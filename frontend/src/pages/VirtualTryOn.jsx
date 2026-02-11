import React, { useEffect, useRef, useState } from "react";

// PNG images frontend me: frontend/public/ (yahi se load hote hain)
const glassesModels = [
  { id: "avatar1", name: "Classic Aviator", url: "/avatar1.png" },
  { id: "avatar3", name: "Modern Wayfarer", url: "/avatar3.png" },
  { id: "avatar4", name: "Round Metal", url: "/avatar4.png" },
];

export default function VirtualTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const animationIdRef = useRef(null);
  const glassesImageRef = useRef(null);
  // Cleaned version with transparent pixels forced (no checkerboard / full-rect visible)
  const glassesCleanedRef = useRef(null);
  const faceDataRef = useRef({
    position: [0, 0],
    scale: 1,
    rotation: 0,
    hasFace: false,
  });
  const smoothedRef = useRef({
    position: [0.5, 0.5],
    scale: 0.15,
    rotation: 0,
  });
  const SMOOTH = 0.35;

  const [currentModel, setCurrentModel] = useState(glassesModels[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [fps, setFps] = useState(0);

  // Load glasses PNG and build cleaned version so transparent bg doesn't show as checkerboard/rectangle
  useEffect(() => {
    setModelReady(false);
    setError(null);
    glassesCleanedRef.current = null;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      glassesImageRef.current = img;
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const off = document.createElement("canvas");
        off.width = w;
        off.height = h;
        const octx = off.getContext("2d");
        octx.drawImage(img, 0, 0);
        const data = octx.getImageData(0, 0, w, h);
        const d = data.data;
        const alphaThreshold = 0.2;
        const whiteThreshold = 245;   // near-white -> treat as bg
        const grayThreshold = 220;    // light gray (checkerboard) -> treat as bg
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
          const isLowAlpha = a / 255 < alphaThreshold;
          const isWhite = r >= whiteThreshold && g >= whiteThreshold && b >= whiteThreshold;
          const avg = (r + g + b) / 3;
          const isLightGray = avg >= grayThreshold && Math.max(r, g, b) - Math.min(r, g, b) < 25;
          if (isLowAlpha || isWhite || isLightGray) {
            d[i + 3] = 0;
          }
        }
        octx.putImageData(data, 0, 0);
        glassesCleanedRef.current = off;
      } catch (e) {
        console.warn("Glasses cleanup skipped:", e);
      }
      setModelReady(true);
      setError(null);
    };
    img.onerror = () => {
      setError(`Failed to load ${currentModel.name}`);
      setModelReady(false);
    };
    img.src = currentModel.url;
  }, [currentModel]);

  // Initialize camera and face detection
  useEffect(() => {
    let stream = null;
    let mounted = true;
    let faceMesh = null;

    const initializeApp = async () => {
      try {
        // Wait for DOM
        await new Promise((resolve) => setTimeout(resolve, 100));

        const canvas = canvasRef.current;
        const video = videoRef.current;

        if (!canvas || !video) {
          throw new Error("Canvas or video element not found");
        }

        // Set canvas resolution
        canvas.width = 1280;
        canvas.height = 720;
        console.log(`✓ Canvas: ${canvas.width}x${canvas.height}`);

        // Request camera
        console.log("📷 Requesting camera access...");
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        if (!mounted) return;

        video.srcObject = stream;
        console.log("✓ Video stream attached");

        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Video timeout")),
            5000
          );
          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            video.play().catch(reject);
            resolve();
          };
        });

        if (!mounted) return;

        console.log(`✓ Video ready: ${video.videoWidth}x${video.videoHeight}`);
        setCameraActive(true);

        // Load MediaPipe Face Mesh
        console.log("📍 Loading MediaPipe Face Mesh...");
        const { FaceMesh } = await import("@mediapipe/face_mesh");

        faceMesh = new FaceMesh({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        // Handle face detection results (normalized 0–1 coordinates)
        faceMesh.onResults((results) => {
          if (
            results.multiFaceLandmarks &&
            results.multiFaceLandmarks.length > 0
          ) {
            if (faceDetectedCount === 0) {
              console.log("✓ Face detected by MediaPipe!");
            }
            faceDetectedCount++;

            const landmarks = results.multiFaceLandmarks[0];
            // MediaPipe: 33 = right eye outer, 263 = left eye outer, 1 = nose tip, 6 = nose bridge
            const rightEye = landmarks[33];
            const leftEye = landmarks[263];
            const noseBridge = landmarks[6];

            const eyeDistance = Math.hypot(
              rightEye.x - leftEye.x,
              rightEye.y - leftEye.y
            );

            // Center between eyes (normalized 0–1)
            let centerX = (rightEye.x + leftEye.x) / 2;
            let centerY = (rightEye.y + leftEye.y) / 2;
            // Nudge down so glasses sit on nose bridge
            centerY = centerY + (noseBridge.y - centerY) * 0.35;

            // Head tilt = angle of line from right eye to left eye
            const rotation = Math.atan2(
              leftEye.y - rightEye.y,
              leftEye.x - rightEye.x
            );

            // Scale: glasses width in normalized terms (~1.8× eye distance), then we use canvas width for pixel size
            const scaleNormalized = Math.max(eyeDistance * 1.85, 0.08);

            faceDataRef.current = {
              position: [centerX, centerY],
              scale: scaleNormalized,
              rotation,
              hasFace: true,
            };
          } else {
            faceDataRef.current.hasFace = false;
          }
        });

        faceMeshRef.current = faceMesh;

        // Canvas drawing loop
        const ctx = canvas.getContext("2d");
        let frameCount = 0;
        let faceDetectedCount = 0;

        const drawFrame = async () => {
          if (!mounted) return;

          try {
            // Draw video frame mirrored (selfie view: left in real = left on screen)
            ctx.save();
            ctx.scale(-1, 1);
            ctx.translate(-canvas.width, 0);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Draw glasses overlay only when face is detected, with smoothing
            const glassesSource = glassesCleanedRef.current || glassesImageRef.current;
            const glassesReady = glassesImageRef.current?.complete && (glassesSource?.width ?? glassesImageRef.current?.width);
            if (glassesSource && glassesReady && faceDataRef.current.hasFace) {
              const raw = faceDataRef.current;
              const prev = smoothedRef.current;

              smoothedRef.current = {
                position: [
                  prev.position[0] + (raw.position[0] - prev.position[0]) * SMOOTH,
                  prev.position[1] + (raw.position[1] - prev.position[1]) * SMOOTH,
                ],
                scale: prev.scale + (raw.scale - prev.scale) * SMOOTH,
                rotation: prev.rotation + (raw.rotation - prev.rotation) * SMOOTH,
              };

              const [nx, ny] = smoothedRef.current.position;
              const scaleNorm = smoothedRef.current.scale;
              const rotation = smoothedRef.current.rotation;

              const cw = canvas.width;
              const ch = canvas.height;
              const x = (1 - nx) * cw; // mirror X to match flipped video
              const y = ny * ch;

              const sw = glassesSource.naturalWidth ?? glassesSource.width;
              const sh = glassesSource.naturalHeight ?? glassesSource.height;
              const glassWidthPx = scaleNorm * cw;
              const glassHeightPx = (sh / sw) * glassWidthPx;

              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(-rotation); // mirror rotation for flipped view
              ctx.globalCompositeOperation = "source-over";
              ctx.globalAlpha = 0.97;
              ctx.drawImage(
                glassesSource,
                0, 0, sw, sh,
                -glassWidthPx / 2,
                -glassHeightPx / 2,
                glassWidthPx,
                glassHeightPx
              );
              ctx.restore();
            }

            // Process face detection every frame
            if (video.readyState === 4) {
              try {
                await faceMesh.send({ image: video });
              } catch (err) {
                console.warn("Face detection error:", err);
              }
            }
            frameCount++;
          } catch (err) {
            console.error("Draw error:", err);
          }

          animationIdRef.current = requestAnimationFrame(drawFrame);
        };

        drawFrame();
        setIsLoading(false);

        console.log("✓ Virtual try-on READY!");
        console.log("Awaiting face detection... (open browser console with F12)");
      } catch (err) {
        console.error("Initialization error:", err);

        if (!mounted) return;

        const errorMessage =
          err.name === "NotAllowedError"
            ? "❌ Camera permission denied. Refresh and allow access."
            : err.name === "NotFoundError"
              ? "❌ No camera found. Check your device."
              : err.message || "❌ Failed to initialize.";

        setError(errorMessage);
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (faceMesh) {
        faceMesh.close();
      }
    };
  }, []);


  return (
    <div className="w-full min-h-screen bg-[#050505] text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif tracking-widest mb-3 sm:mb-4 text-gradient">
            Virtual Try-On
          </h1>
          <p className="text-sm sm:text-base tracking-widest text-white/60 font-light">
            Experience eyewear in real-time with AI-powered face detection
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <div className="relative bg-black/40 glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl" style={{ aspectRatio: "16/9" }}>
              {/* Hidden video for face detection */}
              <video
                ref={videoRef}
                style={{ display: "none" }}
                autoPlay
                muted
                playsInline
              />

              {/* Canvas with live camera + glasses overlay */}
              <canvas
                ref={canvasRef}
                width={1280}
                height={720}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  backgroundColor: "#000",
                }}
              />

              {/* Status Overlay */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-black/60 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm border border-white/20 z-10">
                {error ? (
                  <span className="text-red-400 font-medium">⚠ {error}</span>
                ) : !cameraActive ? (
                  <span className="text-yellow-400">📹 Requesting camera...</span>
                ) : !modelReady ? (
                  <span className="text-blue-400">📸 Loading glasses...</span>
                ) : (
                  <span className="text-green-400 font-medium">● Live</span>
                )}
              </div>

              {/* Current Glasses Name */}
              <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 bg-black/60 backdrop-blur-xl px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm border border-white/20 z-10">
                <span className="font-serif text-[#c5a059]">{currentModel.name}</span>
              </div>

            </div>

            {/* Instructions */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 glass bg-white/[0.02] rounded-2xl border border-white/5">
              <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.3em] font-bold mb-3">How It Works</p>
              <p className="text-white/60 text-xs sm:text-sm font-light leading-relaxed">
                Keep your face centered • Move your head naturally • Switch styles from the panel • Ensure good lighting for best results
              </p>
            </div>
          </div>

          {/* Glasses Selection */}
          <div className="space-y-4 sm:space-y-6">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-xl sm:text-2xl font-serif tracking-wider mb-4 sm:mb-6 text-white/90">
                Choose Your Style
              </h2>

              <div className="space-y-3">
                {glassesModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setCurrentModel(model)}
                    className={`w-full p-3 sm:p-4 rounded-xl border transition-all duration-300 text-left flex items-center gap-3 sm:gap-4 ${currentModel.id === model.id
                        ? "border-[#c5a059] bg-[#c5a059]/5 shadow-lg"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      }`}
                  >
                    {/* Thumbnail Image */}
                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border flex-shrink-0 ${currentModel.id === model.id ? 'border-[#c5a059]' : 'border-white/10'
                      }`}>
                      <img
                        src={model.url}
                        alt={model.name}
                        className="w-full h-full object-contain bg-white/5 p-1.5"
                      />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <span className={`block font-serif text-sm sm:text-base tracking-wide truncate ${currentModel.id === model.id ? 'text-[#c5a059] font-medium' : 'text-white'
                        }`}>
                        {model.name}
                      </span>
                      <span className="block text-[9px] sm:text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
                        Premium Eyewear
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {currentModel.id === model.id && (
                      <div className="w-2 h-2 rounded-full bg-[#c5a059] animate-pulse flex-shrink-0"></div>
                    )}
                  </button>
                ))}
              </div>

              {/* Tips Box */}
              <div className="mt-6 sm:mt-8 p-4 sm:p-5 glass bg-white/[0.02] rounded-2xl border border-white/5">
                <h3 className="text-[#c5a059] text-[10px] uppercase tracking-[0.3em] font-bold mb-3 sm:mb-4">
                  Pro Tips
                </h3>
                <ul className="text-xs sm:text-sm space-y-2 text-white/60 font-light">
                  <li className="flex items-start gap-2">
                    <span className="text-[#c5a059] mt-0.5">✓</span>
                    <span>Allow camera access when prompted</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c5a059] mt-0.5">✓</span>
                    <span>Ensure good lighting conditions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c5a059] mt-0.5">✓</span>
                    <span>Face the camera directly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#c5a059] mt-0.5">✓</span>
                    <span>Stay 1-2 feet away from screen</span>
                  </li>
                </ul>
              </div>

              {/* Status */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 glass bg-white/[0.02] rounded-xl border border-white/5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-white/40">Camera</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
                      <span className="text-xs text-white/80">{cameraActive ? "Active" : "Waiting"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-white/40">Model</span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${modelReady ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`}></span>
                      <span className="text-xs text-white/80">{modelReady ? "Ready" : "Loading"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="glass bg-red-900/10 border border-red-500/30 rounded-2xl p-4 sm:p-6 mb-8 backdrop-blur">
            <p className="text-red-300 text-sm font-medium mb-2">⚠️ {error}</p>
            <p className="text-red-300/70 text-xs">
              Refresh the page and allow camera access when prompted.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs text-white/20 text-center pt-8 border-t border-white/5">
          <p className="uppercase tracking-widest">Powered by MediaPipe Face Detection + Real-time Canvas Rendering</p>
        </div>
      </div>
    </div>
  );
}
