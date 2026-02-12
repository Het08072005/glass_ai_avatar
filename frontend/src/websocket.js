let socket = null;
let reconnectTimer = null;

export const connectWebSocket = (onMessage) => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  let wsUrl = import.meta.env.VITE_WS_URL || "ws://127.0.0.1:8000/ws";

  // 🔐 Auto-fix protocol if mismatching window.location
  if (window.location.protocol === "https:" && wsUrl.startsWith("ws:")) {
    console.warn("Downgrading ws to wss because of HTTPS context");
    wsUrl = wsUrl.replace("ws:", "wss:");
  }

  console.log("WebSocket: Attempting connection to:", wsUrl);

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("✅ WebSocket Connected Successfully");
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📥 WS Message Received:", data.type);
        onMessage(data);
      } catch (e) {
        console.warn("❌ WS Message Parse Error", e);
      }
    };

    socket.onclose = (event) => {
      console.log("🔌 WebSocket Closed:", event.code, event.reason);
      socket = null;

      // Auto-reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          console.log("🔄 Attempting WebSocket Reconnect...");
          reconnectTimer = null;
          connectWebSocket(onMessage);
        }, 3000);
      }
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket Error:", error);
    };
  } catch (err) {
    console.error("❌ WebSocket Initialization Failed:", err);
  }
};

export const disconnectWebSocket = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (socket) {
    // Override onclose to prevent reconnect logic during manual disconnect
    socket.onclose = null;
    socket.close();
    socket = null;
  }
};
