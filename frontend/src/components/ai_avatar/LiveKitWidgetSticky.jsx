import React, { useState, useCallback, useEffect, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { X, ShieldCheck, MessageSquare } from "lucide-react";
import "@livekit/components-styles";
import AvatarVoiceAgent from "./AvatarVoiceAgent";
import api from "../../api/axios.js";
import { useNavigate, useLocation } from "react-router-dom";

// 🔒 HARD BLOCK: SSR / Insecure Context Guard
if (typeof window !== "undefined") {
  if (!window.isSecureContext && window.location.hostname !== "localhost") {
    console.error("❌ HTTPS is REQUIRED for LiveKit/Media access in production.");
  }
}

// Inner component to handle room events
const RoomDataListener = ({ navigate, location, onEndCall }) => {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleDisconnected = (reason) => {
      console.log("LiveKit Room Disconnected:", reason);
      onEndCall();
    };

    const handleDataReceived = (payload, participant, kind, topic) => {
      try {
        const strData = new TextDecoder().decode(payload);
        const msg = JSON.parse(strData);

        if (msg.type === "end_conversation") {
          console.log("Received end_conversation event - bypassing immediate disconnect in listener");
          // Defer to handleDelayedEndCall or similar
        }
        if (msg.type === "navigate" && msg.url) {
          if (location.pathname !== msg.url) {
            console.log(`Navigating to ${msg.url}`);
            navigate(msg.url);
          }
        }
      } catch (e) {
        console.error("Data decode error", e);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleDisconnected);
    };
  }, [room, navigate, location.pathname, onEndCall]);

  return null;
};

