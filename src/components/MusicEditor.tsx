import React, { useRef, useState } from 'react';
import {
  Music,
  Scissors,
  Gauge,
  Sliders,
  Volume2,
  UploadCloud,
  Check,
  RotateCcw,
  Layers,
  FileAudio,
  Play,
  Square,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Shuffle,
  AudioWaveform,
  Waves,
  Zap,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Link2,
  Download,
  Sparkles,
} from 'lucide-react';
import { BgmPreset, MusicEditConfig, AudioTrack, MusicTransitionType } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface MusicEditorProps {
  bgmPreset: BgmPreset;
  bgmVolume: number;
  sfxVolume: number;
  uploadedAudioName: string | null;
  musicEdit: MusicEditConfig;
  audioTracks: AudioTrack[];
  transitionType: MusicTransitionType;
  transitionDuration: number;
  slideCount: number;
  autoMatchMusicDuration?: boolean;
  effectiveMusicDuration?: number;
  currentSlideDuration?: number;
  onToggleAutoMatchMusicDuration?: () => void;
  onUpdateBgmPreset: (preset: BgmPreset) => void;
  onUpdateBgmVolume: (vol: number) => void;
  onUpdateSfxVolume: (vol: number) => void;
  onUpdateMusicEdit: (config: Partial<MusicEditConfig>) => void;
  onUploadAudio?: (file: File) => void;
  onUploadAudios: (files: FileList | File[], append?: boolean) => void;
  onRemoveTrack: (trackId: string) => void;
  onReorderTracks: (fromIdx: number, toIdx: number) => void;
  onUpdateTrack: (trackId: string, updates: Partial<AudioTrack>) => void;
  onChangeTransition: (type: MusicTransitionType, duration: number) => void;
  onAutoSyncSlidesToMusic: () => void;
  onClearAllTracks: () => void;
  onOpenAutoEdit?: () => void;
  onMergeTracks?: () => void;
  onDownloadMergedAudio?: () => void;
}

