import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Glasses3D({ model, position, scale, rotation }) {
  const groupRef = useRef(null);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    if (!groupRef.current || !model) return;

    // Clear previous mesh
    groupRef.current.clear();

    const loader = new GLTFLoader();

    loader.load(
      model,
      (gltf) => {
        const scene = gltf.scene;
        scene.scale.set(scale || 1, scale || 1, scale || 1);

        // Apply position
        if (position) {
          scene.position.set(position[0] || 0, position[1] || 0, position[2] || 0);
        }

        // Apply rotation if available
        if (rotation) {
          scene.rotation.x = rotation.x || 0;
          scene.rotation.y = rotation.y || 0;
          scene.rotation.z = rotation.z || 0;
        }

        // Traverse and enhance materials
        scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.envMapIntensity = 0.5;
            }
          }
        });

        groupRef.current.add(scene);
        setLoaded(true);
        setError(null);
      },
      undefined,
      (err) => {
        console.error("Error loading model:", err);
        setError("Failed to load 3D model");
        setLoaded(false);
      }
    );
  }, [model, scale, position, rotation]);

  return (
    <group ref={groupRef}>
      {error && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshBasicMaterial color={0xff0000} wireframe />
        </mesh>
      )}
    </group>
  );
}
