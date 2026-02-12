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
      console.log("Global WS Message:", data);
      if (data.type === "SEARCH_RESULT") {
        // 🔥 Store globally so it survives navigation to /products
        window.lastWSSearchResult = data;

        // 🔥 Dispatch a custom event for if the user is already on the page
        const event = new CustomEvent("ws-search-result", { detail: data });
        window.dispatchEvent(event);
      }

      if (data.type === "END_SESSION") {
        console.log("⚡⚡⚡ GLOBAL END_SESSION RECEIVED - KILLING AI NOW ⚡⚡⚡");
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
