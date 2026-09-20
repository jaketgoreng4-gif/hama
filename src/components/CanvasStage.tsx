import React, { RefObject, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Music,
  Sparkles,
  Activity,
  ImagePlus,
  UploadCloud,
  Plus,
  Library,
  Volume2,
  FolderOpen,
  Zap,
} from 'lucide-react';
import { EqualizerConfig, AudioReactiveVideoFx } from '../types';
import { sampleStockPhotos } from '../utils/slideRenderer';

interface CanvasStageProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  activeSlideIndex: number;
  totalSlides: number;
  bgmVolume: number;
  sfxVolume: number;
  equalizerConfig: EqualizerConfig;
  audioFx?: AudioReactiveVideoFx;
  lyricsEnabled?: boolean;
  onToggleLyrics?: () => void;
  onOpenLyricsTab?: () => void;
  isExporting: boolean;
  exportElapsed: number;
  uploadedAudioName: string | null;
  trackCount?: number;
  autoMatchMusicDuration?: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onSeek: (time: number) => void;
  onBgmVolumeChange: (vol: number) => void;
  onSfxVolumeChange: (vol: number) => void;
  onToggleEqualizer: () => void;
  onToggleAudioFx?: () => void;
  onUploadAudio?: (file: File) => void;
  onUploadAudios: (files: FileList | File[]) => void;
  onUploadImages: (files: FileList | File[]) => void;
  onAddBlankSlide: () => void;
  onAddStockPhoto: (url: string, title: string) => void;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  canvasRef,
  isPlaying,
  currentTime,
  totalDuration,
  activeSlideIndex,
  totalSlides,
  bgmVolume,
  sfxVolume,
  equalizerConfig,
  audioFx,
  lyricsEnabled = true,
  onToggleLyrics,
  onOpenLyricsTab,
  isExporting,
  exportElapsed,
  uploadedAudioName,
  trackCount = 0,
  autoMatchMusicDuration = true,
  onPlayPause,
  onStop,
  onPrevSlide,
  onNextSlide,
  onSeek,
  onBgmVolumeChange,
  onSfxVolumeChange,
  onToggleEqualizer,
  onToggleAudioFx,
  onUploadAudio,
  onUploadAudios,
  onUploadImages,
  onAddBlankSlide,
  onAddStockPhoto,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const fileAudioRef = useRef<HTMLInputElement>(null);
  const fileImageRef = useRef<HTMLInputElement>(null);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);
    const audioFiles = files.filter(
      (f) =>
        f.type.startsWith('audio/') ||
        f.type.includes('webm') ||
        f.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i)
    );
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));

    if (audioFiles.length > 0) {
      onUploadAudios(audioFiles);
    }
    if (imageFiles.length > 0) {
      onUploadImages(imageFiles);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 p-3 md:p-5 flex flex-col items-center justify-center relative min-h-[380px] transition-colors ${
        isDragging ? 'bg-indigo-950/40 border-2 border-dashed border-indigo-400' : 'bg-slate-950'
      }`}
    >
      {/* Hidden file pickers */}
      <input
        ref={fileAudioRef}
        type="file"
        accept="audio/*,video/webm,.webm"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onUploadAudios(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />
      <input
        ref={fileImageRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onUploadImages(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Canvas Viewport Frame */}
      <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800/90 flex items-center justify-center group">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full h-full object-contain"
        />

        {/* Empty State Overlay when 0 slides exist */}
        {totalSlides === 0 && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 mb-4 animate-bounce">
              <UploadCloud className="w-7 h-7" />
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white mb-1.5">
              Mulai Membuat Video Kanvas
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              Tarik dan lepas banyak foto serta file musik ke sini, atau gunakan tombol di bawah untuk membuat video dengan equalizer visual.
            </p>

            {/* Quick Action Grid */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg">
              {/* Upload Multiple Images */}
              <button
                onClick={() => fileImageRef.current?.click()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
              >
                <ImagePlus className="w-4 h-4" />
                <span>Unggah Banyak Foto Sekaligus</span>
              </button>

              {/* Upload Music */}
              <button
                onClick={() => fileAudioRef.current?.click()}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5"
              >
                <Music className="w-4 h-4 text-purple-200" />
                <span>{uploadedAudioName ? 'Ganti File Musik' : 'Unggah File Musik (MP3/WAV)'}</span>
              </button>

              {/* Add Blank Slide */}
              <button
                onClick={onAddBlankSlide}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs flex items-center gap-2 border border-slate-700 transition"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Slide Gradien</span>
              </button>

              {/* Stock Photos */}
              <button
                onClick={() => setShowStockModal(true)}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-xs flex items-center gap-2 border border-slate-700 transition"
              >
                <Library className="w-4 h-4 text-amber-400" />
                <span>Galeri Foto</span>
              </button>
            </div>

            {uploadedAudioName && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-200 text-xs">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>Musik aktif: <strong>{uploadedAudioName}</strong></span>
              </div>
            )}
          </div>
        )}

        {/* Dragging Active Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur border-2 border-indigo-400 flex flex-col items-center justify-center text-white z-20 pointer-events-none">
            <UploadCloud className="w-16 h-16 text-indigo-400 mb-2 animate-bounce" />
            <h4 className="text-base font-bold">Lepaskan File Foto atau Musik di Sini</h4>
            <p className="text-xs text-indigo-200">Mendukung banyak gambar (JPG, PNG, WEBP) & audio (MP3, WAV)</p>
          </div>
        )}

        {/* Recording Overlay Badge */}
        {isExporting && (
          <div className="absolute top-4 left-4 bg-red-600/95 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-xl backdrop-blur animate-pulse z-20">
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span>MEREKAM VIDEO ({formatTime(exportElapsed)})</span>
          </div>
        )}

        {/* Active Equalizer HUD Badge */}
        {equalizerConfig.enabled && !isExporting && totalSlides > 0 && (
          <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur text-[11px] font-mono text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/30 flex items-center gap-1.5 shadow-md z-10">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>EQ: {equalizerConfig.style.toUpperCase()}</span>
          </div>
        )}

        {/* Audio Reactive Video FX Live HUD Badge */}
        {audioFx?.enabled && !isExporting && totalSlides > 0 && (
          <button
            onClick={onToggleAudioFx}
            title="Efek Video Reaktif Musik Aktif (Klik untuk matikan / nyalakan)"
            className={`absolute top-4 ${
              equalizerConfig.enabled ? 'left-32' : 'left-4'
            } bg-purple-950/85 hover:bg-purple-900/90 backdrop-blur text-[11px] font-mono text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/40 flex items-center gap-1.5 shadow-md z-10 cursor-pointer transition`}
          >
            <Zap className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span>EFEK: {(audioFx.intensity || 1).toFixed(1)}x</span>
          </button>
        )}

        {/* Lyrics HUD Badge */}
        {lyricsEnabled && !isExporting && totalSlides > 0 && (
          <button
            onClick={onOpenLyricsTab}
            title="Lirik Musik Aktif di Video (Klik untuk edit lirik & gaya)"
            className={`absolute top-4 ${
              equalizerConfig.enabled && audioFx?.enabled
                ? 'left-60'
                : equalizerConfig.enabled || audioFx?.enabled
                ? 'left-32'
                : 'left-4'
            } bg-pink-950/85 hover:bg-pink-900/90 backdrop-blur text-[11px] font-mono text-pink-300 px-2.5 py-1 rounded-lg border border-pink-500/40 flex items-center gap-1.5 shadow-md z-10 cursor-pointer transition`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-pink-400" />
            <span>LIRIK ON</span>
          </button>
        )}

        {/* Current Slide Indicator */}
        {totalSlides > 0 && (
          <div className="absolute bottom-3 right-4 bg-slate-950/80 backdrop-blur text-[11px] font-mono text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800/80 pointer-events-none z-10">
            Slide: <strong className="text-white">{activeSlideIndex + 1}</strong> / {totalSlides}
          </div>
        )}
      </div>

      {/* Canvas Controls Bar */}
      <div className="w-full max-w-4xl mt-3.5 bg-slate-900/95 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col gap-2.5">
        {/* Scrubber Timeline Bar */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-indigo-400 w-12 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={totalDuration || 1}
            step="0.01"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-800 rounded-lg cursor-pointer accent-indigo-500 transition"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-xs text-slate-400">
              {formatTime(totalDuration)}
            </span>
            {autoMatchMusicDuration && (
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-1 py-0.2 rounded hidden sm:inline-block">
                Pas Musik
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & Volume */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onPrevSlide}
              disabled={totalSlides <= 1}
              title="Slide Sebelumnya"
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition disabled:opacity-30"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onPlayPause}
              disabled={totalSlides === 0 && !uploadedAudioName}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-40"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Putar Video</span>
                </>
              )}
            </button>

            <button
              onClick={onNextSlide}
              disabled={totalSlides <= 1}
              title="Slide Berikutnya"
              className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition disabled:opacity-30"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onStop}
              title="Stop & Reset ke Awal"
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Audio & Equalizer Toggles */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-xs text-slate-400">
            {/* Quick Upload Music Button right on stage bar */}
            <button
              onClick={() => fileAudioRef.current?.click()}
              title={uploadedAudioName ? `Lagu: ${uploadedAudioName}. Klik untuk ganti.` : 'Unggah file musik'}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition flex items-center gap-1.5 border ${
                uploadedAudioName
                  ? 'bg-purple-950/80 border-purple-500/50 text-purple-300 hover:bg-purple-900/80'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span className="max-w-[90px] sm:max-w-[120px] truncate">
                {uploadedAudioName || 'Pilih Musik'}
              </span>
            </button>

            {/* Quick EQ toggle button */}
            <button
              onClick={onToggleEqualizer}
              title="Toggle Efek Visual Equalizer"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 border ${
                equalizerConfig.enabled
                  ? 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>EQ {equalizerConfig.enabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Quick Lirik AI button */}
            <button
              onClick={onOpenLyricsTab || onToggleLyrics}
              title="Pengaturan Lirik AI & Teks Lagu"
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition flex items-center gap-1.5 border ${
                lyricsEnabled
                  ? 'bg-pink-950/80 border-pink-700/60 text-pink-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>LIRIK {lyricsEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Quick BGM Volume */}
            <div className="flex items-center gap-1.5" title="Volume Musik BGM">
              <span className="text-[11px] hidden sm:inline">Vol:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVolume}
                onChange={(e) => onBgmVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-16 h-1.5 bg-slate-800 accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Photos Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Library className="w-4 h-4 text-cyan-400" />
                Pilih Foto Bebas Royalti
              </h3>
              <button
                onClick={() => setShowStockModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
              >
                Tutup
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {sampleStockPhotos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onAddStockPhoto(p.url, p.title);
                    setShowStockModal(false);
                  }}
                  className="p-2 rounded-xl border border-slate-800 hover:border-cyan-400 bg-slate-950 text-left transition flex flex-col gap-1.5 group"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-900">
                    <img
                      src={p.url}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <span className="text-xs text-slate-200 font-medium truncate">{p.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
