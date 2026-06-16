import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  ParticipantView,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";
import { NotificationContext } from "../contexts/notificationContext";

const CallPage = () => {
  const { id: callId } = useParams();
  const [searchParams] = useSearchParams();
  const isAudioOnly = searchParams.get("audio") === "true";

  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { authUser, isLoading } = useAuthUser();
  const { videoClient } = useContext(NotificationContext);

  useEffect(() => {
    const initCall = async () => {
      if (!videoClient || !authUser || !callId) return;

      try {
        const callInstance = videoClient.call("default", callId);
        await callInstance.join({ create: true });

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
    <div className="h-screen bg-gray-900">
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
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900">
          <div className="flex gap-6 mb-8">
            {participants.map((p) => (
              <div key={p.sessionId} className="flex flex-col items-center gap-2">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700">
                  <img
                    src={p.image || "/favicon.ico"}
                    alt={p.name || "User"}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = "/favicon.ico"; }}
                  />
                </div>
                <p className="text-white text-sm">{p.name || "User"}</p>
                <span className="text-xs text-gray-400">
                  {p.isSpeaking ? "🎙️ Speaking" : "🔇 Silent"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-white text-xl font-semibold mb-8">Voice Call in Progress</p>
          <CallControls />
        </div>
      </StreamTheme>
    );
  }

  return (
    <StreamTheme>
      <div className="h-screen w-screen flex flex-col bg-gray-900">
        <div className="flex-1 grid gap-2 p-2"
          style={{
            gridTemplateColumns: participants.length === 1 ? "1fr" : "1fr 1fr",
          }}
        >
          {participants.map((p) => (
            <div key={p.sessionId} className="relative rounded-lg overflow-hidden bg-gray-800">
              <ParticipantView
                participant={p}
                className="w-full h-full"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {p.name || "User"} {p.isSpeaking ? "🎙️" : ""}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-shrink-0 flex justify-center py-4 bg-gray-900">
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
};

export default CallPage;