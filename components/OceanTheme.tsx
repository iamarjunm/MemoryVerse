"use client";
import { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Instance, Instances } from '@react-three/drei';
import * as Drei from '@react-three/drei';
import * as THREE from 'three';

export function OceanTheme({ nodes, onMemoryClick }: { nodes: any[], onMemoryClick: (data: any) => void }) {
  const cardCount = Math.max(nodes.length, 1);
  
  // Rising bubbles
  const bubbleCount = Math.min(2000, cardCount * 40);
  const bubblesGeo = useMemo(() => {
    const count = bubbleCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const r2 = Math.sin(i * 39.346 + 11.135) * 23421.631;
      const r3 = Math.sin(i * 73.156 + 54.721) * 31415.926;
      positions[i * 3]     = (r1 - Math.floor(r1) - 0.5) * Math.max(300, cardCount * 25);
      positions[i * 3 + 1] = (r2 - Math.floor(r2) - 0.5) * Math.max(150, cardCount * 12);
      positions[i * 3 + 2] = (r3 - Math.floor(r3) - 0.5) * Math.max(300, cardCount * 25);
      sizes[i] = 0.3 + (r1 - Math.floor(r1)) * 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [bubbleCount, cardCount]);

  const bubblesRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (bubblesRef.current) {
      const pos = bubblesRef.current.geometry.attributes.position.array as Float32Array;
      const t = state.clock.elapsedTime;
      for (let i = 0; i < pos.length / 3; i++) {
        pos[i * 3 + 1] += 0.04 + (i % 7) * 0.012;
        // Gentle horizontal drift
        pos[i * 3] += Math.sin(t * 0.3 + i * 0.05) * 0.01;
        if (pos[i * 3 + 1] > 100) pos[i * 3 + 1] -= 200;
      }
      bubblesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Caustic light pattern (animated plane on the floor)
  const causticRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (causticRef.current) {
      causticRef.current.rotation.z = state.clock.elapsedTime * 0.03;
      (causticRef.current.material as THREE.MeshBasicMaterial).opacity = 0.04 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  // Organic Kelp using TubeGeometry
  const kelpCount = Math.min(60, cardCount * 3);
  const kelpSegments = 5;
  const kelps = useMemo(() => {
    return Array.from({ length: kelpCount }, (_, i) => {
      const angle = (i / kelpCount) * Math.PI * 2 * 3;
      const r = Math.max(15, cardCount * 1.5) + (i * 3) + Math.random() * 20;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const height = 15 + Math.random() * 25;
      
      const points = [];
      for (let j = 0; j <= kelpSegments; j++) {
        // slight bezier curve
        const offset = Math.sin(j * 0.8) * 2;
        points.push(new THREE.Vector3(offset, (j / kelpSegments) * height, 0));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, kelpSegments * 2, 0.4 + Math.random() * 0.3, 6, false);
      
      return { x, z, geom, phase: Math.random() * 100 };
    });
  }, [kelpCount, cardCount]);

  const kelpRefs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    kelpRefs.current.forEach((mesh, i) => {
      if (mesh && kelps[i]) {
        mesh.rotation.z = Math.sin(t * 0.5 + kelps[i].phase) * 0.1;
        mesh.rotation.x = Math.cos(t * 0.4 + kelps[i].phase) * 0.08;
      }
    });
  });

  // Schooling Fish (InstancedMesh)
  const fishCount = Math.min(250, cardCount * 15);
  const fishRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const fishData = useMemo(() => {
    return Array.from({ length: fishCount }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * Math.max(100, cardCount * 10),
        -15 + Math.random() * 60,
        (Math.random() - 0.5) * Math.max(100, cardCount * 10)
      ),
      speed: 1.0 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI * 2,
      turnSpeed: (Math.random() - 0.5) * 0.4,
    }));
  }, [fishCount, cardCount]);

  const fishGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(1, 0.5, 2, 0);
    shape.quadraticCurveTo(1, -0.5, 0, 0);
    // Tail
    shape.moveTo(0, 0);
    shape.lineTo(-0.8, 0.6);
    shape.lineTo(-0.8, -0.6);
    shape.lineTo(0, 0);
    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();
    geom.scale(0.3, 0.3, 0.3);
    return geom;
  }, []);

  useFrame((state, delta) => {
    if (fishRef.current) {
      const t = state.clock.elapsedTime;
      fishData.forEach((fish, i) => {
        // Swarm logic
        fish.angle += fish.turnSpeed * delta + Math.sin(t * 0.3 + fish.phase) * 0.01;
        
        fish.pos.x += Math.cos(fish.angle) * fish.speed * delta * 4;
        fish.pos.z += Math.sin(fish.angle) * fish.speed * delta * 4;
        fish.pos.y += Math.sin(t * fish.speed + fish.phase) * delta * 1.5;

        // Wrap around bounds softly
        const range = Math.max(150, cardCount * 12);
        if (fish.pos.x > range) fish.pos.x -= range * 2;
        if (fish.pos.x < -range) fish.pos.x += range * 2;
        if (fish.pos.z > range) fish.pos.z -= range * 2;
        if (fish.pos.z < -range) fish.pos.z += range * 2;
        if (fish.pos.y > 60) fish.pos.y -= 80;
        if (fish.pos.y < -20) fish.pos.y += 80;

        dummy.position.copy(fish.pos);
        dummy.rotation.y = -fish.angle;
        dummy.rotation.x = Math.sin(t * fish.speed * 2 + fish.phase) * 0.15; // Swim wobble
        dummy.updateMatrix();
        fishRef.current!.setMatrixAt(i, dummy.matrix);
      });
      fishRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // God rays (volumetric light shafts from above)
  const rayCount = Math.min(12, Math.max(4, Math.floor(cardCount / 2)));
  const rays = useMemo(() =>
    Array.from({ length: rayCount }, (_, i) => {
      const angle = (i / rayCount) * Math.PI * 2;
      return { x: Math.cos(angle) * 15, z: Math.sin(angle) * 15, rotY: angle };
    })
  , [rayCount]);

  // Bioluminescent Jellyfish
  const jellyCount = Math.min(25, Math.max(3, Math.floor(cardCount * 0.4)));
  const jellies = useMemo(() => Array.from({ length: jellyCount }, (_, i) => ({
    x: (Math.random() - 0.5) * Math.max(100, cardCount * 10),
    y: -20 + Math.random() * 80,
    z: (Math.random() - 0.5) * Math.max(100, cardCount * 10),
    speed: 0.15 + Math.random() * 0.2,
    phase: Math.random() * Math.PI * 2,
    scale: 0.8 + Math.random() * 0.6
  })), [jellyCount, cardCount]);
  const jellyRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    jellyRefs.current.forEach((jelly, i) => {
      const data = jellies[i];
      if (jelly && data) {
        jelly.position.y += Math.sin(t * data.speed + data.phase) * 0.05;
        jelly.position.x += Math.cos(t * data.speed * 0.5) * 0.02;
        jelly.rotation.y = t * 0.2;
        // Pulse scale
        const s = data.scale * (1 + Math.sin(t * 2 + data.phase) * 0.1);
        jelly.scale.set(s, s, s);
      }
    });
  });

  return (
    <group>
      <fog attach="fog" args={['#000b1a', 40, 700]} />

      {/* Layered underwater lighting */}
      <directionalLight position={[8, 80, 8]} intensity={3.5} color="#4dd8ff" />
      <pointLight position={[0, 30, 0]} intensity={4} color="#38bdf8" distance={500} />
      <pointLight position={[-150, -10, -150]} intensity={2.5} color="#0066cc" distance={400} />
      <pointLight position={[150, -10, 150]} intensity={2.5} color="#00aaff" distance={400} />
      <ambientLight intensity={0.6} color="#011844" />

      {/* Sparkle shimmer */}
      <Sparkles count={Math.min(3000, cardCount * 40)} scale={Math.max(250, cardCount * 30)} size={5} speed={0.5} opacity={0.3} color="#bae6fd" />
      {/* Bioluminescent glow motes */}
      <Sparkles count={Math.min(1000, cardCount * 20)} scale={Math.max(180, cardCount * 25)} size={8} speed={0.2} opacity={0.6} color="#00ffcc" />

      {/* Rising bubbles */}
      <points ref={bubblesRef} geometry={bubblesGeo}>
        <pointsMaterial size={0.6} color="#e0f7ff" transparent opacity={0.45} sizeAttenuation />
      </points>

      {/* Schooling Fish */}
      <instancedMesh ref={fishRef} args={[fishGeo, undefined, fishCount]}>
        <meshPhysicalMaterial color="#38bdf8" roughness={0.2} metalness={0.7} transmission={0.2} />
      </instancedMesh>

      {/* Caustic floor */}
      <mesh ref={causticRef as any} rotation={[-Math.PI / 2, 0, 0]} position={[0, -22, 0]}>
        <circleGeometry args={[1200, 64]} />
        <meshBasicMaterial color="#00aaff" transparent opacity={0.06} />
      </mesh>

      {/* Glowing floor disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -20, 0]}>
        <ringGeometry args={[0, 900, 64]} />
        <meshBasicMaterial color="#002244" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* God rays from surface */}
      {rays.map((ray, i) => (
        <GodRay key={i} x={ray.x} z={ray.z} rotY={ray.rotY} index={i} />
      ))}

      {/* Organic Kelp */}
      {kelps.map((kelpData, i) => (
        <mesh
          key={`kelp-${i}`}
          ref={el => { if (el) kelpRefs.current[i] = el; }}
          position={[kelpData.x, -22, kelpData.z]}
          geometry={kelpData.geom}
        >
          <meshStandardMaterial
            color={i % 3 === 0 ? "#064e3b" : (i % 3 === 1 ? "#065f46" : "#0f766e")}
            transparent
            opacity={0.85}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Jellyfish */}
      {jellies.map((data, i) => (
        <group key={`jelly-${i}`} ref={el => { if (el) jellyRefs.current[i] = el; }} position={[data.x, data.y, data.z]}>
          <mesh position={[0, 1, 0]}>
            <sphereGeometry args={[2, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshPhysicalMaterial color="#38bdf8" transparent opacity={0.4} transmission={0.9} roughness={0.1} side={THREE.DoubleSide} />
            <pointLight color="#bae6fd" intensity={2} distance={15} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.8, 16, 16]} />
            <meshBasicMaterial color="#00ffcc" transparent opacity={0.7} />
          </mesh>
          {Array.from({length: 6}).map((_, ti) => (
            <mesh key={ti} position={[Math.cos((ti/6)*Math.PI*2)*1.2, -1.5, Math.sin((ti/6)*Math.PI*2)*1.2]}>
              <cylinderGeometry args={[0.05, 0.01, 3, 4]} />
              <meshBasicMaterial color="#7dd3fc" transparent opacity={0.6} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Memory bubble nodes */}
      {nodes.map((node) => (
        <OceanNode 
          key={node.data.id} 
          data={node.data} 
          position={node.position} 
          onClick={onMemoryClick} 
        />
      ))}
    </group>
  );
}

function GodRay({ x, z, rotY, index }: { x: number, z: number, rotY: number, index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.03 + Math.sin(state.clock.elapsedTime * 0.3 + index * 0.8) * 0.015;
    }
  });
  return (
    <mesh ref={ref as any} position={[x, 15, z]} rotation={[0, rotY, 0.15]}>
      <coneGeometry args={[8, 70, 8, 1, true]} />
      <meshBasicMaterial color="#aaddff" transparent opacity={0.04} side={THREE.DoubleSide} />
    </mesh>
  );
}

function OceanNode({ data, position, onClick }: { data: any; position: [number, number, number], onClick: (data: any) => void }) {
  const [hovered, setHover] = useState(false);
  const sphereRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const phaseX = useMemo(() => Math.random() * Math.PI * 2, []);
  const phaseY = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sphereRef.current) {
      (sphereRef.current.material as THREE.MeshPhysicalMaterial).opacity =
        hovered ? 0.7 : 0.35 + Math.sin(t * 1.5) * 0.1;
    }
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + phaseY) * 2.0;
      groupRef.current.position.x = position[0] + Math.cos(t * 0.3 + phaseX) * 1.2;
      groupRef.current.rotation.z = Math.sin(t * 0.4 + phaseX) * 0.06;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.6}>
      <group ref={groupRef} position={position}>
        <Drei.Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          {/* Glass bubble sphere */}
          <mesh ref={sphereRef} position={[0, 0, -0.5]}>
            <sphereGeometry args={[3.0, 48, 48]} />
            <meshPhysicalMaterial 
              color={hovered ? "#bae6fd" : '#38bdf8'} 
              transparent opacity={0.25}
              metalness={0.15} roughness={0.0}
              transmission={0.98} ior={1.1}
              thickness={0.8}
            />
            <pointLight color={hovered ? "#00ffcc" : "#38bdf8"} intensity={hovered ? 4 : 2} distance={25} />
          </mesh>
          {/* Outer shimmer ring */}
          <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.5, 0.08, 12, 48]} />
            <meshBasicMaterial color={hovered ? "#7dd3fc" : "#0ea5e9"} transparent opacity={hovered ? 0.9 : 0.4} />
          </mesh>
          
          <Drei.Html transform distanceFactor={14} position={[0, 0, 0]} zIndexRange={[100, 0]}>
            <div 
              onPointerEnter={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
              onPointerLeave={() => { setHover(false); document.body.style.cursor = 'auto'; }}
              onClick={(e) => { 
                e.stopPropagation(); 
                onClick(data); 
                document.body.style.cursor = 'auto'; 
              }}
              className={`transition-all duration-500 overflow-hidden cursor-pointer select-none rounded-full flex items-center justify-center relative ${
                hovered 
                  ? 'scale-110 shadow-[0_0_80px_rgba(56,189,248,0.9)] ring-4 ring-cyan-300' 
                  : 'scale-100 shadow-[0_0_40px_rgba(56,189,248,0.4)] ring-2 ring-cyan-400/50'
              }`} 
              style={{ 
                width: '260px', 
                height: '260px', 
                backgroundColor: 'rgba(0, 15, 45, 0.65)', 
                backdropFilter: 'blur(12px)' 
              }}
            >
              {data.type === 'voice' ? (
                <div className="absolute inset-0 flex items-center justify-center flex-col bg-gradient-to-br from-blue-950 to-cyan-950 rounded-full">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center mb-2 animate-pulse">
                    <span className="text-2xl">🎙️</span>
                  </div>
                  <span className="text-xs text-cyan-300 font-medium">Voice Memory</span>
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
                  <div className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
                     <div className="w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.3)_0%,transparent_60%)] animate-[spin_6s_linear_infinite] origin-center -ml-[50%] -mt-[50%] mix-blend-overlay" />
                  </div>
                  <img 
                    src={data.image} 
                    alt={data.title} 
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 origin-center ${hovered ? 'scale-125 opacity-100 filter contrast-125 saturate-125' : 'scale-100 opacity-80 blur-[0.5px]'}`} 
                  />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#000b1a] via-[#000b1a]/30 to-transparent rounded-full pointer-events-none" />
              
              <div className={`absolute top-4 left-6 w-20 h-10 bg-white/20 rounded-full blur-md pointer-events-none transition-all duration-700 ${hovered ? 'translate-y-2 opacity-90' : 'opacity-50'}`} style={{ transform: 'rotate(-35deg)' }} />

              <div className={`absolute bottom-6 flex flex-col items-center text-center px-5 w-full transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-90'}`}>
                <span className="px-2.5 py-0.5 mb-1.5 bg-blue-950/80 backdrop-blur-md rounded-full text-[9px] text-cyan-200 uppercase tracking-widest border border-cyan-400/50 font-bold">{data.type}</span>
                <h3 className="text-white font-serif text-base leading-tight drop-shadow-lg truncate max-w-[200px]">{data.title}</h3>
                <span className="text-cyan-200/90 text-[10px] uppercase tracking-wider mt-1">{data.date}</span>
              </div>
            </div>
          </Drei.Html>
        </Drei.Billboard>
      </group>
    </Float>
  );
}
