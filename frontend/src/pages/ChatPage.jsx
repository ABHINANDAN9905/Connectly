import { useEffect, useState, useRef } from "react";
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
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const clientRef = useRef(null);
  const channelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const { authUser } = useAuthUser();
  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser, // only fetch token if authUser exists, otherwise skip until we have authUser data
  });
  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;
      if (clientRef.current && channelRef.current) return; // already initialized
      try {
        console.log("Initializing stream chat client...");
        // create singleton client instance and store in ref
        const client = clientRef.current || StreamChat.getInstance(STREAM_API_KEY);
        clientRef.current = client;
        // If client already connected as the same user, skip reconnect
        if (client.userID !== authUser._id) {
          // if connected as other user, disconnect first
          if (client.userID) {
            try {
              await client.disconnectUser();
            } catch (e) {
              console.warn("Failed to disconnect previous Stream user:", e?.message || e);
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
        const channelId = [authUser._id, targetUserId].sort().join("-");
        // you and me
        // if i start the chat => channelId: [myId, yourId]
        // if you start the chat => channelId: [yourId, myId]  => [myId,yourId]
        // ensure both users exist in Stream before creating the channel
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"}/chat/upsert/${authUser._id}`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.warn("Failed to upsert current user in Stream:", e?.message || e);
        }
        try {
          await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:5005/api"}/chat/upsert/${targetUserId}`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          console.warn("Failed to upsert target user in Stream:", e?.message || e);
        }
        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });
        await currChannel.watch();
        await currChannel.markRead();

        currChannel.on("message.new", () => {
          // no notification sound or browser notification in chat page
        });
        channelRef.current = currChannel;
        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat:", error);
        toast.error("Could not connect to chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    initChat();
    return () => {
      if (channelRef.current?.off) {
        channelRef.current.off("message.new");
      }
      // Do not disconnect the Stream user here.
      // NotificationProvider relies on the shared Stream client staying connected.
      // We only unsubscribe channel listeners in the cleanup above.
      (async () => {
        try {
          // no-op
        } catch (e) {
          console.warn("Error during ChatPage cleanup:", e?.message || e);
        }
      })();
    };
  }, [tokenData, authUser, targetUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };
  if (loading || !chatClient || !channel) return <ChatLoader />;
  return (
    <div className="h-[93vh]">
      <Chat client={chatClient}>
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