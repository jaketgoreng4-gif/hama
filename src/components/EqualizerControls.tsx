import React, { useState } from 'react';
import {
  Activity,
  BarChart2,
  Waves,
  Disc,
  Split,
  Sparkles,
  Zap,
  Sliders,
  Flame,
  Radio,
  Eye,
  Film,
  Layers,
  RotateCcw,
} from 'lucide-react';
import {
  EqualizerConfig,
  EqualizerStyle,
  EqualizerTheme,
  EqualizerPosition,
  AudioReactiveVideoFx,
} from '../types';

interface EqualizerControlsProps {
  config: EqualizerConfig;
  onChange: (updated: Partial<EqualizerConfig>) => void;
  audioFx?: AudioReactiveVideoFx;
  onUpdateAudioFx?: (updated: Partial<AudioReactiveVideoFx>) => void;
  currentSlideImageSrc?: string;
}

export const EqualizerControls: React.FC<EqualizerControlsProps> = ({
  config,
  onChange,
  audioFx,
  onUpdateAudioFx,
  currentSlideImageSrc,
}) => {
  const [subTab, setSubTab] = useState<'videoFx' | 'equalizer'>('videoFx');
  const styles: { id: EqualizerStyle; label: string; icon: React.ReactNode; desc: string; badge?: string }[] = [
    {
      id: 'circular-liquid',
      label: 'Liquid Melingkar (Fluid)',
      icon: <Disc className="w-4 h-4 text-pink-400" />,
      desc: 'Cincin cairan organik meliuk dan berdenyut mengikuti spektrum frekuensi',
      badge: 'PRO LIQUID',
    },
    {
      id: 'liquid-wave',
      label: 'Liquid Wave Mengalir',
      icon: <Waves className="w-4 h-4 text-cyan-400" />,
      desc: 'Gelombang cairan halus berlapis mengalir di kanvas secara dinamis',
      badge: 'LIQUID',
    },
    {
      id: 'circular-bars',
      label: 'Radial Ring Spektrum',
      icon: <Disc className="w-4 h-4 text-amber-400" />,
      desc: 'Spektrum batang melingkar mengelilingi lingkaran tengah',
      badge: 'MELINGKAR',
    },
    {
      id: 'circular-neon-ring',
      label: 'Double Neon Orbit',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
      desc: 'Dua orbit cincin neon bersinar berputar di sekeliling foto',
      badge: 'NEON',
    },
    {
      id: 'vinyl-disc',
      label: 'Vinyl Turntable Meja Putar',
      icon: <Disc className="w-4 h-4 text-indigo-400" />,
      desc: 'Piringan hitam klasik berputar dengan alur audio & logo/gambar tengah',
      badge: 'RETRO',
    },
    {
      id: 'particle-orbit',
      label: 'Orbit Partikel Bintang',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      desc: 'Partikel starlight menari dan meluas mengelilingi lingkaran foto',
      badge: 'ORBIT',
    },
    {
      id: 'cyber-radial',
      label: 'Cyberpunk HUD Radial',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      desc: 'Instrumen gauge radial futuristik sci-fi dengan jarum & telemetry audio',
      badge: 'CYBER',
    },
    {
      id: 'circular',
      label: 'Radial Melingkar (Spikes)',
      icon: <Disc className="w-4 h-4 text-indigo-400" />,
      desc: 'Cincin frekuensi melingkar klasik seperti portal musik',
      badge: 'MELINGKAR',
    },
    {
      id: 'bars',
      label: 'Batang Spektrum',
      icon: <BarChart2 className="w-4 h-4" />,
      desc: 'Grafis spektrum batang dengan indikator puncak (peak caps)',
    },
    {
      id: 'waveform',
      label: 'Gelombang Neon',
      icon: <Waves className="w-4 h-4" />,
      desc: 'Oskiloskop pita gelombang audio dinamis yang bercahaya',
    },
    {
      id: 'mirror',
      label: 'Pantulan Simetris',
      icon: <Split className="w-4 h-4" />,
      desc: 'Batang spektrum terbagi dua ke atas dan ke bawah',
    },
    {
      id: 'dots',
      label: 'Matrix LED Beads',
      icon: <Sparkles className="w-4 h-4" />,
      desc: 'Titik-titik partikel LED audio mengambang dengan ritme beat',
    },
  ];

  const themes: { id: EqualizerTheme; label: string; preview: string }[] = [
    { id: 'cyan-neon', label: 'Cyan & Indigo Neon', preview: 'from-cyan-400 to-indigo-600' },
    { id: 'rainbow', label: 'Rainbow Spectrum', preview: 'from-pink-500 via-amber-400 to-emerald-400' },
    { id: 'fire-amber', label: 'Fire & Ember', preview: 'from-amber-300 via-orange-500 to-red-600' },
    { id: 'emerald', label: 'Emerald Matrix', preview: 'from-lime-400 via-emerald-500 to-cyan-500' },
    { id: 'purple-magenta', label: 'Cyberpunk Magenta', preview: 'from-purple-400 via-fuchsia-500 to-pink-600' },
    { id: 'white-glow', label: 'Pure White Glow', preview: 'from-white via-slate-200 to-indigo-200' },
  ];

  const positions: { id: EqualizerPosition; label: string }[] = [
    { id: 'bottom', label: 'Bawah Kanvas (Standar)' },
    { id: 'center', label: 'Tengah Layar (Hero)' },
    { id: 'top', label: 'Atas Kanvas' },
    { id: 'radial-center', label: 'Pusat Radial' },
  ];

  const applyPreset = (preset: 'podcast' | 'cyberpunk' | 'ambient' | 'classic') => {
    switch (preset) {
      case 'podcast':
        onChange({
          enabled: true,
          style: 'waveform',
          theme: 'cyan-neon',
          position: 'bottom',
          height: 90,
          sensitivity: 1.2,
          glow: true,
          beatPulse: false,
        });
        break;
      case 'cyberpunk':
        onChange({
          enabled: true,
          style: 'bars',
          theme: 'purple-magenta',
          position: 'bottom',
          barCount: 48,
          height: 140,
          sensitivity: 1.6,
          glow: true,
          showPeakCaps: true,
          beatPulse: true,
        });
        break;
      case 'ambient':
        onChange({
          enabled: true,
          style: 'circular',
          theme: 'emerald',
          position: 'center',
          height: 110,
          sensitivity: 1.1,
          glow: true,
          beatPulse: true,
        });
        break;
      case 'classic':
        onChange({
          enabled: true,
          style: 'mirror',
          theme: 'fire-amber',
          position: 'bottom',
          barCount: 36,
          height: 120,
          sensitivity: 1.3,
          glow: false,
          showPeakCaps: true,
          beatPulse: false,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-Navigation Switch between Audio-Reactive Video FX & Spectrum Equalizer */}
      <div className="flex p-1 bg-slate-950 border border-slate-800 rounded-xl">
        <button
          onClick={() => setSubTab('videoFx')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'videoFx'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>⚡ Efek Video Musik</span>
          {audioFx?.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setSubTab('equalizer')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'equalizer'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-300" />
          <span>🎛️ Equalizer Spektrum</span>
          {config.enabled && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ===================== TAB 1: AUDIO-REACTIVE VIDEO FX ===================== */}
      {subTab === 'videoFx' && (
        <div className="flex flex-col gap-3.5">
          {/* Master Enable Banner */}
          <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/60 p-3.5 rounded-xl border border-purple-500/40 flex items-center justify-between shadow-lg shadow-purple-950/30">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  audioFx?.enabled
                    ? 'bg-gradient-to-tr from-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  Efek Video Reaktif Musik
                  {audioFx?.enabled && (
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping inline-block" />
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Video bergerak, berdenyut, dan menyala otomatis mengikuti ketukan & bass musik
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={audioFx?.enabled ?? true}
                onChange={(e) => onUpdateAudioFx?.({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-600 peer-checked:to-pink-500"></div>
            </label>
          </div>

          {/* Quick FX Presets */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Preset Efek Video Musik
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  onUpdateAudioFx?.({
                    enabled: true,
                    bassPulseZoom: true,
                    bassShake: true,
                    beatFlash: true,
                    rgbSplit: true,
                    beatParticles: true,
                    vignettePulse: true,
                    intensity: 1.4,
                  })
                }
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 rounded-lg text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <Zap className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">TikTok / EDM Drop</div>
                  <div className="text-[9px] text-slate-500">Semua Efek & Bass Hentak 1.4x</div>
                </div>
              </button>

              <button
                onClick={() =>
                  onUpdateAudioFx?.({
                    enabled: true,
                    bassPulseZoom: true,
                    bassShake: false,
                    beatFlash: false,
                    rgbSplit: false,
                    beatParticles: true,
                    vignettePulse: true,
                    intensity: 0.8,
                  })
                }
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 rounded-lg text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <Film className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Sinematik Halus</div>
                  <div className="text-[9px] text-slate-500">Denyut Zoom & Partikel Elegan</div>
                </div>
              </button>

              <button
                onClick={() =>
                  onUpdateAudioFx?.({
                    enabled: true,
                    bassPulseZoom: true,
                    bassShake: true,
                    beatFlash: true,
                    rgbSplit: true,
                    beatParticles: false,
                    vignettePulse: false,
                    intensity: 1.2,
                  })
                }
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">Cyberpunk Glitch</div>
                  <div className="text-[9px] text-slate-500">RGB Split & Screen Shake</div>
                </div>
              </button>

              <button
                onClick={() =>
                  onUpdateAudioFx?.({
                    enabled: false,
                  })
                }
                className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-left transition flex items-center gap-2 group cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-300">Nonaktifkan Efek</div>
                  <div className="text-[9px] text-slate-500">Video Bergerak Standar</div>
                </div>
              </button>
            </div>
          </div>

          {/* Intensity Slider */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Intensitas Respons Efek Video</span>
              </span>
              <span className="font-mono text-pink-400 font-bold bg-pink-950/60 px-2 py-0.5 rounded border border-pink-800/40 text-[11px]">
                {(audioFx?.intensity ?? 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.2"
              step="0.1"
              value={audioFx?.intensity ?? 1.0}
              onChange={(e) => onUpdateAudioFx?.({ intensity: parseFloat(e.target.value) })}
              className="w-full accent-pink-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0.4x (Halus)</span>
              <span>1.0x (Normal)</span>
              <span>2.2x (Ekstrem)</span>
            </div>
          </div>

          {/* Individual Feature Toggles */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 flex flex-col gap-2.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Pilihan Efek Video Reaktif Musik
            </label>

            {/* 1. Bass Pulse Zoom */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">💥</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Denyut Zoom Bass (Bass Pulse Zoom)</div>
                  <div className="text-[10px] text-slate-400">Video membesar berdenyut mengikuti ketukan kick drum</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioFx?.bassPulseZoom ?? true}
                onChange={(e) => onUpdateAudioFx?.({ bassPulseZoom: e.target.checked })}
                className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
              />
            </div>

            {/* 2. Bass Screen Shake */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">📳</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Guncangan Layar Beat (Screen Shake)</div>
                  <div className="text-[10px] text-slate-400">Kamera berguncang dinamis saat ada dentuman bass bertenaga</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioFx?.bassShake ?? true}
                onChange={(e) => onUpdateAudioFx?.({ bassShake: e.target.checked })}
                className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
              />
            </div>

            {/* 3. Beat Flash Strobe */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">⚡</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Kilatan Cahaya Beat (Beat Flash)</div>
                  <div className="text-[10px] text-slate-400">Kilatan cahaya atmosferik pada puncak drop lagu</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioFx?.beatFlash ?? true}
                onChange={(e) => onUpdateAudioFx?.({ beatFlash: e.target.checked })}
                className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
              />
            </div>

            {/* 4. RGB Split Glitch */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🌈</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">RGB Split Glitch (Chromatic Aberration)</div>
                  <div className="text-[10px] text-slate-400">Pemisahan spektrum warna merah-biru saat hentakan beat</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioFx?.rgbSplit ?? true}
                onChange={(e) => onUpdateAudioFx?.({ rgbSplit: e.target.checked })}
                className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
              />
            </div>

            {/* 5. Shockwave Ripples & Sparks */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">✨</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Cincin Gelombang & Percikan (Shockwave)</div>
                  <div className="text-[10px] text-slate-400">Cincin gelombang melingkar & partikel mengambang bergerak sesuai ritme</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioFx?.beatParticles ?? true}
                onChange={(e) => onUpdateAudioFx?.({ beatParticles: e.target.checked })}
                className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
              />
            </div>

            {/* 6. Vignette Pulse */}
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 hover:border-slate-700 transition flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-base">🔘</span>
                <div>
                  <div className="text-xs font-semibold text-slate-200">Denyut Tepi Bingkai (Vignette Pulse)</div>
                  <div className="text-[10px] text-slate-400">Kegelapan tepi frame bernafas mengikuti dinamika volume audio</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioFx?.vignettePulse ?? true}
                onChange={(e) => onUpdateAudioFx?.({ vignettePulse: e.target.checked })}
                className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: SPECTRUM EQUALIZER ===================== */}
      {subTab === 'equalizer' && (
        <div className="flex flex-col gap-4">
          {/* Enable Toggle Banner */}
          <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-cyan-950/60 p-3.5 rounded-xl border border-indigo-500/30 flex items-center justify-between shadow-lg shadow-indigo-950/30">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition ${
                  config.enabled
                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  Efek Visual Equalizer
                  {config.enabled && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                  )}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Tampilkan grafis equalizer responsif musik & SFX di kanvas video
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => onChange({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-cyan-500"></div>
            </label>
          </div>

      {/* Quick Presets */}
      <div>
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
          Preset Cepat Equalizer
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPreset('podcast')}
            className="px-2.5 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-lg text-left transition flex items-center gap-2 group"
          >
            <Waves className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Podcast Wave</div>
              <div className="text-[9px] text-slate-500">Gelombang Halus Bawah</div>
            </div>
          </button>

          <button
            onClick={() => applyPreset('cyberpunk')}
            className="px-2.5 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-fuchsia-500/50 rounded-lg text-left transition flex items-center gap-2 group"
          >
            <Zap className="w-3.5 h-3.5 text-fuchsia-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Cyberpunk Rave</div>
              <div className="text-[9px] text-slate-500">Peak Bars + Beat Pulse</div>
            </div>
          </button>

          <button
            onClick={() => applyPreset('ambient')}
            className="px-2.5 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-left transition flex items-center gap-2 group"
          >
            <Disc className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Ambient Portal</div>
              <div className="text-[9px] text-slate-500">Cincin Melingkar Radial</div>
            </div>
          </button>

          <button
            onClick={() => applyPreset('classic')}
            className="px-2.5 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 rounded-lg text-left transition flex items-center gap-2 group"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold text-slate-200">Studio Mirror</div>
              <div className="text-[9px] text-slate-500">Simetris Atas & Bawah</div>
            </div>
          </button>
        </div>
      </div>

      {/* Equalizer Styles Selection */}
      <div>
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Model & Gaya Efek
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {styles.map((s) => {
            const isSelected = config.style === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onChange({ style: s.id })}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-indigo-950/50 border-cyan-500/80 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'text-cyan-400' : 'text-slate-400'}>{s.icon}</span>
                    <span className="text-xs font-bold">{s.label}</span>
                  </div>
                  {s.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- FITUR: GAMBAR DI DALAM LINGKARAN EQUALIZER (CENTER DISC / AVATAR) --- */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Disc className="w-4 h-4 text-pink-400" />
            <span>Gambar di Dalam Lingkaran Equalizer</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-semibold">
            FITUR PRO
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Tambahkan foto profil, cover album, atau gambar di tengah equalizer melingkar & liquid. Gambar akan berputar dan berdenyut mengikuti bass audio!
        </p>

        {/* Image Preview & Upload Controls */}
        <div className="flex items-center gap-3 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-pink-500/60 bg-slate-800 shrink-0 flex items-center justify-center shadow-md">
            {config.centerImageSrc ? (
              <img
                src={config.centerImageSrc}
                alt="Center Circle"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500">
                <Disc className="w-6 h-6 animate-spin text-pink-400" />
                <span className="text-[8px] mt-0.5 font-bold text-slate-400">HAMA</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label className="px-2.5 py-1 bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-semibold rounded-md cursor-pointer flex items-center gap-1 transition-colors shadow-sm">
                <span>Pilih Foto Baru</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const src = ev.target?.result as string;
                        const img = new Image();
                        img.onload = () => {
                          onChange({
                            centerImageSrc: src,
                            centerImageElement: img,
                          });
                        };
                        img.src = src;
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              {currentSlideImageSrc && (
                <button
                  onClick={() => {
                    const img = new Image();
                    img.onload = () => {
                      onChange({
                        centerImageSrc: currentSlideImageSrc,
                        centerImageElement: img,
                      });
                    };
                    img.src = currentSlideImageSrc;
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded-md transition-colors border border-slate-700"
                >
                  Pakai Foto Slide Aktif
                </button>
              )}

              {config.centerImageSrc && (
                <button
                  onClick={() => {
                    onChange({
                      centerImageSrc: undefined,
                      centerImageElement: null,
                    });
                  }}
                  className="text-slate-500 hover:text-rose-400 text-xs px-1"
                  title="Hapus foto tengah"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-[10px] text-slate-400">
              {config.centerImageSrc ? 'Foto aktif terpasang di tengah visualizer' : 'Piringan vinyl standar HAMA aktif'}
            </span>
          </div>
        </div>

        {/* Center Image Options */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Radius / Size */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>Ukuran Gambar:</span>
              <span className="font-mono text-pink-400 font-bold">{config.centerImageRadius || 65}px</span>
            </div>
            <input
              type="range"
              min="35"
              max="105"
              step="5"
              value={config.centerImageRadius || 65}
              onChange={(e) => onChange({ centerImageRadius: Number(e.target.value) })}
              className="w-full accent-pink-500 cursor-pointer"
            />
          </div>

          {/* Shape */}
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block">Bentuk Bingkai:</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'circle', label: 'Bulat' },
                { id: 'rounded', label: 'Sudut' },
                { id: 'hexagon', label: 'Hexa' },
              ].map((sh) => (
                <button
                  key={sh.id}
                  onClick={() => onChange({ centerImageShape: sh.id as any })}
                  className={`py-0.5 text-[10px] rounded border transition-colors ${
                    (config.centerImageShape || 'circle') === sh.id
                      ? 'bg-pink-600 border-pink-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sh.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
          <label className="text-[11px] text-slate-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.centerImageRotation ?? true}
              onChange={(e) => onChange({ centerImageRotation: e.target.checked })}
              className="rounded accent-pink-500"
            />
            <span>Putar Gambar Otomatis (Vinyl Spin 360°)</span>
          </label>

          <label className="text-[11px] text-slate-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.centerImageBorder ?? true}
              onChange={(e) => onChange({ centerImageBorder: e.target.checked })}
              className="rounded accent-pink-500"
            />
            <span>Cincin Neon</span>
          </label>
        </div>
      </div>

      {/* Color Themes */}
      <div>
        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Tema Warna & Gradien
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {themes.map((t) => {
            const isSelected = config.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange({ theme: t.id })}
                className={`p-2 rounded-lg border text-left transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-400 text-white ring-1 ring-indigo-400/40'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${t.preview} shrink-0 shadow-sm`} />
                <span className="text-[11px] font-medium truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Position and Fine-tuning Sliders */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 border-b border-slate-800/80 pb-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Kustomisasi Posisi & Parameter Audio
        </div>

        {/* Position Select */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Posisi Efek di Layar</label>
          <select
            value={config.position}
            onChange={(e) => onChange({ position: e.target.value as EqualizerPosition })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Bar Count (Resolution) */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Kerapatan / Jumlah Bar</span>
              <span className="font-mono text-cyan-400 font-bold">{config.barCount}</span>
            </div>
            <input
              type="range"
              min="16"
              max="96"
              step="8"
              value={config.barCount}
              onChange={(e) => onChange({ barCount: parseInt(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Sensitivity */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Kepekaan / Sensitivitas</span>
              <span className="font-mono text-cyan-400 font-bold">{config.sensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={config.sensitivity}
              onChange={(e) => onChange({ sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Height */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Tinggi Maksimal Visualizer</span>
              <span className="font-mono text-cyan-400 font-bold">{config.height}px</span>
            </div>
            <input
              type="range"
              min="40"
              max="220"
              step="10"
              value={config.height}
              onChange={(e) => onChange({ height: parseInt(e.target.value) })}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Additional Options */}
          <div className="flex flex-col justify-end gap-2 pt-1">
            <label className="text-[11px] text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.glow}
                onChange={(e) => onChange({ glow: e.target.checked })}
                className="rounded accent-cyan-500"
              />
              <span>Efek Pendaran Cahaya (Neon Bloom Glow)</span>
            </label>

            <label className="text-[11px] text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPeakCaps}
                onChange={(e) => onChange({ showPeakCaps: e.target.checked })}
                className="rounded accent-cyan-500"
              />
              <span>Indikator Puncak Jatuh (Peak Caps)</span>
            </label>

            <label className="text-[11px] text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.beatPulse}
                onChange={(e) => onChange({ beatPulse: e.target.checked })}
                className="rounded accent-cyan-500"
              />
              <span>Beat Pulse (Layar Berdenyut saat Bass Kick)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    )}
  </div>
  );
};
