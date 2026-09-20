"use client";
import { useMemo, Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { SpaceTheme } from './SpaceTheme';
import { OceanTheme } from './OceanTheme';
import { ForestTheme } from './ForestTheme';
import { TrainTheme } from './TrainTheme';

export type ThemeType = 'space' | 'ocean' | 'forest' | 'train';

export interface MemoryItem {
  id: number | string;
  title: string;
  image: string;
  date: string;
  group: string;
  type: 'photo' | 'video' | 'voice' | 'audio' | 'note';
  content: string;
  mediaId?: string;
  mediaUrl?: string;
}

export const DEFAULT_MEMORIES: MemoryItem[] = [
  { id: 1, title: "Summer in Kyoto", image: "https://picsum.photos/seed/kyoto/400/300", date: "Aug 2018", group: "Travels 2018", type: "photo", content: "The cicadas were so loud, but the temples were completely silent." },
  { id: 2, title: "Dad's old guitar", image: "https://picsum.photos/seed/guitar/400/300", date: "Mar 2009", group: "Family", type: "voice", content: "Audio recording: Playing Blackbird" },
  { id: 3, title: "College Graduation", image: "https://picsum.photos/seed/grad/400/300", date: "May 2014", group: "College Years", type: "photo", content: "We finally did it. The whole squad together." },
  { id: 4, title: "First Apartment", image: "https://picsum.photos/seed/apt/400/300", date: "Sep 2015", group: "College Years", type: "note", content: "Slept on an air mattress tonight. Ate pizza on the floor. Best night ever." },
  { id: 5, title: "Roadtrip to Big Sur", image: "https://picsum.photos/seed/bigsur/400/300", date: "Jul 2020", group: "Travels", type: "video", content: "Driving down Highway 1" },
  { id: 6, title: "Letter from Grandma", image: "https://picsum.photos/seed/letter/400/300", date: "Dec 2010", group: "Family", type: "note", content: "Always remember to be kind to yourself." },
  { id: 7, title: "Snow day!", image: "https://picsum.photos/seed/snow/400/300", date: "Feb 2021", group: "Travels", type: "photo", content: "City completely shut down." },
  { id: 8, title: "New Puppy", image: "https://picsum.photos/seed/puppy/400/300", date: "Jan 2022", group: "Family", type: "video", content: "Meet our new golden retriever." },
  { id: 9, title: "Paris Trip", image: "https://picsum.photos/seed/paris/400/300", date: "Apr 2023", group: "Travels", type: "photo", content: "Eating croissants by the Seine." },
  { id: 10, title: "Concert Ticket", image: "https://picsum.photos/seed/concert/400/300", date: "Oct 2019", group: "Friends", type: "photo", content: "Front row seats!" },
];

export const CONSTELLATION_CLUSTER_CENTERS: Record<string, [number, number, number]> = {
  'Travels 2018': [-26, 8, -14],
  'Family': [26, 10, -16],
  'College Years': [-22, -8, 16],
  'Travels': [25, -6, 18],
  'Friends': [0, 20, -6],
};

export function getClusterCenter(groupName: string, index: number): [number, number, number] {
  if (CONSTELLATION_CLUSTER_CENTERS[groupName]) {
    return CONSTELLATION_CLUSTER_CENTERS[groupName];
  }
  const angle = (index / 5) * Math.PI * 2;
  const radius = 26;
  const y = (index % 2 === 0 ? 1 : -1) * (10 + (index % 3) * 4);
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
}

function GlobalCameraController({ 
  theme, 
  targetFocus, 
  controlsRef 
}: { 
  theme: ThemeType; 
  targetFocus: { position: [number, number, number], name: string } | null; 
  controlsRef: React.RefObject<any>; 
}) {
  const { camera } = useThree();
  const prevThemeRef = useRef<ThemeType>(theme);
  const prevFocusRef = useRef<any>(null);

  // Smoothly orient camera when switching themes
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme;

      if (theme === 'train') {
        camera.position.set(0, 0, 20);
        camera.rotation.set(0, 0, 0);
      } else {
        camera.rotation.set(0, 0, 0);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        if (theme === 'ocean') {
          camera.position.set(0, 4, 46);
        } else if (theme === 'forest') {
          camera.position.set(0, 4, 44);
        } else if (theme === 'space') {
          camera.position.set(0, 22, 68);
        }
      }
    }
  }, [theme, camera, controlsRef]);

  useFrame((state) => {
    if (theme === 'train') {
      // Keep view centered looking down the corridor with subtle mouse parallax and train vibration
      state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.pointer.x * 1.5, 0.05);
      state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, state.pointer.y * 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.08, 0.05);
      state.camera.position.z = 20;

      state.camera.rotation.y = THREE.MathUtils.lerp(state.camera.rotation.y, -state.pointer.x * 0.1, 0.05);
      state.camera.rotation.x = THREE.MathUtils.lerp(state.camera.rotation.x, state.pointer.y * 0.06, 0.05);
      state.camera.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.004;
    } else if (theme === 'space' && targetFocus) {
      // Smoothly fly to focused constellation
      const [tx, ty, tz] = targetFocus.position;
      const targetCam = new THREE.Vector3(tx, ty + 2, tz + 28);
      state.camera.position.lerp(targetCam, 0.045);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(tx, ty, tz), 0.045);
        controlsRef.current.update();
      }
    } else if (prevFocusRef.current && !targetFocus && theme === 'space') {
      // Returning from focused constellation to wide view
      state.camera.position.lerp(new THREE.Vector3(0, 22, 68), 0.04);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), 0.04);
        controlsRef.current.update();
      }
      if (state.camera.position.distanceTo(new THREE.Vector3(0, 22, 68)) < 1) {
        prevFocusRef.current = null;
      }
    }

    if (targetFocus) {
      prevFocusRef.current = targetFocus;
    }
  });

  return null;
}

