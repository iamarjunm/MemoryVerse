"use client";
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MediaCard } from './MediaCard';

export function ForestTheme({ nodes, onMemoryClick }: { nodes: any[], onMemoryClick: (data: any | null) => void }) {
  const cardCount = Math.max(nodes.length, 1);
  const radius = Math.max(15, cardCount * 5); // Dynamic radius based on photo count

  // Trees using InstancedMesh for massive performance gain
  const treeCount = Math.min(250, cardCount * 8);
  const treeTrunkRef = useRef<THREE.InstancedMesh>(null);
  const treeFoliageRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const treeData = useMemo(() => {
    return Array.from({ length: treeCount }, (_, i) => { 
      const angle = (i / treeCount) * Math.PI * 2 * 6; // Spiral outwards
      // Keep trees strictly outside the inner radius where memories are
      const r = radius + 5 + (i * 1.5) + Math.random() * 20; 
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        height: 20 + Math.random() * 20,
        thickness: 1.2 + Math.random() * 1.5,
        angle,
      };
    });
  }, [treeCount, radius]);

  useFrame(() => {
    if (treeTrunkRef.current && treeFoliageRef.current) {
      treeData.forEach((tree, i) => {
        // Trunk
        dummy.position.set(tree.x, -10 + tree.height / 2, tree.z);
        dummy.scale.set(tree.thickness, tree.height, tree.thickness);
        dummy.rotation.set(0, tree.angle, 0);
        dummy.updateMatrix();
        treeTrunkRef.current!.setMatrixAt(i, dummy.matrix);
        
        // Foliage
        dummy.position.set(tree.x, -10 + tree.height + 2, tree.z);
        dummy.scale.set(tree.thickness * 4, 15 + (i % 3) * 5, tree.thickness * 4);
        dummy.updateMatrix();
        treeFoliageRef.current!.setMatrixAt(i, dummy.matrix);
      });
      treeTrunkRef.current.instanceMatrix.needsUpdate = true;
      treeFoliageRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.5, 1, 1, 6), []);
  const foliageGeo = useMemo(() => new THREE.ConeGeometry(1, 1, 6), []);

  // Glowing Mushrooms (InstancedMesh)
  const mushroomCount = Math.min(150, cardCount * 6);
  const mushroomStemRef = useRef<THREE.InstancedMesh>(null);
  const mushroomCapRef = useRef<THREE.InstancedMesh>(null);
  
  const mushroomData = useMemo(() => {
    return Array.from({ length: mushroomCount }, (_, i) => {
      const angle = (i / mushroomCount) * Math.PI * 2 * 5;
      const r = radius * 0.5 + (i * 1.5) + Math.random() * 10;
      return {
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        scale: 0.5 + Math.random() * 0.8,
        colorType: i % 3,
      };
    });
  }, [mushroomCount, radius]);

  const stemGeo = useMemo(() => new THREE.CylinderGeometry(0.15, 0.25, 1.2, 5), []);
  const capGeo = useMemo(() => new THREE.SphereGeometry(0.7, 8, 6), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mushroomStemRef.current && mushroomCapRef.current) {
      mushroomData.forEach((m, i) => {
        dummy.position.set(m.x, -9.5, m.z);
        dummy.scale.set(m.scale, m.scale, m.scale);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        mushroomStemRef.current!.setMatrixAt(i, dummy.matrix);
        
        // Bobbing caps
        dummy.position.set(m.x, -9.5 + 0.9 * m.scale + Math.sin(t * 2 + i) * 0.05, m.z);
        dummy.updateMatrix();
        mushroomCapRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mushroomStemRef.current.instanceMatrix.needsUpdate = true;
      mushroomCapRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <fog attach="fog" args={['#020b06', 20, 400]} />

      {/* Optimized lighting - No point lights on individual objects */}
      <ambientLight intensity={0.6} color="#071a08" />
      <directionalLight position={[15, 60, 15]} intensity={1.8} color="#ccffcc" />
      <pointLight position={[0, 25, 0]} intensity={3.5} color="#86efac" distance={500} />
      <pointLight position={[-radius*2, 10, -radius*2]} intensity={2} color="#4ade80" distance={400} />
      <pointLight position={[radius*2, 10, radius*2]} intensity={2} color="#22c55e" distance={400} />

      {/* Fireflies & Mist using Sparkles (GPU accelerated, very cheap) */}
      <Sparkles count={Math.min(1500, cardCount * 25)} scale={radius * 4} size={6} speed={0.4} opacity={0.8} color="#fef08a" />
      <Sparkles count={Math.min(1000, cardCount * 15)} scale={radius * 3} size={4} speed={0.2} opacity={0.5} color="#bef264" />
      <Sparkles count={Math.min(800, cardCount * 10)} scale={radius * 4} size={40} speed={0.1} opacity={0.08} color="#a7f3d0" /> {/* Mist fake */}

      {/* Trees */}
      <instancedMesh ref={treeTrunkRef} args={[trunkGeo, undefined, treeCount]}>
        <meshStandardMaterial color="#1a1107" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={treeFoliageRef} args={[foliageGeo, undefined, treeCount]}>
        <meshStandardMaterial color="#0f3b20" roughness={0.8} />
      </instancedMesh>

      {/* Mushrooms */}
      <instancedMesh ref={mushroomStemRef} args={[stemGeo, undefined, mushroomCount]}>
        <meshStandardMaterial color="#d6d3d1" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={mushroomCapRef} args={[capGeo, undefined, mushroomCount]}>
        <meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.8} roughness={0.4} />
      </instancedMesh>

      {/* Forest floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <circleGeometry args={[800, 64]} />
        <meshStandardMaterial color="#040d04" roughness={1} />
      </mesh>

      {/* Glowing magic runes on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9.8, 0]}>
        <ringGeometry args={[radius * 0.8, radius * 0.85, 64]} />
        <meshBasicMaterial color="#166534" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Moon */}
      <mesh position={[20, 80, -100]}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshStandardMaterial color="#e0ffe0" emissive="#aaffaa" emissiveIntensity={0.6} roughness={0.4} />
      </mesh>

      {/* Memory nodes */}
      {nodes.map((node) => (
        <group key={node.data.id} position={node.position}>
          <MediaCard data={node.data} onClick={onMemoryClick} theme="forest" />
        </group>
      ))}
    </group>
  );
}
