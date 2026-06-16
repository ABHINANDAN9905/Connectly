import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import { NotificationContext } from "../contexts/notificationContext";

const CallPage = () => {
  const { id: callId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isAudioOnly = searchParams.get("audio") === "true";
  const isIncoming = location.state?.incomingCall === true;

  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { authUser, isLoading } = useAuthUser();
  const { videoClient } = useContext(NotificationContext);

  useEffect(() => {
    const initCall = async () => {
      if (!videoClient || !authUser || !callId) return;

      try {
        const callInstance = videoClient.call("default", callId);

        if (isIncoming) {
          // Receiver — just join, don't create
          await callInstance.join();
        } else {
          // Caller — create if not exists
          await callInstance.join({ create: true });
        }

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

const CallContent = ({ isAudioOnly }) => {
  const { useCallCallingState, useParticipants } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

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
                    border: "3px solid #6366f1",
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
          <CallControls />
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
        }}
      >
        <div style={{ flex: 1, minHeight: 0 }}>
          <SpeakerLayout />
        </div>
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
            padding: "16px",
            background: "#1a1a2e",
          }}
        >
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
};

export default CallPage;