function ThemeRouter({ 
  onMemoryClick, 
  theme, 
  spaceStyle,
  memories,
  isTrainPaused,
  trainSpeed,
  onFocusConstellation
}: { 
  onMemoryClick: (data: any) => void, 
  theme: ThemeType, 
  spaceStyle: 'random' | 'spiral' | 'clusters' | 'rings',
  memories: MemoryItem[],
  isTrainPaused?: boolean,
  trainSpeed?: number,
  onFocusConstellation?: (position: [number, number, number], name: string) => void
}) {
  const nodes = useMemo(() => {
    const list = memories;
    const uniqueGroups = Array.from(new Set(list.map(m => m.group || 'Scattered')));

    return list.map((data, i) => {
      // Deterministic spread using golden angle and sin/cos
      const pseudo1 = Math.sin(i * 12.9898) * 0.5 + 0.5;
      const pseudo2 = Math.cos(i * 78.233) * 0.5 + 0.5;
      
      let radius, theta, y, x, z;
      
      if (theme === 'ocean') {
        // Ascending vertical aquatic spiral of memory bubbles
        const count = list.length || 1;
        const progress = i / (count > 1 ? count - 1 : 1);
        radius = Math.max(10, count * 1.2) + Math.sin(i * 1.8) * 4;
        theta = (i * 1.25);
        y = (progress - 0.5) * Math.max(26, count * 1.5);
      } else if (theme === 'forest') {
        // Enchanted glade ring at comfortable eye level and fog range
        const count = list.length || 1;
        radius = Math.max(12, count * 1.5) + (i % 3) * 4;
        theta = (i / count) * Math.PI * 2;
        y = ((i % 4) - 1.5) * 2.5 + 1;
      } else if (theme === 'train') {
        // Alternating Left (-1) and Right (+1) sides of the train corridor
        const side = i % 2 === 0 ? -1 : 1;
        const sideIndex = Math.floor(i / 2);
        const zOffset = side === 1 ? -22.5 : 0;
        z = -(sideIndex * 45) + zOffset;
        x = side * 13.5;
        y = 0;
        return { data, position: [x, y, z] as [number, number, number] };
      } else {
        // Space Theme Layouts
        if (spaceStyle === 'spiral') {
          radius = 12 + (i * 2.8);
          theta = i * 0.75;
          y = ((i / list.length) - 0.5) * 22;
        } else if (spaceStyle === 'clusters') {
          // Dynamic cohesive group clustering
          const groupIdx = uniqueGroups.indexOf(data.group || 'Scattered');
          const center = getClusterCenter(data.group || 'Scattered', groupIdx);
          
          x = center[0] + (pseudo1 - 0.5) * 14;
          y = center[1] + (pseudo2 - 0.5) * 12;
          z = center[2] + (Math.sin(i * 2.5) * 10);
          return { data, position: [x, y, z] as [number, number, number] };
        } else if (spaceStyle === 'rings') {
          const ring = i % 2 === 0 ? 20 : 34;
          radius = ring + (pseudo1 - 0.5) * 4;
          theta = (i / list.length) * Math.PI * 2;
          y = (pseudo2 - 0.5) * 10;
        } else {
          // Random (Spherical cosmic distribution)
          radius = 22 + Math.abs(pseudo1) * 20;
          theta = (i / list.length) * Math.PI * 2;
          y = (pseudo2 - 0.5) * 24;
        }
      }
      
      x = Math.cos(theta) * radius;
      z = Math.sin(theta) * radius;
      return { data, position: [x, y, z] as [number, number, number] };
    });
  }, [theme, spaceStyle, memories]);

  switch (theme) {
    case 'ocean': return <OceanTheme nodes={nodes} onMemoryClick={onMemoryClick} />;
    case 'forest': return <ForestTheme nodes={nodes} onMemoryClick={onMemoryClick} />;
    case 'train': return (
      <TrainTheme 
        nodes={nodes} 
        onMemoryClick={onMemoryClick} 
        isPaused={isTrainPaused} 
        speedMultiplier={trainSpeed} 
      />
    );
    case 'space':
    default: return (
      <SpaceTheme 
        nodes={nodes} 
        onMemoryClick={onMemoryClick} 
        onFocusConstellation={onFocusConstellation} 
      />
    );
  }
}

