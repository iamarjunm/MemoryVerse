'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const moments = [
  { title: 'The overthinker', note: 'Her brain has 37 tabs open. At least one is playing a song and one is planning a spontaneous adventure.', color: '#fb7185' },
  { title: 'The yapper', note: '“Quick chat?” is never quick. The stories, side quests, and plot twists are all part of the charm.', color: '#fbbf24' },
  { title: 'The soft heart', note: 'She notices when someone needs a little extra care—and shows up with all of hers.', color: '#f9a8d4' },
  { title: 'The good-food radar', note: 'A truly elite instinct for finding the best thing on the menu. Always trust Nisha’s order.', color: '#fdba74' },
  { title: 'The midnight menace', note: 'Says “I’m so tired” and then sends the funniest reel at 2:47 a.m. A predictable delight.', color: '#c4b5fd' },
];

export { moments as diwaliMoments };

function Diya({ position, color, index, onClick }: { position: [number, number, number]; color: string; index: number; onClick: () => void }) {
  const group = useRef<THREE.Group>(null);
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.5 + index) * 0.18;
    if (flame.current) flame.current.scale.y = 0.85 + Math.sin(clock.elapsedTime * 8 + index) * 0.12;
  });
  return <Float speed={1.2 + index * 0.12} rotationIntensity={0.16} floatIntensity={0.6}>
    <group ref={group} position={position} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh position={[0, -0.1, 0]} castShadow>
        <latheGeometry args={[ [new THREE.Vector2(0, 0), new THREE.Vector2(0.22, 0), new THREE.Vector2(0.38, 0.12), new THREE.Vector2(0.42, 0.2), new THREE.Vector2(0.36, 0.24), new THREE.Vector2(0.2, 0.12), new THREE.Vector2(0, 0.1)], 32 ]} />
        <meshStandardMaterial color="#c76729" metalness={0.75} roughness={0.25} emissive="#5a2108" emissiveIntensity={0.35} />
      </mesh>
      <mesh ref={flame} position={[0, 0.34, 0]}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <pointLight position={[0, 0.48, 0]} color={color} intensity={2.2} distance={5} />
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.09} />
      </mesh>
    </group>
  </Float>;
}

function Mandala() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.z += delta * 0.035; });
  return <group ref={ref} position={[0, 0.4, -5]}>
    {[0, 1, 2].map((ring) => <mesh key={ring} rotation={[0, 0, ring * 0.3]}>
      <torusGeometry args={[2.1 + ring * 0.48, 0.012, 8, 120]} />
      <meshBasicMaterial color={ring === 1 ? '#fb7185' : '#fbbf24'} transparent opacity={0.45 - ring * 0.08} />
    </mesh>)}
    {Array.from({ length: 16 }, (_, i) => <mesh key={i} position={[Math.cos(i * Math.PI / 8) * 2.8, Math.sin(i * Math.PI / 8) * 2.8, 0]}>
      <sphereGeometry args={[0.045, 12, 12]} />
      <meshBasicMaterial color={i % 2 ? '#fbbf24' : '#f9a8d4'} />
    </mesh>)}
  </group>;
}

function Rangoli() {
  return <group position={[0, -2.45, 2.4]} rotation={[-Math.PI / 2, 0, 0]}>
    <mesh><circleGeometry args={[3.8, 96]} /><meshBasicMaterial color="#8d2346" transparent opacity={0.3} /></mesh>
    {[0, 1, 2, 3].map((ring) => <mesh key={ring} position={[0, 0, 0.015 + ring * 0.006]}>
      <ringGeometry args={[0.72 + ring * 0.65, 0.75 + ring * 0.65, 96]} />
      <meshBasicMaterial color={['#ffd166', '#f472b6', '#5eead4', '#fb923c'][ring]} transparent opacity={0.88} />
    </mesh>)}
    {Array.from({ length: 12 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 6]}>
      <mesh position={[0, 1.12, 0.03]} scale={[0.29, 0.75, 1]}>
        <circleGeometry args={[0.52, 32]} />
        <meshBasicMaterial color={i % 2 ? '#fb7185' : '#fbbf24'} transparent opacity={0.82} />
      </mesh>
      <mesh position={[0, 2.2, 0.04]}><circleGeometry args={[0.075, 20]} /><meshBasicMaterial color="#fff1b8" /></mesh>
    </group>)}
    <mesh position={[0, 0, 0.06]}><circleGeometry args={[0.46, 32]} /><meshBasicMaterial color="#fbbf24" /></mesh>
  </group>;
}