export const MusicEditor: React.FC<MusicEditorProps> = ({
  bgmPreset,
  bgmVolume,
  sfxVolume,
  uploadedAudioName,
  musicEdit,
  audioTracks,
  transitionType,
  transitionDuration,
  slideCount,
  autoMatchMusicDuration = true,
  effectiveMusicDuration,
  currentSlideDuration = 4.0,
  onToggleAutoMatchMusicDuration,
  onUpdateBgmPreset,
  onUpdateBgmVolume,
  onUpdateSfxVolume,
  onUpdateMusicEdit,
  onUploadAudios,
  onRemoveTrack,
  onReorderTracks,
  onUpdateTrack,
  onChangeTransition,
  onAutoSyncSlidesToMusic,
  onClearAllTracks,
  onOpenAutoEdit,
  onMergeTracks,
  onDownloadMergedAudio,
}) => {
  const replaceFilesInputRef = useRef<HTMLInputElement>(null);
  const appendFilesInputRef = useRef<HTMLInputElement>(null);

  // Local state for single track preview
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  // Expand/collapse trimming controls for specific track
  const [expandedTrimTrackId, setExpandedTrimTrackId] = useState<string | null>(null);

  const handleToggleTrackPreview = (trackId: string) => {
    if (previewingTrackId === trackId) {
      audioEngine.stopTrackPreview();
      setPreviewingTrackId(null);
    } else {
      audioEngine.playTrackPreview(trackId);
      setPreviewingTrackId(trackId);
    }
  };

  const handleReplaceFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadAudios(e.target.files, false);
    }
    e.target.value = '';
  };

  const handleAppendFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadAudios(e.target.files, true);
    }
    e.target.value = '';
  };

  const totalAudioLength =
    musicEdit.totalAudioDuration || (bgmPreset === 'upload' ? 30 : 24);

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5];
  const transitionPresets = [1.0, 2.0, 2.5, 3.5, 5.0];

  const transitionDefinitions: {
    type: MusicTransitionType;
    label: string;
    badge: string;
    description: string;
    color: string;
  }[] = [
    {
      type: 'crossfade',
      label: 'Crossfade Halus (Equal Power)',
      badge: 'Rekomendasi',
      description:
        'Lagu pertama memudar keluar secara mulus sementara lagu berikutnya memudar masuk, menjaga kekerasan suara tetap seimbang tanpa hening.',
      color: 'from-cyan-500 to-indigo-500',
    },
    {
      type: 'linearCrossfade',
      label: 'Crossfade Linier',
      badge: 'Klasik',
      description:
        'Pencampuran volume silang bertahap secara linier antara dua lagu yang bersambung.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      type: 'dipToSilence',
      label: 'Dip to Silence (Hening Sejenak)',
      badge: 'Dramatic',
      description:
        'Lagu pertama perlahan meredup hingga hening, ada jeda hening sejenak, lalu lagu kedua perlahan naik.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      type: 'whoosh',
      label: 'Whoosh DJ Transition (Sapuan Modern)',
      badge: 'DJ Effect',
      description:
        'Crossfade disertai efek sapuan angin / filter sweep modern di titik pergantian lagu.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      type: 'cut',
      label: 'Potongan Cepat (Gapless Beat Cut)',
      badge: 'Instant',
      description:
        'Lagu kedua langsung menyala seketika di akhir lagu pertama tanpa jeda ataupun tumpang tindih.',
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Hidden Audio File Inputs */}
      <input
        ref={replaceFilesInputRef}
        type="file"
        accept="audio/*,video/webm,.webm"
        multiple
        onChange={handleReplaceFiles}
        className="hidden"
      />
      <input
        ref={appendFilesInputRef}
        type="file"
        accept="audio/*,video/webm,.webm"
        multiple
        onChange={handleAppendFiles}
        className="hidden"
      />

      {/* Hero Upload & Multi-Track Manager Card */}
      <div className="bg-gradient-to-br from-purple-950/90 via-slate-900 to-indigo-950/80 p-4 rounded-xl border border-purple-500/40 shadow-xl shadow-purple-950/30 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                Unggah Banyak Musik & Penyambungan
              </h3>
              <p className="text-[11px] text-purple-200/80">
                Pilih beberapa file lagu untuk digabungkan dengan transisi
              </p>
            </div>
          </div>
          {audioTracks.length > 0 && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
              <Check className="w-3 h-3" />
              {audioTracks.length} Lagu
            </span>
          )}
        </div>

        {/* Action Buttons to Upload / Add Tracks */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => replaceFilesInputRef.current?.click()}
            className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{audioTracks.length > 0 ? 'Ganti Semua Lagu' : 'Pilih Banyak Lagu'}</span>
          </button>

          <button
            onClick={() => appendFilesInputRef.current?.click()}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-purple-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-purple-500/30"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>+ Tambah Lagu Lain</span>
          </button>
        </div>

        {/* Notice of formats */}
        <div className="text-[10px] text-purple-300/70 text-center">
          Mendukung pemilihan banyak file sekaligus (MP3, WAV, OGG, WEBM, M4A, FLAC)
        </div>
      </div>

      {/* Auto-Edit Studio Pro Banner */}
      {onOpenAutoEdit && (
        <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/50 to-indigo-950/40 border border-indigo-500/40 rounded-xl p-3 flex items-center justify-between gap-3 shadow-md shadow-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-indigo-500 rounded-lg text-white shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Auto-Edit Studio Pro</span>
                <span className="text-[9px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                  AI Beats
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Deteksi BPM, potong hening, leveling volume, & sinkronkan slide ke ketukan drum musik
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAutoEdit}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer"
          >
            <span>Buka Auto-Edit</span>
          </button>
        </div>
      )}

      {/* AUTO-FIT DURASI VIDEO KE MUSIK (REAL-TIME SYNC) */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg border ${autoMatchMusicDuration ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Durasi Video Sesuai Musik Otomatis</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${autoMatchMusicDuration ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {autoMatchMusicDuration ? '100% TERKUNCI' : 'MANUAL'}
                </span>
              </h4>
              <p className="text-[10px] text-emerald-200/75">
                Video dan slide dihitung otomatis agar video selesai tepat di ketukan terakhir musik
              </p>
            </div>
          </div>

          {onToggleAutoMatchMusicDuration && (
            <button
              onClick={onToggleAutoMatchMusicDuration}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                autoMatchMusicDuration
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {autoMatchMusicDuration ? 'Otomatis: AKTIF' : 'Otomatis: OFF'}
            </button>
          )}
        </div>

        {/* Calculation Pill Badges */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-black/40 p-2 rounded-lg border border-slate-800">
          <div>
            <span className="text-slate-400 block">Total Musik</span>
            <span className="text-cyan-300 font-mono font-bold text-xs">
              {(effectiveMusicDuration || totalAudioLength).toFixed(1)}s
            </span>
          </div>
          <div className="border-x border-slate-800">
            <span className="text-slate-400 block">Jumlah Slide</span>
            <span className="text-white font-mono font-bold text-xs">{slideCount} Foto</span>
          </div>
          <div>
            <span className="text-slate-400 block">Durasi / Slide</span>
            <span className="text-emerald-400 font-mono font-bold text-xs">{currentSlideDuration.toFixed(2)}s</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Setiap Anda menambah/menghapus lagu atau foto, durasi video otomatis menyesuaikan.</span>
          <button
            onClick={onAutoSyncSlidesToMusic}
            className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 font-medium transition cursor-pointer"
          >
            Sinkronkan Ulang
          </button>
        </div>
      </div>

      {/* Playlist Tracks & Transition Connector Section */}
      {audioTracks.length > 0 ? (
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
          {/* GABUNGKAN SEMUA LAGU (AUDIO MERGER HERO CARD) */}
          <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-slate-900 border border-purple-500/40 rounded-xl p-3 flex flex-col gap-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Gabungkan Musik (Audio Merger)</span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-500/50 px-1.5 py-0.2 rounded font-mono font-bold">
                      {audioTracks.length} Lagu
                    </span>
                  </h4>
                  <p className="text-[10px] text-purple-200/75">
                    Satukan seluruh trek & transisi ke dalam 1 file lagu komposit tunggal
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-cyan-300 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                {formatAudioTime(totalAudioLength)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {onMergeTracks && (
                <button
                  onClick={onMergeTracks}
                  title="Gabungkan semua trek menjadi 1 lagu tunggal di timeline"
                  className="py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-600/25 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Gabung Jadi 1 Lagu Master</span>
                </button>
              )}

              {onDownloadMergedAudio && (
                <button
                  onClick={onDownloadMergedAudio}
                  title="Unduh hasil penggabungan audio dalam format WAV 16-bit PCM kualitas tinggi"
                  className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 rounded-lg text-xs font-bold border border-cyan-500/40 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Unduh Lagu Gabungan (.WAV)</span>
                </button>
              )}
            </div>

            <div className="text-[9.5px] text-slate-400 flex items-center gap-1.5 bg-black/40 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                Format WebM, MP3, WAV, OGG, & M4A didukung dan akan digabung mulus dengan efek transisi {transitionType}.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200">
                Urutan Playlist ({audioTracks.length} Lagu)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-2 py-0.5 rounded">
                Total: {formatAudioTime(totalAudioLength)} ({totalAudioLength.toFixed(1)}s)
              </span>
              <button
                onClick={onClearAllTracks}
                title="Hapus semua lagu dalam playlist"
                className="text-slate-500 hover:text-red-400 p-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Sequential Track List with Connectors */}
          <div className="flex flex-col gap-2.5">
            {audioTracks.map((track, idx) => {
              const isPreviewing = previewingTrackId === track.id;
              const isExpandedTrim = expandedTrimTrackId === track.id;
              const trackDur = Math.max(0.1, track.trimEnd - track.trimStart);

              return (
                <React.Fragment key={track.id}>
                  {/* Track Card */}
                  <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 hover:border-slate-700 transition flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate max-w-[160px] sm:max-w-[200px]">
                            {track.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Durasi: {formatAudioTime(trackDur)} / Asli: {formatAudioTime(track.duration)}
                          </p>
                        </div>
                      </div>

                      {/* Right Action Tools: Solo Preview, Reorder, Trim Toggle, Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Solo Preview Button */}
                        <button
                          onClick={() => handleToggleTrackPreview(track.id)}
                          title={isPreviewing ? 'Stop dengarkan lagu ini' : 'Dengarkan lagu ini saja (Solo)'}
                          className={`p-1.5 rounded text-xs transition flex items-center gap-1 ${
                            isPreviewing
                              ? 'bg-cyan-600 text-white animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isPreviewing ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </button>

                        {/* Toggle Trim Panel */}
                        <button
                          onClick={() =>
                            setExpandedTrimTrackId(isExpandedTrim ? null : track.id)
                          }
                          title="Atur potongan (Trim) untuk lagu ini"
                          className={`p-1.5 rounded text-xs transition ${
                            isExpandedTrim
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Scissors className="w-3 h-3" />
                        </button>

                        {/* Move Up */}
                        <button
                          onClick={() => onReorderTracks(idx, idx - 1)}
                          disabled={idx === 0}
                          title="Geser urutan ke atas"
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => onReorderTracks(idx, idx + 1)}
                          disabled={idx === audioTracks.length - 1}
                          title="Geser urutan ke bawah"
                          className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>

                        {/* Delete Track */}
                        <button
                          onClick={() => onRemoveTrack(track.id)}
                          title="Hapus lagu ini dari playlist"
                          className="p-1 rounded text-slate-500 hover:text-red-400 transition ml-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Per-Track Volume Slider */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                      <Volume2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="w-16 shrink-0">Volume Lagu:</span>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={track.volume ?? 1.0}
                        onChange={(e) =>
                          onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })
                        }
                        className="flex-1 accent-indigo-500 cursor-pointer h-1 bg-slate-800"
                      />
                      <span className="font-mono text-indigo-300 font-bold w-10 text-right">
                        {Math.round((track.volume ?? 1.0) * 100)}%
                      </span>
                    </div>

                    {/* Expanded Trim Panel for this Track */}
                    {isExpandedTrim && (
                      <div className="bg-slate-950/90 rounded-lg p-2.5 border border-purple-500/30 flex flex-col gap-2 mt-1 animate-in fade-in">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                          <span>Potong Lagu #{idx + 1}</span>
                          <span className="font-mono text-purple-200">
                            Diputar: {trackDur.toFixed(1)}s
                          </span>
                        </div>

                        {/* Mini Waveform Display */}
                        <div className="h-8 bg-slate-900 rounded flex items-center px-1 gap-[2px] overflow-hidden">
                          {track.peaks.map((pk, pidx) => {
                            const pointSec = (pidx / track.peaks.length) * track.duration;
                            const isWithin =
                              pointSec >= track.trimStart && pointSec <= track.trimEnd;
                            return (
                              <div
                                key={pidx}
                                className={`flex-1 rounded-full ${
                                  isWithin ? 'bg-purple-400' : 'bg-slate-800 opacity-40'
                                }`}
                                style={{ height: `${Math.max(15, pk * 100)}%` }}
                              />
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                              <span>Mulai:</span>
                              <span className="font-mono text-cyan-300">
                                {track.trimStart.toFixed(1)}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max={Math.max(0.5, track.duration - 0.5)}
                              step="0.5"
                              value={track.trimStart}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val < track.trimEnd) {
                                  onUpdateTrack(track.id, { trimStart: val });
                                }
                              }}
                              className="w-full accent-cyan-400 cursor-pointer h-1"
                            />
                          </div>
                          <div>
                            <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                              <span>Selesai:</span>
                              <span className="font-mono text-purple-300">
                                {track.trimEnd.toFixed(1)}s
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max={track.duration}
                              step="0.5"
                              value={track.trimEnd}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > track.trimStart) {
                                  onUpdateTrack(track.id, { trimEnd: val });
                                }
                              }}
                              className="w-full accent-purple-400 cursor-pointer h-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transition Connector between Track i and Track i+1 */}
                  {idx < audioTracks.length - 1 && (
                    <div className="relative py-1 flex items-center justify-center">
                      <div className="absolute inset-x-4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
                      <div className="relative z-10 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/50 shadow-md text-[10px] text-cyan-300 flex items-center gap-1.5 font-medium">
                        <Waves className="w-3 h-3 text-cyan-400 animate-pulse" />
                        <span>
                          Transisi #{idx + 1} ➜ #{idx + 2}:{' '}
                          <strong className="text-white">
                            {transitionType === 'crossfade'
                              ? 'Crossfade Halus'
                              : transitionType === 'linearCrossfade'
                              ? 'Crossfade Linier'
                              : transitionType === 'dipToSilence'
                              ? 'Dip to Silence'
                              : transitionType === 'whoosh'
                              ? 'Whoosh DJ'
                              : 'Potongan Langsung'}{' '}
                            ({transitionDuration}s)
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Transition Configuration Panel */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-500/30 flex flex-col gap-3 shadow-lg shadow-cyan-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300">
              <Waves className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white">
              Penyambungan Musik & Efek Transisi
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/40 px-2 py-0.5 rounded-full font-bold">
            {transitionDuration}s Overlap
          </span>
        </div>

        {/* Transition Style Selector Cards */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-300 block">
            Gaya Transisi Penyambungan:
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {transitionDefinitions.map((item) => {
              const isSelected = transitionType === item.type;
              return (
                <button
                  key={item.type}
                  onClick={() => onChangeTransition(item.type, transitionDuration)}
                  className={`text-left p-2.5 rounded-lg border transition flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/90 to-indigo-950/90 border-cyan-500/80 shadow-md ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold flex items-center gap-1.5 ${
                        isSelected ? 'text-cyan-300' : 'text-slate-200'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        isSelected
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {item.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Transition Duration Slider */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-300 font-semibold">
              Durasi Transisi (Waktu Sambungan):
            </span>
            <span className="font-mono text-cyan-400 font-bold text-xs">
              {transitionDuration.toFixed(1)} Detik
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.25"
            value={transitionDuration}
            onChange={(e) => onChangeTransition(transitionType, parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded"
          />

          {/* Quick Preset Buttons */}
          <div className="flex items-center justify-between gap-1">
            {transitionPresets.map((dur) => (
              <button
                key={dur}
                onClick={() => onChangeTransition(transitionType, dur)}
                className={`flex-1 py-1 text-[10px] font-mono rounded transition border ${
                  Math.abs(transitionDuration - dur) < 0.1
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {dur}s
              </button>
            ))}
          </div>
        </div>

        {/* Visual Diagram of Transition Overlap */}
        <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 flex flex-col gap-1.5">
          <span className="text-[10px] text-slate-400 font-medium">
            Visualisasi Sambungan Transisi ({transitionDuration}s):
          </span>
          <div className="relative h-12 bg-slate-950 rounded overflow-hidden flex items-center px-3 border border-slate-800">
            {/* Track A falling line */}
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 200 40">
              <path
                d="M 10 10 L 100 10 Q 130 10 150 35 L 150 40 L 10 40 Z"
                fill="rgba(6, 182, 212, 0.15)"
              />
              <path
                d="M 10 10 L 100 10 Q 130 10 150 35"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
              />
              {/* Track B rising line */}
              <path
                d="M 80 40 Q 100 15 130 10 L 190 10 L 190 40 Z"
                fill="rgba(168, 85, 247, 0.15)"
              />
              <path
                d="M 80 35 Q 100 15 130 10 L 190 10"
                fill="none"
                stroke="#c084fc"
                strokeWidth="2"
              />
              {/* Overlap Window vertical guides */}
              <line x1="80" y1="0" x2="80" y2="40" stroke="#475569" strokeDasharray="2,2" />
              <line x1="150" y1="0" x2="150" y2="40" stroke="#475569" strokeDasharray="2,2" />
              <text x="18" y="24" fill="#06b6d4" fontSize="8" fontWeight="bold">
                Lagu #1
              </text>
              <text x="156" y="24" fill="#c084fc" fontSize="8" fontWeight="bold">
                Lagu #2
              </text>
              <text x="96" y="24" fill="#e2e8f0" fontSize="8" fontWeight="bold">
                Transisi
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* Sync Slide Duration to Combined Audio */}
      <button
        onClick={onAutoSyncSlidesToMusic}
        className="w-full py-2.5 px-3 bg-gradient-to-r from-cyan-600/30 via-indigo-600/30 to-purple-600/30 hover:from-cyan-600/50 hover:to-purple-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>
          Bagi Rata Durasi {slideCount} Slide ke Total Musik ({totalAudioLength.toFixed(1)}s)
        </span>
      </button>

      {/* Preset Music Selector (Alternative for instant background synth) */}
      <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Pilihan Soundtrack Lain (Synthesizer AI)
        </label>
        <select
          value={bgmPreset}
          onChange={(e) => onUpdateBgmPreset(e.target.value as BgmPreset)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="upload">
            {audioTracks.length > 0
              ? `Playlist Unggahan (${audioTracks.length} Lagu Tersambung)`
              : uploadedAudioName
              ? `File Unggahan: ${uploadedAudioName}`
              : 'Playlist File Unggahan (MP3/WAV)'}
          </option>
          <option value="lofi">Lo-Fi Harmonic Rhodes (Auto Synth)</option>
          <option value="acoustic">Upbeat Melodic Acoustic (Auto Synth)</option>
          <option value="cinematic">Deep Atmospheric Tone (Auto Synth)</option>
          <option value="cyberpunk">Cyberpunk Synthwave Bass (Auto Synth)</option>
        </select>
      </div>

      {/* Combined Waveform Display */}
      {musicEdit.waveformPeaks.length > 0 && (
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <AudioWaveform className="w-3.5 h-3.5 text-indigo-400" />
              Gelombang Audio Gabungan
            </span>
            <span className="text-[10px] font-mono text-indigo-300">
              {formatAudioTime(totalAudioLength)}
            </span>
          </div>

          <div className="h-14 bg-slate-900/90 rounded-lg overflow-hidden border border-slate-800 flex items-center px-2">
            <div className="w-full h-10 flex items-center justify-between gap-[2px]">
              {musicEdit.waveformPeaks.map((p, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-full bg-gradient-to-t from-indigo-500 to-cyan-400 opacity-80"
                  style={{ height: `${Math.max(12, Math.round(p * 100))}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3-Band Equalizer (Bass, Mid, Treble) */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Equalizer Nada Master (Tone EQ)
          </span>
          <button
            onClick={() => onUpdateMusicEdit({ bassBoost: 0, midGain: 0, trebleBoost: 0 })}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Reset EQ
          </button>
        </div>

        {/* 3 Sliders Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Bass */}
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Bass (Low)</span>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={musicEdit.bassBoost}
              onChange={(e) => onUpdateMusicEdit({ bassBoost: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-indigo-300 mt-1 block">
              {musicEdit.bassBoost > 0 ? `+${musicEdit.bassBoost}` : musicEdit.bassBoost} dB
            </span>
          </div>

          {/* Mid */}
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Mid (Vokal)</span>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={musicEdit.midGain}
              onChange={(e) => onUpdateMusicEdit({ midGain: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-cyan-300 mt-1 block">
              {musicEdit.midGain > 0 ? `+${musicEdit.midGain}` : musicEdit.midGain} dB
            </span>
          </div>

          {/* Treble */}
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-1">Treble (High)</span>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={musicEdit.trebleBoost}
              onChange={(e) => onUpdateMusicEdit({ trebleBoost: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-purple-300 mt-1 block">
              {musicEdit.trebleBoost > 0 ? `+${musicEdit.trebleBoost}` : musicEdit.trebleBoost} dB
            </span>
          </div>
        </div>
      </div>

      {/* Speed & Tempo */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            Kecepatan & Tempo (Playback Speed)
          </span>
          <span className="text-[10px] font-mono text-amber-400 font-bold">
            {musicEdit.playbackRate}x
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {speedOptions.map((rate) => (
            <button
              key={rate}
              onClick={() => onUpdateMusicEdit({ playbackRate: rate })}
              className={`py-1.5 text-xs font-medium rounded-lg transition border ${
                musicEdit.playbackRate === rate
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Volume & Fade Transition */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          Volume Master BGM
        </span>

        <div className="flex flex-col gap-2.5">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Volume Master</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.round(bgmVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgmVolume}
              onChange={(e) => onUpdateBgmVolume(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
