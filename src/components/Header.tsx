import React, { useRef } from 'react';
import {
  Clapperboard,
  Download,
  Trash2,
  Activity,
  Mic,
  MicOff,
  Music,
  ImagePlus,
  Upload,
  Zap,
  Globe,
} from 'lucide-react';

interface HeaderProps {
  onClearAll: () => void;
  onExport: () => void;
  isExporting: boolean;
  micActive: boolean;
  onToggleMic: () => void;
  equalizerEnabled: boolean;
  onUploadAudio?: (file: File) => void;
  onUploadAudios: (files: FileList | File[]) => void;
  onUploadImages: (files: FileList | File[]) => void;
  uploadedAudioName: string | null;
  trackCount?: number;
  slideCount: number;
  onOpenAutoEdit?: () => void;
  onOpenVercelDeploy?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onClearAll,
  onExport,
  isExporting,
  micActive,
  onToggleMic,
  equalizerEnabled,
  onUploadAudio,
  onUploadAudios,
  onUploadImages,
  uploadedAudioName,
  trackCount = 0,
  slideCount,
  onOpenAutoEdit,
  onOpenVercelDeploy,
}) => {
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadAudios(e.target.files);
    }
    // reset input value so re-uploading same file triggers change
    e.target.value = '';
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadImages(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur px-3 md:px-5 flex items-center justify-between z-20 shrink-0 gap-2">
      {/* Brand & Stats */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white font-bold">
          <Clapperboard className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-black tracking-tight bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              HAMA PRO EDITING
            </h1>
            <span className="hidden sm:inline-flex text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
              PRO
            </span>
            {equalizerEnabled && (
              <span className="hidden xl:inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                <Activity className="w-3 h-3 animate-pulse" />
                EQ On
              </span>
            )}
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700/60">
              {slideCount} Slide
            </span>
          </div>
        </div>
      </div>

      {/* Center Quick Upload Actions */}
      <div className="flex items-center gap-2">
        {/* Hidden File Inputs */}
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*,video/webm,.webm"
          multiple
          onChange={handleAudioChange}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Upload Music Button */}
        <button
          onClick={() => audioInputRef.current?.click()}
          title="Unggah satu atau banyak file musik MP3/WAV/OGG/WEBM/M4A/FLAC"
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 border shadow-sm ${
            uploadedAudioName || trackCount > 0
              ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 hover:bg-purple-900/80'
              : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white border-purple-500/40'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-purple-300" />
          <span className="max-w-[130px] sm:max-w-[180px] truncate">
            {trackCount > 1
              ? `${trackCount} Lagu Tersambung`
              : uploadedAudioName
              ? `Lagu: ${uploadedAudioName}`
              : 'Unggah Musik'}
          </span>
          <Upload className="w-3 h-3 text-purple-300 ml-0.5 opacity-70" />
        </button>

        {/* Upload Multiple Images Button */}
        <button
          onClick={() => imageInputRef.current?.click()}
          title="Unggah banyak foto sekaligus untuk dijadikan slide video"
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-sm flex items-center gap-1.5 transition"
        >
          <ImagePlus className="w-3.5 h-3.5 text-indigo-200" />
          <span className="hidden sm:inline">Unggah Banyak Foto</span>
          <span className="sm:hidden">Foto</span>
        </button>

        {/* Auto-Edit Pro Button */}
        {onOpenAutoEdit && (
          <button
            onClick={onOpenAutoEdit}
            title="Auto-Edit Studio Pro: Sinkronkan slide ke ketukan musik, pangkas hening & leveling audio otomatis"
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">Auto-Edit Pro</span>
            <span className="md:hidden">Auto-Edit</span>
          </button>
        )}

        {/* Deploy Vercel Guide Button */}
        {onOpenVercelDeploy && (
          <button
            onClick={onOpenVercelDeploy}
            title="Panduan & Perintah Git untuk Deploy ke Vercel via GitHub"
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/80 shadow-sm flex items-center gap-1.5 transition"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Deploy Vercel</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Microphone Toggle for Live Visualizer test */}
        <button
          onClick={onToggleMic}
          title={micActive ? 'Matikan Mikrofon' : 'Aktifkan Mikrofon untuk Uji Suara Equalizer'}
          className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 border ${
            micActive
              ? 'bg-red-950/70 border-red-700/80 text-red-300 ring-2 ring-red-500/30 animate-pulse'
              : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 text-slate-300'
          }`}
        >
          {micActive ? <Mic className="w-3.5 h-3.5 text-red-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden lg:inline">{micActive ? 'Mic Aktif' : 'Tes Mic'}</span>
        </button>

        {/* Clear All Slides */}
        {slideCount > 0 && (
          <button
            onClick={onClearAll}
            title="Kosongkan semua slide untuk mulai baru"
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium bg-slate-800/80 hover:bg-red-950/50 hover:text-red-300 hover:border-red-700/50 text-slate-400 rounded-lg transition flex items-center gap-1.5 border border-slate-700/60"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kosongkan</span>
          </button>
        )}

        {/* Export Video */}
        <button
          onClick={onExport}
          disabled={isExporting || slideCount === 0}
          title={slideCount === 0 ? 'Tambahkan slide foto terlebih dahulu sebelum ekspor' : 'Ekspor video hasil gabungan slide & musik'}
          className="px-3.5 py-1.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ekspor Video</span>
          <span className="sm:hidden">Ekspor</span>
        </button>
      </div>
    </header>
  );
};
