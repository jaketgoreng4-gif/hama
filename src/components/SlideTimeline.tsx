import React, { useRef, useState, useEffect } from 'react';
import { Slide, AudioTrack } from '../types';
import {
  Layers,
  ImagePlus,
  Plus,
  Volume1,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Library,
  Trash2,
  Music,
  Zap,
  Wand2,
  Sliders,
  Scissors,
  Upload,
  Link2,
} from 'lucide-react';
import { sampleStockPhotos } from '../utils/slideRenderer';
import { audioEngine } from '../audio/audioEngine';

interface SlideTimelineProps {
  slides: Slide[];
  activeSlideIndex: number;
  slideDuration: number;
  currentTime?: number;
  uploadedAudioName: string | null;
  audioTracks?: AudioTrack[];
  waveformPeaks?: number[];
  autoMatchMusicDuration?: boolean;
  effectiveMusicDuration?: number;
  onToggleAutoMatchMusicDuration?: () => void;
  onSelectSlide: (index: number) => void;
  onAddBlankSlide: () => void;
  onAddMultipleBlankSlides: (count?: number) => void;
  onUploadImages: (files: FileList | File[]) => void;
  onUploadAudios?: (files: FileList | File[], append?: boolean) => void;
  onAddStockPhoto: (url: string, title: string) => void;
  onMoveSlide: (fromIdx: number, toIdx: number) => void;
  onClearAll: () => void;
  onAutoSyncWithMusic?: () => void;
  onOpenAutoEdit?: () => void;
  onSeek?: (time: number) => void;
  onMergeTracks?: () => void;
}

