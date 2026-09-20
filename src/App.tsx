import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Slide,
  EqualizerConfig,
  BgmPreset,
  MusicEditConfig,
  AudioTrack,
  MusicTransitionType,
  AutoEditOptions,
  AudioReactiveVideoFx,
  LyricsConfig,
} from './types';
import { audioEngine } from './audio/audioEngine';
import { drawSlideBackground, drawSlideText, defaultFilter, defaultTransform } from './utils/slideRenderer';
import { renderEqualizer, renderAudioReactiveVideoOverlays } from './utils/visualizerRenderer';
import { renderLyrics } from './utils/lyricRenderer';
import { Header } from './components/Header';
import { CanvasStage } from './components/CanvasStage';
import { SlideTimeline } from './components/SlideTimeline';
import { EqualizerControls } from './components/EqualizerControls';
import { SlideInspector } from './components/SlideInspector';
import { MusicEditor } from './components/MusicEditor';
import { AudioSettings } from './components/AudioSettings';
import { LyricsManager } from './components/LyricsManager';
import { ExportModal } from './components/ExportModal';
import { AutoEditModal } from './components/AutoEditModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import { Activity, Sliders, Music, Clock, CheckCircle2, AlertCircle, Image as ImageIcon, ImagePlus, Plus, Zap, Sparkles } from 'lucide-react';

