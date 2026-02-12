import React from "react";
import * as THREE from "three";

export default function TryOnScene({ canvasRef, scene }) {
  React.useEffect(() => {
    if (!canvasRef.current || !scene) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Setup camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 2);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 5, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Add subtle background
    scene.background = new THREE.Color(0x1a1a1a);

    // Animation loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = canvas.clientWidth;
      const newHeight = canvas.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
    };
  }, [canvasRef, scene]);

  return null;
}
