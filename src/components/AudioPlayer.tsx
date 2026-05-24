
import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Music } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  isMuted?: boolean;
  volume?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  isMuted = false,
  volume = 0.8,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Restart/reset audio when standard src changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    if (audioRef.current) {
      audioRef.current.load();
      // Auto-play attempt
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn("Autoplay was prevented, waiting for user click:", err);
            setIsPlaying(false);
          });
      }
    }
  }, [src]);

  // Handle outside volume/muted changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Error playing audio:", e));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 40); // default to 40 if not loaded
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Error standard restarting:", e));
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-slate-900/80 border border-purple-500/30 rounded-[2.5rem] p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] backdrop-blur-md">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col gap-5">
        {/* Track info header */}
        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white animate-pulse">
            <Music className="w-6 h-6" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs text-purple-400 font-black tracking-widest uppercase">Аудио-трек</p>
            <p className="text-sm font-semibold text-white/90 truncate">Угадай аниме по треку / опенингу / звуку</p>
          </div>
        </div>

        {/* Timeline Slider / Progress */}
        <div className="space-y-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 40}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-purple-950/60 rounded-lg appearance-none cursor-pointer accent-pink-500 focus:outline-none transition-all hover:bg-purple-950"
              style={{
                background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${
                  (currentTime / (duration || 40)) * 100
                }%, #1e1b4b ${(currentTime / (duration || 40)) * 100}%, #1e1b4b 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 40)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-between items-center px-2">
          {/* Restart Btn */}
          <button
            onClick={restartAudio}
            title="Заново"
            className="p-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-95"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Core Play/Pause Btn */}
          <button
            onClick={togglePlay}
            className={`flex items-center justify-center w-16 h-16 rounded-full text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all transform active:scale-95`}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white translate-x-0.5" />
            )}
          </button>

          {/* Volume Status indicator */}
          <div className="p-3 text-slate-400 bg-white/5 rounded-2xl flex items-center justify-center">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-purple-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