export default function App() {
  // Slides state: clean start without sample slides as requested
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);

  // Equalizer state (enabled by default)
  const [equalizerConfig, setEqualizerConfig] = useState<EqualizerConfig>({
    enabled: true,
    style: 'bars',
    position: 'bottom',
    theme: 'cyan-neon',
    barCount: 36,
    sensitivity: 1.3,
    height: 110,
    glow: true,
    showPeakCaps: true,
    beatPulse: true,
  });

  // Efek Video Reaktif Musik (Audio-Reactive Video FX)
  const [audioReactiveFx, setAudioReactiveFx] = useState<AudioReactiveVideoFx>({
    enabled: true,
    bassPulseZoom: true,
    bassShake: true,
    beatFlash: true,
    rgbSplit: true,
    beatParticles: true,
    vignettePulse: true,
    intensity: 1.0,
  });

  // Playback & Audio settings state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [slideDuration, setSlideDuration] = useState<number>(4.0);
  const [transitionDuration, setTransitionDuration] = useState<number>(0.8);
  const [bgmPreset, setBgmPreset] = useState<BgmPreset>('lofi');
  const [bgmVolume, setBgmVolume] = useState<number>(0.8);
  const [sfxVolume, setSfxVolume] = useState<number>(0.9);
  const [uploadedAudioName, setUploadedAudioName] = useState<string | null>(null);
  const [micActive, setMicActive] = useState<boolean>(false);

  // Multi-Track Playlist & Transition state
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [musicTransitionType, setMusicTransitionType] = useState<MusicTransitionType>('crossfade');
  const [musicTransitionDuration, setMusicTransitionDuration] = useState<number>(2.5);

  // Music Edit state (Trimming, 3-Band Studio EQ, Playback Speed, Waveforms)
  const [musicEdit, setMusicEdit] = useState<MusicEditConfig>({
    trimStart: 0,
    trimEnd: 30,
    playbackRate: 1.0,
    fadeInDuration: 1.2,
    fadeOutDuration: 2.0,
    bassBoost: 0,
    midGain: 0,
    trebleBoost: 0,
    loop: true,
    totalAudioDuration: 30,
    waveformPeaks: audioEngine.generateSyntheticPeaks(72),
  });

  // Current uploaded audio file for AI lyric transcription
  const [currentAudioFile, setCurrentAudioFile] = useState<File | null>(null);

  // Synchronized Lyrics State (Fitur Lirik Otomatis dari Musik)
  const [lyricsConfig, setLyricsConfig] = useState<LyricsConfig>({
    enabled: true,
    lines: [
      {
        id: 'sample-1',
        startTime: 0.5,
        endTime: 4.2,
        text: 'HAMA PRO EDITING - Visualizer & Lirik',
      },
      {
        id: 'sample-2',
        startTime: 4.5,
        endTime: 9.0,
        text: 'Equalizer Liquid Melingkar & Teks Otomatis',
      },
    ],
    fontStyle: 'sans-modern',
    animationVariant: 'karaoke-glow',
    position: 'bottom',
    fontSize: 34,
    textColor: '#ffffff',
    highlightColor: '#f43f5e',
    outlineColor: '#000000',
    showBox: true,
    boxBgColor: 'rgba(0, 0, 0, 0.65)',
    textCase: 'normal',
    offsetSeconds: 0,
  });

  // Sidebar Tab: 'equalizer' | 'slide' | 'music' | 'timing' | 'lyrics'
  const [activeTab, setActiveTab] = useState<'equalizer' | 'slide' | 'music' | 'timing' | 'lyrics'>('music');

  // Video Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportElapsed, setExportElapsed] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Auto-Edit Studio Pro Modal state
  const [showAutoEditModal, setShowAutoEditModal] = useState<boolean>(false);

  // Vercel Deploy Guide Modal state
  const [showVercelModal, setShowVercelModal] = useState<boolean>(false);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation frame & SFX triggers
  const sfxPlayedRef = useRef<{ [slideIdx: number]: boolean }>({});
  const lastTimeRef = useRef<number | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Auto-Match Video Duration to Music State (Default: true)
  const [autoMatchMusicDuration, setAutoMatchMusicDuration] = useState<boolean>(true);

  // Helper to accurately derive the composite/effective duration of current music
  const getEffectiveMusicDuration = useCallback((): number => {
    const compDur = audioEngine.getCompositeDuration();
    const trimStart = musicEdit.trimStart || 0;
    const rawEnd =
      musicEdit.trimEnd && musicEdit.trimEnd > trimStart
        ? musicEdit.trimEnd
        : compDur > 0
        ? compDur
        : musicEdit.totalAudioDuration || 0;

    let baseDur = rawEnd - trimStart;
    if (baseDur <= 0) {
      baseDur = compDur > 0 ? compDur : musicEdit.totalAudioDuration || 30;
    }
    const rate = musicEdit.playbackRate || 1.0;
    return Math.max(0.5, parseFloat((baseDur / rate).toFixed(3)));
  }, [musicEdit]);

  const effectiveMusicDuration = getEffectiveMusicDuration();

  // Total video duration: exactly matches music duration when autoMatchMusicDuration is active
  const totalDuration =
    autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
      ? effectiveMusicDuration
      : slides.length * slideDuration;

  // Function to calculate and distribute slide duration evenly to match music length
  const syncSlideDurationToMusic = useCallback(
    (slideCount: number, customMusicDur?: number): number => {
      if (slideCount <= 0) return slideDuration;
      const targetMusicDur =
        customMusicDur !== undefined ? customMusicDur : getEffectiveMusicDuration();
      if (targetMusicDur <= 0) return slideDuration;
      const ideal = Math.max(0.1, parseFloat((targetMusicDur / slideCount).toFixed(3)));
      setSlideDuration(ideal);
      return ideal;
    },
    [getEffectiveMusicDuration, slideDuration]
  );

  // Reactive Auto-Sync: Automatically recalculates slideDuration when slides or music duration changes
  useEffect(() => {
    if (!autoMatchMusicDuration || slides.length === 0) return;
    const targetMusicDur = getEffectiveMusicDuration();
    if (targetMusicDur > 0) {
      const ideal = Math.max(0.1, parseFloat((targetMusicDur / slides.length).toFixed(3)));
      setSlideDuration((prev) => (Math.abs(prev - ideal) > 0.005 ? ideal : prev));
    }
  }, [autoMatchMusicDuration, slides.length, effectiveMusicDuration, getEffectiveMusicDuration]);

  const showToast = useCallback((message: string, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  // --- AUTO EDIT APPLIED HANDLER ---
  const handleApplyAutoEdit = useCallback(
    (
      options: AutoEditOptions,
      newSlides: Slide[],
      newDuration: number,
      summaryMessage: string
    ) => {
      setSlides(newSlides);
      setSlideDuration(newDuration);
      setAudioTracks([...audioEngine.getAudioTracks()]);

      if (options.preset === 'beatSync' || options.preset === 'reelsFast') {
        setEqualizerConfig((prev) => ({
          ...prev,
          style: 'bars',
          theme: 'cyan-neon',
          beatPulse: true,
          sensitivity: 1.4,
        }));
      }

      showToast(summaryMessage, false);
    },
    [showToast]
  );

  // --- DRAWING CANVAS FRAME ---
  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas with sleek dark canvas
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // If no slides, render clean background & responsive visual layers
      const audioMetrics = audioEngine.getAudioReactiveMetrics();
      if (slides.length === 0) {
        if (audioReactiveFx.enabled) {
          renderAudioReactiveVideoOverlays(ctx, width, height, audioReactiveFx, audioMetrics);
        }
        if (equalizerConfig.enabled) {
          renderEqualizer(ctx, width, height, equalizerConfig, audioMetrics.bass);
        }
        return;
      }

      // Determine current slide and next slide for transition
      const sDuration =
        autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
          ? effectiveMusicDuration / slides.length
          : slideDuration;
      const tDuration = transitionDuration;
      const currentSlideIdx = Math.min(Math.floor(time / sDuration), slides.length - 1);
      const slideTime = time - currentSlideIdx * sDuration;
      const slideProgress = Math.min(1, slideTime / sDuration);

      const currentSlide = slides[currentSlideIdx];
      const nextSlide = slides[currentSlideIdx + 1];

      // Transition check
      const inTransition = nextSlide && slideTime >= sDuration - tDuration;
      const transProgress = inTransition ? (slideTime - (sDuration - tDuration)) / tDuration : 0;

      // Trigger SFX exactly when transition starts
      if (inTransition && !sfxPlayedRef.current[currentSlideIdx] && (isPlaying || isExporting)) {
        sfxPlayedRef.current[currentSlideIdx] = true;
        if (currentSlide.sfx && currentSlide.sfx !== 'none') {
          audioEngine.playSFX(currentSlide.sfx);
        }
      }

      // 1. Draw Current Slide visual (with audio-reactive shake, zoom, and RGB split)
      drawSlideBackground(
        ctx,
        currentSlide,
        width,
        height,
        slideProgress,
        currentSlide.motion,
        audioReactiveFx,
        audioMetrics
      );
      drawSlideText(ctx, currentSlide, width, height, slideProgress);

      // 2. Draw Transition to next slide
      if (inTransition && nextSlide) {
        const transType = currentSlide.transition || 'crossfade';
        ctx.save();

        if (transType === 'crossfade') {
          ctx.globalAlpha = transProgress;
          drawSlideBackground(
            ctx,
            nextSlide,
            width,
            height,
            transProgress * 0.2,
            nextSlide.motion,
            audioReactiveFx,
            audioMetrics
          );
          drawSlideText(ctx, nextSlide, width, height, transProgress * 0.2);
        } else if (transType === 'slideLeft') {
          ctx.beginPath();
          ctx.rect(width * (1 - transProgress), 0, width, height);
          ctx.clip();
          drawSlideBackground(
            ctx,
            nextSlide,
            width,
            height,
            transProgress * 0.2,
            nextSlide.motion,
            audioReactiveFx,
            audioMetrics
          );
          drawSlideText(ctx, nextSlide, width, height, transProgress * 0.2);
        } else if (transType === 'slideRight') {
          ctx.beginPath();
          ctx.rect(0, 0, width * transProgress, height);
          ctx.clip();
          drawSlideBackground(
            ctx,
            nextSlide,
            width,
            height,
            transProgress * 0.2,
            nextSlide.motion,
            audioReactiveFx,
            audioMetrics
          );
          drawSlideText(ctx, nextSlide, width, height, transProgress * 0.2);
        } else if (transType === 'fadeBlack') {
          if (transProgress < 0.5) {
            ctx.fillStyle = `rgba(0, 0, 0, ${transProgress * 2})`;
            ctx.fillRect(0, 0, width, height);
          } else {
            drawSlideBackground(
              ctx,
              nextSlide,
              width,
              height,
              transProgress * 0.2,
              nextSlide.motion,
              audioReactiveFx,
              audioMetrics
            );
            drawSlideText(ctx, nextSlide, width, height, transProgress * 0.2);
            ctx.fillStyle = `rgba(0, 0, 0, ${(1 - transProgress) * 2})`;
            ctx.fillRect(0, 0, width, height);
          }
        }

        ctx.restore();
      }

      // 3. Global fade to black near end
      const totalDur =
        autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
          ? effectiveMusicDuration
          : slides.length * sDuration;
      if (time >= totalDur - 0.4 && totalDur > 1) {
        const fadeOutProgress = (time - (totalDur - 0.4)) / 0.4;
        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, fadeOutProgress)})`;
        ctx.fillRect(0, 0, width, height);
      }

      // 4. RENDER LAPISAN EFEK VIDEO REAKTIF MUSIK (Flash, Shockwave, Floating Sparks)
      if (audioReactiveFx.enabled) {
        renderAudioReactiveVideoOverlays(ctx, width, height, audioReactiveFx, audioMetrics);
      }

      // 5. RENDER VISUAL EQUALIZER LAYER ON TOP
      if (equalizerConfig.enabled) {
        renderEqualizer(ctx, width, height, equalizerConfig, audioMetrics.bass);
      }

      // 6. RENDER SYNCHRONIZED LYRICS OVERLAY (AI Auto-Lyrics)
      if (lyricsConfig.enabled) {
        renderLyrics(ctx, width, height, lyricsConfig, time, audioMetrics.bass);
      }

      // Keep active slide index in sync with scrubber when playing
      if (currentSlideIdx !== activeSlideIndex && !isExporting) {
        setActiveSlideIndex(currentSlideIdx);
      }
    },
    [slides, slideDuration, transitionDuration, isPlaying, isExporting, equalizerConfig, audioReactiveFx, lyricsConfig, activeSlideIndex, autoMatchMusicDuration, effectiveMusicDuration]
  );

  // Auto-load center image element for Equalizer circular/liquid styles
  useEffect(() => {
    if (equalizerConfig.centerImageSrc && !equalizerConfig.centerImageElement) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setEqualizerConfig((prev) => ({ ...prev, centerImageElement: img }));
      };
      img.src = equalizerConfig.centerImageSrc;
    }
  }, [equalizerConfig.centerImageSrc, equalizerConfig.centerImageElement]);

  // Playback Loop
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        setCurrentTime((prevTime) => {
          const nextTime = prevTime + delta;
          const totalDur =
            autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
              ? effectiveMusicDuration
              : slides.length > 0
              ? slides.length * slideDuration
              : musicEdit.totalAudioDuration || 30;

          // Apply audio fade in & out
          audioEngine.applyAudioFades(nextTime, totalDur, bgmVolume);

          if (nextTime >= totalDur) {
            sfxPlayedRef.current = {};
            return 0; // loop
          }
          return nextTime;
        });
      }

      renderFrame(currentTime);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    animFrameIdRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying, currentTime, slides.length, slideDuration, bgmVolume, musicEdit.totalAudioDuration, renderFrame, autoMatchMusicDuration, effectiveMusicDuration]);

  // Initial draw & redraw when inactive
  useEffect(() => {
    renderFrame(currentTime);
  }, [renderFrame, currentTime, activeSlideIndex, equalizerConfig, lyricsConfig]);

  // --- PLAYBACK CONTROLS ---
  const handlePlay = () => {
    audioEngine.init();
    audioEngine.startMusic(bgmPreset, currentTime);
    lastTimeRef.current = null;
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    audioEngine.stopMusic();
  };

  const handleTogglePlayPause = () => {
    if (isPlaying) handlePause();
    else handlePlay();
  };

  const handleStop = () => {
    setIsPlaying(false);
    audioEngine.stopMusic();
    setCurrentTime(0);
    sfxPlayedRef.current = {};
    renderFrame(0);
  };

  const handleSeek = (time: number) => {
    const totalDur =
      autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
        ? effectiveMusicDuration
        : slides.length > 0
        ? slides.length * slideDuration
        : musicEdit.totalAudioDuration || 30;
    const clampedTime = Math.max(0, Math.min(time, totalDur));
    setCurrentTime(clampedTime);
    sfxPlayedRef.current = {};
    renderFrame(clampedTime);
    if (isPlaying) {
      audioEngine.startMusic(bgmPreset, clampedTime);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      const sDuration =
        autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
          ? effectiveMusicDuration / slides.length
          : slideDuration;
      const newIdx = activeSlideIndex - 1;
      setActiveSlideIndex(newIdx);
      const newTime = newIdx * sDuration;
      handleSeek(newTime);
    }
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      const sDuration =
        autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
          ? effectiveMusicDuration / slides.length
          : slideDuration;
      const newIdx = activeSlideIndex + 1;
      setActiveSlideIndex(newIdx);
      const newTime = newIdx * sDuration;
      handleSeek(newTime);
    }
  };

  // --- VOLUME CONTROLS ---
  const handleBgmVolumeChange = (vol: number) => {
    setBgmVolume(vol);
    audioEngine.setBgmVolume(vol);
  };

  const handleSfxVolumeChange = (vol: number) => {
    setSfxVolume(vol);
    audioEngine.setSfxVolume(vol);
  };

  // --- MICROPHONE TOGGLE ---
  const handleToggleMic = async () => {
    const nextState = !micActive;
    const ok = await audioEngine.toggleMicrophone(nextState);
    if (nextState && ok) {
      setMicActive(true);
      showToast('Mikrofon aktif! Suara Anda akan menggerakkan equalizer visual.');
    } else {
      setMicActive(false);
      showToast(nextState ? 'Gagal mengakses mikrofon.' : 'Mikrofon dimatikan.');
    }
  };

  // --- MUSIC EDIT CONTROLS ---
  const handleUpdateMusicEdit = (updated: Partial<MusicEditConfig>) => {
    const next = { ...musicEdit, ...updated };
    setMusicEdit(next);
    audioEngine.updateMusicEdit(updated);
  };

  const handleAutoSyncSlidesToMusic = () => {
    if (slides.length === 0) {
      showToast('Tambahkan slide gambar terlebih dahulu untuk disinkronkan!', true);
      return;
    }
    setAutoMatchMusicDuration(true);
    const audioTrimLength = getEffectiveMusicDuration();
    const count = slides.length;
    const idealDurationPerSlide = syncSlideDurationToMusic(count, audioTrimLength);
    showToast(
      `Semua ${count} slide disinkronkan ke durasi musik: ${idealDurationPerSlide.toFixed(2)}s per slide (Total: ${audioTrimLength.toFixed(1)}s = 100% Pas)!`
    );
  };

  // --- SLIDE & IMAGE OPERATIONS ---
  const handleUpdateActiveSlide = (updated: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((s, idx) => (idx === activeSlideIndex ? { ...s, ...updated } : s))
    );
  };

  const handleDuplicateSlide = () => {
    const current = slides[activeSlideIndex];
    if (!current) return;
    const copy: Slide = {
      ...current,
      id: `slide-${Date.now()}`,
      title: `${current.title} (Salinan)`,
      filter: { ...(current.filter || defaultFilter) },
      transform: { ...(current.transform || defaultTransform) },
    };
    const nextSlides = [...slides];
    nextSlides.splice(activeSlideIndex + 1, 0, copy);
    setSlides(nextSlides);
    setActiveSlideIndex(activeSlideIndex + 1);
    showToast('Slide berhasil diduplikasi!');
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) {
      setSlides([]);
      setActiveSlideIndex(0);
      setCurrentTime(0);
      showToast('Semua slide telah dikosongkan.');
      return;
    }
    const nextSlides = slides.filter((_, idx) => idx !== activeSlideIndex);
    const newIdx = Math.max(0, Math.min(activeSlideIndex, nextSlides.length - 1));
    setSlides(nextSlides);
    setActiveSlideIndex(newIdx);
    setCurrentTime(newIdx * slideDuration);
    showToast('Slide telah dihapus.');
  };

  const handleClearAllSlides = () => {
    handleStop();
    setSlides([]);
    setActiveSlideIndex(0);
    setCurrentTime(0);
    showToast('Semua slide telah dibersihkan.');
  };

  const handleMoveSlide = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= slides.length) return;
    const item = slides[fromIdx];
    const next = [...slides];
    next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setSlides(next);
    setActiveSlideIndex(toIdx);
  };

  const handleAddBlankSlide = () => {
    const palettes: [string, string][] = [
      ['#4338ca', '#06b6d4'],
      ['#b91c1c', '#f97316'],
      ['#047857', '#10b981'],
      ['#6d28d9', '#ec4899'],
      ['#1e293b', '#3b82f6'],
    ];
    const palette = palettes[slides.length % palettes.length];

    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: `Slide Gradien ${slides.length + 1}`,
      text: `Momen Video ${slides.length + 1}`,
      textPos: 'bottom',
      textAnim: 'slideUp',
      fontSize: 38,
      textColor: '#ffffff',
      hasBgBox: true,
      motion: 'kenburns',
      transition: 'crossfade',
      sfx: 'whoosh',
      gradient: palette,
      imgElement: null,
      filter: { ...defaultFilter },
      transform: { ...defaultTransform },
    };

    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    setActiveTab('slide');
    showToast('Slide baru ditambahkan!');
  };

  const handleAddMultipleBlankSlides = (count = 5) => {
    const palettes: [string, string][] = [
      ['#4338ca', '#06b6d4'],
      ['#b91c1c', '#f97316'],
      ['#047857', '#10b981'],
      ['#6d28d9', '#ec4899'],
      ['#1e293b', '#3b82f6'],
      ['#0f172a', '#6366f1'],
    ];

    const newItems: Slide[] = Array.from({ length: count }, (_, i) => {
      const idx = slides.length + i + 1;
      const palette = palettes[(slides.length + i) % palettes.length];
      return {
        id: `slide-${Date.now()}-${i}`,
        title: `Slide Gradien ${idx}`,
        text: `Momen Video ${idx}`,
        textPos: 'bottom',
        textAnim: 'slideUp',
        fontSize: 38,
        textColor: '#ffffff',
        hasBgBox: true,
        motion: 'kenburns',
        transition: 'crossfade',
        sfx: 'whoosh',
        gradient: palette,
        imgElement: null,
        filter: { ...defaultFilter },
        transform: { ...defaultTransform },
      };
    });

    setSlides((prev) => [...prev, ...newItems]);
    setActiveSlideIndex(slides.length);
    setActiveTab('slide');
    showToast(`${count} slide gradien baru berhasil ditambahkan!`);
  };

  const handleAddStockPhoto = (url: string, title: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const newSlide: Slide = {
        id: `slide-${Date.now()}`,
        title,
        text: title,
        textPos: 'bottom',
        textAnim: 'fade',
        fontSize: 36,
        textColor: '#ffffff',
        hasBgBox: true,
        motion: 'kenburns',
        transition: 'crossfade',
        sfx: 'whoosh',
        gradient: ['#1e293b', '#0f172a'],
        imgElement: img,
        imageSrc: url,
        filter: { ...defaultFilter },
        transform: { ...defaultTransform },
      };

      setSlides((prev) => [...prev, newSlide]);
      setActiveSlideIndex(slides.length);
      setActiveTab('slide');
      showToast(`Foto "${title}" berhasil dimasukkan ke slide video!`);
    };
    img.src = url;
  };

  const handleSelectStockPhotoForCurrentSlide = (url: string, title: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      handleUpdateActiveSlide({
        imgElement: img,
        imageSrc: url,
        title,
      });
      showToast(`Foto "${title}" diterapkan ke slide aktif.`);
    };
    img.src = url;
  };

  // --- BATCH IMAGE UPLOAD (Allows selecting 10, 20, 50+ photos at once) ---
  const handleUploadImages = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      showToast('Tidak ada file gambar valid yang dipilih.', true);
      return;
    }

    showToast(`Memproses ${fileArray.length} foto...`);

    const loadSingle = (file: File, index: number): Promise<Slide> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            resolve({
              id: `slide-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
              title: file.name.replace(/\.[^/.]+$/, ''),
              text: file.name.replace(/\.[^/.]+$/, ''),
              textPos: 'bottom',
              textAnim: 'fade',
              fontSize: 36,
              textColor: '#ffffff',
              hasBgBox: true,
              motion: 'kenburns',
              transition: 'crossfade',
              sfx: 'whoosh',
              gradient: ['#1e293b', '#0f172a'],
              imgElement: img,
              imageSrc: result,
              filter: { ...defaultFilter },
              transform: { ...defaultTransform },
            });
          };
          img.onerror = () => {
            resolve({
              id: `slide-${Date.now()}-${index}`,
              title: file.name,
              text: file.name,
              textPos: 'bottom',
              textAnim: 'fade',
              fontSize: 36,
              textColor: '#ffffff',
              hasBgBox: true,
              motion: 'kenburns',
              transition: 'crossfade',
              sfx: 'whoosh',
              gradient: ['#1e293b', '#0f172a'],
              imgElement: null,
              filter: { ...defaultFilter },
              transform: { ...defaultTransform },
            });
          };
          img.src = result;
        };
        reader.readAsDataURL(file);
      });
    };

    const newSlides = await Promise.all(fileArray.map((file, i) => loadSingle(file, i)));

    setSlides((prev) => {
      const combined = [...prev, ...newSlides];
      return combined;
    });

    setActiveTab('slide');
    showToast(`${newSlides.length} foto berhasil diimpor ke dalam slide video!`);
  };

  // --- MULTI-AUDIO UPLOAD & PLAYLIST TRANSITIONS ---
  const handleUploadAudios = async (files: FileList | File[], append = false) => {
    const fileArray = Array.from(files).filter(
      (f) =>
        f.type.startsWith('audio/') ||
        f.type.includes('webm') ||
        f.name.match(/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i)
    );
    if (fileArray.length === 0) {
      showToast('Pilih file audio valid (MP3, WAV, OGG, WEBM, M4A, FLAC).', true);
      return;
    }

    try {
      showToast(`Memproses ${fileArray.length} file lagu...`);
      const res = await audioEngine.loadAudioFiles(fileArray, append);
      setAudioTracks(res.tracks);
      if (fileArray.length > 0) {
        setCurrentAudioFile(fileArray[0]);
      }

      const displayName =
        res.tracks.length === 1
          ? res.tracks[0].name
          : `${res.tracks.length} Lagu Tersambung (${res.tracks.map((t) => t.name).join(', ')})`;
      setUploadedAudioName(displayName);
      setBgmPreset('upload');
      setMusicEdit((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: res.totalDuration,
        totalAudioDuration: res.totalDuration,
        waveformPeaks: res.peaks,
      }));
      setActiveTab('music');
      showToast(
        `${fileArray.length} lagu berhasil disambungkan! Total durasi playlist: ${res.totalDuration.toFixed(1)}s`
      );
      if (isPlaying) {
        audioEngine.startMusic('upload', currentTime);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memproses file lagu audio.', true);
    }
  };

  const handleUploadAudio = (file: File) => {
    handleUploadAudios([file], false);
  };

  const handleRemoveAudioTrack = async (trackId: string) => {
    try {
      const res = await audioEngine.removeTrack(trackId);
      setAudioTracks(res.tracks);
      if (res.tracks.length === 0) {
        setUploadedAudioName(null);
        setBgmPreset('lofi');
        if (isPlaying) audioEngine.startMusic('lofi', currentTime);
        showToast('Semua lagu telah dihapus dari playlist.');
      } else {
        const displayName =
          res.tracks.length === 1
            ? res.tracks[0].name
            : `${res.tracks.length} Lagu Tersambung (${res.tracks.map((t: AudioTrack) => t.name).join(', ')})`;
        setUploadedAudioName(displayName);
        setMusicEdit((prev) => ({
          ...prev,
          trimStart: 0,
          trimEnd: res.totalDuration,
          totalAudioDuration: res.totalDuration,
          waveformPeaks: res.peaks,
        }));
        showToast('Lagu berhasil dihapus dari playlist.');
        if (isPlaying) audioEngine.startMusic('upload', currentTime);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghapus lagu.', true);
    }
  };

  const handleReorderAudioTracks = async (fromIdx: number, toIdx: number) => {
    try {
      const res = await audioEngine.reorderTracks(fromIdx, toIdx);
      setAudioTracks(res.tracks);
      setMusicEdit((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: res.totalDuration,
        totalAudioDuration: res.totalDuration,
        waveformPeaks: res.peaks,
      }));
      showToast('Urutan pemutaran lagu diperbarui!');
      if (isPlaying) audioEngine.startMusic('upload', currentTime);
    } catch (err) {
      console.error(err);
      showToast('Gagal merubah urutan lagu.', true);
    }
  };

  const handleUpdateAudioTrack = async (trackId: string, updates: Partial<AudioTrack>) => {
    try {
      const res = await audioEngine.updateTrack(trackId, updates);
      setAudioTracks(res.tracks);
      setMusicEdit((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: res.totalDuration,
        totalAudioDuration: res.totalDuration,
        waveformPeaks: res.peaks,
      }));
      if (isPlaying) audioEngine.startMusic('upload', currentTime);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeMusicTransition = async (
    type: MusicTransitionType,
    duration: number
  ) => {
    setMusicTransitionType(type);
    setMusicTransitionDuration(duration);
    try {
      const res = await audioEngine.updateTransitions(type, duration);
      setAudioTracks(res.tracks);
      setMusicEdit((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: res.totalDuration,
        totalAudioDuration: res.totalDuration,
        waveformPeaks: res.peaks,
      }));
      showToast(`Transisi musik diperbarui: ${type} (${duration.toFixed(1)}s)!`);
      if (isPlaying) audioEngine.startMusic('upload', currentTime);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAllAudioTracks = async () => {
    try {
      const res = await audioEngine.clearAllTracks();
      setAudioTracks(res.tracks);
      setCurrentAudioFile(null);
      setUploadedAudioName(null);
      setBgmPreset('lofi');
      if (isPlaying) audioEngine.startMusic('lofi', currentTime);
      showToast('Seluruh playlist lagu dibersihkan.');
    } catch (err) {
      console.error(err);
    }
  };

  // --- GABUNGKAN SEMUA MUSIK MENJADI 1 MASTER AUDIO (AUDIO MERGER) ---
  const handleMergeAudioTracks = async () => {
    if (audioTracks.length === 0) {
      showToast('Tidak ada file lagu untuk digabungkan. Silakan unggah musik terlebih dahulu.', true);
      return;
    }
    try {
      const trackCount = audioTracks.length;
      showToast(`Menggabungkan ${trackCount} lagu dengan efek transisi ${musicTransitionType}...`);
      const res = await audioEngine.mergeTracksIntoSingleTrack();
      setAudioTracks(res.tracks);
      setUploadedAudioName(res.tracks[0]?.name || 'Lagu Gabungan Master');
      setMusicEdit((prev) => ({
        ...prev,
        trimStart: 0,
        trimEnd: res.totalDuration,
        totalAudioDuration: res.totalDuration,
        waveformPeaks: res.peaks,
      }));
      showToast(`Berhasil menggabungkan ${trackCount} lagu menjadi 1 trek audio master!`);
      if (isPlaying) {
        audioEngine.startMusic('upload', currentTime);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menggabungkan lagu musik.', true);
    }
  };

  // --- UNDUH AUDIO GABUNGAN DALAM FORMAT WAV ---
  const handleDownloadMergedAudio = async () => {
    if (audioTracks.length === 0) {
      showToast('Tidak ada musik untuk diunduh. Silakan unggah file musik terlebih dahulu.', true);
      return;
    }
    try {
      showToast('Menyiapkan file audio WAV 16-bit PCM kualitas studio...');
      const blob = await audioEngine.exportMergedAudioAsWav();
      if (!blob) {
        showToast('Gagal memproses file audio gabungan.', true);
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `musik_gabungan_${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File WAV musik gabungan berhasil diunduh!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh file musik.', true);
    }
  };

  // --- VIDEO EXPORT WITH EMBEDDED EQUALIZER & AUDIO ---
  const handleStartExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || slides.length === 0) {
      showToast('Tambahkan foto/slide terlebih dahulu untuk diekspor ke video!', true);
      return;
    }

    audioEngine.init();
    handleStop();

    setIsExporting(true);
    setExportProgress(0);
    setExportElapsed(0);
    recordedChunksRef.current = [];
    sfxPlayedRef.current = {};

    const totalDur =
      autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
        ? effectiveMusicDuration
        : slides.length * slideDuration;

    // Capture 30 FPS stream from canvas
    const canvasStream = canvas.captureStream(30);

    // Merge with audio destination track
    const dest = audioEngine.getStreamDestination();
    if (dest) {
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        canvasStream.addTrack(audioTrack);
      }
    }

    // MIME type selection
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    try {
      const mr = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 5000000,
      });

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mr.onstop = () => {
        setIsExporting(false);
        audioEngine.stopMusic();

        const blob = new Blob(recordedChunksRef.current, {
          type: mr.mimeType || 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `HAMA_PRO_EDITING_Video_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }, 300);

        showToast('Video MP4/WebM dengan Equalizer & Musik berhasil diunduh!');
      };

      mediaRecorderRef.current = mr;
      mr.start(100);
      audioEngine.startMusic(bgmPreset, 0);

      // Export frame render loop
      const startTime = performance.now();
      const exportLoop = (now: number) => {
        const elapsed = (now - startTime) / 1000;
        setExportElapsed(elapsed);
        const progress = Math.min(1, elapsed / totalDur);
        setExportProgress(progress);

        audioEngine.applyAudioFades(elapsed, totalDur, bgmVolume);
        renderFrame(elapsed);

        if (elapsed >= totalDur) {
          mr.stop();
        } else {
          requestAnimationFrame(exportLoop);
        }
      };

      requestAnimationFrame(exportLoop);
    } catch (err) {
      setIsExporting(false);
      showToast('Gagal memulai perekaman video.', true);
    }
  };

  const handleCancelExport = () => {
    if (isExporting && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsExporting(false);
      audioEngine.stopMusic();
      showToast('Ekspor video dibatalkan.');
    }
  };

  const activeSlide = slides[activeSlideIndex] || slides[0] || null;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col overflow-x-hidden antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Header */}
      <Header
        onClearAll={handleClearAllSlides}
        onExport={handleStartExport}
        isExporting={isExporting}
        micActive={micActive}
        onToggleMic={handleToggleMic}
        equalizerEnabled={equalizerConfig.enabled}
        onUploadAudio={handleUploadAudio}
        onUploadAudios={handleUploadAudios}
        onUploadImages={handleUploadImages}
        uploadedAudioName={uploadedAudioName}
        trackCount={audioTracks.length}
        slideCount={slides.length}
        onOpenAutoEdit={() => setShowAutoEditModal(true)}
        onOpenVercelDeploy={() => setShowVercelModal(true)}
      />

      {/* Main Studio Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden relative">
        {/* Left & Center: Canvas Video Stage & Bottom Slide Timeline */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col border-r border-slate-800 bg-slate-950 overflow-y-auto">
          <CanvasStage
            canvasRef={canvasRef}
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={totalDuration}
            activeSlideIndex={activeSlideIndex}
            totalSlides={slides.length}
            bgmVolume={bgmVolume}
            sfxVolume={sfxVolume}
            equalizerConfig={equalizerConfig}
            audioFx={audioReactiveFx}
            isExporting={isExporting}
            exportElapsed={exportElapsed}
            uploadedAudioName={uploadedAudioName}
            trackCount={audioTracks.length}
            autoMatchMusicDuration={autoMatchMusicDuration}
            onPlayPause={handleTogglePlayPause}
            onStop={handleStop}
            onPrevSlide={handlePrevSlide}
            onNextSlide={handleNextSlide}
            onSeek={handleSeek}
            onBgmVolumeChange={handleBgmVolumeChange}
            onSfxVolumeChange={handleSfxVolumeChange}
            onToggleEqualizer={() =>
              setEqualizerConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
            onToggleAudioFx={() =>
              setAudioReactiveFx((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
            lyricsEnabled={lyricsConfig.enabled}
            onToggleLyrics={() =>
              setLyricsConfig((prev) => ({ ...prev, enabled: !prev.enabled }))
            }
            onOpenLyricsTab={() => setActiveTab('lyrics')}
            onUploadAudio={handleUploadAudio}
            onUploadAudios={handleUploadAudios}
            onUploadImages={handleUploadImages}
            onAddBlankSlide={handleAddBlankSlide}
            onAddStockPhoto={handleAddStockPhoto}
          />

          <SlideTimeline
            slides={slides}
            activeSlideIndex={activeSlideIndex}
            slideDuration={slideDuration}
            currentTime={currentTime}
            uploadedAudioName={uploadedAudioName}
            audioTracks={audioTracks}
            waveformPeaks={musicEdit.waveformPeaks}
            autoMatchMusicDuration={autoMatchMusicDuration}
            effectiveMusicDuration={effectiveMusicDuration}
            onToggleAutoMatchMusicDuration={() => setAutoMatchMusicDuration((prev) => !prev)}
            onSelectSlide={(idx) => {
              setActiveSlideIndex(idx);
              const sDur =
                autoMatchMusicDuration && effectiveMusicDuration > 0 && slides.length > 0
                  ? effectiveMusicDuration / slides.length
                  : slideDuration;
              handleSeek(idx * sDur);
            }}
            onAddBlankSlide={handleAddBlankSlide}
            onAddMultipleBlankSlides={handleAddMultipleBlankSlides}
            onUploadImages={handleUploadImages}
            onUploadAudios={handleUploadAudios}
            onAddStockPhoto={handleAddStockPhoto}
            onMoveSlide={handleMoveSlide}
            onClearAll={handleClearAllSlides}
            onAutoSyncWithMusic={handleAutoSyncSlidesToMusic}
            onOpenAutoEdit={() => setShowAutoEditModal(true)}
            onSeek={handleSeek}
            onMergeTracks={handleMergeAudioTracks}
          />
        </div>

        {/* Right Sidebar: Inspector & Configuration Panel */}
        <div className="lg:col-span-4 xl:col-span-4 bg-slate-900/90 border-l border-slate-800 p-4 md:p-5 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          {/* Panel Header */}
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Panel Studio & Editing
            </h2>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded font-mono">
              Live Real-Time
            </span>
          </div>

          {/* 5 Dedicated Tabs */}
          <div className="grid grid-cols-5 rounded-xl bg-slate-950/90 p-1 border border-slate-800 gap-1">
            <button
              onClick={() => setActiveTab('slide')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                activeTab === 'slide'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Edit Gambar & Slide"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gambar</span>
            </button>

            <button
              onClick={() => setActiveTab('music')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                activeTab === 'music'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Edit Musik & Audio"
            >
              <Music className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Musik</span>
            </button>

            <button
              onClick={() => setActiveTab('lyrics')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 relative ${
                activeTab === 'lyrics'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Tools Pembaca Lirik Musik Otomatis"
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              <span className="hidden sm:inline">Lirik AI</span>
              {lyricsConfig.lines.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 absolute top-1 right-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('equalizer')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                activeTab === 'equalizer'
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Efek Video Musik & Visualizer Equalizer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">EQ & FX</span>
            </button>

            <button
              onClick={() => setActiveTab('timing')}
              className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                activeTab === 'timing'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Pengaturan Durasi & Waktu"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Durasi</span>
            </button>
          </div>

          {/* TAB 1: EDIT GAMBAR (SLIDE INSPECTOR & TRANSFORM) */}
          {activeTab === 'slide' && (
            activeSlide ? (
              <SlideInspector
                slide={activeSlide}
                slideIndex={activeSlideIndex}
                totalSlides={slides.length}
                onChange={handleUpdateActiveSlide}
                onDuplicate={handleDuplicateSlide}
                onDelete={handleDeleteSlide}
                onMoveLeft={() => handleMoveSlide(activeSlideIndex, activeSlideIndex - 1)}
                onMoveRight={() => handleMoveSlide(activeSlideIndex, activeSlideIndex + 1)}
                onSelectStockPhoto={handleSelectStockPhotoForCurrentSlide}
                canDelete={slides.length > 0}
              />
            ) : (
              <div className="bg-slate-950/70 p-6 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
                <ImageIcon className="w-10 h-10 text-slate-600 mb-1" />
                <h3 className="text-sm font-bold text-white">Belum Ada Slide Gambar</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Unggah banyak foto dari komputer Anda atau buat slide baru untuk mengatur filter visual, rotasi, dan teks pada video.
                </p>
                <div className="flex flex-col gap-2 w-full pt-2">
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.multiple = true;
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files) handleUploadImages(files);
                      };
                      input.click();
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 shadow"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <span>Unggah Banyak Foto Sekaligus</span>
                  </button>
                  <button
                    onClick={() => handleAddMultipleBlankSlides(5)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Buat 5 Slide Gradien Sekaligus</span>
                  </button>
                </div>
              </div>
            )
          )}

          {/* TAB 2: EDIT MUSIK (AUDIO TRIMMER, 3-BAND EQ, SPEED, WAVEFORM, MULTI-TRACK & TRANSITIONS & MERGE) */}
          {activeTab === 'music' && (
            <MusicEditor
              bgmPreset={bgmPreset}
              bgmVolume={bgmVolume}
              sfxVolume={sfxVolume}
              uploadedAudioName={uploadedAudioName}
              musicEdit={musicEdit}
              audioTracks={audioTracks}
              transitionType={musicTransitionType}
              transitionDuration={musicTransitionDuration}
              slideCount={slides.length}
              autoMatchMusicDuration={autoMatchMusicDuration}
              effectiveMusicDuration={effectiveMusicDuration}
              currentSlideDuration={slideDuration}
              onToggleAutoMatchMusicDuration={() => {
                const nextState = !autoMatchMusicDuration;
                setAutoMatchMusicDuration(nextState);
                if (nextState && slides.length > 0) {
                  syncSlideDurationToMusic(slides.length, effectiveMusicDuration);
                }
              }}
              onUpdateBgmPreset={(val) => {
                setBgmPreset(val);
                if (isPlaying) audioEngine.startMusic(val, currentTime);
              }}
              onUpdateBgmVolume={handleBgmVolumeChange}
              onUpdateSfxVolume={handleSfxVolumeChange}
              onUpdateMusicEdit={handleUpdateMusicEdit}
              onUploadAudios={handleUploadAudios}
              onRemoveTrack={handleRemoveAudioTrack}
              onReorderTracks={handleReorderAudioTracks}
              onUpdateTrack={handleUpdateAudioTrack}
              onChangeTransition={handleChangeMusicTransition}
              onAutoSyncSlidesToMusic={handleAutoSyncSlidesToMusic}
              onClearAllTracks={handleClearAllAudioTracks}
              onOpenAutoEdit={() => setShowAutoEditModal(true)}
              onMergeTracks={handleMergeAudioTracks}
              onDownloadMergedAudio={handleDownloadMergedAudio}
            />
          )}

          {/* TAB 3: LIRIK OTOMATIS DARI MUSIK (AI SYNCED LYRICS STUDIO) */}
          {activeTab === 'lyrics' && (
            <LyricsManager
              config={lyricsConfig}
              onChange={(updated: LyricsConfig) => setLyricsConfig(updated)}
              audioFile={currentAudioFile}
              audioTrackTitle={uploadedAudioName || 'Musik Latar'}
              totalDuration={
                autoMatchMusicDuration && effectiveMusicDuration > 0
                  ? effectiveMusicDuration
                  : totalDuration
              }
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          )}

          {/* TAB 4: VISUAL EQUALIZER & AUDIO-REACTIVE VIDEO FX */}
          {activeTab === 'equalizer' && (
            <EqualizerControls
              config={equalizerConfig}
              onChange={(updated) => setEqualizerConfig((prev) => ({ ...prev, ...updated }))}
              audioFx={audioReactiveFx}
              onUpdateAudioFx={(updated) =>
                setAudioReactiveFx((prev) => ({ ...prev, ...updated }))
              }
              currentSlideImageSrc={slides[activeSlideIndex]?.imageSrc || undefined}
            />
          )}

          {/* TAB 5: PENGATURAN DURASI & WAKTU */}
          {activeTab === 'timing' && (
            <AudioSettings
              slideDuration={slideDuration}
              transitionDuration={transitionDuration}
              bgmPreset={bgmPreset}
              bgmVolume={bgmVolume}
              sfxVolume={sfxVolume}
              uploadedAudioName={uploadedAudioName}
              micActive={micActive}
              autoMatchMusicDuration={autoMatchMusicDuration}
              effectiveMusicDuration={effectiveMusicDuration}
              slideCount={slides.length}
              onToggleAutoMatchMusicDuration={() => {
                const nextState = !autoMatchMusicDuration;
                setAutoMatchMusicDuration(nextState);
                if (nextState && slides.length > 0) {
                  syncSlideDurationToMusic(slides.length, effectiveMusicDuration);
                }
              }}
              onAutoSyncWithMusic={handleAutoSyncSlidesToMusic}
              onUpdateSlideDuration={(val) => {
                setSlideDuration(val);
                // If user manually updates slide duration, disable autoMatch to respect user preference
                setAutoMatchMusicDuration(false);
              }}
              onUpdateTransitionDuration={(val) => setTransitionDuration(val)}
              onUpdateBgmPreset={(val) => {
                setBgmPreset(val);
                if (isPlaying) audioEngine.startMusic(val, currentTime);
              }}
              onUpdateBgmVolume={handleBgmVolumeChange}
              onUpdateSfxVolume={handleSfxVolumeChange}
              onUploadAudio={handleUploadAudio}
              onToggleMic={handleToggleMic}
            />
          )}
        </div>
      </main>

      {/* Auto-Edit Studio Pro Modal */}
      <AutoEditModal
        isOpen={showAutoEditModal}
        onClose={() => setShowAutoEditModal(false)}
        slides={slides}
        audioTracks={audioTracks}
        uploadedAudioName={uploadedAudioName}
        currentSlideDuration={slideDuration}
        onApplyAutoEdit={handleApplyAutoEdit}
      />

      {/* Vercel Deploy Guide Modal */}
      <VercelDeployModal
        isOpen={showVercelModal}
        onClose={() => setShowVercelModal(false)}
      />

      {/* Export Recording Modal */}
      <ExportModal
        isOpen={isExporting}
        progress={exportProgress}
        elapsedTime={exportElapsed}
        totalTime={totalDuration}
        onCancel={handleCancelExport}
      />

      {/* Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-slate-100 text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-4 duration-200">
          {toast.isError ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
