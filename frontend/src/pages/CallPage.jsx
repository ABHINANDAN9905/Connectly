import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
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

        if (isAudioOnly) {
          try { await callInstance.camera.disable(); } catch { /* ignore */ }
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
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="relative">
        {videoClient && call ? (
          <StreamVideo client={videoClient}>
            <StreamCall call={call}>
              <CallContent isAudioOnly={isAudioOnly} />
            </StreamCall>
          </StreamVideo>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Could not initialize call. Please refresh or try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CallContent = ({ isAudioOnly }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  if (callingState === CallingState.LEFT) return navigate("/");

  return (
    <StreamTheme>
      {isAudioOnly ? (
        <div className="flex flex-col items-center justify-center p-8">
          <p className="text-lg font-semibold mb-4">Voice Call in Progress</p>
        </div>
      ) : (
        <SpeakerLayout />
      )}
      <CallControls />
    </StreamTheme>
  );
};

export default CallPage;