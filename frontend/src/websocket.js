let socket = null;
let reconnectTimer = null;

export const connectWebSocket = (onMessage) => {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  console.log("Connecting WebSocket...");
  const wsUrl = import.meta.env.VITE_WS_URL;
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log("WebSocket Connected");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.warn("WS Message Parse Error", e);
    }
  };

  socket.onclose = (event) => {
    console.log("WebSocket Closed:", event.code, event.reason);
    socket = null;

    // Auto-reconnect after 3 seconds
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        console.log("Attempting WebSocket Reconnect...");
        reconnectTimer = null;
        connectWebSocket(onMessage);
      }, 3000);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error:", error);
  };
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
