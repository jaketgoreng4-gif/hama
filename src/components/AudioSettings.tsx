import React, { useRef } from 'react';
import { Music, Clock, UploadCloud, Volume2, Sparkles, Mic, MicOff, Info, Zap, CheckCircle2 } from 'lucide-react';
import { BgmPreset } from '../types';

interface AudioSettingsProps {
  slideDuration: number;
  transitionDuration: number;
  bgmPreset: BgmPreset;
  bgmVolume: number;
  sfxVolume: number;
  uploadedAudioName: string | null;
  micActive: boolean;
  autoMatchMusicDuration?: boolean;
  effectiveMusicDuration?: number;
  slideCount?: number;
  onToggleAutoMatchMusicDuration?: () => void;
  onAutoSyncWithMusic?: () => void;
  onUpdateSlideDuration: (val: number) => void;
  onUpdateTransitionDuration: (val: number) => void;
  onUpdateBgmPreset: (val: BgmPreset) => void;
  onUpdateBgmVolume: (val: number) => void;
  onUpdateSfxVolume: (val: number) => void;
  onUploadAudio: (file: File) => void;
  onToggleMic: () => void;
}

export const AudioSettings: React.FC<AudioSettingsProps> = ({
  slideDuration,
  transitionDuration,
  bgmPreset,
  bgmVolume,
  sfxVolume,
  uploadedAudioName,
  micActive,
  autoMatchMusicDuration = true,
  effectiveMusicDuration = 30,
  slideCount = 0,
  onToggleAutoMatchMusicDuration,
  onAutoSyncWithMusic,
  onUpdateSlideDuration,
  onUpdateTransitionDuration,
  onUpdateBgmPreset,
  onUpdateBgmVolume,
  onUpdateSfxVolume,
  onUploadAudio,
  onToggleMic,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadAudio(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Auto-Fit Video to Music Duration Control */}
      <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${autoMatchMusicDuration ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Sesuaikan Durasi Video ke Musik</span>
                <span className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ${autoMatchMusicDuration ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {autoMatchMusicDuration ? 'OTOMATIS AKTIF' : 'MANUAL'}
                </span>
              </span>
              <p className="text-[10px] text-slate-400">
                Durasi video dan tiap slide dihitung otomatis agar video selesai tepat saat musik berakhir
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
              {autoMatchMusicDuration ? 'Otomatis: ON' : 'Otomatis: OFF'}
            </button>
          )}
        </div>

        {/* Live Calculation Info Box */}
        {autoMatchMusicDuration ? (
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Durasi Video 100% Pas dengan Musik
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                {effectiveMusicDuration.toFixed(1)}s
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">Panjang Musik</span>
                <span className="text-cyan-400 font-mono font-bold text-xs">{effectiveMusicDuration.toFixed(1)}s</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-slate-400 block">Jumlah Slide</span>
                <span className="text-white font-mono font-bold text-xs">{slideCount} Foto</span>
              </div>
              <div>
                <span className="text-slate-400 block">Durasi / Slide</span>
                <span className="text-emerald-400 font-mono font-bold text-xs">{slideDuration.toFixed(2)}s</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-300/80">
                Setiap menambah/menghapus foto, durasi per slide otomatis disesuaikan ulang.
              </span>
              {onAutoSyncWithMusic && (
                <button
                  onClick={onAutoSyncWithMusic}
                  className="px-2 py-0.5 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 text-[10px] font-medium transition cursor-pointer"
                >
                  Sinkronkan Ulang
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Mode manual aktif. Gunakan slider di bawah untuk mengatur durasi per slide.</span>
            {onToggleAutoMatchMusicDuration && (
              <button
                onClick={onToggleAutoMatchMusicDuration}
                className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-[10px]"
              >
                Kembalikan ke Otomatis
              </button>
            )}
          </div>
        )}

        {/* Manual Duration per Slide Slider */}
        <div className={`pt-2 border-t border-slate-800/80 ${autoMatchMusicDuration ? 'opacity-70' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Durasi Per Slide {autoMatchMusicDuration ? '(Otomatis)' : '(Manual)'}
            </span>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
              {slideDuration.toFixed(2)}s
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="12"
            step="0.1"
            value={slideDuration}
            disabled={autoMatchMusicDuration}
            onChange={(e) => onUpdateSlideDuration(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>0.5s (Cepat)</span>
            {autoMatchMusicDuration && (
              <span className="text-emerald-400 font-medium">Terkunci otomatis ke durasi musik</span>
            )}
            <span>12.0s (Lama)</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-300">Durasi Transisi Gambar</div>
              <div className="text-[10px] text-slate-500">Panjang efek lintas gambar</div>
            </div>
            <select
              value={transitionDuration}
              onChange={(e) => onUpdateTransitionDuration(parseFloat(e.target.value))}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="0.4">0.4s (Sangat Cepat)</option>
              <option value="0.6">0.6s (Cepat)</option>
              <option value="0.8">0.8s (Standar Halus)</option>
              <option value="1.2">1.2s (Sinematik Panjang)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Background Music Synthesizer & Upload */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            Musik Latar (BGM)
          </span>
          <span className="text-[10px] bg-emerald-950/70 border border-emerald-800/50 text-emerald-400 px-2 py-0.5 rounded">
            {bgmPreset === 'upload' && uploadedAudioName ? 'File Khusus' : 'Synthesizer Aktif'}
          </span>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Preset Musik Harmoni</label>
          <select
            value={bgmPreset}
            onChange={(e) => onUpdateBgmPreset(e.target.value as BgmPreset)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="lofi">Lo-Fi Harmonic Rhodes (Auto Synth)</option>
            <option value="acoustic">Upbeat Melodic Pulse (Auto Synth)</option>
            <option value="cinematic">Deep Atmospheric Tone (Auto Synth)</option>
            <option value="cyberpunk">Cyberpunk Synthwave Bass (Auto Synth)</option>
            <option value="upload">Unggah File Audio Sendiri (MP3 / WAV)...</option>
          </select>
        </div>

        {bgmPreset === 'upload' && (
          <div className="pt-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-indigo-500/50 hover:border-indigo-400 p-3 rounded-lg text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 transition bg-indigo-950/20 hover:bg-indigo-950/30"
            >
              <UploadCloud className="w-5 h-5 text-indigo-400" />
              <span className="text-xs text-indigo-200 font-medium">
                {uploadedAudioName ? uploadedAudioName : 'Pilih File MP3, WAV, OGG, atau WEBM'}
              </span>
              <span className="text-[10px] text-slate-500">Klik untuk menjelajahi file audio lokal</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/webm,.webm"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* BGM Volume Slider */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
              Volume Musik Latar
            </span>
            <span className="text-[10px] font-mono text-slate-400">{Math.round(bgmVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bgmVolume}
            onChange={(e) => onUpdateBgmVolume(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        {/* SFX Volume Slider */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Volume Efek Suara (SFX Transisi)
            </span>
            <span className="text-[10px] font-mono text-slate-400">{Math.round(sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sfxVolume}
            onChange={(e) => onUpdateSfxVolume(parseFloat(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>
      </div>

      {/* Live Microphone Test for Equalizer */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${micActive ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Mikrofon Langsung</div>
            <div className="text-[10px] text-slate-400">
              {micActive ? 'Uji suara mic langsung menari di visualizer' : 'Uji respons vokal/suara di visualizer'}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleMic}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            micActive
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {micActive ? 'Matikan Mic' : 'Aktifkan Mic'}
        </button>
      </div>

      {/* Sync tip */}
      <div className="text-[11px] text-slate-400 bg-indigo-950/20 p-3 rounded-xl border border-indigo-900/30 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong>Auto-Sync & Fade Audio:</strong> Musik secara cerdas memudar (fade in 1.2s) di awal dan melembut (fade out 2.0s) di akhir slide terakhir.
        </span>
      </div>
    </div>
  );
};
