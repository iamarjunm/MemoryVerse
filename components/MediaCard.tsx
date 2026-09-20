"use client";
import * as THREE from 'three';
import * as Drei from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { loadMediaUrl } from '../lib/mediaStorage';

export function VideoPreview({ src, poster, title }: { src: string; poster: string; title: string }) {
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setReady(false);
    video.muted = true;
    video.loop = true;

    const start = () => {
      video.muted = true;
      void video.play().catch(() => undefined);
    };
    const markPlaying = () => setReady(true);

    video.addEventListener('loadedmetadata', start);
    video.addEventListener('loadeddata', start);
    video.addEventListener('canplay', start);
    video.addEventListener('canplaythrough', start);
    video.addEventListener('playing', markPlaying);
    video.load();
    start();

    return () => {
      video.removeEventListener('loadedmetadata', start);
      video.removeEventListener('loadeddata', start);
      video.removeEventListener('canplay', start);
      video.removeEventListener('canplaythrough', start);
      video.removeEventListener('playing', markPlaying);
      video.pause();
    };
  }, [src]);

  return (
    <>
      <div className={`absolute inset-0 bg-slate-950 ${ready ? 'opacity-0' : 'opacity-100'}`} />
      {poster && (
        <img src={poster} alt={title} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ready ? 'opacity-0' : 'opacity-100'}`} />
      )}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onPlaying={() => setReady(true)}
        onError={() => setReady(false)}
        aria-label={title}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}

export function MediaCard({ data, onClick, theme }: { data: any, onClick: (data: any) => void, theme: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(data.mediaUrl || null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    if (data.mediaUrl) {
      setVideoUrl(data.mediaUrl);
      return;
    }
    if (!data.mediaId) return;

    loadMediaUrl(data.mediaId).then(url => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setVideoUrl(url);
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data.mediaId, data.mediaUrl]);

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
      onClick={(e) => { e.stopPropagation(); onClick(videoUrl ? { ...data, mediaUrl: videoUrl } : data); document.body.style.cursor = 'auto'; }}
    >
      <div className="relative flex-1 rounded-xl overflow-hidden mb-3">
        {data.type === 'video' ? (
          <>
            {videoUrl ? (
              <VideoPreview src={videoUrl} poster={data.image} title={data.title} />
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
      <Drei.Billboard follow lockX={false} lockY={false} lockZ={false}>
        <Drei.Html transform distanceFactor={15} zIndexRange={[100, 0]}>
          {content}
        </Drei.Html>
      </Drei.Billboard>
    </group>
  );
}
