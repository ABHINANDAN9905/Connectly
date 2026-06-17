import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  StreamVideo,
  StreamCall,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  useCall,              // ← top-level export, NOT from useCallStateHooks()
  ParticipantView,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import { PhoneOffIcon } from "lucide-react";
import PageLoader from "../components/PageLoader";
import { NotificationContext } from "../contexts/notificationContext";

const CallPage = () => {
  const { id: callId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isAudioOnly = searchParams.get("audio") === "true";
  const isIncoming = location.state?.incomingCall === true;
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { authUser, isLoading } = useAuthUser();
  const { videoClient } = useContext(NotificationContext);

  useEffect(() => {
    const initCall = async () => {
      console.log("callId from URL:", callId);
      console.log("isIncoming:", isIncoming);

      if (!callId) {
        toast.error("Invalid call ID. Redirecting...");
        navigate("/");
        return;
      }

      if (!videoClient || !authUser) return;

      try {
        const callInstance = videoClient.call("default", callId);
        console.log("call instance:", callInstance);

        await callInstance.join({ create: true });
        console.log("join status: joined successfully");

        try { await callInstance.microphone.enable(); } catch { /* ignore */ }

        if (isAudioOnly) {
          try { await callInstance.camera.disable(); } catch { /* ignore */ }
        } else {
          try { await callInstance.camera.enable(); } catch { /* ignore */ }
        }

        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    initCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoClient, authUser, callId]);

  if (isLoading || isConnecting || !videoClient) return <PageLoader />;

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#1a1a2e" }}>
      {videoClient && call ? (
        <StreamVideo client={videoClient}>
          <StreamCall call={call}>
            <CallContent isAudioOnly={isAudioOnly} />
          </StreamCall>
        </StreamVideo>
      ) : (
        <div className="flex items-center justify-center h-full text-white">
          <p>Could not initialize call. Please refresh or try again later.</p>
        </div>
      )}
    </div>
  );
};

// ─── Custom end-call button ────────────────────────────────────────────────
const EndCallButton = ({ onEnd }) => (
  <button
    onClick={onEnd}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "56px",
      height: "56px",
      borderRadius: "50%",
      background: "#ef4444",
      border: "none",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(239,68,68,0.5)",
    }}
    title="End call for everyone"
  >
    <PhoneOffIcon color="white" size={22} />
  </button>
);

// ─── Call content (lives inside StreamCall context) ────────────────────────
const CallContent = ({ isAudioOnly }) => {
  const {
    useCallCallingState,
    useParticipants,
    useLocalParticipant,
    useRemoteParticipants,
  } = useCallStateHooks();

  const callingState      = useCallCallingState();
  const participants      = useParticipants();
  const localParticipant  = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const navigate          = useNavigate();

  // useCall() is a standalone hook — reads the call from StreamCall context
  const call = useCall();

  const leavingRef = useRef(false);

  const leaveAndGoHome = useCallback(async (reason = "unknown") => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    console.log("[CallContent] leaving call, reason:", reason);
    try { await call?.leave(); } catch { /* ignore */ }
    navigate("/");
  }, [call, navigate]);

  const handleEndCall = async () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    try {
      console.log("[CallContent] endCall() →", call?.id);
      await call?.endCall();
    } catch (err) {
      console.error("endCall failed:", err);
    }
    navigate("/");
  };

  // Listen for remote termination (receiver auto-exits)
  useEffect(() => {
    if (!call) return;

    const onCallEnded    = () => leaveAndGoHome("call.ended");
    const onSessionEnded = () => leaveAndGoHome("call.session_ended");
    const onCallRejected = () => leaveAndGoHome("call.rejected");

    call.on("call.ended",         onCallEnded);
    call.on("call.session_ended", onSessionEnded);
    call.on("call.rejected",      onCallRejected);

    return () => {
      call.off("call.ended",         onCallEnded);
      call.off("call.session_ended", onSessionEnded);
      call.off("call.rejected",      onCallRejected);
    };
  }, [call, leaveAndGoHome]);

  // Handle SDK-driven state transitions (network drop, etc.)
  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      leaveAndGoHome("CallingState.LEFT");
    }
  }, [callingState, leaveAndGoHome]);

  if (isAudioOnly) {
    return (
      <StreamTheme>
        <div
          style={{
            height: "100vh",
            width: "100vw",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#1a1a2e",
            gap: "24px",
          }}
        >
          <div style={{ display: "flex", gap: "32px" }}>
            {participants.map((p) => (
              <div
                key={p.sessionId}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
              >
                <div
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: p.isSpeaking ? "3px solid #22c55e" : "3px solid #6366f1",
                  }}
                >
                  <img
                    src={p.image || "/favicon.ico"}
                    alt={p.name || "User"}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.target.src = "/favicon.ico"; }}
                  />
                </div>
                <p style={{ color: "white", fontWeight: 600 }}>{p.name || "User"}</p>
                <p style={{ color: "#9ca3af", fontSize: "12px" }}>
                  {p.isSpeaking ? "🎙️ Speaking..." : "🔇"}
                </p>
              </div>
            ))}
          </div>
          <p style={{ color: "#d1d5db", fontSize: "18px" }}>Voice Call in Progress</p>
          <EndCallButton onEnd={handleEndCall} />
        </div>
      </StreamTheme>
    );
  }

  return (
    <StreamTheme>
      <div
        style={{
          height: "100vh",
          width: "100vw",
          display: "flex",
          flexDirection: "column",
          background: "#1a1a2e",
          position: "relative",
        }}
      >
        <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
          {remoteParticipants.length > 0 ? (
            <ParticipantView
              participant={remoteParticipants[0]}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "50%",
                  background: "#374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                }}
              >
                👤
              </div>
              <p style={{ color: "white", fontSize: "18px" }}>Waiting for others to join...</p>
            </div>
          )}

          {localParticipant && (
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                width: "120px",
                height: "160px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "2px solid white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                background: "#374151",
              }}
            >
              <ParticipantView
                participant={localParticipant}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          )}
        </div>

        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
            padding: "16px",
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <EndCallButton onEnd={handleEndCall} />
        </div>
      </div>
    </StreamTheme>
  );
};

export default CallPage;