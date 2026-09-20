"use client";
import * as THREE from 'three';
import * as Drei from '@react-three/drei';
import { useRef, useState } from 'react';

export function MediaCard({ data, onClick, theme }: { data: any, onClick: (data: any) => void, theme: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  const getColors = () => {
    if (theme === 'ocean') return { bg: 'rgba(0, 15, 30, 0.85)', border: 'rgba(50, 150, 255, 0.4)', text: 'text-blue-50', tag: 'bg-blue-900/60 text-blue-300 border-blue-500/30' };
    if (theme === 'forest') return { bg: 'rgba(10, 25, 12, 0.85)', border: 'rgba(100, 255, 150, 0.4)', text: 'text-emerald-50', tag: 'bg-emerald-900/60 text-emerald-300 border-emerald-500/30' };
    if (theme === 'train') return { bg: '#f0ede6', border: '#d0c8b8', text: 'text-amber-950', tag: 'bg-black/10 text-amber-900 border-amber-900/20', dark: true };
    return { bg: 'rgba(10, 10, 25, 0.85)', border: 'rgba(150, 100, 255, 0.4)', text: 'text-purple-50', tag: 'bg-purple-900/60 text-purple-300 border-purple-500/30' };
  };
  
  const colors = getColors();

  const content = (
    <div 
      className={`transition-all duration-300 cursor-pointer select-none ${hovered ? 'scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'scale-100 shadow-xl'}`} 
      style={{ 
        width: '300px', 
        height: '230px', 
        backgroundColor: colors.bg, 
        backdropFilter: 'blur(16px)', 
        border: `1.5px solid ${colors.border}`, 
        padding: '12px', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: '18px'
      }}
      onPointerEnter={() => { setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerLeave={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      onClick={(e) => { e.stopPropagation(); onClick(data); document.body.style.cursor = 'auto'; }}
    >
      <div className="relative flex-1 rounded-xl overflow-hidden mb-3">
        {data.type === 'video' ? (
          <>
            {data.mediaUrl ? (
              <video
                src={data.mediaUrl}
                poster={data.image}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <img src={data.image} alt={data.title} className="absolute inset-0 w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm">
                ▶
              </span>
            </div>
          </>
        ) : data.type === 'voice' ? (
           <div className={`absolute inset-0 w-full h-full flex items-center justify-center flex-col ${colors.dark ? 'bg-amber-100' : 'bg-slate-900'}`}>
             <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2 animate-pulse">
               <span className="text-2xl">🎙️</span>
             </div>
             <span className="text-xs text-emerald-300 font-medium">Voice Memory</span>
           </div>
        ) : (
          <img src={data.image} alt={data.title} className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${hovered ? 'scale-110' : 'scale-100'}`} />
        )}
        <div className={`absolute inset-0 bg-gradient-to-t ${colors.dark ? 'from-black/50' : 'from-black/90'} via-transparent to-transparent pointer-events-none`} />
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-2 pointer-events-none z-10">
          <span className={`px-2.5 py-1 backdrop-blur-md rounded-full text-[10px] uppercase tracking-widest border ${colors.tag}`}>{data.type}</span>
        </div>
      </div>
      <div className="flex justify-between items-end px-1 pb-0.5 pointer-events-none">
        <h3 className={`${colors.text} font-serif text-base leading-tight truncate drop-shadow-md`}>{data.title}</h3>
        <span className={`${colors.text} opacity-60 text-[10px] uppercase tracking-wider`}>{data.date}</span>
      </div>
    </div>
  );

  if (theme === 'train') {
    return (
      <group ref={meshRef}>
        <Drei.Html transform distanceFactor={15} zIndexRange={[100, 0]}>
          {content}
        </Drei.Html>
      </group>
    );
  }

  return (
    <group ref={meshRef}>
      <Drei.Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Drei.Html transform distanceFactor={15} zIndexRange={[100, 0]}>
          {content}
        </Drei.Html>
      </Drei.Billboard>
    </group>
  );
}
