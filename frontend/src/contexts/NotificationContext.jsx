import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { getStreamToken } from "../lib/api";
import useAuthUser from "../hooks/useAuthUser";
import { NotificationContext } from "./notificationContext";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const formatChannelPreview = (channel) => {
  const members = Object.values(channel.state?.members || {});
  const otherMember = members.find((member) => member.user?.id !== channel.getClient().userID);
  const lastMessage = channel.state?.messages?.slice(-1)[0] || channel.state?.last_message_at;

  return {
    channelId: channel.id,
    targetUserId: otherMember?.user?.id,
    title: otherMember?.user?.name ?? otherMember?.user?.fullName ?? "New message",
    subtitle: otherMember?.user?.id ? `From ${otherMember.user.name || otherMember.user.fullName}` : "New message",
    avatar: otherMember?.user?.image || otherMember?.user?.profilePic || "/favicon.ico",
    preview:
      (lastMessage?.text && String(lastMessage.text)) ||
      (lastMessage?.message && String(lastMessage.message)) ||
      "Sent a new message",
    time: channel.state?.last_message_at || lastMessage?.created_at || new Date(),
    unreadCount: channel.state?.unreadCount || 0,
  };
};

const playNotificationSound = () => {
  try {
    // Play notification tone audio file
    const audio = new Audio("/notification-tone.wav");
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Fallback to synthesized tone if file not found
      playFallbackNotificationTone();
    });
  } catch (error) {
    console.warn("Notification sound failed:", error);
    playFallbackNotificationTone();
  }
};

const playFallbackNotificationTone = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const now = audioCtx.currentTime;

    // Create a more musical notification tone with multiple frequencies
    // This creates a pleasant "ding" sound similar to modern notification tones

    // First tone: high frequency
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(800, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second tone: lower frequency for richness
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, now);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.15);
  } catch (error) {
    console.warn("Fallback notification sound failed:", error);
  }
};

const showBrowserNotification = (title, preview, icon) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body: preview,
    icon,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

export const NotificationProvider = ({ children }) => {
  const { authUser, isLoading: authLoading } = useAuthUser();
  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    retry: false,
  });

  const clientRef = useRef(null);
  const [chatClient, setChatClient] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeChannelId, setActiveChannelId] = useState(null);

  const updateNotifications = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    const channels = Object.values(client.state.channels || {});
    const unreadChannels = channels
      .filter((channel) => channel.state?.unreadCount > 0)
      .sort((a, b) => {
        const aTime = a.state?.last_message_at ? new Date(a.state.last_message_at).getTime() : 0;
        const bTime = b.state?.last_message_at ? new Date(b.state.last_message_at).getTime() : 0;
        return bTime - aTime;
      })
      .map((channel) => formatChannelPreview(channel));

    setNotifications(unreadChannels);
    setTotalUnread(unreadChannels.reduce((sum, item) => sum + item.unreadCount, 0));
  }, []);

  const markChannelRead = useCallback(async (channelId) => {
    const client = clientRef.current;
    if (!client || !channelId) return;

    try {
      const channel = client.channel("messaging", channelId);
      await channel.watch();
      await channel.markRead();
      updateNotifications();
    } catch (error) {
      console.warn("Failed to mark chat as read:", error);
    }
  }, [updateNotifications]);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        console.log("Notification permission:", permission);
      });
    }
  }, []);

  useEffect(() => {
    if (!authUser || authLoading || tokenLoading || !tokenData?.token) return;

    let cleanupHandlers = () => {};
    const initStream = async () => {
      try {
        const client = clientRef.current || StreamChat.getInstance(STREAM_API_KEY);
        clientRef.current = client;

        if (client.userID !== authUser._id) {
          if (client.userID) {
            try {
              await client.disconnectUser();
            } catch (error) {
              console.warn("Failed to disconnect previous Stream user:", error);
            }
          }

          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: authUser.profilePic,
            },
            tokenData.token
          );
        }

        setChatClient(client);

        const filters = { type: "messaging", members: { $in: [authUser._id] } };
        const sort = [{ last_message_at: -1 }];
        await client.queryChannels(filters, sort, { watch: true, state: true });

        const handleIncomingMessage = (event) => {
          if (event.user?.id === authUser._id) return;

          const channelId = event.cid || event.channel?.cid;
          updateNotifications();

          const isSameChatOpen = channelId && channelId === activeChannelId && document.visibilityState === "visible";
          if (isSameChatOpen) return;

          const title = event.user?.name || "New message";
          const preview = event.message?.text || "You have a new message";
          const icon = event.user?.image || "/favicon.ico";

          if (document.visibilityState !== "visible") {
            showBrowserNotification(title, preview, icon);
          }

          playNotificationSound();
          toast(`${title}: ${preview}`, {
            icon: "💬",
          });
        };

        const refreshNotifications = () => updateNotifications();

        client.on("message.new", handleIncomingMessage);
        client.on("notification.mark_read", refreshNotifications);
        client.on("notification.mark_unread", refreshNotifications);
        client.on("channel.updated", refreshNotifications);

        cleanupHandlers = () => {
          client.off("message.new", handleIncomingMessage);
          client.off("notification.mark_read", refreshNotifications);
          client.off("notification.mark_unread", refreshNotifications);
          client.off("channel.updated", refreshNotifications);
        };

        updateNotifications();
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize Stream notifications:", error);
      }
    };

    initStream();
    return () => cleanupHandlers();
  }, [authUser, authLoading, tokenLoading, tokenData?.token, activeChannelId, updateNotifications]);

  const value = useMemo(
    () => ({
      chatClient,
      isReady,
      notifications,
      totalUnread,
      activeChannelId,
      setActiveChannelId,
      markChannelRead,
    }),
    [chatClient, isReady, notifications, totalUnread, activeChannelId, markChannelRead]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
