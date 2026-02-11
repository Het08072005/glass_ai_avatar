import React, { useState, useCallback, useEffect, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer, useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { X, ShieldCheck, MessageSquare } from "lucide-react";
import "@livekit/components-styles";
import AvatarVoiceAgent from "./AvatarVoiceAgent";
import api from "../../api/axios.js";
import { useNavigate, useLocation } from "react-router-dom";

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
          console.log("Received end_conversation event - forcing immediate disconnect");
          room.disconnect(); // ⚡ Flush local state immediately
          onEndCall();
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

const LiveKitWidget = () => {
  const [token, setToken] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Default false, home page pe true hoga
  const [hasManuallyClosed, setHasManuallyClosed] = useState(false);
  const tokenRequestedRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to start the session
  const startSession = useCallback(async (isManual = false) => {
    if (tokenRequestedRef.current || token) return;

    if (isManual) setHasManuallyClosed(false);

    tokenRequestedRef.current = true;
    try {
      const name = `user_${Date.now()}`;
      const res = await api.get("/getToken", { params: { name } });
      setToken(res.data);
    } catch (err) {
      console.error("❌ Token generation failed:", err);
      tokenRequestedRef.current = false;
    }
  }, [token]);

  // Handle auto-connection ONLY on home page
  useEffect(() => {
    const isHomePage = location.pathname === "/" || location.pathname === "";

    // Case 1: Agar user home page par hai aur token nahi hai aur manually close nahi kiya -> AUTO CONNECT
    if (isHomePage && !token && !tokenRequestedRef.current && !hasManuallyClosed) {
      console.log("🤖 Auto-starting AI on Home Page (LiveKitWidget)...");
      setIsOpen(true);
      startSession(false);
    }
    // Case 2: Agar kisi aur page par hai aur pehle se connect NAHI hai -> WIDGET CLOSED (Manual mode)
    else if (!isHomePage && !token) {
      setIsOpen(false);
    }
  }, [location.pathname, startSession, token, hasManuallyClosed]);

  // Handle automatic navigation when token received on Home page
  useEffect(() => {
    const isHomePage = location.pathname === "/" || location.pathname === "";
    if (token && isHomePage) {
      console.log("🚀 Home page detected, navigating to /products");
      navigate("/products");
    }
  }, [token, location.pathname, navigate]);

  const handleEndCall = useCallback(() => {
    console.log("🛑 FORCE KILLING SESSION INSTANTLY");
    setToken(null);
    tokenRequestedRef.current = false;

    // Kill the widget immediately
    setIsOpen(false);
    setHasManuallyClosed(true); // Stop auto-connect loop
  }, []);

  // 🔥 Listen for Global WebSocket End Session Event for absolute speed
  useEffect(() => {
    const handleGlobalEnd = () => {
      console.log("⚡ Instant Global Disconnect Triggered!");
      handleEndCall();
    };

    window.addEventListener("ws-end-session", handleGlobalEnd);
    return () => window.removeEventListener("ws-end-session", handleGlobalEnd);
  }, [handleEndCall]);

  const handleManualOpen = () => {
    setIsOpen(true);
    if (!token) {
      startSession(true);
    }
  };

  // If widget is closed, show only the trigger button
  if (!isOpen) {
    return (
      <button
        onClick={handleManualOpen}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all border border-white/10"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-[340px] bg-[#0b0b0b] border border-white/10 rounded-[28px] shadow-2xl overflow-hidden flex flex-col font-sans text-white">
      {/* Header / Close Button */}
      <button
        onClick={handleEndCall}
        className="absolute top-4 right-4 z-50 bg-black/40 hover:bg-black/60 backdrop-blur-md p-1.5 rounded-full transition-all border border-white/10"
      >
        <X size={16} />
      </button>

      {/* Main Content Area */}
      <div className="relative aspect-[3/4] bg-zinc-950 flex items-center justify-center overflow-hidden">
        {!token ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] animate-pulse">
              Connecting AI...
            </p>
          </div>
        ) : (
          <LiveKitRoom
            serverUrl="wss://ecommerce-xaanlrl1.livekit.cloud"
            token={token}
            connect={true}
            audio={!isMuted}
            onDisconnected={handleEndCall}
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
        )}
      </div>

      {/* Footer Status */}
      <div className="py-2.5 bg-black/90 flex items-center justify-center gap-2 border-t border-white/5">
        <ShieldCheck size={10} className="text-indigo-400" />
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">
          Secure AI Session
        </span>
      </div>
    </div>
  );
};

export default LiveKitWidget;