function MarigoldTorans() {
  const flowers = Array.from({ length: 33 }, (_, i) => {
    const x = -8 + i * 0.5;
    const y = 3.65 - 1.3 * (1 - (x * x) / 64);
    return [x, y, -1.2] as [number, number, number];
  });
  return <group>
    {flowers.map((position, i) => <mesh key={i} position={position} scale={i % 3 === 0 ? 1.3 : 1}>
      <dodecahedronGeometry args={[0.105, 0]} />
      <meshStandardMaterial color={i % 2 ? '#f59e0b' : '#fb923c'} emissive="#a84405" emissiveIntensity={0.25} />
    </mesh>)}
    {[-7.8, 7.8].map((x) => <group key={x} position={[x, 2.65, -1.2]}>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[0, -i * 0.32, 0]}>
        <dodecahedronGeometry args={[0.13, 0]} /><meshStandardMaterial color={i % 2 ? '#f59e0b' : '#fb923c'} />
      </mesh>)}
    </group>)}
  </group>;
}

function Lantern({ position, color, delay }: { position: [number, number, number]; color: string; delay: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1 + delay) * 0.09;
  });
  return <group ref={ref} position={position}>
    <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.012, 0.012, 1.1]} /><meshStandardMaterial color="#d9a441" metalness={0.7} /></mesh>
    <mesh position={[0, -0.12, 0]}><cylinderGeometry args={[0.34, 0.2, 0.65, 8, 1, true]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} transparent opacity={0.82} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshBasicMaterial color={color} transparent opacity={0.22} /></mesh>
    <mesh position={[0, -0.52, 0]}><coneGeometry args={[0.22, 0.22, 8]} /><meshStandardMaterial color="#d99b35" metalness={0.65} /></mesh>
    <pointLight position={[0, -0.1, 0]} color={color} intensity={1.1} distance={4} />
  </group>;
}

