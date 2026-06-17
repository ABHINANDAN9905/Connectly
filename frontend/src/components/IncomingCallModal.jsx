import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { PhoneIcon, PhoneOffIcon, VideoIcon } from "lucide-react";
import toast from "react-hot-toast";
import { NotificationContext } from "../contexts/notificationContext";

const IncomingCallModal = () => {
  const { incomingCall, acceptIncomingCall, declineIncomingCall } = useContext(NotificationContext);
  const navigate = useNavigate();

  if (!incomingCall) return null;

  const createdBy = incomingCall.state?.createdBy;
  const custom = incomingCall.state?.custom || incomingCall.custom || {};

  const callerName = createdBy?.name || custom.callerName || "Unknown";
  const callerImage = createdBy?.image || custom.callerImage || "/favicon.ico";
  const isAudioOnly = incomingCall.id?.includes("audio");

  const handleAccept = () => {
    const call = acceptIncomingCall();
    console.log("Accepted call object:", call);

    const callId = call?.id || call?.call?.id;

    if (!callId) {
      console.warn("handleAccept: callId is missing", call);
      toast.error("Could not resolve call ID. Please try again.");
      return;
    }

    const url = isAudioOnly ? `/call/${callId}?audio=true` : `/call/${callId}`;
    navigate(url, { state: { incomingCall: true } });
  };

  const handleDecline = () => {
    declineIncomingCall();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-base-100 rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/40">
          <img
            src={callerImage}
            alt={callerName}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = "/favicon.ico"; }}
          />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold">{callerName}</h3>
          <p className="text-sm opacity-60">
            Incoming {isAudioOnly ? "voice" : "video"} call...
          </p>
        </div>
        <div className="flex gap-6 mt-2">
          <button
            onClick={handleDecline}
            className="btn btn-circle btn-error btn-lg text-white"
          >
            <PhoneOffIcon className="size-6" />
          </button>
          <button
            onClick={handleAccept}
            className="btn btn-circle btn-success btn-lg text-white"
          >
            {isAudioOnly ? <PhoneIcon className="size-6" /> : <VideoIcon className="size-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;