export const SlideTimeline: React.FC<SlideTimelineProps> = ({
  slides,
  activeSlideIndex,
  slideDuration,
  currentTime = 0,
  uploadedAudioName,
  audioTracks = [],
  waveformPeaks = [],
  autoMatchMusicDuration = true,
  effectiveMusicDuration,
  onToggleAutoMatchMusicDuration,
  onSelectSlide,
  onAddBlankSlide,
  onAddMultipleBlankSlides,
  onUploadImages,
  onUploadAudios,
  onAddStockPhoto,
  onMoveSlide,
  onClearAll,
  onAutoSyncWithMusic,
  onOpenAutoEdit,
  onSeek,
  onMergeTracks,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showStockMenu, setShowStockMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const totalDuration = slides.length * slideDuration;
  const compositeDuration = audioEngine.getCompositeDuration() || totalDuration || 30;
  const analysisData = audioEngine.getAnalysisData();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadImages(e.target.files);
    }
    e.target.value = '';
  };

  const handleAudioFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUploadAudios) {
      onUploadAudios(e.target.files, true);
    }
    e.target.value = '';
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter(
        (f) =>
          f.type.startsWith('audio/') ||
          f.type.includes('webm') ||
          f.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i)
      );
      const imgFiles = files.filter((f) => f.type.startsWith('image/'));

      if (audioFiles.length > 0 && onUploadAudios) {
        onUploadAudios(audioFiles, true);
      }
      if (imgFiles.length > 0) {
        onUploadImages(imgFiles);
      }
    }
  };

  // Format seconds to SMPTE MM:SS.FF
  const formatSMPTE = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-t border-slate-800 bg-slate-950 p-3 flex flex-col justify-between relative transition-colors ${
        isDragging ? 'bg-indigo-950/40 border-t-2 border-indigo-500' : ''
      }`}
    >
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*,video/webm,.webm"
        multiple
        onChange={handleAudioFiles}
        className="hidden"
      />

      {/* Studio Timeline Header Bar */}
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap pb-2 border-b border-slate-800/80">
        {/* Left: Track Info & Timecode */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Timeline Multitrack
            </span>
          </div>

          <span className="text-[11px] font-mono bg-slate-900 text-indigo-300 border border-slate-700/80 px-2 py-0.5 rounded-md shadow-inner">
            TC: {formatSMPTE(currentTime)} / {formatSMPTE(totalDuration)}
          </span>

          <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono font-medium">
            {slides.length} Slide
          </span>

          {audioTracks.length > 0 && (
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-1">
              <Music className="w-3 h-3 text-purple-400" />
              <span>{audioTracks.length} Lagu Tersambung</span>
            </span>
          )}
        </div>

        {/* Right: Studio Actions & Prominent Auto-Edit Button */}
        <div className="flex items-center gap-2 relative flex-wrap">
          {/* AUTO-EDIT PRO BUTTON */}
          {onOpenAutoEdit && (
            <button
              onClick={onOpenAutoEdit}
              title="Buka Auto-Edit Studio Pro: Sinkronkan ketukan beat musik, pangkas hening & leveling audio otomatis"
              className="px-3 py-1 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer animate-pulse"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Auto-Edit Pro</span>
            </button>
          )}

          {/* Upload Multiple Images */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Pilih banyak foto sekaligus dari perangkat Anda"
            className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg cursor-pointer transition flex items-center gap-1.5 shadow-sm"
          >
            <ImagePlus className="w-3.5 h-3.5 text-indigo-200" />
            <span>+ Foto</span>
          </button>

          {/* Quick Add Multiple Blank Slides */}
          <button
            onClick={() => onAddMultipleBlankSlides(5)}
            title="Tambahkan 5 slide gradien sekaligus"
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition flex items-center gap-1.5 border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+5 Slide</span>
          </button>

          {/* Stock Photos dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStockMenu(!showStockMenu)}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer transition flex items-center gap-1.5 border border-slate-700"
            >
              <Library className="w-3.5 h-3.5 text-amber-400" />
              <span>Contoh</span>
            </button>

            {showStockMenu && (
              <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-30 flex flex-col gap-2 animate-in fade-in">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>Pilih Foto Bebas Royalti:</span>
                  <button
                    onClick={() => setShowStockMenu(false)}
                    className="text-[10px] text-slate-500 hover:text-white"
                  >
                    Tutup
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto">
                  {sampleStockPhotos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onAddStockPhoto(p.url, p.title);
                        setShowStockMenu(false);
                      }}
                      className="p-1 rounded-lg border border-slate-800 hover:border-cyan-400 bg-slate-950 text-left transition flex flex-col gap-1 group"
                    >
                      <div className="aspect-video w-full rounded overflow-hidden">
                        <img
                          src={p.url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <span className="text-[10px] text-slate-300 truncate">{p.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clear All Slides if any exist */}
          {slides.length > 0 && (
            <button
              onClick={onClearAll}
              title="Hapus semua slide"
              className="p-1.5 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-700/60 text-slate-400 rounded-lg transition border border-slate-700/70"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Scroll Navigation */}
          {slides.length > 4 && (
            <div className="flex items-center gap-1 ml-1 bg-slate-800/90 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={scrollLeft}
                title="Gulir ke Kiri"
                className="p-1 hover:bg-slate-700 text-slate-300 rounded transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={scrollRight}
                title="Gulir ke Kanan"
                className="p-1 hover:bg-slate-700 text-slate-300 rounded transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TRACK 1: VIDEO / SLIDES LANE */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider w-16 shrink-0 flex items-center gap-1">
          <Layers className="w-3 h-3 text-indigo-400" />
          <span>V1: Video</span>
        </span>

        {slides.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3 border-2 border-dashed border-slate-800 hover:border-indigo-500/70 rounded-xl bg-slate-900/40 flex items-center justify-center gap-2 text-center cursor-pointer transition group"
          >
            <ImagePlus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
            <span className="text-xs text-slate-400 font-medium">
              Belum ada foto slide. Klik untuk mengunggah banyak foto sekaligus!
            </span>
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="flex-1 flex gap-2 overflow-x-auto items-center pb-1 scroll-smooth"
          >
            {slides.map((slide, idx) => {
              const isActive = idx === activeSlideIndex;
              const slideStart = idx * slideDuration;
              const slideEnd = (idx + 1) * slideDuration;

              return (
                <div
                  key={slide.id}
                  onClick={() => onSelectSlide(idx)}
                  className={`shrink-0 w-28 h-24 rounded-xl p-1.5 cursor-pointer transition flex flex-col justify-between relative border select-none group ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-950/50 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                      : 'border-slate-800 bg-slate-900/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Card Header: Slide index & Timecode */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-mono font-bold px-1 rounded ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">
                      {slideStart.toFixed(1)}s
                    </span>
                  </div>

                  {/* Card Thumbnail */}
                  <div
                    className="flex-1 my-1 rounded overflow-hidden flex items-center justify-center border border-slate-800 text-center relative bg-slate-950"
                    style={{
                      background: slide.imgElement
                        ? 'transparent'
                        : `linear-gradient(135deg, ${slide.gradient[0]}, ${slide.gradient[1]})`,
                    }}
                  >
                    {slide.imgElement && slide.imageSrc ? (
                      <img
                        src={slide.imageSrc}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          transform: `rotate(${slide.transform?.rotation || 0}deg) scaleX(${
                            slide.transform?.flipH ? -1 : 1
                          }) scaleY(${slide.transform?.flipV ? -1 : 1})`,
                        }}
                      />
                    ) : (
                      <span className="text-[8px] text-white font-medium truncate px-1">
                        {slide.text || slide.title}
                      </span>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between text-[8px] text-slate-400">
                    <span className="truncate max-w-[50px]">{slide.transition}</span>
                    <span className="text-amber-400/90 font-mono">{slide.sfx}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRACK 2: AUDIO MASTER & STEMS LANE */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/70">
        <div className="w-16 shrink-0 flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Music className="w-3 h-3 text-purple-400" />
            <span>A1: Audio</span>
          </span>
          <span className="text-[8px] text-slate-500 font-mono">
            {audioTracks.length > 0 ? `${audioTracks.length} Lagu` : 'Preset'}
          </span>
        </div>

        {/* Audio Waveform & Multi-Track Stems Container */}
        <div className="flex-1 h-12 bg-slate-900/90 border border-slate-800/90 rounded-xl p-1.5 flex items-center relative overflow-hidden group">
          {/* Audio Tracks Ribbon Blocks */}
          {audioTracks.length > 0 ? (
            <div className="w-full h-full flex items-center gap-1 relative">
              {audioTracks.map((tr, tIdx) => {
                const colors = [
                  'from-purple-950/70 to-indigo-950/70 border-purple-500/40 text-purple-300',
                  'from-blue-950/70 to-cyan-950/70 border-cyan-500/40 text-cyan-300',
                  'from-emerald-950/70 to-teal-950/70 border-emerald-500/40 text-emerald-300',
                  'from-rose-950/70 to-amber-950/70 border-rose-500/40 text-rose-300',
                ];
                const themeClass = colors[tIdx % colors.length];

                return (
                  <div
                    key={tr.id}
                    className={`flex-1 h-full rounded-lg border bg-gradient-to-r ${themeClass} px-2 flex items-center justify-between relative overflow-hidden`}
                    title={`Lagu #${tIdx + 1}: ${tr.name} (${tr.duration.toFixed(1)}s)`}
                  >
                    {/* Mini Waveform in background */}
                    <div className="absolute inset-0 flex items-center justify-between px-1 opacity-25 pointer-events-none">
                      {(tr.peaks.length > 0 ? tr.peaks : [0.3, 0.6, 0.9, 0.4, 0.7, 0.5]).map(
                        (p, pi) => (
                          <div
                            key={pi}
                            className="w-0.5 bg-current rounded-full"
                            style={{ height: `${Math.max(15, p * 100)}%` }}
                          />
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 z-10">
                      <span className="text-[9px] font-bold font-mono px-1 rounded bg-black/40">
                        #{tIdx + 1}
                      </span>
                      <span className="text-[10px] font-medium truncate max-w-[120px]">
                        {tr.name}
                      </span>
                    </div>

                    <span className="text-[9px] font-mono opacity-80 z-10">
                      {tr.duration.toFixed(1)}s
                    </span>

                    {/* Transition badge connector to next track */}
                    {tIdx < audioTracks.length - 1 && (
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-indigo-500/40 to-transparent flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white">⚡</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-between px-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[11px] font-medium text-slate-300">
                  Preset BGM Aktif ({uploadedAudioName || 'Lo-Fi Chill Chords'})
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {analysisData.detectedBpm} BPM
              </span>
            </div>
          )}

          {/* Quick Add Audio Button */}
          <button
            onClick={() => audioInputRef.current?.click()}
            title="Tambah lagu lain ke dalam urutan multitrack"
            className="ml-2 px-2 py-1 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border border-slate-700 text-[10px] font-medium flex items-center gap-1 shrink-0 transition cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">+ Lagu</span>
          </button>

          {/* Quick Merge Audio Tracks Button */}
          {audioTracks.length > 1 && onMergeTracks && (
            <button
              onClick={onMergeTracks}
              title="Gabungkan seluruh lagu di timeline menjadi 1 master audio"
              className="ml-1.5 px-2 py-1 h-8 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white border border-purple-500/50 text-[10px] font-bold flex items-center gap-1 shrink-0 shadow-sm transition cursor-pointer active:scale-95"
            >
              <Link2 className="w-3 h-3 text-purple-200" />
              <span>Gabung</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Timeline Summary Bar */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 mt-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {slides.length} Slide Foto
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-200 font-medium">
            Total Video: <strong className="text-white">{totalDuration.toFixed(1)}s</strong> ({slideDuration.toFixed(2)}s / slide)
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-cyan-300">
            Musik: {(effectiveMusicDuration !== undefined ? effectiveMusicDuration : compositeDuration).toFixed(1)}s
          </span>

          {autoMatchMusicDuration && (
            <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9.5px] font-bold">
              <Zap className="w-3 h-3 text-emerald-400" />
              100% Pas Musik
            </span>
          )}
        </div>

        {/* Quick Sync Action */}
        <div className="flex items-center gap-2">
          {onToggleAutoMatchMusicDuration && (
            <button
              onClick={onToggleAutoMatchMusicDuration}
              title="Aktifkan atau matikan penyesuaian otomatis durasi video ke panjang musik"
              className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                autoMatchMusicDuration
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{autoMatchMusicDuration ? '⚡ Auto-Fit Musik: AKTIF' : 'Auto-Fit: NONAKTIF'}</span>
            </button>
          )}

          {onAutoSyncWithMusic && slides.length > 0 && (
            <button
              onClick={onAutoSyncWithMusic}
              title="Bagi rata durasi slide ke total durasi musik"
              className="px-2.5 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900 text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Music className="w-3 h-3 text-purple-400" />
              <span>Sinkronkan Musik</span>
            </button>
          )}

          {onOpenAutoEdit && slides.length > 0 && (
            <button
              onClick={onOpenAutoEdit}
              className="px-2.5 py-0.5 rounded-md bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-900 text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
            >
              <Wand2 className="w-3 h-3 text-indigo-400" />
              <span>Auto-Edit Beat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
