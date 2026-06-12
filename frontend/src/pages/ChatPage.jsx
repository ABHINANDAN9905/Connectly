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

  useEffect(() => {
    if (!sharedClient || !isReady || !authUser || !targetUserId) return;
    const channelId = [authUser._id, targetUserId].sort().join("-");
    if (channelIdRef.current === channelId && channelRef.current) return;
    const openChannel = async () => {
      setLoading(true);
      try {
        try {
          await fetch(
            `${import.meta.env.VITE_API_BASE_URL || "https://connectly-backend-kw1s.onrender.com"}/chat/upsert/${authUser._id}`,
            { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          console.warn("Upsert user failed:", e?.message);
        }
        const ch = sharedClient.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });
        await ch.watch();
        await ch.markRead();
        channelRef.current = ch;
        channelIdRef.current = channelId;
        setActiveChannelId(channelId);
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

  useEffect(() => {
    const ch = channelRef.current;
    if (!ch) return;
    const handleNewMessage = (event) => {
      ch.markRead().then(() => syncNotifications()).catch(() => {});
    };
    ch.on("message.new", handleNewMessage);
    return () => ch.off("message.new", handleNewMessage);
  }, [channel, syncNotifications]);

  useEffect(() => {
    return () => {
      setActiveChannelId(null);
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

  if (!sharedClient || loading || !channel) return <ChatLoader />;

  return (
    <div className="h-[calc(100dvh-64px)] w-full">
      <Chat client={sharedClient}>
        <Channel channel={channel}>
          <div className="h-full w-full max-w-6xl mx-auto p-2 md:p-4">
            <div className="h-full bg-base-100 rounded-xl shadow-lg overflow-hidden relative">
              <CallButton handleVideoCall={handleVideoCall} />
              <Window>
                <ChannelHeader />
                <MessageList />
                <MessageInput focus />
              </Window>
            </div>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;