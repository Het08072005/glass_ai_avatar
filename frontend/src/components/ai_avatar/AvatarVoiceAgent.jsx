import React, { useEffect } from "react";
import { useVoiceAssistant, VideoTrack, useTracks, useLocalParticipant, useRoomContext } from "@livekit/components-react";
import { Track, RoomEvent } from "livekit-client";
import { Mic, MicOff, PhoneOff, Monitor } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AvatarVoiceAgent = ({ isMuted, setIsMuted, onEndCall }) => {
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera]);
  const agentTrack = tracks.find(t => t.participant.identity !== localParticipant.identity);
  const room = useRoomContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!room) return;

    const onDisconnected = () => {
      console.log("AvatarVoiceAgent: Room disconnected");
      if (onEndCall) onEndCall();
    };

    const onDataReceived = (payload, participant, kind, topic) => {
      try {
        const msg = JSON.parse(new TextDecoder().decode(payload));
        if (msg.type === "end_conversation") {
          console.log("AvatarVoiceAgent: Received end_conversation signal - letting main widget handle delay");
          // No action here, LiveKitWidgetSticky handles the global WS signal or data event better
        }
        if (msg.type === "navigate" && msg.url) {
          console.log(`AvatarVoiceAgent: Navigate to ${msg.url}`);
          if (location.pathname !== msg.url) {
            navigate(msg.url);
          }
        }
      } catch (e) {
        console.error("Failed to decode data", e);
      }
    };

    room.on(RoomEvent.DataReceived, onDataReceived);
    room.on(RoomEvent.Disconnected, onDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, onDataReceived);
      room.off(RoomEvent.Disconnected, onDisconnected);
    };
  }, [room, onEndCall, navigate, location.pathname]);

  const toggleScreenShare = async () => {
    try {
      if (localParticipant) {
        await localParticipant.setScreenShareEnabled(!localParticipant.isScreenShareEnabled);
      }
    } catch (e) {
      console.error("Screen share error", e);
    }
  };

  return (
    <div className="relative w-full h-full group bg-black cursor-none">
      {agentTrack ? (
        <VideoTrack
          trackRef={agentTrack}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">
          <div className="w-10 h-10 border-2 border-white/5 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-[9px] text-indigo-400 mt-4 tracking-[0.2em] font-bold uppercase">
            Waking up avatar
          </span>
        </div>
      )}

      {/* Control Overlay - Only visible on hover */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
            }`}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        <button
          onClick={onEndCall}
          className="w-11 h-11 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white/10 shadow-lg"
        >
          <PhoneOff size={20} fill="currentColor" />
        </button>

        <button
          onClick={toggleScreenShare}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white border border-white/10"
        >
          <Monitor size={16} />
        </button>
      </div>

      {/* Subtle Gradient Overlay for controls legibility */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default AvatarVoiceAgent;