const LiveKitWidgetSticky = () => {
  const [token, setToken] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasManuallyClosed, setHasManuallyClosed] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("idle"); // idle, connecting, active, ended, no-media
  const [mediaError, setMediaError] = useState(null);
  const tokenRequestedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const startSession = useCallback(async (isManual = false) => {
    if (tokenRequestedRef.current || token) return;

    if (isManual) setHasManuallyClosed(false);

    tokenRequestedRef.current = true;
    setSessionStatus("connecting");

    try {
      // 🛑 ABSOLUTE GUARD: Check for Secure Context & Media Support
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        throw new Error("Insecure context: HTTPS is required.");
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error("Media devices not supported in this browser.");
      }

      // 🔥 STEP 1: FORCE MEDIA PERMISSION (Request audio early)
      console.log("🎤 Requesting microphone permission...");
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 🔥 STEP 2: FETCH TOKEN ONLY AFTER MEDIA READY
      const name = `user_${Date.now()}`;
      console.log("Fetching token for", name);
      const res = await api.get("/getToken", {
        params: { name },
        timeout: 10000 // 10s timeout
      });

      if (!res.data || typeof res.data !== 'string') {
        throw new Error("Invalid token received from server.");
      }

      setToken(res.data);
      setSessionStatus("active");
    } catch (err) {
      console.error("❌ SESSION START FAILED:", err);
      setSessionStatus("no-media");

      let friendlyMessage = "Microphone access failed.";
      if (err.message?.includes("Insecure context")) {
        friendlyMessage = "Security Restriction: HTTPS is required for AI voice.";
      } else if (err.message?.includes("permission")) {
        friendlyMessage = "Microphone permission denied. Please allow access and refresh.";
      } else if (err.code === 'ECONNABORTED') {
        friendlyMessage = "Server timeout. Please check if the backend is running.";
      }

      setMediaError(friendlyMessage);
      tokenRequestedRef.current = false;
    }
  }, [token]);

  // Main Logic: Auto-Connect only on Home Page AND if not manually closed
  useEffect(() => {
    const isHomePage = location.pathname === "/" || location.pathname === "";

    // Auto-start ONLY on home page AND only if we haven't manually closed it yet
    if (isHomePage && !token && !tokenRequestedRef.current && !hasManuallyClosed) {
      const timer = setTimeout(() => {
        console.log("🤖 Auto-starting AI on Home Page (Delayed for LCP)...");
        setIsOpen(true);
        startSession(false);
      }, 800); // Give 800ms for the page to paint properly
      return () => clearTimeout(timer);
    }
    // If we've moved away from home and no session is active, hide it (Manual Mode)
    else if (!isHomePage && !token) {
      setIsOpen(false);
    }
  }, [location.pathname, startSession, token, hasManuallyClosed]);

  // Trigger navigation when token is received on Home Page
  useEffect(() => {
    const isHomePage = location.pathname === "/" || location.pathname === "";
    if (token && isHomePage) {
      console.log("🚀 Token received, navigating to /products");
      navigate("/products");
    }
  }, [token, location.pathname, navigate]);

  const handleEndCall = useCallback(() => {
    console.log("🛑 FORCE KILLING SESSION INSTANTLY");

    // ⚡ 1. KILL the room immediately (Stops the video instantly)
    setToken(null);
    tokenRequestedRef.current = false;

    // ⚡ 2. Close the widget immediately (The "Autoclick" effect)
    setIsOpen(false);
    setHasManuallyClosed(true); // 🛑 STOP the auto-connect loop!
    setSessionStatus("idle");
  }, []);

  const handleDelayedEndCall = useCallback(() => {
    console.log("⏳ RECEIVED AUTO-END SIGNAL. Waiting for final speech...");
    // Wait about 7 seconds for "Thank you! Have a nice day!" to finish
    setTimeout(() => {
      handleEndCall();
    }, 7000);
  }, [handleEndCall]);

  // 🔥 Listen for Global WebSocket End Session Event for absolute speed
  useEffect(() => {
    const handleGlobalEnd = () => {
      console.log("⚡ Instant Global Disconnect Signal Received! Starting delay...");
      handleDelayedEndCall();
    };

    window.addEventListener("ws-end-session", handleGlobalEnd);
    return () => window.removeEventListener("ws-end-session", handleGlobalEnd);
  }, [handleDelayedEndCall]);

  // When user manually clicks the bubble button
  const handleManualOpen = () => {
    setIsOpen(true);
    if (!token) {
      startSession(true); // Force clear the hasManuallyClosed flag
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleManualOpen}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all border border-white/10"
      >
        <MessageSquare size={18} className="sm:hidden" />
        <MessageSquare size={20} className="hidden sm:block" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[85vw] max-w-[280px] sm:w-[280px] bg-[#0b0b0b] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans text-white">
      <button
        onClick={handleEndCall}
        className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-50 bg-black/40 hover:bg-black/60 backdrop-blur-md p-1 sm:p-1.5 rounded-full transition-all border border-white/10"
      >
        <X size={12} className="sm:hidden" />
        <X size={14} className="hidden sm:block" />
      </button>

      <div className="relative aspect-[3/4] bg-zinc-950 flex items-center justify-center overflow-hidden">
        {sessionStatus === "ended" && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-zinc-400" />
            </div>
            <h3 className="text-xl font-medium text-white mb-1">Session Ended</h3>
            <p className="text-sm text-zinc-400">Thanks for visiting!</p>
          </div>
        )}

        {sessionStatus === "no-media" ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <ShieldCheck size={40} className="text-red-500 mb-4" />
            <p className="text-sm font-medium text-white mb-2">Security Restriction</p>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              {mediaError || "Voice interaction requires an HTTPS connection for security."}
            </p>
            <button
              onClick={() => {
                setSessionStatus("idle");
                setIsOpen(false);
              }}
              className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-[10px] uppercase tracking-wider transition-colors"
            >
              Close
            </button>
          </div>
        ) : sessionStatus === "connecting" ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
              Connecting AI...
            </p>
          </div>
        ) : (token && sessionStatus === "active") ? (
          <LiveKitRoom
            key="livekit-room"
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            token={token}
            connect={true}
            audio={true}
            onDisconnected={handleEndCall}
            onMediaDeviceError={(e) => {
              console.error("LiveKit Media Error:", e);
              setMediaError("Audio output blocked by browser. Click anywhere to enable.");
            }}
            className="w-full h-full relative"
          >
            <RoomAudioRenderer />
            <RoomDataListener
              navigate={navigate}
              location={location}
              onEndCall={handleEndCall}
            />
            <AvatarVoiceAgent
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              onEndCall={handleEndCall}
            />
          </LiveKitRoom>
        ) : null}
      </div>

      <div className="py-2.5 bg-black/90 flex items-center justify-center gap-2 border-t border-white/5">
        <ShieldCheck size={10} className="text-indigo-400" />
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
          Secure AI Session
        </span>
      </div>
    </div>
  );
};

export default LiveKitWidgetSticky;