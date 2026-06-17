import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { VideoIcon, PhoneIcon } from "lucide-react";
import { NotificationContext } from "../contexts/notificationContext";
import useAuthUser from "../hooks/useAuthUser";
import toast from "react-hot-toast";

function CallButton({ targetUserId }) {
  const { videoClient } = useContext(NotificationContext);
  const { authUser } = useAuthUser();
  const navigate = useNavigate();

  const startCall = async (audioOnly) => {
    if (!videoClient) {
      toast.error("Call service not ready, try again in a moment.");
      return;
    }
    try {
      const callId = audioOnly
        ? `audio-${Date.now()}-${targetUserId}`
        : `video-${Date.now()}-${targetUserId}`;

      console.log("Generated callId:", callId);

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

      console.log("call.id after getOrCreate():", call.id);

      const resolvedCallId = call.id || callId;
      const url = audioOnly ? `/call/${resolvedCallId}?audio=true` : `/call/${resolvedCallId}`;

      console.log("Navigation URL:", url);
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