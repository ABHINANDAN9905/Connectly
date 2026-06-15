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

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    preview:
      (lastMessage?.text && String(lastMessage.text)) ||
      "Sent a new message",
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
  } catch {
    // silent fail
  }
};

const showBrowserNotification = (title, body, icon) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon });
  n.onclick = () => { window.focus(); n.close(); };
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const NotificationProvider = ({ children }) => {
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    retry: false,
  });

  // Shared Stream chat client — single instance across the whole app
  const clientRef = useRef(null);
  const listenersAttached = useRef(false);

  // Shared Stream video client — for ringing calls
  const videoClientRef = useRef(null);
  const videoListenersAttached = useRef(false);
  const ringtoneRef = useRef(null);

  const [chatClient, setChatClient] = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState(null);

  // activeChannelId lives in a ref so event handlers never go stale
  const activeChannelIdRef = useRef(null);
  const [activeChannelId, setActiveChannelIdState] = useState(null);

  const setActiveChannelId = useCallback((id) => {
    activeChannelIdRef.current = id;
    setActiveChannelIdState(id);
  }, []);

  // ── Recompute unread state from the client's channel cache ──────────────
  const syncNotifications = useCallback(() => {
    const client = clientRef.current;
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

  // ── Mark a channel as read and immediately sync UI ───────────────────────
  const markChannelRead = useCallback(
    async (channelId) => {
      const client = clientRef.current;
      if (!client || !channelId) return;

      try {
        const channel =
          client.activeChannels[`messaging:${channelId}`] ||
          client.channel("messaging", channelId);

        await channel.markRead();
        setNotifications((prev) => prev.filter((n) => n.channelId !== channelId));
        setTotalUnread((prev) => {
          const removed = prev;
          return Math.max(0, removed);
        });
        syncNotifications();
      } catch (err) {
        console.warn("markChannelRead failed:", err);
      }
    },
    [syncNotifications]
  );

  // ── Ringtone controls ─────────────────────────────────────────────────────
  const startRingtone = useCallback(() => {
    try {
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("/ringtone.mp3");
        ringtoneRef.current.loop = true;
      }
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play().catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, []);

  // ── Accept / decline incoming call ───────────────────────────────────────
  const acceptIncomingCall = useCallback(() => {
    stopRingtone();
    const call = incomingCall;
    setIncomingCall(null);
    return call;
  }, [incomingCall, stopRingtone]);

  const declineIncomingCall = useCallback(async () => {
    stopRingtone();
    if (incomingCall) {
      try {
        await incomingCall.leave({ reject: true });
      } catch (err) {
        console.warn("Failed to reject call:", err);
      }
    }
    setIncomingCall(null);
  }, [incomingCall, stopRingtone]);

  // ── Request browser notification permission once ──────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Main Stream initialisation (chat + video) ────────────────────────────
  useEffect(() => {
    if (!authUser || authLoading || tokenLoading || !tokenData?.token) return;
    if (!STREAM_API_KEY) {
      console.error("VITE_STREAM_API_KEY is missing.");
      return;
    }

    let detachListeners = () => {};
    let detachVideoListeners = () => {};

    const init = async () => {
      try {
        // Reuse singleton chat client
        const client = StreamChat.getInstance(STREAM_API_KEY);
        clientRef.current = client;

        if (client.userID !== authUser._id) {
          if (client.userID) {
            try { await client.disconnectUser(); } catch { /* ignore */ }
          }
          await client.connectUser(
            { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
            tokenData.token
          );
        }

        setChatClient(client);

        await client.queryChannels(
          { type: "messaging", members: { $in: [authUser._id] } },
          [{ last_message_at: -1 }],
          { watch: true, state: true, presence: true, limit: 30 }
        );

        // ── Chat event listeners exactly once ────────────────────────────
        if (!listenersAttached.current) {
          listenersAttached.current = true;

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

          client.on("message.new", onNewMessage);
          client.on("notification.message_new", onReadChange);
          client.on("notification.mark_read", onReadChange);
          client.on("notification.mark_unread", onReadChange);
          client.on("channel.updated", onReadChange);

          detachListeners = () => {
            client.off("message.new", onNewMessage);
            client.off("notification.message_new", onReadChange);
            client.off("notification.mark_read", onReadChange);
            client.off("notification.mark_unread", onReadChange);
            client.off("channel.updated", onReadChange);
            listenersAttached.current = false;
          };
        }

        // ── Global Video client for ringing calls ────────────────────────
        let vClient = videoClientRef.current;
        if (!vClient || vClient.streamClient?.userID !== authUser._id) {
          if (vClient) {
            try { await vClient.disconnectUser(); } catch { /* ignore */ }
          }
          vClient = new StreamVideoClient({
            apiKey: STREAM_API_KEY,
            user: { id: authUser._id, name: authUser.fullName, image: authUser.profilePic },
            token: tokenData.token,
          });
          videoClientRef.current = vClient;
        }
        setVideoClient(vClient);

        if (!videoListenersAttached.current) {
          videoListenersAttached.current = true;

          // TEMP DEBUG — remove after confirming everything works
          vClient.on("all", (e) => console.log("VIDEO EVENT:", e.type, e));

          const onCallRinging = (call) => {
            // Don't show popup for calls created by self
            if (call.state.createdBy?.id === authUser._id) return;
            setIncomingCall(call);
            startRingtone();

            if (document.visibilityState !== "visible") {
              showBrowserNotification(
                call.state.createdBy?.name || "Incoming call",
                call.type === "audio_room" || call.id?.includes("audio")
                  ? "Voice call"
                  : "Video call",
                call.state.createdBy?.image || "/favicon.ico"
              );
            }
          };

          const onCallEnded = () => {
            stopRingtone();
            setIncomingCall(null);
          };

          vClient.on("call.ring", onCallRinging);
          vClient.on("call.rejected", onCallEnded);
          vClient.on("call.ended", onCallEnded);

          detachVideoListeners = () => {
            vClient.off("call.ring", onCallRinging);
            vClient.off("call.rejected", onCallEnded);
            vClient.off("call.ended", onCallEnded);
            videoListenersAttached.current = false;
          };
        }

        syncNotifications();
        setIsReady(true);
      } catch (err) {
        console.error("Stream init failed:", err);
      }
    };

    init();
    return () => {
      detachListeners();
      detachVideoListeners();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id, tokenData?.token]);

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
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <IncomingCallModal />
    </NotificationContext.Provider>
  );
};