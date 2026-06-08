import { useEffect, useRef, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import toast from "react-hot-toast";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { NotificationContext } from "../contexts/notificationContext";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { authUser } = useAuthUser();
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Pull the shared client + notification helpers from context
  const {
    chatClient: sharedClient,
    isReady,
    setActiveChannelId,
    markChannelRead,
    syncNotifications,
  } = useContext(NotificationContext);

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);
  const channelIdRef = useRef(null);

  // ── Open the channel once the shared client + token are ready ────────────
  useEffect(() => {
    if (!sharedClient || !isReady || !authUser || !targetUserId) return;

    // Prevent re-opening the same channel
    const channelId = [authUser._id, targetUserId].sort().join("-");
    if (channelIdRef.current === channelId && channelRef.current) return;

    const openChannel = async () => {
      setLoading(true);
      try {
        // Upsert current user in Stream (backend helper)
        try {
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"}/chat/upsert/${authUser._id}`,
            { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.warn("Upsert user failed:", e?.message);
        }

        const ch = sharedClient.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await ch.watch();

        // Mark read immediately on open — clears the notification
        await ch.markRead();

        channelRef.current = ch;
        channelIdRef.current = channelId;

        // Tell NotificationContext which chat is currently open
        setActiveChannelId(channelId);

        // Sync the bell badge immediately
        syncNotifications();

        setChannel(ch);
      } catch (err) {
        console.error("Error opening channel:", err);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    openChannel();
  }, [sharedClient, isReady, authUser, targetUserId, setActiveChannelId, syncNotifications]);

  // ── Mark as read whenever a new message arrives while this chat is open ──
  useEffect(() => {
    const ch = channelRef.current;
    if (!ch) return;

    const handleNewMessage = (event) => {
      // Don't play sounds — NotificationContext won't either (activeChannelId is set)
      // Just keep the channel read in real time
      ch.markRead().then(() => syncNotifications()).catch(() => {});
    };

    ch.on("message.new", handleNewMessage);
    return () => ch.off("message.new", handleNewMessage);
  }, [channel, syncNotifications]); // re-attach when channel changes

  // ── Cleanup: clear activeChannelId when leaving the chat ─────────────────
  useEffect(() => {
    return () => {
      setActiveChannelId(null);
      // Final read mark + sync when navigating away
      if (channelRef.current) {
        channelRef.current
          .markRead()
          .then(() => syncNotifications())
          .catch(() => {});
      }
    };
  }, [setActiveChannelId, syncNotifications]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;
      channel.sendMessage({ text: `I've started a video call. Join me here: ${callUrl}` });
      toast.success("Video call link sent!");
    }
  };

  // Show loader until BOTH the shared client is ready AND the channel is open
  if (!sharedClient || loading || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh]">
      {/* 
        IMPORTANT: Use the shared chatClient from NotificationContext — not a local one.
        This keeps the single Stream connection alive across the whole app.
      */}
      <Chat client={sharedClient}>
        <Channel channel={channel}>
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;