function PetalShower() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const petals = useMemo(() => Array.from({ length: 68 }, (_, i) => ({
    x: (Math.sin(i * 87.13) * 0.5 + 0.5) * 19 - 9.5,
    y: (Math.cos(i * 13.71) * 0.5 + 0.5) * 10 - 2,
    z: (Math.sin(i * 4.31) * 0.5 + 0.5) * 16 - 9,
    speed: 0.22 + (i % 7) * 0.035,
    phase: i * 1.73,
    color: ['#fb923c', '#fbbf24', '#fb7185', '#f9a8d4'][i % 4],
  })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    if (!mesh.current) return;
    petals.forEach((petal, i) => mesh.current?.setColorAt(i, new THREE.Color(petal.color)));
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [petals]);
  useFrame(({ clock }) => {
    if (!mesh.current) return;
    petals.forEach((petal, i) => {
      const t = clock.elapsedTime * petal.speed + petal.phase;
      const fallingY = ((petal.y - t * 0.9 + 36) % 12 + 12) % 12 - 3;
      dummy.position.set(petal.x + Math.sin(t * 0.7) * 0.7, fallingY, petal.z + Math.cos(t * 0.4) * 0.35);
      dummy.rotation.set(Math.sin(t) * 0.6, t * 0.5, Math.cos(t * 0.8) * 0.6);
      dummy.scale.set(0.055, 0.022, 0.11);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, petals.length]}>
    <sphereGeometry args={[1, 8, 6]} />
    <meshStandardMaterial roughness={0.8} metalness={0.05} />
  </instancedMesh>;
}

type CrackerStyle = 'sky' | 'rocket' | 'chakri' | 'anaar';

function Firework({ position, color, style }: { position: [number, number, number]; color: string; style: CrackerStyle }) {
  const spinner = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);
  const elapsed = useRef(0);
  const velocities = useMemo(() => {
    const particleCount = style === 'anaar' ? 120 : 90;
    return Array.from({ length: particleCount }, (_, i) => {
      const golden = Math.PI * (3 - Math.sqrt(5));
      const y = 1 - (i / (particleCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const angle = golden * i;
      const speed = 2.2 + ((i * 37) % 100) / 55;
      if (style === 'chakri') return new THREE.Vector3(Math.cos(angle) * speed, y * speed * 0.08, Math.sin(angle) * speed);
      if (style === 'anaar') return new THREE.Vector3(Math.cos(angle) * speed * 0.44, 2.6 + radius * speed * 0.7, Math.sin(angle) * speed * 0.44);
      return new THREE.Vector3(Math.cos(angle) * radius * speed, y * speed, Math.sin(angle) * radius * speed);
    });
  }, [style]);
  const positions = useMemo(() => new Float32Array(velocities.length * 3), [velocities]);
  useFrame((_, delta) => {
    elapsed.current += delta;
    if (style === 'chakri' && spinner.current) spinner.current.rotation.y += delta * 9;
    const geometry = points.current?.geometry;
    const attribute = geometry?.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!attribute) return;
    if (style === 'rocket' && elapsed.current < 0.68) {
      const progress = elapsed.current / 0.68;
      velocities.forEach((_, i) => {
        const trailOffset = (i % 15) * 0.075;
        attribute.setXYZ(i, Math.sin(i * 2.3) * 0.035, progress * 3.5 - trailOffset, Math.cos(i * 1.7) * 0.035);
      });
      attribute.needsUpdate = true;
      const material = points.current?.material as THREE.PointsMaterial | undefined;
      if (material) material.opacity = 0.9;
      return;
    }
    const t = style === 'rocket' ? elapsed.current - 0.68 : elapsed.current;
    velocities.forEach((velocity, i) => {
      const drag = Math.exp(-0.42 * t);
      attribute.setXYZ(i, velocity.x * t * drag, velocity.y * t * drag - 0.42 * t * t, velocity.z * t * drag);
    });
    attribute.needsUpdate = true;
    const material = points.current?.material as THREE.PointsMaterial | undefined;
    if (material) material.opacity = Math.max(0, 1 - t / 1.8);
  });
  return <group ref={spinner} position={position}>
    <points ref={points}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color={color} size={0.11} sizeAttenuation transparent depthWrite={false} />
    </points>
    {style === 'chakri' && <pointLight color={color} intensity={2} distance={3} />}
  </group>;
}

export default function DiwaliScene({ onSelect, burstId }: { onSelect: (index: number) => void; burstId: number }) {
  const [fireworks, setFireworks] = useState<{ id: number; position: [number, number, number]; color: string; style: CrackerStyle }[]>([]);
  const fireworkId = useRef(0);
  const handledBurstId = useRef(0);
  useEffect(() => {
    if (!burstId || handledBurstId.current === burstId) return;
    handledBurstId.current = burstId;
    const colors = ['#ffd166', '#fb7185', '#5eead4', '#c4b5fd', '#fb923c', '#ffffff', '#f472b6', '#a3e635'];
    const styles: CrackerStyle[] = ['sky', 'rocket', 'sky', 'anaar', 'rocket', 'sky', 'chakri', 'sky', 'rocket', 'anaar', 'sky', 'chakri', 'rocket', 'sky', 'sky', 'rocket'];
    const volley = styles.map((style, i) => {
      const count = styles.length;
      return {
        id: ++fireworkId.current,
        position: style === 'anaar'
          ? [((i - (count - 1) / 2) / count) * 7, -1.55, 2 + Math.random() * 2] as [number, number, number]
          : style === 'chakri'
            ? [((i - (count - 1) / 2) / count) * 7, -1.65, 1 + Math.random() * 2] as [number, number, number]
            : style === 'rocket'
              ? [((i - (count - 1) / 2) / Math.max(1, count / 2)) * 7 + (Math.random() - 0.5), -1.6, -1 - Math.random() * 4] as [number, number, number]
              : [((i - (count - 1) / 2) / Math.max(1, count / 2)) * 7 + (Math.random() - 0.5), 1.2 + Math.random() * 4.7, -2 - Math.random() * 5] as [number, number, number],
        color: colors[Math.floor(Math.random() * colors.length)],
        style,
      };
    });
    setFireworks(current => [...current.slice(-24), ...volley]);
    window.setTimeout(() => setFireworks(current => current.filter(item => !volley.some(firework => firework.id === item.id))), 2700);
  }, [burstId]);
  return <div className="absolute inset-0">
    <Canvas camera={{ position: [0, 4.6, 16], fov: 46 }} dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
      <color attach="background" args={['#1b0713']} />
      <fog attach="fog" args={['#1b0713', 14, 34]} />
      <ambientLight intensity={0.8} />
      <pointLight position={[0, 5, 5]} intensity={3.2} color="#ffb454" />
      <pointLight position={[-8, 1, 2]} intensity={1.1} color="#fb7185" />
      <Stars radius={45} depth={35} count={1200} factor={3} saturation={0.35} fade speed={0.3} />
      <Sparkles count={180} scale={[18, 10, 14]} size={3} speed={0.55} color="#ffd28a" />
      <Sparkles count={55} scale={[13, 7, 8]} position={[-5, 3, -5]} size={5} speed={0.8} color="#fb7185" />
      <Sparkles count={55} scale={[13, 7, 8]} position={[5, 4, -5]} size={5} speed={0.7} color="#5eead4" />
      <PetalShower />
      <MarigoldTorans />
      <Lantern position={[-6.6, 3.1, -1]} color="#f97316" delay={0} />
      <Lantern position={[6.4, 2.8, -1.5]} color="#e879f9" delay={1.3} />
      <Lantern position={[-3.5, 4.1, -5]} color="#fbbf24" delay={2.1} />
      <Mandala />
      <Rangoli />
      {fireworks.map(firework => <Firework key={firework.id} position={firework.position} color={firework.color} style={firework.style} />)}
      {moments.map((moment, i) => {
        const angle = (i / moments.length) * Math.PI * 2 - Math.PI / 2;
        return <Diya key={moment.title} index={i} color={moment.color} position={[Math.cos(angle) * 5.2, Math.sin(angle) * 1.55 + 0.2, Math.sin(angle) * 2.2]} onClick={() => onSelect(i)} />;
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
        <circleGeometry args={[12, 96]} />
        <meshStandardMaterial color="#451327" metalness={0.2} roughness={0.72} />
      </mesh>
      <OrbitControls target={[0, -0.9, 0]} enablePan={false} minDistance={9} maxDistance={19} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.9} autoRotate autoRotateSpeed={0.22} />
    </Canvas>
  </div>;
}
