import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import { StreamVideoClient } from "@stream-io/video-react-sdk";
import toast from "react-hot-toast";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { NotificationContext } from "./notificationContext";
import IncomingCallModal from "../components/IncomingCallModal";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// ─── Module-level singletons ────────────────────────────────────────────────
// Kept outside React so they survive StrictMode double-mount and are never
// re-created across re-renders. React state holds references for consumers.
let chatSingleton = null;
let videoSingleton = null;
// ────────────────────────────────────────────────────────────────────────────

const formatChannelPreview = (channel, currentUserId) => {
  const members = Object.values(channel.state?.members || {});
  const otherMember = members.find((m) => m.user?.id !== currentUserId);
  const messages = channel.state?.messages || [];
  const lastMessage = messages[messages.length - 1];
  return {
    channelId: channel.id,
    targetUserId: otherMember?.user?.id,
    title: otherMember?.user?.name ?? otherMember?.user?.fullName ?? "New message",
    subtitle: otherMember?.user?.id
      ? `From ${otherMember.user.name || otherMember.user.fullName}`
      : "New message",
    avatar: otherMember?.user?.image || otherMember?.user?.profilePic || "/favicon.ico",
    preview: (lastMessage?.text && String(lastMessage.text)) || "Sent a new message",
    time: new Date(channel.state?.last_message_at || lastMessage?.created_at || Date.now()),
    unreadCount: channel.countUnread(),
  };
};

const playNotificationSound = () => {
  try {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.8;
    audio.play().catch(playFallbackTone);
  } catch {
    playFallbackTone();
  }
};

const playFallbackTone = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [[800, now, 0.15], [1200, now + 0.05, 0.1]].forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    });
  } catch { /* silent fail */ }
};

const showBrowserNotification = (title, body, icon) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon });
  n.onclick = () => { window.focus(); n.close(); };
};