export default function MemoryCanvas({ 
  onMemoryClick, 
  theme = 'space', 
  spaceStyle = 'random',
  memories = DEFAULT_MEMORIES,
  isTrainPaused = false,
  trainSpeed = 1,
  targetFocus = null,
  onFocusConstellation
}: { 
  onMemoryClick?: (data: any) => void, 
  theme?: ThemeType, 
  spaceStyle?: 'random' | 'spiral' | 'clusters' | 'rings',
  memories?: MemoryItem[],
  isTrainPaused?: boolean,
  trainSpeed?: number,
  targetFocus?: { position: [number, number, number], name: string } | null,
  onFocusConstellation?: (position: [number, number, number], name: string) => void
}) {
  const controlsRef = useRef<any>(null);

  const getThemeColors = () => {
    switch (theme) {
      case 'ocean': return { bg: '#001133' };
      case 'forest': return { bg: '#0b2119' };
      case 'train': return { bg: '#1a1005' };
      case 'space':
      default: return { bg: '#020617' };
    }
  };
  
  const colors = getThemeColors();

  return (
    <div className="absolute inset-0 transition-colors duration-1000" style={{ backgroundColor: colors.bg }}>
      <Canvas camera={{ position: [0, 22, 68], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <color attach="background" args={[colors.bg]} />
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={1} castShadow />
          
          <GlobalCameraController 
            theme={theme} 
            targetFocus={targetFocus} 
            controlsRef={controlsRef} 
          />
          
          <ThemeRouter 
            onMemoryClick={onMemoryClick || (() => {})} 
            theme={theme} 
            spaceStyle={spaceStyle} 
            memories={memories}
            isTrainPaused={isTrainPaused}
            trainSpeed={trainSpeed}
            onFocusConstellation={onFocusConstellation}
          />
          
          <OrbitControls 
            ref={controlsRef}
            enabled={theme !== 'train'}
            enableZoom={theme !== 'train'} 
            enablePan={theme !== 'train'} 
            maxDistance={theme === 'space' ? 180 : 120} 
            minDistance={8} 
            autoRotate={theme !== 'train' && !targetFocus} 
            autoRotateSpeed={0.25} 
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
