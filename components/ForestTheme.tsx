"use client";
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MediaCard } from './MediaCard';

function seeded(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function ForestTheme({ nodes, onMemoryClick }: { nodes: any[]; onMemoryClick: (data: any | null) => void }) {
  const cardCount = Math.max(nodes.length, 1);
  const gladeRadius = Math.max(14, cardCount * 1.8);

  const treeCount = Math.min(220, cardCount * 7);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const treeData = useMemo(() => {
    const trees: {
      x: number;
      z: number;
      height: number;
      thickness: number;
      lean: number;
      hue: number;
      phase: number;
    }[] = [];
    let i = 0;
    while (trees.length < treeCount && i < treeCount * 4) {
      const angle = seeded(i, 1) * Math.PI * 2;
      const dist = gladeRadius + 6 + seeded(i, 2) * 55;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.hypot(x, z) < gladeRadius + 2) {
        i++;
        continue;
      }
      trees.push({
        x,
        z,
        height: 14 + seeded(i, 3) * 22,
        thickness: 0.7 + seeded(i, 4) * 1.4,
        lean: (seeded(i, 5) - 0.5) * 0.12,
        hue: seeded(i, 6),
        phase: seeded(i, 7) * Math.PI * 2,
      });
      i++;
    }
    return trees;
  }, [treeCount, gladeRadius]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageARef = useRef<THREE.InstancedMesh>(null);
  const foliageBRef = useRef<THREE.InstancedMesh>(null);
  const foliageCRef = useRef<THREE.InstancedMesh>(null);

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.45, 0.85, 1, 7), []);
  const foliageGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 8), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const refs = [trunkRef, foliageARef, foliageBRef, foliageCRef];
    if (!refs.every(r => r.current)) return;

    treeData.forEach((tree, i) => {
      const sway = Math.sin(t * 0.55 + tree.phase) * 0.04;
      const swayZ = Math.cos(t * 0.42 + tree.phase) * 0.03;

      dummy.position.set(tree.x, tree.height * 0.45, tree.z);
      dummy.scale.set(tree.thickness, tree.height, tree.thickness);
      dummy.rotation.set(swayZ + tree.lean, tree.phase, sway);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      const layers = [
        { y: tree.height * 0.92, scale: tree.thickness * 3.8, h: 11 },
        { y: tree.height * 1.08, scale: tree.thickness * 3.1, h: 9 },
        { y: tree.height * 1.22, scale: tree.thickness * 2.2, h: 7 },
      ];
      const foliageRefs = [foliageARef, foliageBRef, foliageCRef];
      layers.forEach((layer, li) => {
        dummy.position.set(tree.x + sway * 2, layer.y, tree.z + swayZ * 2);
        dummy.scale.set(layer.scale, layer.h, layer.scale);
        dummy.rotation.set(swayZ * 0.5, tree.phase + li * 0.2, sway * 0.5);
        dummy.updateMatrix();
        foliageRefs[li].current!.setMatrixAt(i, dummy.matrix);
      });
    });

    refs.forEach(r => {
      r.current!.instanceMatrix.needsUpdate = true;
    });
  });

  const mushroomCount = Math.min(120, cardCount * 5);
  const mushroomStemRef = useRef<THREE.InstancedMesh>(null);
  const mushroomCapRef = useRef<THREE.InstancedMesh>(null);
  const capColors = useMemo(() => new Float32Array(mushroomCount * 3), [mushroomCount]);

  const mushroomData = useMemo(() => {
    return Array.from({ length: mushroomCount }, (_, i) => {
      const angle = seeded(i, 8) * Math.PI * 2;
      const r = gladeRadius * 0.35 + seeded(i, 9) * gladeRadius * 0.55;
      const palette = [
        new THREE.Color('#f472b6'),
        new THREE.Color('#a78bfa'),
        new THREE.Color('#34d399'),
        new THREE.Color('#fbbf24'),
      ];
      const col = palette[i % palette.length];
      capColors[i * 3] = col.r;
      capColors[i * 3 + 1] = col.g;
      capColors[i * 3 + 2] = col.b;
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        scale: 0.45 + seeded(i, 10) * 0.9,
        phase: seeded(i, 11) * Math.PI * 2,
      };
    });
  }, [mushroomCount, gladeRadius, capColors]);

  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.12, 0.22, 1, 6), []);
  const capGeo = useMemo(() => new THREE.SphereGeometry(0.65, 10, 8), []);

  useEffect(() => {
    if (!mushroomCapRef.current) return;
    const color = new THREE.Color();
    for (let i = 0; i < mushroomCount; i++) {
      color.setRGB(capColors[i * 3], capColors[i * 3 + 1], capColors[i * 3 + 2]);
      mushroomCapRef.current.setColorAt(i, color);
    }
    mushroomCapRef.current.instanceColor!.needsUpdate = true;
  }, [mushroomCount, capColors]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!mushroomStemRef.current || !mushroomCapRef.current) return;
    mushroomData.forEach((m, i) => {
      const bob = Math.sin(time * 1.8 + m.phase) * 0.06;
      dummy.position.set(m.x, 0.35 * m.scale, m.z);
      dummy.scale.set(m.scale, m.scale, m.scale);
      dummy.updateMatrix();
      mushroomStemRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(m.x, 0.75 * m.scale + bob, m.z);
      dummy.updateMatrix();
      mushroomCapRef.current!.setMatrixAt(i, dummy.matrix);
    });
    mushroomStemRef.current.instanceMatrix.needsUpdate = true;
    mushroomCapRef.current.instanceMatrix.needsUpdate = true;
  });

  const leafCount = Math.min(800, cardCount * 30);
  const leavesRef = useRef<THREE.Points>(null);
  const leafGeo = useMemo(() => {
    const positions = new Float32Array(leafCount * 3);
    for (let i = 0; i < leafCount; i++) {
      positions[i * 3] = (seeded(i, 12) - 0.5) * gladeRadius * 4;
      positions[i * 3 + 1] = 4 + seeded(i, 13) * 35;
      positions[i * 3 + 2] = (seeded(i, 14) - 0.5) * gladeRadius * 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [leafCount, gladeRadius]);

  useFrame((state, delta) => {
    if (!leavesRef.current) return;
    const pos = leavesRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < leafCount; i++) {
      pos[i * 3 + 1] -= delta * (0.35 + (i % 5) * 0.08);
      pos[i * 3] += Math.sin(t * 0.4 + i) * delta * 0.35;
      pos[i * 3 + 2] += Math.cos(t * 0.35 + i * 0.5) * delta * 0.25;
      if (pos[i * 3 + 1] < -0.5) {
        pos[i * 3 + 1] = 28 + seeded(i, 15) * 12;
      }
    }
    leavesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const fireflyGeo = useMemo(() => {
    const count = Math.min(400, cardCount * 15);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = seeded(i, 16) * Math.PI * 2;
      const r = gladeRadius * 0.4 + seeded(i, 17) * gladeRadius * 1.2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 1 + seeded(i, 18) * 14;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [cardCount, gladeRadius]);

  const firefliesRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!firefliesRef.current) return;
    const pos = firefliesRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    const count = pos.length / 3;
    for (let i = 0; i < count; i++) {
      pos[i * 3] += Math.sin(t * 0.7 + i * 0.9) * 0.015;
      pos[i * 3 + 1] += Math.cos(t * 0.9 + i * 0.4) * 0.012;
      pos[i * 3 + 2] += Math.sin(t * 0.5 + i * 0.6) * 0.015;
    }
    firefliesRef.current.geometry.attributes.position.needsUpdate = true;
    const mat = firefliesRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.55 + Math.sin(t * 2) * 0.15;
  });

  const moonGlowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (moonGlowRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 0.4) * 0.04;
      moonGlowRef.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <fog attach="fog" args={['#0a1628', 28, 220]} />

      <ambientLight intensity={0.35} color="#1e3a5f" />
      <hemisphereLight args={['#94a3b8', '#0f172a', 0.55]} />
      <directionalLight position={[40, 90, -60]} intensity={1.4} color="#dbeafe" />
      <directionalLight position={[-30, 20, 40]} intensity={0.25} color="#4ade80" />
      <pointLight position={[0, 12, 0]} intensity={2.2} color="#86efac" distance={gladeRadius * 2.5} decay={2} />

      {/* Night sky dome */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[350, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshBasicMaterial color="#0c1929" side={THREE.BackSide} />
      </mesh>

      {/* Moon + halo */}
      <group position={[55, 72, -120]}>
        <mesh ref={moonGlowRef}>
          <sphereGeometry args={[22, 32, 32]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.08} />
        </mesh>
        <mesh>
          <sphereGeometry args={[9, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" emissive="#e2e8f0" emissiveIntensity={0.85} roughness={0.35} />
        </mesh>
      </group>

      {/* Distant star field */}
      <Sparkles count={600} scale={400} size={2} speed={0.05} opacity={0.35} color="#ffffff" />

      {/* Ground — mossy clearing */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[500, 64]} />
        <meshStandardMaterial color="#0a1f12" roughness={1} metalness={0} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[gladeRadius + 4, 64]} />
        <meshStandardMaterial color="#14532d" roughness={0.95} emissive="#052e16" emissiveIntensity={0.15} />
      </mesh>

      {/* Stone path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, gladeRadius * 0.15]}>
        <planeGeometry args={[3.5, gladeRadius * 1.6]} />
        <meshStandardMaterial color="#1c1917" roughness={0.85} />
      </mesh>

      {/* Magic glade ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[gladeRadius * 0.92, gladeRadius * 0.98, 80]} />
        <meshBasicMaterial color="#4ade80" transparent opacity={0.22} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[gladeRadius * 0.55, gladeRadius * 0.58, 64]} />
        <meshBasicMaterial color="#a7f3d0" transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>

      {/* Trees */}
      <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, treeData.length]} frustumCulled={false}>
        <meshStandardMaterial color="#2a1810" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={foliageARef} args={[foliageGeo, undefined, treeData.length]} frustumCulled={false}>
        <meshStandardMaterial color="#0d4a2a" roughness={0.88} emissive="#052e16" emissiveIntensity={0.08} />
      </instancedMesh>
      <instancedMesh ref={foliageBRef} args={[foliageGeo, undefined, treeData.length]} frustumCulled={false}>
        <meshStandardMaterial color="#166534" roughness={0.85} emissive="#064e3b" emissiveIntensity={0.1} />
      </instancedMesh>
      <instancedMesh ref={foliageCRef} args={[foliageGeo, undefined, treeData.length]} frustumCulled={false}>
        <meshStandardMaterial color="#15803d" roughness={0.82} emissive="#14532d" emissiveIntensity={0.12} />
      </instancedMesh>

      {/* Bioluminescent mushrooms */}
      <instancedMesh ref={mushroomStemRef} args={[stemGeo, undefined, mushroomCount]}>
        <meshStandardMaterial color="#e7e5e4" roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={mushroomCapRef} args={[capGeo, undefined, mushroomCount]}>
        <meshStandardMaterial vertexColors emissive="#ffffff" emissiveIntensity={0.6} roughness={0.35} />
      </instancedMesh>

      {/* Falling leaves */}
      <points ref={leavesRef} geometry={leafGeo}>
        <pointsMaterial size={0.35} color="#84cc16" transparent opacity={0.65} depthWrite={false} />
      </points>

      {/* Fireflies */}
      <points ref={firefliesRef} geometry={fireflyGeo}>
        <pointsMaterial size={0.55} color="#fef08a" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>

      <Sparkles count={Math.min(900, cardCount * 18)} scale={gladeRadius * 2.5} size={5} speed={0.35} opacity={0.65} color="#fef9c3" />
      <Sparkles count={Math.min(500, cardCount * 10)} scale={gladeRadius * 3} size={35} speed={0.08} opacity={0.06} color="#bbf7d0" />

      {nodes.map((node) => (
        <group key={node.data.id} position={node.position}>
          <MediaCard data={node.data} onClick={onMemoryClick} theme="forest" />
        </group>
      ))}
    </group>
  );
}
