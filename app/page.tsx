'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Image as ImageIcon,
  Mic,
  FileText,
  Compass,
  Upload,
  RotateCcw,
  Check,
  Plus,
  Download,
  FolderOpen,
  Trash2,
  Info,
  AlertTriangle,
  HelpCircle,
  Keyboard,
  Globe,
  Star,
  Waves,
  TreePine,
  Train,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ambientAudio } from '../components/ambientAudio';
import { loadMediaUrl, saveMediaFile } from '../lib/mediaStorage';

// Dynamically import the 3D canvas so it doesn't break SSR
const MemoryCanvas = dynamic(() => import('../components/MemoryCanvas'), { 
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-[#000510] flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full animate-pulse" />
      
      {/* Orbital Loader */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-8">
        {/* Core sphere */}
        <div className="absolute w-8 h-8 rounded-full bg-blue-300 shadow-[0_0_30px_#60a5fa] animate-pulse z-10" />
        
        {/* Ring 1 */}
        <div className="absolute w-32 h-32 rounded-full border-t-2 border-l-2 border-blue-400/50 animate-[spin_3s_linear_infinite]" />
        
        {/* Ring 2 */}
        <div className="absolute w-24 h-24 rounded-full border-b-2 border-r-2 border-cyan-300/50 animate-[spin_2s_linear_infinite_reverse]" />
        
        {/* Ring 3 (3D tilt illusion) */}
        <div className="absolute w-32 h-12 rounded-full border-2 border-indigo-400/30 animate-[spin_4s_linear_infinite]" style={{ transform: 'rotateX(70deg)' }} />
      </div>

      {/* Shimmering Text */}
      <div className="relative font-serif tracking-[0.3em] uppercase text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 animate-[pulse_2s_ease-in-out_infinite] bg-[length:200%_auto]">
        Initializing Universe
      </div>
      <div className="text-xs text-blue-300/40 mt-2 font-mono tracking-widest animate-pulse">
        CONNECTING MEMORIES
      </div>
    </div>
  )
});

import { ThemeType, THEME_OPTIONS, DEFAULT_MEMORIES, MemoryItem, getClusterCenter } from '../components/MemoryCanvas';

export type SpaceStyleType = 'random' | 'spiral' | 'clusters' | 'rings';

// ---------- Storage helpers ----------
export interface World {
  id: string;
  name: string;
  theme: ThemeType;
  spaceStyle?: SpaceStyleType;
  memories: MemoryItem[];
  musicByTheme?: Partial<Record<ThemeType, { mediaId?: string; url?: string; name: string }>>;
  createdAt: string;
}

function stripRuntimeMedia(worlds: World[]): World[] {
  return worlds.map(world => ({
    ...world,
    memories: world.memories.map(({ mediaUrl, ...memory }) => memory),
  }));
}

const STORAGE_KEY_WORLDS = 'memoryverse_worlds';
const STORAGE_KEY_ACTIVE = 'memoryverse_active_world_id';
const MAX_STORAGE_BYTES = 4 * 1024 * 1024; // 4 MB guard

function normalizeWorld(world: World): World {
  const theme = world.theme === 'bedroom' || (world.theme as string) === 'birthday'
    ? 'space'
    : world.theme;
  return { ...world, theme };
}

function loadWorlds(): World[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WORLDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeWorld);
    }
  } catch {}
  
  try {
    const oldSaved = localStorage.getItem('user_memoryverse_items');
    if (oldSaved) {
      const parsed = JSON.parse(oldSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const migratedWorld: World = {
          id: 'world_' + Date.now(),
          name: 'My First Universe',
          theme: 'space',
          spaceStyle: 'clusters',
          memories: parsed,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY_WORLDS, JSON.stringify([migratedWorld]));
        localStorage.removeItem('user_memoryverse_items');
        return [migratedWorld];
      }
    }
  } catch {}
  
  return [{
    id: 'demo_world',
    name: 'Demo Universe',
    theme: 'space',
    spaceStyle: 'clusters',
    memories: DEFAULT_MEMORIES,
    createdAt: new Date().toISOString()
  }];
}

function saveWorlds(worlds: World[]): 'ok' | 'too_large' | 'error' {
  try {
    const str = JSON.stringify(stripRuntimeMedia(worlds));
    if (str.length > MAX_STORAGE_BYTES) return 'too_large';
    localStorage.setItem(STORAGE_KEY_WORLDS, str);
    return 'ok';
  } catch {
    return 'error';
  }
}

function loadActiveWorldId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE);
}

function saveActiveWorldId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  }
}

// ---------- Toast ----------
type Toast = { id: number; message: string; type: 'success' | 'warning' | 'error' };

