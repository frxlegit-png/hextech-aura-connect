import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";

const ParticleField = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00F5FF"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

const NetworkNodes = () => {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
        ] as [number, number, number],
        scale: Math.random() * 0.15 + 0.05,
      });
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.015;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <mesh position={node.position}>
            <sphereGeometry args={[node.scale, 16, 16]} />
            <meshBasicMaterial color="#00F5FF" transparent opacity={0.7} />
          </mesh>
          {/* Glow */}
          <mesh position={node.position}>
            <sphereGeometry args={[node.scale * 2.5, 16, 16]} />
            <meshBasicMaterial
              color="#00F5FF"
              transparent
              opacity={0.08}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </Float>
      ))}
      {/* Connection lines between nearby nodes */}
      {nodes.map((nodeA, i) =>
        nodes.slice(i + 1).map((nodeB, j) => {
          const dist = Math.sqrt(
            (nodeA.position[0] - nodeB.position[0]) ** 2 +
            (nodeA.position[1] - nodeB.position[1]) ** 2 +
            (nodeA.position[2] - nodeB.position[2]) ** 2
          );
          if (dist > 5) return null;
          const points = [
            new THREE.Vector3(...nodeA.position),
            new THREE.Vector3(...nodeB.position),
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          return (
            <line key={`${i}-${j}`} geometry={geometry}>
              <lineBasicMaterial
                color="#00F5FF"
                transparent
                opacity={0.1}
                blending={THREE.AdditiveBlending}
              />
            </line>
          );
        })
      )}
    </group>
  );
};

const Scene3D = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`absolute inset-0 ${className}`} style={{ pointerEvents: "none" }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.1} />
          <pointLight position={[5, 5, 5]} intensity={0.3} color="#00F5FF" />
          <pointLight position={[-5, -3, 3]} intensity={0.15} color="#6C3BFF" />
          <ParticleField />
          <NetworkNodes />
          <Stars radius={50} depth={50} count={800} factor={2} saturation={0} fade speed={0.5} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Scene3D;
