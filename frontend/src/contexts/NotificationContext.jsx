import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { NotificationContext } from "./notificationContext";

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

  // Shared Stream client — single instance across the whole app
  const clientRef = useRef(null);
  const listenersAttached = useRef(false);

  const [chatClient, setChatClient] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);

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
        // Use the already-watched channel from activeChannels if available
        const channel =
          client.activeChannels[`messaging:${channelId}`] ||
          client.channel("messaging", channelId);

        await channel.markRead();
        // Optimistically remove it from the list immediately
        setNotifications((prev) => prev.filter((n) => n.channelId !== channelId));
        setTotalUnread((prev) => {
          const removed = prev; // will be corrected by syncNotifications below
          return Math.max(0, removed);
        });
        // Then do a full sync to make sure counts are accurate
        syncNotifications();
      } catch (err) {
        console.warn("markChannelRead failed:", err);
      }
    },
    [syncNotifications]
  );

  // ── Request browser notification permission once ──────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── Main Stream initialisation ────────────────────────────────────────────
  useEffect(() => {
    if (!authUser || authLoading || tokenLoading || !tokenData?.token) return;
    if (!STREAM_API_KEY) {
      console.error("VITE_STREAM_API_KEY is missing.");
      return;
    }

    let detachListeners = () => {};

    const init = async () => {
      try {
        // Reuse singleton
        const client = StreamChat.getInstance(STREAM_API_KEY);
        clientRef.current = client;

        // Connect only if not already connected as this user
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

        // Pre-fetch channels so countUnread() works immediately
        await client.queryChannels(
          { type: "messaging", members: { $in: [authUser._id] } },
          [{ last_message_at: -1 }],
          { watch: true, state: true, presence: true, limit: 30 }
        );

        // ── Attach event listeners exactly once ──────────────────────────
        if (!listenersAttached.current) {
          listenersAttached.current = true;

          // New message from someone else
          const onNewMessage = (event) => {
            // Ignore own messages
            if (event.user?.id === authUser._id) return;

            const incomingCid = event.channel_id || event.cid;

            // Ignore if this chat is already open and visible
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

          // Any read/unread event — just resync
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

        syncNotifications();
        setIsReady(true);
      } catch (err) {
        console.error("Stream init failed:", err);
      }
    };

    init();
    return () => detachListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?._id, tokenData?.token]);

  const value = useMemo(
    () => ({
      chatClient,
      isReady,
      notifications,
      totalUnread,
      activeChannelId,
      setActiveChannelId,
      markChannelRead,
      syncNotifications,
    }),
    [chatClient, isReady, notifications, totalUnread, activeChannelId, setActiveChannelId, markChannelRead, syncNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};