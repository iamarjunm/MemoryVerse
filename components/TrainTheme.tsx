"use client";
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MediaCard } from './MediaCard';

export function TrainTheme({ 
  nodes, 
  onMemoryClick,
  isPaused = false,
  speedMultiplier = 1
}: { 
  nodes: any[], 
  onMemoryClick: (data: any | null) => void,
  isPaused?: boolean,
  speedMultiplier?: number
}) {
  const offsetRef = useRef(0);
  const effectiveSpeed = isPaused ? 0 : 24 * speedMultiplier;

  useFrame((_, delta) => {
    offsetRef.current += delta * effectiveSpeed;
  });

  return (
    <group>
      <fog attach="fog" args={['#1a1005', 25, 175]} />
      <ambientLight intensity={0.4} color="#ffaa55" />
      <directionalLight position={[0, 20, -50]} intensity={1.8} color="#ff9944" />
      <pointLight position={[0, 0, 10]} intensity={0.8} color="#ffcc77" distance={40} />
      
      <TrainTracks offsetRef={offsetRef} />
      <PassingPillars offsetRef={offsetRef} />
      <TunnelLights offsetRef={offsetRef} />
      <TunnelSparks isPaused={isPaused} speedMultiplier={speedMultiplier} />

      {nodes.map((node) => (
        <TrainNode 
          key={node.data.id} 
          node={node} 
          onClick={onMemoryClick}
          offsetRef={offsetRef}
          isPaused={isPaused}
        />
      ))}
    </group>
  );
}

// Passing structural pillars along both sides of the corridor
const PassingPillars = ({ offsetRef }: { offsetRef: React.RefObject<number> }) => {
  const pillarsRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (pillarsRef.current && offsetRef.current !== undefined) {
      pillarsRef.current.position.z = (offsetRef.current * 1.8) % 30;
    }
  });

  return (
    <group ref={pillarsRef}>
      {[...Array(14)].map((_, i) => (
        <group key={i} position={[0, 0, (i - 9) * 30]}>
          {/* Left pillar */}
          <mesh position={[-20, 0, 0]}>
            <boxGeometry args={[2.5, 60, 4]} />
            <meshStandardMaterial color="#080402" roughness={0.9} />
          </mesh>
          {/* Right pillar */}
          <mesh position={[20, 0, 0]}>
            <boxGeometry args={[2.5, 60, 4]} />
            <meshStandardMaterial color="#080402" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Tunnel warm wall lights and ceiling beams
const TunnelLights = ({ offsetRef }: { offsetRef: React.RefObject<number> }) => {
  const lightsRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (lightsRef.current && offsetRef.current !== undefined) {
      lightsRef.current.position.z = (offsetRef.current * 1.8) % 30;
    }
  });

  return (
    <group ref={lightsRef}>
      {[...Array(14)].map((_, i) => (
        <group key={i} position={[0, 16, (i - 9) * 30]}>
          {/* Left lantern light */}
          <mesh position={[-18.5, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
            <planeGeometry args={[3.5, 1.2]} />
            <meshBasicMaterial color="#ffb055" transparent opacity={0.85} />
          </mesh>
          {/* Right lantern light */}
          <mesh position={[18.5, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
            <planeGeometry args={[3.5, 1.2]} />
            <meshBasicMaterial color="#ffb055" transparent opacity={0.85} />
          </mesh>
          {/* Ceiling arch beam */}
          <mesh position={[0, 10, 0]}>
            <boxGeometry args={[42, 1, 2.5]} />
            <meshStandardMaterial color="#100804" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Moving train tracks down the center floor
const TrainTracks = ({ offsetRef }: { offsetRef: React.RefObject<number> }) => {
  const tracksRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (tracksRef.current && offsetRef.current !== undefined) {
      tracksRef.current.position.z = (offsetRef.current * 1.8) % 8;
    }
  });

  return (
    <group>
      {/* Continuous center rails */}
      <mesh position={[-4.5, -8.5, -80]}>
        <boxGeometry args={[0.3, 0.4, 260]} />
        <meshStandardMaterial color="#886644" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[4.5, -8.5, -80]}>
        <boxGeometry args={[0.3, 0.4, 260]} />
        <meshStandardMaterial color="#886644" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Floor dark base */}
      <mesh position={[0, -9, -80]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[45, 260]} />
        <meshStandardMaterial color="#0b0603" roughness={0.95} />
      </mesh>
      {/* Moving railroad cross ties */}
      <group ref={tracksRef}>
        {[...Array(32)].map((_, i) => (
          <mesh key={i} position={[0, -8.7, (i - 20) * 8]}>
            <boxGeometry args={[12, 0.3, 1.4]} />
            <meshStandardMaterial color="#1f1208" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// Floating warm ambient sparks and speed motes
const TunnelSparks = ({ isPaused, speedMultiplier }: { isPaused: boolean, speedMultiplier: number }) => {
  const count = 180;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const rand1 = r1 - Math.floor(r1);
      const r2 = Math.sin(i * 39.346 + 11.135) * 23421.631;
      const rand2 = r2 - Math.floor(r2);
      const r3 = Math.sin(i * 73.156 + 54.721) * 31415.926;
      const rand3 = r3 - Math.floor(r3);

      pos[i * 3] = (rand1 - 0.5) * 45;
      pos[i * 3 + 1] = (rand2 - 0.5) * 22;
      pos[i * 3 + 2] = -rand3 * 210;
    }
    return pos;
  }, [count]);

  const sparksRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (sparksRef.current) {
      const pos = sparksRef.current.geometry.attributes.position.array as Float32Array;
      const speed = (isPaused ? 6 : 70 * speedMultiplier) * delta;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 2] += speed;
        if (pos[i * 3 + 2] > 25) {
          pos[i * 3 + 2] -= 210;
          pos[i * 3] = (Math.random() - 0.5) * 45;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
        }
      }
      sparksRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={sparksRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.35} color="#ff9933" transparent opacity={0.75} sizeAttenuation />
    </points>
  );
};

function TrainNode({ 
  node, 
  onClick, 
  offsetRef,
  isPaused
}: { 
  node: any, 
  onClick: (data: any | null) => void,
  offsetRef: React.RefObject<number>,
  isPaused: boolean
}) {
  const meshRef = useRef<THREE.Group>(null);
  const position = node.position;
  const isLeft = position[0] < 0;

  useFrame((state) => {
    if (meshRef.current) {
      const totalLength = 225;
      const offset = offsetRef.current ?? 0;

      let currentZ = ((position[2] + offset) % totalLength + totalLength) % totalLength;
      currentZ -= 195;

      meshRef.current.position.z = currentZ;
      meshRef.current.position.x = position[0];
      const swayFactor = isPaused ? 0.04 : 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * (isPaused ? 1 : 2.5) + position[0]) * swayFactor;

      const targetAngleY = isLeft ? 0.32 : -0.32;
      meshRef.current.rotation.set(0, targetAngleY, 0);
    }
  });

  return (
    <group ref={meshRef} position={[position[0], position[1], position[2]]}>
      <MediaCard data={node.data} onClick={onClick} theme="train" />
    </group>
  );
}
