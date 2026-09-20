import React, { useState, useEffect } from 'react';
import {
  Wand2,
  Sparkles,
  Zap,
  Film,
  Flame,
  Volume2,
  Scissors,
  Sliders,
  CheckCircle2,
  X,
  Music,
  Activity,
  Layers,
  Clock,
} from 'lucide-react';
import { Slide, AutoEditPreset, AutoEditOptions, AudioAnalysisData, AudioTrack } from '../types';
import { audioEngine } from '../audio/audioEngine';

interface AutoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  audioTracks: AudioTrack[];
  uploadedAudioName: string | null;
  currentSlideDuration: number;
  onApplyAutoEdit: (
    options: AutoEditOptions,
    newSlides: Slide[],
    newDuration: number,
    summaryMessage: string
  ) => void;
}

export const AutoEditModal: React.FC<AutoEditModalProps> = ({
  isOpen,
  onClose,
  slides,
  audioTracks,
  uploadedAudioName,
  currentSlideDuration,
  onApplyAutoEdit,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<AutoEditPreset>('completePro');
  const [syncToBeat, setSyncToBeat] = useState(true);
  const [autoTrimSilence, setAutoTrimSilence] = useState(true);
  const [autoMatchLoudness, setAutoMatchLoudness] = useState(true);
  const [smartMotions, setSmartMotions] = useState(true);
  const [smartTransitions, setSmartTransitions] = useState(true);
  const [smartSfx, setSmartSfx] = useState(true);

  const [analysisData, setAnalysisData] = useState<AudioAnalysisData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const data = audioEngine.getAnalysisData();
      setAnalysisData(data);
    }
  }, [isOpen, audioTracks]);

  if (!isOpen) return null;

  const totalAudioDuration = audioEngine.getCompositeDuration() || 30;
  const slideCount = slides.length;

  const handlePresetSelect = (preset: AutoEditPreset) => {
    setSelectedPreset(preset);
    if (preset === 'beatSync') {
      setSyncToBeat(true);
      setAutoTrimSilence(true);
      setAutoMatchLoudness(true);
      setSmartMotions(true);
      setSmartTransitions(true);
      setSmartSfx(true);
    } else if (preset === 'cinematic') {
      setSyncToBeat(false);
      setAutoTrimSilence(false);
      setAutoMatchLoudness(true);
      setSmartMotions(true);
      setSmartTransitions(true);
      setSmartSfx(true);
    } else if (preset === 'reelsFast') {
      setSyncToBeat(true);
      setAutoTrimSilence(true);
      setAutoMatchLoudness(true);
      setSmartMotions(true);
      setSmartTransitions(true);
      setSmartSfx(true);
    } else if (preset === 'completePro') {
      setSyncToBeat(true);
      setAutoTrimSilence(true);
      setAutoMatchLoudness(true);
      setSmartMotions(true);
      setSmartTransitions(true);
      setSmartSfx(true);
    }
  };

  const executeAutoEdit = async () => {
    if (slideCount === 0) return;
    setIsProcessing(true);

    try {
      let trimmedSec = 0;
      if (autoTrimSilence && audioTracks.length > 0) {
        const trimRes = await audioEngine.autoTrimAllTracksSilence();
        trimmedSec = trimRes.trimmedSec;
      }

      if (autoMatchLoudness && audioTracks.length > 1) {
        await audioEngine.autoMatchTracksLoudness(0.12);
      }

      const freshAnalysis = audioEngine.getAnalysisData();
      const effectiveAudioDur = audioEngine.getCompositeDuration() || totalAudioDuration;
      const bpm = freshAnalysis.detectedBpm || 120;

      // Calculate new slide duration based on preset & beats
      let calculatedSlideDuration = currentSlideDuration;
      if (selectedPreset === 'reelsFast') {
        calculatedSlideDuration = Math.max(1.2, Math.min(2.4, (60 / bpm) * 2));
      } else if (selectedPreset === 'cinematic') {
        calculatedSlideDuration = Math.max(
          2.5,
          Math.min(8.0, parseFloat((effectiveAudioDur / Math.max(1, slideCount)).toFixed(2)))
        );
      } else if (syncToBeat) {
        // Distribute slides across total audio or beat subdivisions
        const beatInterval = 60 / bpm; // bar/beat length
        const idealSlideTime = effectiveAudioDur / Math.max(1, slideCount);
        // Snap idealSlideTime to nearest musical beat (1, 2, 4, or 8 beats)
        const beatsPerSlide = Math.max(1, Math.round(idealSlideTime / beatInterval));
        calculatedSlideDuration = Math.max(
          1.2,
          Math.min(12.0, parseFloat((beatsPerSlide * beatInterval).toFixed(2)))
        );
      } else {
        calculatedSlideDuration = Math.max(
          1.0,
          Math.min(15.0, parseFloat((effectiveAudioDur / Math.max(1, slideCount)).toFixed(2)))
        );
      }

      // Transform slides
      const motionOptions: Slide['motion'][] =
        selectedPreset === 'cinematic'
          ? ['kenburns', 'zoomIn', 'panLeft', 'panRight']
          : selectedPreset === 'reelsFast'
          ? ['zoomIn', 'zoomOut', 'panRight', 'panLeft']
          : ['kenburns', 'zoomIn', 'zoomOut', 'panLeft'];

      const transitionOptions: Slide['transition'][] =
        selectedPreset === 'cinematic'
          ? ['crossfade', 'crossfade', 'fadeBlack']
          : selectedPreset === 'reelsFast'
          ? ['slideLeft', 'slideRight', 'crossfade']
          : ['crossfade', 'slideLeft', 'slideRight', 'crossfade'];

      const sfxOptions: Slide['sfx'][] =
        selectedPreset === 'cinematic'
          ? ['chime', 'none', 'chime', 'none']
          : selectedPreset === 'reelsFast'
          ? ['whoosh', 'pop', 'whoosh', 'pop']
          : ['whoosh', 'chime', 'pop', 'none'];

      const updatedSlides: Slide[] = slides.map((slide, idx) => {
        const nextSlide = { ...slide };

        if (smartMotions) {
          nextSlide.motion = motionOptions[idx % motionOptions.length];
        }

        if (smartTransitions) {
          nextSlide.transition = transitionOptions[idx % transitionOptions.length];
        }

        if (smartSfx) {
          nextSlide.sfx = sfxOptions[idx % sfxOptions.length];
        }

        // Add subtle filmic enhancement for cinematic
        if (selectedPreset === 'cinematic' && nextSlide.filter) {
          nextSlide.filter = {
            ...nextSlide.filter,
            contrast: 108,
            saturation: 106,
            vignette: 0.18,
          };
        } else if (selectedPreset === 'reelsFast' && nextSlide.filter) {
          nextSlide.filter = {
            ...nextSlide.filter,
            contrast: 112,
            saturation: 115,
            vignette: 0.1,
          };
        }

        return nextSlide;
      });

      const options: AutoEditOptions = {
        preset: selectedPreset,
        syncToBeat,
        autoTrimSilence,
        autoMatchLoudness,
        smartMotions,
        smartTransitions,
        smartSfx,
      };

      const summary = `Auto-Edit Sukses! Disinkronkan ke ${bpm} BPM (${calculatedSlideDuration}s / slide), ${slideCount} slide dioptimasi ritme & transisinya.`;
      onApplyAutoEdit(options, updatedSlides, calculatedSlideDuration, summary);
      onClose();
    } catch (err) {
      console.error('Auto edit error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 via-pink-500 to-indigo-500 rounded-xl text-white shadow-md shadow-indigo-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Auto-Edit Studio Pro</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-amber-500 to-pink-500 text-black px-2 py-0.5 rounded-full shadow-sm">
                  AI Smart Edit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Otomatisasi pemotongan durasi slide, ketukan beat musik, transisi, dan leveling audio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Audio Intelligence Banner */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="font-semibold truncate max-w-[170px]">
              {uploadedAudioName || 'Preset Musik Studio'}
            </span>
            {audioTracks.length > 1 && (
              <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800/60 px-1.5 py-0.2 rounded font-mono">
                {audioTracks.length} Lagu
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1 text-cyan-400 bg-cyan-950/50 border border-cyan-800/40 px-2 py-0.5 rounded-md">
              <Activity className="w-3.5 h-3.5" />
              <span>Tempo: {analysisData?.detectedBpm || 120} BPM</span>
            </div>

            <div className="flex items-center gap-1 text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analysisData?.beatCount || 0} Titik Beat</span>
            </div>

            <div className="flex items-center gap-1 text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-md">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{totalAudioDuration.toFixed(1)}s Total</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Section: Select Preset Style */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 block">
              Pilih Gaya Auto-Edit:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Preset 1: Complete Pro */}
              <button
                type="button"
                onClick={() => handlePresetSelect('completePro')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedPreset === 'completePro'
                    ? 'bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedPreset === 'completePro'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-indigo-400'
                  }`}
                >
                  <Wand2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Smart Master (Lengkap)</span>
                    {selectedPreset === 'completePro' && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Potong hening, sinkronkan ketukan beat, ratakan volume & pasang transisi pas.
                  </p>
                </div>
              </button>

              {/* Preset 2: Beat Drop Sync */}
              <button
                type="button"
                onClick={() => handlePresetSelect('beatSync')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedPreset === 'beatSync'
                    ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedPreset === 'beatSync'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 text-purple-400'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Ketukan Beat Drop</span>
                    {selectedPreset === 'beatSync' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mengunci pergantian slide tepat di titik drop bass atau hentakan drum musik.
                  </p>
                </div>
              </button>

              {/* Preset 3: Cinematic Flow */}
              <button
                type="button"
                onClick={() => handlePresetSelect('cinematic')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedPreset === 'cinematic'
                    ? 'bg-amber-950/40 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedPreset === 'cinematic'
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-800 text-amber-400'
                  }`}
                >
                  <Film className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Sinematik Santai</span>
                    {selectedPreset === 'cinematic' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gerakan Ken-Burns mengalir lambat, transisi halus, dan warna hangat filmis.
                  </p>
                </div>
              </button>

              {/* Preset 4: Viral Reels / Fast Paced */}
              <button
                type="button"
                onClick={() => handlePresetSelect('reelsFast')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                  selectedPreset === 'reelsFast'
                    ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-500/10 ring-1 ring-rose-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    selectedPreset === 'reelsFast'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-800 text-rose-400'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Viral Reels / TikTok</span>
                    {selectedPreset === 'reelsFast' && (
                      <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pemotongan cepat (1.5s - 2.0s), zoom punch enerjik, dan efek transisi geser.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Detailed Auto-Edit Feature Checkboxes */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Modul Auto-Edit yang Akan Dijalankan:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer select-none text-slate-300 transition">
                <input
                  type="checkbox"
                  checked={syncToBeat}
                  onChange={(e) => setSyncToBeat(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Kunci Durasi ke Ketukan Beat</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer select-none text-slate-300 transition">
                <input
                  type="checkbox"
                  checked={autoTrimSilence}
                  onChange={(e) => setAutoTrimSilence(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>Pangkas Hening di Awal/Akhir Lagu</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer select-none text-slate-300 transition">
                <input
                  type="checkbox"
                  checked={autoMatchLoudness}
                  onChange={(e) => setAutoMatchLoudness(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ratakan Volume Antar Lagu (Auto-Gain)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer select-none text-slate-300 transition">
                <input
                  type="checkbox"
                  checked={smartMotions}
                  onChange={(e) => setSmartMotions(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <Film className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gerakan Kamera Cerdas (Ken-Burns / Zoom)</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer select-none text-slate-300 transition">
                <input
                  type="checkbox"
                  checked={smartTransitions}
                  onChange={(e) => setSmartTransitions(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Transisi Visual Ritmis Otomatis</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/50 cursor-pointer select-none text-slate-300 transition">
                <input
                  type="checkbox"
                  checked={smartSfx}
                  onChange={(e) => setSmartSfx(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Efek Suara (Whoosh / Chime) di Titik Cut</span>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-slate-300">{slideCount} Slide</span> akan
            diotomatisasi ke{' '}
            <span className="font-semibold text-indigo-300">
              {audioTracks.length > 0 ? `${audioTracks.length} Lagu Audio` : 'Musik Preset'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={executeAutoEdit}
              disabled={isProcessing || slideCount === 0}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Menganalisis & Mengedit...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Terapkan Auto-Edit Sekarang</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
