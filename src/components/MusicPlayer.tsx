import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  url: string;
}

const PLAYLIST: Song[] = [
  { id: '1', title: 'Midnight Drive', artist: 'Synthwave Pro', duration: '6:12', cover: 'https://picsum.photos/seed/music1/200/200', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Cyber City', artist: 'Neon Dreams', duration: '7:05', cover: 'https://picsum.photos/seed/music2/200/200', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Electric Horizon', artist: 'Digital Nomad', duration: '5:44', cover: 'https://picsum.photos/seed/music3/200/200', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'Techno Pulse', artist: 'Bass Master', duration: '5:02', cover: 'https://picsum.photos/seed/music4/200/200', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

export interface MusicPlayerHandle {
  control: (action: string) => void;
}

const MusicPlayer = forwardRef<MusicPlayerHandle>((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('0:00');
  const [volume, setVolume] = useState(75);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentSong = PLAYLIST[currentSongIndex];

  useImperativeHandle(ref, () => ({
    control: (action: string) => {
      switch (action) {
        case 'play':
          setIsPlaying(true);
          break;
        case 'pause':
          setIsPlaying(false);
          break;
        case 'next':
          nextSong();
          break;
        case 'previous':
          prevSong();
          break;
        case 'volume_up':
          setVolume(prev => Math.min(100, prev + 10));
          break;
        case 'volume_down':
          setVolume(prev => Math.max(0, prev - 10));
          break;
      }
    }
  }));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          if (e.name === 'AbortError') return;
          console.error("Audio play failed:", e);
          setIsPlaying(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSongIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
      
      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setCurrentTimeStr(`${mins}:${secs.toString().padStart(2, '0')}`);
    }
  };

  const handleEnded = () => {
    nextSong();
  };

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const nextSong = () => {
    setCurrentSongIndex((currentSongIndex + 1) % PLAYLIST.length);
    setIsPlaying(true);
  };
  
  const prevSong = () => {
    setCurrentSongIndex((currentSongIndex - 1 + PLAYLIST.length) % PLAYLIST.length);
    setIsPlaying(true);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center gap-3">
      <audio 
        ref={audioRef} 
        src={currentSong.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative group">
        <img 
          src={currentSong.cover} 
          alt={currentSong.title} 
          className={cn("w-full h-full object-cover transition-transform duration-700", isPlaying ? "scale-110" : "scale-100")}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className={cn("w-1.5 h-1.5 rounded-full bg-car-accent", isPlaying && "animate-ping")} />
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-1">
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white truncate">{currentSong.title}</h3>
            <p className="text-[9px] text-white/40 truncate uppercase tracking-widest">{currentSong.artist}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={prevSong} className="text-white/40 hover:text-white transition-colors">
              <SkipBack size={14} />
            </button>
            <button 
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-car-accent text-white flex items-center justify-center hover:bg-car-accent/80 transition-all shadow-lg shadow-car-accent/20"
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={nextSong} className="text-white/40 hover:text-white transition-colors">
              <SkipForward size={14} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-white/40 w-6">{currentTimeStr}</span>
          <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-car-accent" 
              animate={{ width: `${progress}%` }}
              transition={{ type: "tween", duration: 0.1 }}
            />
          </div>
          <span className="text-[8px] font-mono text-white/40 w-6 text-right">{currentSong.duration}</span>
        </div>
      </div>
    </div>
  );
});

export default MusicPlayer;