export default function MemoryVerse() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [viewState, setViewState] = useState<'hero' | 'gallery' | 'canvas'>('hero');
  const [theme, setTheme] = useState<ThemeType>('space');
  const [spaceStyle, setSpaceStyle] = useState<SpaceStyleType>('clusters');
  const [showNewScrapbook, setShowNewScrapbook] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isTransitioningTheme, setIsTransitioningTheme] = useState(false);

  // Worlds state
  const [worlds, setWorlds] = useState<World[]>(() => loadWorlds());
  const [activeWorldId, setActiveWorldId] = useState<string | null>(() => loadActiveWorldId());
  
  const activeWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];
  const memories = activeWorld?.memories || [];
  const themeOptions = THEME_OPTIONS;

  // Make sure theme syncs with active world on load
  useEffect(() => {
    if (activeWorld && activeWorld.theme !== theme && !isTransitioningTheme) {
      setTheme(activeWorld.theme);
      if (activeWorld.spaceStyle) {
        setSpaceStyle(activeWorld.spaceStyle);
      }
    }
  }, [activeWorldId, worlds]);

  // Form State for creating new WORLD
  const [showNewWorldModal, setShowNewWorldModal] = useState(false);
  const [newWorldName, setNewWorldName] = useState('');
  const [newWorldTheme, setNewWorldTheme] = useState<ThemeType>('space');

  // Train Theme Controls
  const [isTrainPaused, setIsTrainPaused] = useState(false);
  const [trainSpeed, setTrainSpeed] = useState<number>(1);

  // Space Constellation Focus Target
  const [focusTarget, setFocusTarget] = useState<{ position: [number, number, number], name: string } | null>(null);

  // Form State for creating new memory
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 7));
  const [newGroup, setNewGroup] = useState('');
  const [newType, setNewType] = useState<'photo' | 'video' | 'voice' | 'note'>('photo');
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null);
  const [uploadedMediaId, setUploadedMediaId] = useState<string | null>(null);
  const [uploadedPoster, setUploadedPoster] = useState<string | null>(null);
  const [customMusicUrl, setCustomMusicUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const musicInputRef = useRef<HTMLInputElement | null>(null);
  const customMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrateMedia = async () => {
      const hydratedWorlds = await Promise.all(worlds.map(async world => ({
        ...world,
        memories: await Promise.all(world.memories.map(async memory => {
          if (!memory.mediaId || memory.mediaUrl) return memory;
          const mediaUrl = await loadMediaUrl(memory.mediaId);
          return mediaUrl ? { ...memory, mediaUrl } : memory;
        })),
      })));
      if (!cancelled) setWorlds(current => current.map(world => hydratedWorlds.find(item => item.id === world.id) || world));
    };
    hydrateMedia().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const track = activeWorld?.musicByTheme?.[theme];

    setCustomMusicUrl(null);
    if (!track?.mediaId) return;

    loadMediaUrl(track.mediaId).then(url => {
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setCustomMusicUrl(url);
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeWorld?.id, theme, activeWorld?.musicByTheme?.[theme]?.mediaId]);

  // ---------- Toast helpers ----------
  const pushToast = useCallback((message: string, type: Toast['type'] = 'success', duration = 3500) => {
    const id = ++toastCounter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // ---------- Ambient audio & Theme Switcher ----------
  const handleThemeSwitch = useCallback((newTheme: ThemeType) => {
    if (newTheme === theme) return;
    setIsTransitioningTheme(true);
    setFocusTarget(null);
    
    setTimeout(() => {
      setTheme(newTheme);
      
      // If we're in canvas view and switch theme, update the active world's theme!
      if (activeWorld && viewState === 'canvas') {
        const updatedWorlds = worlds.map(w => w.id === activeWorld.id ? { ...w, theme: newTheme } : w);
        setWorlds(updatedWorlds);
        saveWorlds(updatedWorlds);
      }
      
      setTimeout(() => {
        setIsTransitioningTheme(false);
      }, 1500);
    }, 800);
  }, [theme, activeWorld, worlds, viewState]);

  const customMusic = activeWorld?.musicByTheme?.[theme];

  const playCustomMusic = useCallback(async (url: string) => {
    const audio = customMusicRef.current;
    if (!audio) return false;

    audio.pause();
    audio.src = url;
    audio.loop = true;
    audio.load();

    try {
      await audio.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const audio = customMusicRef.current;
    if (!audio) return;

    audio.pause();
    audio.src = customMusicUrl || customMusic?.url || '';
    audio.loop = true;
    audio.load();

    if (isPlayingAudio && (customMusicUrl || customMusic?.url)) {
      ambientAudio.stop();
      playCustomMusic(customMusicUrl || customMusic?.url || '').then((didPlay) => {
        if (!didPlay) setIsPlayingAudio(false);
      });
    } else if (isPlayingAudio) {
      ambientAudio.changeTheme(theme);
    }
  }, [theme, isPlayingAudio, customMusicUrl, customMusic?.url, playCustomMusic]);

  const toggleAudio = useCallback(async () => {
    if (isPlayingAudio) {
      ambientAudio.stop();
      customMusicRef.current?.pause();
      setIsPlayingAudio(false);
    } else {
      const musicUrl = customMusicUrl
        || customMusic?.url
        || (customMusic?.mediaId ? await loadMediaUrl(customMusic.mediaId) : null);
      if (musicUrl) {
        setCustomMusicUrl(musicUrl);
        const didPlay = await playCustomMusic(musicUrl);
        if (!didPlay) {
          pushToast('The music could not be played by this browser.', 'error');
          return;
        }
      } else {
        ambientAudio.start(theme);
      }
      setIsPlayingAudio(true);
    }
  }, [isPlayingAudio, theme, customMusicUrl, customMusic?.url, playCustomMusic, pushToast]);

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      pushToast('Please choose an audio file.', 'error');
      return;
    }

    saveMediaFile(file).then(mediaId => {
      const updatedWorlds = worlds.map(world => world.id === activeWorld?.id
        ? {
            ...world,
            musicByTheme: {
              ...world.musicByTheme,
              [theme]: { mediaId, name: file.name }
            }
          }
        : world
      );
      const result = saveWorlds(updatedWorlds);
      if (result !== 'ok') {
        pushToast('Music metadata could not be saved.', 'error');
        return;
      }
      setWorlds(updatedWorlds);
      pushToast(`${theme} music set to ${file.name}. Press play to hear it.`, 'success');
    }).catch(() => {
      pushToast('Could not store this music file in browser storage.', 'error');
    });
  };

  // ---------- Keyboard shortcuts ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        setSelectedMemory(null);
        setShowNewScrapbook(false);
        setShowHelp(false);
      } else if (e.key === '?' || e.key === 'h') {
        setShowHelp(h => !h);
      } else if (e.key === '1') {
        handleThemeSwitch('space');
      } else if (e.key === '2') {
        handleThemeSwitch('ocean');
      } else if (e.key === '3') {
        handleThemeSwitch('forest');
      } else if (e.key === '4') {
        handleThemeSwitch('train');
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (theme === 'train' && viewState === 'canvas' && !selectedMemory) {
          setIsTrainPaused(p => !p);
        } else {
          toggleAudio();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme, viewState, selectedMemory, toggleAudio, handleThemeSwitch]);

  // ---------- File upload (for memory media) ----------
  const createVideoPoster = (url: string): Promise<string> => new Promise(resolve => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.1, video.duration || 0);
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    video.onerror = () => {
      resolve('');
    };
    video.src = url;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      try {
        const mediaId = await saveMediaFile(file);
        const previewUrl = URL.createObjectURL(file);
        const poster = await createVideoPoster(previewUrl);
        setUploadedMediaId(mediaId);
        setUploadedFilePreview(previewUrl);
        setUploadedPoster(poster || '');
        setNewType('video');
        pushToast('Video ready. The original file stays outside localStorage.', 'success');
      } catch {
        pushToast('Could not store this video in browser storage.', 'error');
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      setUploadedFilePreview(event.target?.result as string);
      setUploadedMediaId(null);
      setUploadedPoster(null);
      setNewType(file.type.startsWith('audio/') ? 'voice' : 'photo');
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let cancelled = false;
    if (!selectedMemory?.mediaId || selectedMemory.mediaUrl) return;

    loadMediaUrl(selectedMemory.mediaId).then(url => {
      if (!cancelled && url) {
        setSelectedMemory(current => current?.id === selectedMemory.id
          ? { ...current, mediaUrl: url }
          : current);
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [selectedMemory?.id, selectedMemory?.mediaId, selectedMemory?.mediaUrl]);

  // ---------- Create memory ----------
  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Please enter a title for this memory.');
      return;
    }

    setIsSubmitting(true);

    const imageUrl = uploadedPoster
      || (newType !== 'video' ? uploadedFilePreview : null)
      || `https://picsum.photos/seed/${encodeURIComponent(newTitle.trim())}/600/400`;

    const item: MemoryItem = {
      id: Date.now(),
      title: newTitle.trim(),
      content: newContent.trim() || 'A cherished memory in the universe.',
      date: newDate || new Date().toISOString().slice(0, 7),
      group: newGroup.trim() || 'My Memories',
      type: newType,
      image: imageUrl,
      ...(uploadedFilePreview?.startsWith('blob:') ? { mediaUrl: uploadedFilePreview } : {}),
      ...(uploadedMediaId ? { mediaId: uploadedMediaId } : {}),
    };

    const updatedMemories = [item, ...memories];
    const updatedWorld = { ...activeWorld, memories: updatedMemories };
    const updatedWorlds = worlds.map(w => w.id === activeWorld.id ? updatedWorld : w);
    const result = saveWorlds(updatedWorlds);

    if (result === 'too_large') {
      // Save without embedded images (strip base64, use placeholder)
      const strippedMemories = updatedMemories.map(m =>
        m.image?.startsWith('data:') 
          ? { ...m, image: `https://picsum.photos/seed/${m.id}/600/400` } 
          : m
      );
      const strippedWorld = { ...activeWorld, memories: strippedMemories };
      const strippedWorlds = worlds.map(w => w.id === activeWorld.id ? strippedWorld : w);
      saveWorlds(strippedWorlds);
      setWorlds(strippedWorlds);
      pushToast('Memory saved! Images were too large for device storage — use smaller photos next time.', 'warning', 6000);
    } else if (result === 'error') {
      pushToast('Memory saved this session but could not be persisted to device storage.', 'warning', 5000);
      setWorlds(updatedWorlds);
    } else {
      setWorlds(updatedWorlds);
      pushToast('Memory added to your universe! ✨', 'success');
    }

    // Reset form
    setNewTitle('');
    setNewContent('');
    setNewGroup('');
    setNewDate(new Date().toISOString().slice(0, 7));
    if (uploadedFilePreview?.startsWith('blob:') && !uploadedMediaId) {
      URL.revokeObjectURL(uploadedFilePreview);
    }
    setUploadedFilePreview(null);
    setUploadedMediaId(null);
    setUploadedPoster(null);
    setIsSubmitting(false);
    setShowNewScrapbook(false);
    setViewState('canvas');
  };

  // ---------- Delete memory ----------
  const handleDeleteMemory = (id: number | string) => {
    const updatedMemories = memories.filter(m => m.id !== id);
    const updatedWorld = { ...activeWorld, memories: updatedMemories };
    const updatedWorlds = worlds.map(w => w.id === activeWorld.id ? updatedWorld : w);
    setWorlds(updatedWorlds);
    saveWorlds(updatedWorlds);
    setSelectedMemory(null);
    pushToast('Memory removed from your universe.', 'success');
  };

  // ---------- Reset to defaults ----------
  const handleResetMemories = () => {
    // Replaces active world with a blank slate
    const updatedWorld = { ...activeWorld, memories: [] };
    const updatedWorlds = worlds.map(w => w.id === activeWorld.id ? updatedWorld : w);
    setWorlds(updatedWorlds);
    saveWorlds(updatedWorlds);
    pushToast('World wiped clean.', 'success');
  };

  // ---------- Export memories ----------
  const handleExport = () => {
    // Export all worlds
    const data = JSON.stringify(worlds, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoryverse-worlds-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast(`Exported ${worlds.length} worlds to file.`, 'success');
  };

  // ---------- Import memories ----------
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        
        // If it looks like old format (array of memories)
        if (parsed[0] && parsed[0].title) {
           const migratedWorld: World = {
              id: 'world_imported_' + Date.now(),
              name: 'Imported Universe',
              theme: 'space',
              memories: parsed,
              createdAt: new Date().toISOString()
           };
           const newWorlds = [...worlds, migratedWorld];
           saveWorlds(newWorlds);
           setWorlds(newWorlds);
           pushToast('Imported legacy memories as a new World!', 'success');
           return;
        }
        
        // Assume it's array of Worlds
        const validWorlds = parsed.filter((w: any) => w && w.id && w.name && Array.isArray(w.memories)) as World[];
        if (validWorlds.length === 0) throw new Error('No valid worlds found');

        const existing = worlds.filter(w => !validWorlds.find(vw => vw.id === w.id));
        const merged = [...validWorlds, ...existing];
        
        const result = saveWorlds(merged);
        setWorlds(merged);

        if (result === 'too_large') {
          pushToast(`Imported ${validWorlds.length} worlds. Storage limit reached, some images dropped.`, 'warning', 5000);
        } else {
          pushToast(`Imported ${validWorlds.length} worlds successfully! ✨`, 'success');
        }
      } catch {
        pushToast('Import failed — file is not a valid MemoryVerse backup.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ---------- Constellation groups ----------
  const constellationGroups = React.useMemo(() => {
    return Array.from(new Set(memories.map(m => m.group || 'Scattered')));
  }, [memories]);

  const handleFocusConstellation = (pos: [number, number, number], name: string) => {
    setFocusTarget({ position: pos, name });
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  const userHasCustomMemories = memories !== DEFAULT_MEMORIES && 
    !(memories.length === DEFAULT_MEMORIES.length && memories.every((m, i) => m.id === DEFAULT_MEMORIES[i]?.id));

  return (
    <div className={`relative w-full h-screen overflow-hidden font-sans antialiased text-white selection:bg-white/30 transition-colors duration-1000 ${
      theme === 'ocean' ? 'bg-[#001133]' : theme === 'forest' ? 'bg-[#071018]' : theme === 'train' ? 'bg-[#1a1005]' : 'bg-[#020617]'
    }`}>

      {/* Hidden file inputs */}
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
      <input ref={musicInputRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
      <audio ref={customMusicRef} preload="auto" />

      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <MemoryCanvas 
          onMemoryClick={setSelectedMemory} 
          theme={theme} 
          spaceStyle={spaceStyle}
          memories={memories}
          isTrainPaused={isTrainPaused}
          trainSpeed={trainSpeed}
          targetFocus={focusTarget}
          onFocusConstellation={handleFocusConstellation}
        />
      </div>

      {/* Theme Transition Overlay */}
      <AnimatePresence>
        {isTransitioningTheme && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[#000510] flex flex-col items-center justify-center z-50 overflow-hidden pointer-events-auto"
          >
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full animate-pulse transform-gpu will-change-opacity" />
            
            {/* Orbital Loader */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-8 transform-gpu">
              <div className="absolute w-8 h-8 rounded-full bg-blue-300 shadow-[0_0_30px_#60a5fa] animate-pulse z-10 transform-gpu will-change-opacity" />
              <div className="absolute w-32 h-32 rounded-full border-t-2 border-l-2 border-blue-400/50 animate-[spin_3s_linear_infinite] transform-gpu will-change-transform" />
              <div className="absolute w-24 h-24 rounded-full border-b-2 border-r-2 border-cyan-300/50 animate-[spin_2s_linear_infinite_reverse] transform-gpu will-change-transform" />
              <div className="absolute w-32 h-12 rounded-full border-2 border-indigo-400/30 animate-[spin_4s_linear_infinite] transform-gpu will-change-transform" style={{ transform: 'rotateX(70deg)' }} />
            </div>

            {/* Shimmering Text */}
            <div className="relative font-serif tracking-[0.3em] uppercase text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-blue-200 animate-[pulse_2s_ease-in-out_infinite] bg-[length:200%_auto] transform-gpu will-change-opacity">
              CALIBRATING REALITY
            </div>
            <div className="text-xs text-blue-300/40 mt-2 font-mono tracking-widest animate-pulse transform-gpu will-change-opacity">
              SHIFTING DIMENSIONAL PLANES
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 w-full z-40 px-3 py-3 sm:px-6 sm:py-5 flex justify-between items-center pointer-events-none"
      >
        {/* Logo */}
        <div onClick={() => { setViewState('hero'); setSelectedMemory(null); }} className="flex items-center gap-3 pointer-events-auto cursor-pointer group">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl group-hover:bg-white/20 transition-colors">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-serif text-xl sm:text-2xl tracking-tight">MemoryVerse</span>
        </div>

        {/* Center Tabs — only in canvas view */}
        <AnimatePresence>
          {viewState === 'canvas' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="hidden md:flex flex-col items-center gap-2 pointer-events-auto shadow-2xl"
            >
              <div className="flex items-center p-1 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full">
                {themeOptions.map((t, index) => (
                  <button
                    key={t}
                    onClick={() => handleThemeSwitch(t)}
                    className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all duration-300 flex items-center gap-2 ${
                      theme === t 
                        ? 'bg-white text-slate-950 shadow-md' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{t}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${theme === t ? 'bg-black/15 text-slate-900' : 'bg-white/10 text-white/50'}`}>
                      {index + 1}
                    </span>
                  </button>
                ))}
              </div>

              {/* Space style sub-tabs */}
              {theme === 'space' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="flex gap-2 p-1 rounded-full bg-slate-900/60 backdrop-blur-xl border border-white/10"
                >
                  {(['clusters', 'spiral', 'rings', 'random'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => { 
                        setSpaceStyle(s); 
                        setFocusTarget(null); 
                        if (activeWorld && viewState === 'canvas') {
                          const updatedWorlds = worlds.map(w => w.id === activeWorld.id ? { ...w, spaceStyle: s } : w);
                          setWorlds(updatedWorlds);
                          saveWorlds(updatedWorlds);
                        }
                      }}
                      className={`px-3.5 py-1 rounded-full text-xs font-medium capitalize transition-all duration-300 ${
                        spaceStyle === s 
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' 
                          : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto">
          {viewState === 'canvas' && (
            <button 
              onClick={() => { setViewState('gallery'); setSelectedMemory(null); }} 
              className="hidden sm:flex px-4 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 items-center justify-center hover:bg-white/20 transition-colors text-sm font-medium"
            >
              Gallery
            </button>
          )}

          {/* Help */}
          <button
            onClick={() => setShowHelp(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Help & Shortcuts"
          >
            <HelpCircle className="w-4 h-4 text-white/80" />
          </button>

          {/* Import */}
          <button
            onClick={() => importInputRef.current?.click()}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Import memories from file"
          >
            <FolderOpen className="w-4 h-4 text-white/80" />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            title="Export memories to file"
          >
            <Download className="w-4 h-4 text-white/80" />
          </button>

          {/* Add Memory */}
          <button 
            onClick={() => setShowNewScrapbook(true)} 
            className="w-9 h-9 sm:w-auto sm:px-4 sm:h-10 rounded-full bg-white text-slate-950 flex items-center justify-center sm:gap-2 hover:scale-105 transition-transform shadow-xl shadow-white/20 font-medium text-sm"
            title="Add a new memory"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Memory</span>
          </button>
        </div>
      </motion.nav>

      {viewState === 'canvas' && (
        <div className="absolute top-[4.75rem] left-0 right-0 z-30 px-3 md:hidden pointer-events-auto">
          <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain rounded-2xl bg-slate-950/70 p-1.5 backdrop-blur-xl border border-white/10 shadow-xl scrollbar-none">
            {themeOptions.map((t) => (
              <button
                key={t}
                onClick={() => handleThemeSwitch(t)}
                aria-pressed={theme === t}
                className={`min-h-10 shrink-0 rounded-xl px-4 text-xs font-medium capitalize transition-colors ${
                  theme === t ? 'bg-white text-slate-950' : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Space Constellation Quick-Fly HUD */}
      <AnimatePresence>
        {viewState === 'canvas' && theme === 'space' && !selectedMemory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto hidden sm:flex items-center gap-2 p-1.5 bg-slate-950/70 backdrop-blur-xl border border-blue-400/20 rounded-full shadow-2xl"
          >
            <div className="flex items-center gap-1.5 px-3 py-1 text-xs text-blue-300/70 font-medium">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Constellations:</span>
            </div>
            {constellationGroups.map((grp, idx) => (
              <button
                key={grp}
                onClick={() => {
                  const pos = getClusterCenter(grp, idx);
                  handleFocusConstellation(pos, grp);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  focusTarget?.name === grp
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                ✦ {grp}
              </button>
            ))}
            {focusTarget && (
              <button
                onClick={() => setFocusTarget(null)}
                className="p-1 text-white/50 hover:text-white rounded-full ml-1"
                title="Reset view"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Train HUD */}
      <AnimatePresence>
        {viewState === 'canvas' && theme === 'train' && !selectedMemory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 p-2 px-4 bg-black/60 backdrop-blur-xl border border-amber-500/20 rounded-full shadow-2xl"
          >
            <button
              onClick={() => setIsTrainPaused(p => !p)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/40 hover:bg-amber-500/30 transition-all font-medium text-xs shadow-md"
            >
              {isTrainPaused ? <Play className="w-3.5 h-3.5 fill-amber-200" /> : <Pause className="w-3.5 h-3.5 fill-amber-200" />}
              <span>{isTrainPaused ? 'Resume Train' : 'Pause Train'}</span>
              <span className="text-[10px] text-amber-300/50 bg-black/30 px-1 rounded ml-1">Space</span>
            </button>

            <div className="h-4 w-px bg-white/15" />

            <div className="flex items-center gap-1">
              <span className="text-xs text-white/50 mr-1.5">Speed:</span>
              {([0.5, 1, 2] as const).map(s => (
                <button
                  key={s}
                  onClick={() => { setTrainSpeed(s); setIsTrainPaused(false); }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    trainSpeed === s && !isTrainPaused
                      ? 'bg-amber-400 text-slate-950 font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Content Overlay */}
      <AnimatePresence>
        {viewState === 'hero' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-end pb-32 pointer-events-none"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-center max-w-2xl px-6"
            >
              <h1 className="text-5xl md:text-7xl font-serif tracking-tight mb-6 leading-[1.1] drop-shadow-2xl">
                Where memories <br/><span className="text-white/60 italic">feel alive.</span>
              </h1>
              <p className="text-lg md:text-xl font-light text-white/60 mb-10 max-w-lg mx-auto drop-shadow-md">
                Enter an immersive digital universe built from your photos, videos, and voice notes.
              </p>
              
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setViewState('gallery')} className="pointer-events-auto group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full overflow-hidden transition-all hover:bg-white/20 hover:scale-105 hover:shadow-2xl hover:shadow-white/20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />
                  <Play className="w-4 h-4 fill-white" />
                  <span className="font-medium tracking-wide">Enter the Verse</span>
                </button>

                <button onClick={() => setShowNewScrapbook(true)} className="pointer-events-auto inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-slate-950 font-medium rounded-full hover:bg-white/90 hover:scale-105 transition-all shadow-xl">
                  <Plus className="w-4 h-4" />
                  <span>Create Yours</span>
                </button>
              </div>

              {/* Quick memory count */}
              {userHasCustomMemories && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="pointer-events-auto mt-6 text-sm text-white/40"
                >
                  {memories.length} {memories.length === 1 ? 'memory' : 'memories'} in your universe
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Worlds Dashboard (Gallery) */}
      <AnimatePresence>
        {viewState === 'gallery' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-28 pb-12 px-6 bg-black/40 backdrop-blur-sm pointer-events-auto overflow-y-auto"
          >
            <div className="w-full max-w-6xl mx-auto">
              <div className="flex justify-between items-end mb-10">
                <div>
                  <h2 className="text-4xl font-serif text-white mb-2 drop-shadow-lg">
                    Your Verses
                  </h2>
                  <p className="text-white/70">
                    Explore and manage your immersive digital universes.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExport}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium transition-colors flex items-center gap-1.5"
                    title="Export your universes to file"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export All</span>
                  </button>
                  <button 
                    onClick={() => setShowNewWorldModal(true)}
                    className="px-6 py-3 bg-white text-slate-950 font-medium rounded-full hover:bg-white/90 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Create World
                  </button>
                </div>
              </div>

              {/* Worlds Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {worlds.map((world) => {
                  const seed = world.name.replace(/\s+/g, '');
                  return (
                    <div 
                      key={world.id}
                      onClick={() => {
                        setActiveWorldId(world.id);
                        saveActiveWorldId(world.id);
                        setTheme(world.theme);
                        if (world.spaceStyle) setSpaceStyle(world.spaceStyle);
                        setViewState('canvas');
                      }}
                      className="group relative h-96 rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-white/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://picsum.photos/seed/${seed}/600/400`} alt={world.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute top-4 right-4 z-10 flex gap-2">
                        {world.id !== 'demo_world' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const updatedWorlds = worlds.filter(w => w.id !== world.id);
                              setWorlds(updatedWorlds);
                              saveWorlds(updatedWorlds);
                              if (activeWorldId === world.id) setActiveWorldId(null);
                              pushToast(`World "${world.name}" deleted.`, 'success');
                            }}
                            className="w-8 h-8 rounded-full bg-red-500/20 backdrop-blur-md flex items-center justify-center text-red-200 hover:bg-red-500/80 transition-colors border border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-8">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium uppercase tracking-wider text-white/80 mb-3">
                          {world.theme === 'space' && <Star className="w-3.5 h-3.5 text-blue-400" />}
                          {world.theme === 'ocean' && <Waves className="w-3.5 h-3.5 text-cyan-400" />}
                          {world.theme === 'forest' && <TreePine className="w-3.5 h-3.5 text-emerald-400" />}
                          {world.theme === 'train' && <Train className="w-3.5 h-3.5 text-amber-400" />}
                          {world.theme} Theme
                        </div>
                        <h3 className="text-2xl font-serif text-white mb-2 line-clamp-1">{world.name}</h3>
                        <p className="text-white/60 text-sm leading-relaxed mb-3">
                          {world.memories.length} Memories
                        </p>
                        {activeWorldId === world.id && (
                          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" /> Currently Active
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Create World Modal */}
      <AnimatePresence>
        {showNewWorldModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowNewWorldModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative my-3 sm:my-0 w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col p-5 sm:p-8"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowNewWorldModal(false)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/5 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-3xl font-serif text-white mb-1">Create World</h2>
              <p className="text-white/50 text-sm mb-6">Initialize a new universe for a specific collection of memories.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newWorldName.trim()) {
                  pushToast('World name is required.', 'error');
                  return;
                }
                const newWorld: World = {
                  id: 'world_' + Date.now(),
                  name: newWorldName.trim(),
                  theme: newWorldTheme,
                  spaceStyle: 'clusters',
                  memories: [],
                  createdAt: new Date().toISOString()
                };
                const updatedWorlds = [newWorld, ...worlds];
                setWorlds(updatedWorlds);
                saveWorlds(updatedWorlds);
                setActiveWorldId(newWorld.id);
                saveActiveWorldId(newWorld.id);
                setTheme(newWorldTheme);
                setShowNewWorldModal(false);
                setViewState('canvas');
                setNewWorldName('');
                pushToast(`World "${newWorld.name}" created!`, 'success');
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                    World Name
                  </label>
                  <input 
                    type="text" 
                    value={newWorldName}
                    onChange={e => setNewWorldName(e.target.value)}
                    placeholder="E.g., Summer 2024, My Childhood..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Starting Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'space', label: 'Cosmic Space', icon: Star, color: 'text-blue-400' },
                      { id: 'ocean', label: 'Deep Blue Ocean', icon: Waves, color: 'text-cyan-400' },
                      { id: 'forest', label: 'Moonlit Forest', icon: TreePine, color: 'text-emerald-400' },
                      { id: 'train', label: 'Midnight Train', icon: Train, color: 'text-amber-400' },
                    ].map(({ id, label, icon: Icon, color }) => (
                      <button 
                        key={id} 
                        type="button"
                        onClick={() => setNewWorldTheme(id as ThemeType)} 
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${newWorldTheme === id ? 'bg-white/15 border-white/50 text-white font-medium' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                      >
                        <Icon className={`w-6 h-6 ${color}`} />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-4 bg-white hover:bg-white/90 text-slate-950 font-medium rounded-xl transition-all shadow-lg hover:shadow-white/20 text-sm flex items-center justify-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>Initialize World</span>
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Detail Modal */}
      <AnimatePresence>
        {selectedMemory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto p-3 sm:p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setSelectedMemory(null)}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative my-3 sm:my-0 w-full max-w-4xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 rounded-3xl sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row"
              onClick={e => e.stopPropagation()}
            >
              {/* Close */}
              <button 
                onClick={() => setSelectedMemory(null)}
                className="absolute top-6 right-6 z-10 p-3 bg-black/40 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Media Section */}
              <div className="relative w-full md:w-3/5 aspect-video md:aspect-auto md:h-[32rem] bg-black flex items-center justify-center overflow-hidden">
                {selectedMemory.type === 'video' ? (
                  <video 
                    src={selectedMemory.mediaUrl} 
                    poster={selectedMemory.image}
                    autoPlay
                    loop
                    controls 
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover" 
                  >
                    Your browser does not support video playback.
                  </video>
                ) : selectedMemory.type === 'voice' ? (
                  <div className="flex flex-col items-center gap-4 p-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
                      <Mic className="w-10 h-10 text-emerald-400" />
                    </div>
                    <p className="text-white/60 text-sm">Voice Recording</p>
                    {selectedMemory.image?.startsWith('data:audio') && (
                      <audio src={selectedMemory.image} controls className="w-full max-w-xs" />
                    )}
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedMemory.image}
                    alt={selectedMemory.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50 hidden md:block pointer-events-none" />
              </div>

              {/* Content Section */}
              <div className="w-full md:w-2/5 p-5 sm:p-8 md:p-10 flex flex-col justify-between bg-gradient-to-bl from-white/5 to-transparent">
                <div>
                  <div className="flex items-center gap-3 text-white/50 mb-4 flex-wrap">
                    {selectedMemory.type === 'photo' && <ImageIcon className="w-5 h-5 text-blue-400" />}
                    {(selectedMemory.type === 'voice' || (selectedMemory.type as string) === 'audio') && <Mic className="w-5 h-5 text-emerald-400" />}
                    {selectedMemory.type === 'note' && <FileText className="w-5 h-5 text-amber-400" />}
                    {selectedMemory.type === 'video' && <Volume2 className="w-5 h-5 text-purple-400" />}
                    <span className="font-medium tracking-wide uppercase text-xs">{selectedMemory.date}</span>
                    {selectedMemory.group && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                        {selectedMemory.group}
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-serif text-white mb-4 leading-tight">
                    {selectedMemory.title}
                  </h2>
                  <p className="text-base md:text-lg text-white/75 leading-relaxed">
                    {selectedMemory.content}
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button 
                    onClick={() => handleDeleteMemory(selectedMemory.id)}
                    className="w-full py-3 px-6 bg-red-500/10 text-red-400 font-medium rounded-full hover:bg-red-500/20 transition-colors border border-red-500/20 text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove from Universe
                  </button>
                  <button 
                    onClick={() => setSelectedMemory(null)} 
                    className="w-full py-3 px-6 bg-white text-slate-950 font-medium rounded-full hover:bg-white/90 transition-colors shadow-lg text-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Memory Modal */}
      <AnimatePresence>
        {showNewScrapbook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => setShowNewScrapbook(false)}
          >
            <motion.div 
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col p-8"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowNewScrapbook(false)}
                className="absolute top-6 right-6 z-10 p-3 bg-white/5 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h2 className="text-3xl font-serif text-white mb-1">Add Memory</h2>
              <p className="text-white/50 text-sm mb-6">Create a lasting memory in your 3D digital universe.</p>
              
              {/* Form error */}
              <AnimatePresence>
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {formError}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <form onSubmit={handleCreateMemory} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={e => { setNewTitle(e.target.value); setFormError(''); }}
                    placeholder="E.g., Stargazing in the Desert" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 focus:bg-white/8 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Group */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                      Constellation
                    </label>
                    <input 
                      type="text" 
                      value={newGroup}
                      onChange={e => setNewGroup(e.target.value)}
                      placeholder="Family, Travels, Friends…" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
                    />
                  </div>
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Date</label>
                    <input 
                      type="month" 
                      value={newDate}
                      onChange={e => setNewDate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/40 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Memory Type */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Memory Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { type: 'photo', label: 'Photo', icon: ImageIcon },
                      { type: 'video', label: 'Video', icon: Volume2 },
                      { type: 'voice', label: 'Audio', icon: Mic },
                      { type: 'note', label: 'Note', icon: FileText }
                    ].map(({ type: t, label, icon: Icon }) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewType(t as any)}
                        className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs transition-all ${
                          newType === t
                            ? 'bg-white text-slate-950 font-medium border-white shadow-md'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">
                    Upload Media
                    <span className="ml-1 text-white/30 font-normal normal-case tracking-normal text-[10px]">(optional)</span>
                  </label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*,video/*,audio/*"
                    className="hidden" 
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center hover:bg-white/5 hover:border-white/40 transition-colors cursor-pointer"
                  >
                    {uploadedFilePreview ? (
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/30 bg-white/5 flex items-center justify-center flex-shrink-0">
                          {uploadedFilePreview.startsWith('data:image') ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={uploadedFilePreview} alt="preview" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-6 h-6 text-white/50" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                            <Check className="w-4 h-4" /> Media uploaded!
                          </p>
                          <p className="text-xs text-white/50">Click to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-7 h-7 text-white/50 mb-2" />
                        <p className="text-sm text-white/80 font-medium">Choose file or drag & drop</p>
                        <p className="text-xs text-white/40 mt-1">JPG, PNG, WebP, MP4, MP3 — max 2 MB for best results</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Memory Note</label>
                  <textarea 
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={3}
                    placeholder="Write a few lines about this moment…" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors resize-none"
                  />
                </div>


                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-4 bg-white hover:bg-white/90 text-slate-950 font-medium rounded-xl transition-all shadow-lg hover:shadow-white/20 text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Adding…' : 'Bring Memory to Life'}</span>
                </button>

                {/* Import hint */}
                <p className="text-center text-xs text-white/30 pb-1">
                  Have a backup file?{' '}
                  <button
                    type="button"
                    onClick={() => { setShowNewScrapbook(false); importInputRef.current?.click(); }}
                    className="text-white/60 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    Import from JSON
                  </button>
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Left Audio Player */}
      <AnimatePresence>
        {viewState === 'canvas' && !selectedMemory && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 1, delay: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-8 left-8 z-40 pointer-events-auto hidden md:flex items-center gap-3"
          >
            <div 
              onClick={toggleAudio}
              className="flex items-center gap-4 p-3 pr-6 bg-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl hover:bg-white/10 transition-all cursor-pointer group"
              title="Toggle theme soundscape (or press Space)"
            >
              <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                {isPlayingAudio ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-white/60" />}
              </div>
              <div>
                <p className="text-sm font-medium capitalize">{theme} Soundscape</p>
                <p className="text-xs text-white/50">{isPlayingAudio ? (customMusic ? customMusic.name : 'Generative Ambient') : 'Click to turn sound ON'}</p>
              </div>
              <div className="ml-3 flex gap-1 h-4 items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.div 
                    key={i}
                    animate={isPlayingAudio ? { height: ["3px", "16px", "3px"] } : { height: "3px" }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, delay: i * 0.1 }}
                    className={`w-1 rounded-full ${isPlayingAudio ? 'bg-emerald-400/90' : 'bg-white/30'}`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => musicInputRef.current?.click()}
              className="w-11 h-11 rounded-full bg-white/5 border border-white/15 flex items-center justify-center hover:bg-white/15 transition-colors"
              title={`Choose custom ${theme} music`}
            >
              <Upload className="w-4 h-4 text-white/70" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Right Keyboard Shortcut Hints */}
      <AnimatePresence>
        {viewState === 'canvas' && !selectedMemory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 right-8 z-30 pointer-events-none hidden lg:flex items-center gap-2 text-[11px] text-white/40 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
          >
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70">1-4</kbd> Switch Themes</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70">Space</kbd> Play/Pause</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70">Esc</kbd> Close</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Memory count badge in canvas view */}
      <AnimatePresence>
        {viewState === 'canvas' && !selectedMemory && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 1.5 }}
            className="absolute top-24 right-8 z-30 pointer-events-none hidden md:flex items-center gap-2 text-xs text-white/40 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
          >
            <Info className="w-3 h-3" />
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/90 border border-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <HelpCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-serif font-medium text-white">How to Use MemoryVerse</h2>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 text-slate-300 text-sm">
                
                <section>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-emerald-400" /> 
                    Exploring the Universe
                  </h3>
                  <ul className="space-y-2 ml-6 list-disc list-outside text-slate-400">
                    <li><strong className="text-slate-200">Drag</strong> anywhere to rotate your view around the memories.</li>
                    <li><strong className="text-slate-200">Scroll</strong> or <strong className="text-slate-200">Pinch</strong> to zoom in and out.</li>
                    <li><strong className="text-slate-200">Click a memory card</strong> to focus on it and view its full details.</li>
                    <li>Toggle between the <strong className="text-slate-200">3D Canvas</strong> and a traditional <strong className="text-slate-200">Gallery</strong> using the nav buttons.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-purple-400" /> 
                    Themes & Environments
                  </h3>
                  <p className="mb-2 text-slate-400">Change the vibe using the top-left dropdown or keyboard shortcuts:</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                      <Star className="w-5 h-5 text-blue-400" />
                      <div><div className="font-medium text-white">Space [1]</div><div className="text-xs text-slate-500">Nebulas & Constellations</div></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                      <Waves className="w-5 h-5 text-cyan-400" />
                      <div><div className="font-medium text-white">Ocean [2]</div><div className="text-xs text-slate-500">Godrays & Bubbles</div></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                      <TreePine className="w-5 h-5 text-emerald-400" />
                      <div><div className="font-medium text-white">Forest [3]</div><div className="text-xs text-slate-500">Moonlit glade & fireflies</div></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3">
                      <Train className="w-5 h-5 text-amber-500" />
                      <div><div className="font-medium text-white">Train [4]</div><div className="text-xs text-slate-500">Vintage Midnight Express</div></div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center gap-3 col-span-2 sm:col-span-1">
                      <BedDouble className="w-5 h-5 text-violet-300" />
                      <div><div className="font-medium text-white">Bedroom [5]</div><div className="text-xs text-slate-500">Rainy night & polaroid memories</div></div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-3">
                    <Keyboard className="w-4 h-4 text-pink-400" /> 
                    Keyboard Shortcuts
                  </h3>
                  <div className="space-y-2 text-slate-400 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between"><span>Open this help menu</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">?</kbd></div>
                    <div className="flex justify-between"><span>Close active memory/menu</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">ESC</kbd></div>
                    <div className="flex justify-between"><span>Mute/Unmute Ambient Audio</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">M</kbd></div>
                    <div className="flex justify-between"><span>Switch to Space Theme</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">1</kbd></div>
                    <div className="flex justify-between"><span>Switch to Ocean Theme</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">2</kbd></div>
                    <div className="flex justify-between"><span>Switch to Forest Theme</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">3</kbd></div>
                    <div className="flex justify-between"><span>Switch to Train Theme</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">4</kbd></div>
                    <div className="flex justify-between"><span>Switch to Bedroom Theme</span> <kbd className="bg-white/10 px-2 py-0.5 rounded text-white font-mono text-xs border border-white/20">5</kbd></div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-3">
                    <FolderOpen className="w-4 h-4 text-amber-400" /> 
                    Storage & Export
                  </h3>
                  <p className="text-slate-400">
                    Memories are saved directly to your browser's <strong className="text-slate-200">local storage</strong>. 
                    If you add very large images, they may exceed browser limits. 
                    Use the <strong className="text-slate-200">Export (Download)</strong> button in the top right to back up your memories to a file, which you can <strong className="text-slate-200">Import</strong> later!
                  </p>
                </section>
                
              </div>
              <div className="mt-8 pt-4 border-t border-slate-700/50 flex justify-end">
                <button 
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-xl border shadow-2xl text-sm font-medium pointer-events-auto ${
                toast.type === 'success' 
                  ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                  : toast.type === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/30 text-amber-300'
                  : 'bg-red-950/80 border-red-500/30 text-red-300'
              }`}
            >
              {toast.type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              {toast.type === 'error' && <X className="w-4 h-4 flex-shrink-0" />}
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