export const NotificationProvider = ({ children }) => {
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    retry: false,
  });

  // ── Refs ──────────────────────────────────────────────────────────────────
  const initializingRef   = useRef(false); // true while init() is in-flight
  const initializedForRef = useRef(null);  // userId that was successfully inited
  const chatListenersRef  = useRef(false);
  const videoListenersRef = useRef(false);
  const ringtoneRef       = useRef(null);
  const detachChatRef     = useRef(() => {});
  const detachVideoRef    = useRef(() => {});

  // ── State (consumed by context) ───────────────────────────────────────────
  const [chatClient,  setChatClient]  = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  const [isReady,     setIsReady]     = useState(false);
  const [notifications,  setNotifications]  = useState([]);
  const [totalUnread,    setTotalUnread]     = useState(0);
  const [incomingCall,   setIncomingCall]    = useState(null);

  const activeChannelIdRef = useRef(null);
  const [activeChannelId, setActiveChannelIdState] = useState(null);
  const setActiveChannelId = useCallback((id) => {
    activeChannelIdRef.current = id;
    setActiveChannelIdState(id);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const syncNotifications = useCallback(() => {
    const client = chatSingleton;
    if (!client) return;
    const channels = Object.values(client.activeChannels || {});
    const unread = channels
      .filter((ch) => ch.countUnread() > 0)
      .sort((a, b) => {
        const aT = a.state?.last_message_at ? new Date(a.state.last_message_at).getTime() : 0;
        const bT = b.state?.last_message_at ? new Date(b.state.last_message_at).getTime() : 0;
        return bT - aT;
      })
      .map((ch) => formatChannelPreview(ch, client.userID));
    setNotifications(unread);
    setTotalUnread(unread.reduce((s, n) => s + n.unreadCount, 0));
  }, []);

  const markChannelRead = useCallback(async (channelId) => {
    const client = chatSingleton;
    if (!client || !channelId) return;
    try {
      const channel =
        client.activeChannels[`messaging:${channelId}`] ||
        client.channel("messaging", channelId);
      await channel.markRead();
      setNotifications((prev) => prev.filter((n) => n.channelId !== channelId));
      setTotalUnread((prev) => Math.max(0, prev));
      syncNotifications();
    } catch (err) {
      console.warn("markChannelRead failed:", err);
    }
  }, [syncNotifications]);

  const startRingtone = useCallback(() => {
    try {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("/ringtone.mp3");
        ringtoneRef.current.loop = true;
      }
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch(() => {});
    } catch { /* ignore */ }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  const acceptIncomingCall = useCallback(() => {
    stopRingtone();
    const call = incomingCall;
    setIncomingCall(null);
    return call;
  }, [incomingCall, stopRingtone]);

  const declineIncomingCall = useCallback(async () => {
    stopRingtone();
    if (incomingCall) {
      try { await incomingCall.leave({ reject: true }); }
      catch (err) { console.warn("Failed to reject call:", err); }
    }
    setIncomingCall(null);
  }, [incomingCall, stopRingtone]);

  // ── Browser notification permission ───────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Main init — runs once per unique (userId + token) pair ────────────────
  useEffect(() => {
    if (!authUser || authLoading || tokenLoading || !tokenData?.token) return;
    if (!STREAM_API_KEY) return;

    // Already initialized for this user — skip entirely.
    if (initializedForRef.current === authUser._id) return;

    // Another async init is already in-flight — skip to avoid double connectUser.
    if (initializingRef.current) return;

    initializingRef.current = true;

    const init = async () => {
      try {
        // ── Chat client (singleton) ──────────────────────────────────────
        // StreamChat.getInstance() always returns the same instance for a key.
        // We call connectUser only when the instance has no connected user yet.
        const chat = StreamChat.getInstance(STREAM_API_KEY);
        chatSingleton = chat;

        if (!chat.userID) {
          console.log("[Stream] connectUser →", authUser._id);
          await chat.connectUser(
            { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
            tokenData.token
          );
        } else {
          console.log("[Stream] chat already connected as", chat.userID);
        }

        setChatClient(chat);

        await chat.queryChannels(
          { type: "messaging", members: { $in: [authUser._id] } },
          [{ last_message_at: -1 }],
          { watch: true, state: true, presence: true, limit: 30 }
        );

        // ── Chat event listeners (attach once) ───────────────────────────
        if (!chatListenersRef.current) {
          chatListenersRef.current = true;

          const onNewMessage = (event) => {
            if (event.user?.id === authUser._id) return;
            const incomingCid = event.channel_id || event.cid;
            const isOpen =
              incomingCid &&
              incomingCid === activeChannelIdRef.current &&
              document.visibilityState === "visible";
            syncNotifications();
            if (isOpen) return;
            const senderName = event.user?.name || "New message";
            const preview = event.message?.text || "You have a new message";
            const icon = event.user?.image || "/favicon.ico";
            playNotificationSound();
            if (document.visibilityState !== "visible") {
              showBrowserNotification(senderName, preview, icon);
            }
            toast(`${senderName}: ${preview}`, { icon: "💬", duration: 4000 });
          };

          const onReadChange = () => syncNotifications();

          chat.on("message.new",              onNewMessage);
          chat.on("notification.message_new", onReadChange);
          chat.on("notification.mark_read",   onReadChange);
          chat.on("notification.mark_unread", onReadChange);
          chat.on("channel.updated",          onReadChange);

          detachChatRef.current = () => {
            chat.off("message.new",              onNewMessage);
            chat.off("notification.message_new", onReadChange);
            chat.off("notification.mark_read",   onReadChange);
            chat.off("notification.mark_unread", onReadChange);
            chat.off("channel.updated",          onReadChange);
            chatListenersRef.current = false;
          };
        }

        // ── Video client (singleton) ─────────────────────────────────────
        // Create once; reuse the module-level singleton on subsequent renders.
        if (!videoSingleton) {
          console.log("[Stream] creating StreamVideoClient for", authUser._id);
          videoSingleton = new StreamVideoClient({
            apiKey: STREAM_API_KEY,
            user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
            token: tokenData.token,
          });
        } else {
          console.log("[Stream] reusing existing StreamVideoClient");
        }

        setVideoClient(videoSingleton);

        // ── Video event listeners (attach once) ──────────────────────────
        if (!videoListenersRef.current) {
          videoListenersRef.current = true;

          const onCallRinging = (event) => {
            try {
              console.log("RING EVENT", event);
              console.log("EVENT ID", event?.id);
              console.log("EVENT CALL ID", event?.call?.id);

              const call = event?.call ?? event;
              const createdBy = call?.state?.createdBy;
              if (createdBy?.id === authUser._id) return;

              if (!call?.id) {
                console.warn("onCallRinging: could not resolve a valid call object", event);
                return;
              }

              setIncomingCall(call);
              startRingtone();

              if (document.visibilityState !== "visible") {
                showBrowserNotification(
                  createdBy?.name || "Incoming call",
                  call?.id?.includes("audio") ? "Voice call" : "Video call",
                  createdBy?.image || "/favicon.ico"
                );
              }
            } catch (err) {
              console.error("onCallRinging error:", err);
            }
          };

          const onCallEnded = () => {
            stopRingtone();
            setIncomingCall(null);
          };

          videoSingleton.on("call.ring",     onCallRinging);
          videoSingleton.on("call.rejected", onCallEnded);
          videoSingleton.on("call.ended",    onCallEnded);
          videoSingleton.on("call.missed",   onCallEnded);

          detachVideoRef.current = () => {
            videoSingleton.off("call.ring",     onCallRinging);
            videoSingleton.off("call.rejected", onCallEnded);
            videoSingleton.off("call.ended",    onCallEnded);
            videoSingleton.off("call.missed",   onCallEnded);
            videoListenersRef.current = false;
          };
        }

        syncNotifications();
        setIsReady(true);
        initializedForRef.current = authUser._id;
        console.log("[Stream] init complete for", authUser._id);
      } catch (err) {
        console.error("[Stream] init failed:", err);
        // Reset so a retry is possible after an error.
        initializingRef.current = false;
      } finally {
        initializingRef.current = false;
      }
    };

    init();
    // Intentionally omitting syncNotifications / startRingtone from deps —
    // they are stable callbacks and including them would re-trigger init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id, tokenData?.token]);

  // ── Disconnect only on logout (authUser becomes null) ─────────────────────
  useEffect(() => {
    if (authUser) return; // still logged in — do nothing

    const cleanup = async () => {
      detachChatRef.current();
      detachVideoRef.current();

      if (chatSingleton?.userID) {
        try { await chatSingleton.disconnectUser(); }
        catch (err) { console.warn("[Stream] chat disconnect error:", err); }
        chatSingleton = null;
      }

      if (videoSingleton) {
        try { await videoSingleton.disconnectUser(); }
        catch (err) { console.warn("[Stream] video disconnect error:", err); }
        videoSingleton = null;
      }

      initializedForRef.current = null;
      setChatClient(null);
      setVideoClient(null);
      setIsReady(false);
      setNotifications([]);
      setTotalUnread(0);
      console.log("[Stream] disconnected on logout");
    };

    cleanup();
  }, [authUser]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = useMemo(
    () => ({
      chatClient,
      videoClient,
      isReady,
      notifications,
      totalUnread,
      activeChannelId,
      setActiveChannelId,
      markChannelRead,
      syncNotifications,
      incomingCall,
      acceptIncomingCall,
      declineIncomingCall,
    }),
    [
      chatClient, videoClient, isReady, notifications, totalUnread,
      activeChannelId, setActiveChannelId, markChannelRead, syncNotifications,
      incomingCall, acceptIncomingCall, declineIncomingCall,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <IncomingCallModal />
    </NotificationContext.Provider>
  );
};