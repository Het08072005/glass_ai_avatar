// import React from "react";
// import { BrowserRouter } from "react-router-dom";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import AppRoutes from "./routes/AppRoutes";
// import "./App.css";

// function App() {
//   return (
//     <BrowserRouter>
//       <div className="app-container">
//         <Navbar />
//         <main className="main-content">
//           <AppRoutes />
//         </main>
//         <Footer />
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;







// import React from "react";
// import { BrowserRouter } from "react-router-dom";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import AppRoutes from "./routes/AppRoutes";
// import LiveKitWidgetSticky from "./components/ai_avatar/LiveKitWidgetSticky";
// import "./App.css";

// function App() {
//   return (
//     <BrowserRouter>
//       <div className="app-container">
//         <Navbar />

//         <main className="main-content">
//           <AppRoutes />
//         </main>

//         <Footer />

//         {/* Sticky AI Assistant on all pages */}
//         <LiveKitWidgetSticky />
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;













// import React from "react";
// import { BrowserRouter, useLocation } from "react-router-dom";
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";
// import AppRoutes from "./routes/AppRoutes";
// import LiveKitWidgetSticky from "./components/ai_avatar/LiveKitWidgetSticky";


// function AppContent() {
//   const location = useLocation();

//   // Hum component ko hamesha render karenge, render ke andar logic handle karenge
//   return (
//     <div className="app-container">
//       <Navbar />
//       <main className="main-content">
//         <AppRoutes />
//       </main>
//       <Footer />

//       {/* Logic component ke andar bhej rahe hain */}
//       <LiveKitWidgetSticky mode="sticky" currentPath={location.pathname} />
//     </div>
//   );
// }

// function App() {
//   return (
//     <BrowserRouter>
//       <AppContent />
//     </BrowserRouter>
//   );
// }

// export default App;







import React from "react";
import { BrowserRouter, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";

const LiveKitWidgetSticky = React.lazy(() => import("./components/ai_avatar/LiveKitWidgetSticky"));

import { connectWebSocket, disconnectWebSocket } from "./websocket";

function AppContent() {
  const location = useLocation();

  React.useEffect(() => {
    // 🌐 Start Global WebSocket Connection
    connectWebSocket((data) => {
      // 🏓 Suppress ping/pong logs
      if (data.type === "pong") return;

      console.log("Global WS Message Received:", data.type);

      if (data.type === "SEARCH_LOADING") {
        console.log("📥 SOURCE: WebSocket (Loading):", data.query);
        if (data.query) window.lastWSSearchQuery = data.query;
        window.dispatchEvent(new CustomEvent("ws-search-loading", { detail: data }));
      }

      if (data.type === "SEARCH_RESULT") {
        console.log("📥 SOURCE: WebSocket (Result):", data.query);
        window.lastWSSearchResult = data;
        if (data.query) window.lastWSSearchQuery = data.query;
        window.dispatchEvent(new CustomEvent("ws-search-result", { detail: data }));
      }

      if (data.type === "END_SESSION") {
        console.log("⚡⚡⚡ GLOBAL END_SESSION RECEIVED - KILLING AI NOW ⚡⚡⚡");
        // 🔥 Cleanup global search states on end
        window.lastWSSearchQuery = null;
        window.lastWSSearchResult = null;
        window.dispatchEvent(new CustomEvent("ws-end-session"));
      }
    });

    return () => disconnectWebSocket();
  }, []);


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 ">
        <AppRoutes />
      </main>

      <Footer />

      {/* 🔥 Sticky LiveKit Widget – always mounted */}
      <React.Suspense fallback={null}>
        <LiveKitWidgetSticky />
      </React.Suspense>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
