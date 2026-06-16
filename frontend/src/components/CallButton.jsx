import { useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { VideoIcon, PhoneIcon } from "lucide-react";
import { NotificationContext } from "../contexts/notificationContext";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";

function CallButton({ targetUserId }) {
  const { videoClient } = useContext(NotificationContext);
  const { authUser } = useAuthUser();
  const navigate = useNavigate();
  const { id: channelId } = useParams();

  const startCall = async (audioOnly) => {
    if (!videoClient) {
      toast.error("Call service not ready, try again in a moment.");
      return;
    }
    try {
      const callId = audioOnly ? `audio-${channelId}` : `video-${channelId}`;
      const call = videoClient.call("default", callId);

      await call.getOrCreate({
        ring: true,
        data: {
          members: targetUserId ? [{ user_id: targetUserId }] : undefined,
          custom: {
            callerName: authUser?.fullName || "Unknown",
            callerImage: authUser?.profilePic || "/favicon.ico",
            callerUserId: authUser?._id,
          },
        },
      });

      const url = audioOnly ? `/call/${call.id}?audio=true` : `/call/${call.id}`;
      navigate(url);
    } catch (err) {
      console.error("Failed to start call:", err);
      toast.error("Could not start the call. Please try again.");
    }
  };

  return (
    <div className="p-3 border-b flex items-center justify-end gap-2 max-w-7xl mx-auto w-full absolute top-0">
      <button onClick={() => startCall(true)} className="btn btn-info btn-sm text-white">
        <PhoneIcon className="size-6" />
      </button>
      <button onClick={() => startCall(false)} className="btn btn-success btn-sm text-white">
        <VideoIcon className="size-6" />
      </button>
    </div>
  );
}

export default CallButton;