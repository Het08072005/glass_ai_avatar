import * as THREE from "three";

let faceMesh = null;

export async function setupFaceTracker(video, onUpdate) {
  const FaceMesh = (await import("@mediapipe/face_mesh")).FaceMesh;

  faceMesh = new FaceMesh({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults((results) => {
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Key facial points
      const rightEye = landmarks[33];
      const leftEye = landmarks[263];
      const noseTip = landmarks[1];
      const noseBase = landmarks[2];

      // Calculate face dimensions
      const eyeDistance = Math.hypot(
        rightEye.x - leftEye.x,
        rightEye.y - leftEye.y
      );

      // Calculate head rotation using landmarks
      const faceCenter = {
        x: (rightEye.x + leftEye.x) / 2,
        y: (rightEye.y + leftEye.y) / 2,
        z: (rightEye.z + leftEye.z) / 2,
      };

      // Rotation estimation from nose to face center
      const noseDelta = {
        x: noseTip.x - faceCenter.x,
        y: noseTip.y - faceCenter.y,
      };

      // Calculate scale with proper ratio
      const glassesScale = Math.max(eyeDistance * 2.5, 0.5);

      // Position centered on eyes with proper offset
      const centerX = (rightEye.x + leftEye.x) / 2 - 0.5;
      const centerY = -((rightEye.y + leftEye.y) / 2 - 0.4);

      onUpdate({
        position: [centerX * 3, centerY * 3, 0],
        scale: glassesScale,
        rotation: {
          x: noseDelta.y * 0.5,
          y: noseDelta.x * 0.5,
          z: 0,
        },
        landmarks: landmarks,
      });
    }
  });

  return faceMesh;
}

export async function startTracking(faceMesh, video) {
  const Camera = (
    await import("@mediapipe/camera_utils")
  ).Camera;

  const camera = new Camera(video, {
    onFrame: async () => {
      if (faceMesh) {
        await faceMesh.send({ image: video });
      }
    },
    width: 640,
    height: 480,
  });

  await camera.start();
  return camera;
}

export function stopTracking(camera, faceMesh) {
  if (camera) {
    camera.stop();
  }
  if (faceMesh) {
    faceMesh.close();
  }
}
