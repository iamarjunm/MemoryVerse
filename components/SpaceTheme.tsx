"use client";
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, Text } from '@react-three/drei';
import * as Drei from '@react-three/drei';
import * as THREE from 'three';
import { VideoPreview } from './MediaCard';

export function SpaceTheme({ 
  nodes, 
  onMemoryClick,
  onFocusConstellation 
}: { 
  nodes: any[], 
  onMemoryClick: (data: any) => void,
  onFocusConstellation?: (position: [number, number, number], name: string) => void 
}) {
  
  // Calculate constellation groupings and lines
  const { lineGeometry, constellations } = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    nodes.forEach(n => {
      const g = n.data.group || 'Scattered';
      if (!groups[g]) groups[g] = [];
      groups[g].push(n);
    });

    const positions: number[] = [];
    const constellationsList = [];

    for (const [groupName, groupNodes] of Object.entries(groups)) {
      if (groupNodes.length === 0) continue;
      
      let centerX = 0, centerY = 0, centerZ = 0;
      
      for (let i = 0; i < groupNodes.length; i++) {
        centerX += groupNodes[i].position[0];
        centerY += groupNodes[i].position[1];
        centerZ += groupNodes[i].position[2];
        
        for (let j = i + 1; j < groupNodes.length; j++) {
          const p1 = new THREE.Vector3(...groupNodes[i].position);
          const p2 = new THREE.Vector3(...groupNodes[j].position);
          if (p1.distanceTo(p2) < 120) {
            positions.push(p1.x, p1.y, p1.z);
            positions.push(p2.x, p2.y, p2.z);
          }
        }
      }
      
      constellationsList.push({
        name: groupName,
        position: [centerX / groupNodes.length, (centerY / groupNodes.length) + 15, centerZ / groupNodes.length] as [number, number, number]
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return { lineGeometry: geo, constellations: constellationsList };
  }, [nodes]);

  // Nebula cloud geometry — large colored dust patches
  const nebulaGeometry = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const nebulaColors = [
      [0.3, 0.1, 0.8], // purple
      [0.1, 0.3, 0.9], // blue
      [0.6, 0.1, 0.6], // magenta
      [0.0, 0.4, 0.7], // teal-blue
    ];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = 80 + Math.sin(i * 7.3) * 55;
      positions[i * 3]     = Math.cos(angle) * r + (Math.sin(i * 13.7) - 0.5) * 60;
      positions[i * 3 + 1] = (Math.sin(i * 9.1) - 0.5) * 70;
      positions[i * 3 + 2] = Math.sin(angle) * r + (Math.cos(i * 17.3) - 0.5) * 60;
      const c = nebulaColors[i % nebulaColors.length];
      colors[i * 3]     = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  // Shooting stars — multiple
  const shootingStars = useRef<THREE.Mesh[]>([]);
  const shootingData = useMemo(() => 
    [0, 1, 2].map(i => ({
      startX: -80 - i * 20,
      startY: 25 + i * 8,
      startZ: -20 - i * 15,
      speedX: 0.9 + i * 0.3,
      speedY: -0.45 - i * 0.1,
      delay: i * 180,
    }))
  , []);
  const shootingFrames = useRef([0, 0, 0]);

  useFrame(() => {
    shootingStars.current.forEach((mesh, i) => {
      if (!mesh) return;
      const d = shootingData[i];
      shootingFrames.current[i]++;
      if (shootingFrames.current[i] < d.delay) return;
      mesh.position.x += d.speedX;
      mesh.position.y += d.speedY;
      if (mesh.position.x > 90) {
        mesh.position.x = d.startX;
        mesh.position.y = d.startY + Math.random() * 20;
        mesh.position.z = d.startZ - Math.random() * 30;
        shootingFrames.current[i] = 0;
      }
    });
  });

  return (
    <group>
      {/* Deep star field */}
      <Stars radius={220} depth={60} count={14000} factor={6} saturation={0} fade speed={0.8} />
      {/* Mid-range sparkles */}
      <Sparkles count={500} scale={160} size={2} speed={0.15} opacity={0.45} color="#88aaff" />
      {/* Gold accent sparkles */}
      <Sparkles count={200} scale={120} size={1.5} speed={0.25} opacity={0.3} color="#ffd700" />

      {/* Nebula dust cloud */}
      <points geometry={nebulaGeometry}>
        <pointsMaterial size={1.6} vertexColors transparent opacity={0.08} sizeAttenuation />
      </points>

      {/* Nebula glow lights */}
      <pointLight position={[-70, 10, -50]} color="#5522ff" intensity={4} distance={130} />
      <pointLight position={[80, -10, 60]} color="#2244dd" intensity={3} distance={110} />
      <pointLight position={[0, 40, -90]} color="#aa22cc" intensity={3} distance={120} />

      {/* Shooting stars */}
      {shootingData.map((d, i) => (
        <mesh
          key={i}
          ref={el => { if (el) shootingStars.current[i] = el; }}
          position={[d.startX, d.startY, d.startZ]}
        >
          <sphereGeometry args={[0.25, 6, 6]} />
          <meshBasicMaterial color="#ffffff" />
          <pointLight color="#aaddff" intensity={3} distance={25} />
        </mesh>
      ))}

      {/* Shooting star trails (elongated meshes) */}
      {shootingData.map((d, i) => (
        <mesh
          key={`trail-${i}`}
          ref={el => { 
            if (el) {
              // position synced in useFrame via parent array
            }
          }}
          position={[d.startX - 3, d.startY + 1.5, d.startZ]}
          rotation={[0, 0, Math.atan2(d.speedY, d.speedX)]}
        >
          <boxGeometry args={[8, 0.08, 0.08]} />
          <meshBasicMaterial color="#aaddff" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Constellation labels */}
      {constellations.map(c => (
        <Float key={c.name} speed={1.5} rotationIntensity={0.05} floatIntensity={0.3}>
          <group position={c.position}>
            <Drei.Billboard follow={true}>
              <Drei.Html center transform distanceFactor={24} zIndexRange={[50, 0]}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFocusConstellation?.(c.position, c.name);
                  }}
                  className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-110 focus:outline-none select-none"
                  title={`Fly to ${c.name} constellation`}
                >
                  <span className="text-2xl font-serif text-blue-200/90 group-hover:text-white tracking-widest text-center px-4 py-1.5 rounded-full bg-blue-950/70 border border-blue-400/30 group-hover:border-blue-400/70 backdrop-blur-md transition-all shadow-2xl" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
                    ✦ {c.name.toUpperCase()}
                  </span>
                  <span className="text-[11px] text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity mt-1 bg-black/70 px-2.5 py-0.5 rounded-full backdrop-blur-sm border border-blue-500/20">
                    Click to fly here
                  </span>
                </button>
              </Drei.Html>
            </Drei.Billboard>
          </group>
        </Float>
      ))}

      {/* Memory nodes */}
      {nodes.map((node) => (
        <SpaceNode 
          key={node.data.id} 
          data={node.data} 
          position={node.position} 
          onClick={onMemoryClick} 
        />
      ))}
      
      {/* Constellation lines */}
      {lineGeometry && (
        <lineSegments geometry={lineGeometry}>
          <lineBasicMaterial color="#93c5fd" transparent opacity={0.3} />
        </lineSegments>
      )}
    </group>
  );
}

function SpaceNode({ data, position, onClick }: { data: any; position: [number, number, number], onClick: (data: any) => void }) {
  const [hovered, setHover] = useState(false);
  const auraRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (auraRef.current) {
      auraRef.current.rotation.y = t * 0.5;
      auraRef.current.rotation.x = t * 0.2;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.8;
      const scale = 1 + Math.sin(t * 2) * 0.03;
      ringRef.current.scale.set(scale, scale, scale);
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * 1.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
      <group position={position}>
        <Drei.Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
          {/* Crystal icosahedron aura */}
          <mesh ref={auraRef} position={[0, 0, -0.2]}>
            <icosahedronGeometry args={[2.4, 1]} />
            <meshPhysicalMaterial 
              color={hovered ? "#bfdbfe" : "#3b82f6"} 
              transparent={true}
              opacity={hovered ? 0.6 : 0.2} 
              metalness={0.9} 
              roughness={0.05} 
              wireframe={true}
            />
            <pointLight color="#93c5fd" intensity={hovered ? 4 : 1.5} distance={25} />
          </mesh>
          {/* Outer glow ring */}
          <mesh ref={ringRef} position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.2, 0.06, 8, 48]} />
            <meshBasicMaterial color={hovered ? "#60a5fa" : "#3b82f6"} transparent opacity={hovered ? 0.9 : 0.4} />
          </mesh>
          {/* Inner tech ring */}
          <mesh ref={innerRingRef} position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.8, 0.02, 8, 32]} />
            <meshBasicMaterial color="#93c5fd" transparent opacity={0.6} />
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
              className={`transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer select-none ${
                hovered 
                  ? 'scale-105 shadow-[0_0_50px_rgba(96,165,250,0.75)] ring-2 ring-blue-400' 
                  : 'scale-100 shadow-xl ring-1 ring-blue-400/30'
              }`} 
              style={{ 
                width: '300px', 
                height: '230px', 
                backgroundColor: 'rgba(8, 12, 28, 0.82)', 
                backdropFilter: 'blur(18px)', 
                padding: '12px', 
                display: 'flex', 
                flexDirection: 'column' 
              }}
            >
              <div className="relative flex-1 rounded-xl overflow-hidden mb-2.5 group">
                {/* Tech scanning line */}
                <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                  <div className="w-full h-1 bg-blue-400/50 blur-[2px] shadow-[0_0_15px_rgba(96,165,250,1)] animate-[scan_3s_ease-in-out_infinite]" />
                </div>
                {/* Grid overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none opacity-20 bg-[linear-gradient(rgba(59,130,246,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.2)_1px,transparent_1px)] bg-[size:10px_10px]" />
                
                {data.type === 'voice' ? (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-950 to-slate-900 flex items-center justify-center flex-col">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center animate-pulse mb-1.5">
                      <span className="text-xl">🎙️</span>
                    </div>
                    <span className="text-[11px] text-blue-300 font-medium">Voice Clip</span>
                  </div>
                ) : data.type === 'video' && data.mediaUrl ? (
                  <VideoPreview src={data.mediaUrl} poster={data.image} title={data.title} />
                ) : (
                  <img src={data.image} alt={data.title} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${hovered ? 'scale-110' : 'scale-100'}`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/90 via-transparent to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 pointer-events-none z-20">
                  <span className="px-2.5 py-0.5 bg-[#020617]/70 backdrop-blur-md rounded-full text-[9px] text-blue-300 uppercase tracking-widest border border-blue-500/40 font-semibold">{data.type}</span>
                </div>
                {hovered && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 animate-ping z-20" />
                )}
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes scan {
                  0% { transform: translateY(-100%); }
                  50% { transform: translateY(200px); }
                  100% { transform: translateY(-100%); }
                }
              `}} />
              <div className="flex justify-between items-end px-1 pb-0.5 pointer-events-none">
                <h3 className="text-blue-50 font-serif text-base leading-tight truncate drop-shadow-md">{data.title}</h3>
                <span className="text-blue-300/60 text-[10px] uppercase tracking-wider">{data.date}</span>
              </div>
            </div>
          </Drei.Html>
        </Drei.Billboard>
      </group>
    </Float>
  );
}
