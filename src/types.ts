export type TextPosition = 'bottom' | 'center' | 'top';
export type TextAnimation = 'fade' | 'pop' | 'slideUp' | 'typewriter';
export type MotionEffect = 'kenburns' | 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight' | 'static';
export type TransitionType = 'crossfade' | 'slideLeft' | 'slideRight' | 'fadeBlack';
export type SFXType = 'whoosh' | 'chime' | 'pop' | 'cinematic' | 'none';
export type FitMode = 'cover' | 'contain' | 'fill';

export interface ImageFilterSettings {
  brightness: number; // 50 to 150 (%)
  contrast: number; // 50 to 150 (%)
  saturation: number; // 0 to 200 (%)
  sepia: number; // 0 to 100 (%)
  grayscale: number; // 0 to 100 (%)
  hueRotate: number; // 0 to 360 (deg)
  blur: number; // 0 to 10 (px)
  vignette: number; // 0 to 1 (intensity)
}

export interface ImageTransformSettings {
  fitMode: FitMode;
  rotation: number; // 0, 90, 180, 270 (deg)
  flipH: boolean;
  flipV: boolean;
  zoomScale: number; // 0.8 to 2.0
}

export interface Slide {
  id: string;
  title: string;
  text: string;
  textPos: TextPosition;
  textAnim: TextAnimation;
  fontSize: number;
  textColor: string;
  hasBgBox: boolean;
  motion: MotionEffect;
  transition: TransitionType;
  sfx: SFXType;
  bgColor?: string;
  gradient: [string, string];
  imgElement: HTMLImageElement | null;
  imageSrc?: string;
  filter?: ImageFilterSettings;
  transform?: ImageTransformSettings;
}

export type EqualizerStyle = 
  | 'bars' 
  | 'waveform' 
  | 'circular' 
  | 'mirror' 
  | 'dots'
  | 'circular-liquid'
  | 'liquid-wave'
  | 'circular-bars'
  | 'circular-neon-ring'
  | 'vinyl-disc'
  | 'particle-orbit'
  | 'cyber-radial';

export type EqualizerPosition = 'bottom' | 'center' | 'top' | 'radial-center';
export type EqualizerTheme = 
  | 'cyan-neon' 
  | 'rainbow' 
  | 'fire-amber' 
  | 'emerald' 
  | 'purple-magenta' 
  | 'white-glow';

export interface EqualizerConfig {
  enabled: boolean;
  style: EqualizerStyle;
  position: EqualizerPosition;
  theme: EqualizerTheme;
  barCount: number; // 16, 32, 64, 128
  sensitivity: number; // 0.5 to 2.5
  height: number; // in pixels (e.g. 50 to 220)
  glow: boolean;
  showPeakCaps: boolean;
  beatPulse: boolean; // bass pulse reactivity on canvas
  // Center image inside circular equalizer
  centerImageSrc?: string;
  centerImageElement?: HTMLImageElement | null;
  centerImageRotation?: boolean;
  centerImageRadius?: number; // 30 to 100 px
  centerImageBorder?: boolean;
  centerImageShape?: 'circle' | 'rounded' | 'hexagon';
}

export type BgmPreset = 'lofi' | 'acoustic' | 'cinematic' | 'cyberpunk' | 'upload';

export type MusicTransitionType = 'crossfade' | 'linearCrossfade' | 'dipToSilence' | 'cut' | 'whoosh';

export interface AudioTrack {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
  duration: number; // in seconds
  trimStart: number;
  trimEnd: number;
  volume: number; // 0 to 1
  peaks: number[];
}

export interface MusicPlaylistConfig {
  tracks: AudioTrack[];
  transitionType: MusicTransitionType;
  transitionDuration: number; // in seconds, e.g. 2.0s
  totalCombinedDuration: number;
}

export interface MusicEditConfig {
  trimStart: number; // in seconds
  trimEnd: number; // in seconds
  playbackRate: number; // 0.5 to 2.0
  fadeInDuration: number; // 0 to 5s
  fadeOutDuration: number; // 0 to 5s
  bassBoost: number; // -12 to +12 dB
  midGain: number; // -12 to +12 dB
  trebleBoost: number; // -12 to +12 dB
  loop: boolean;
  totalAudioDuration: number;
  waveformPeaks: number[];
}

export interface AudioEngineState {
  isPlaying: boolean;
  currentTime: number;
  slideDuration: number;
  transitionDuration: number;
  bgmPreset: BgmPreset;
  bgmVolume: number;
  sfxVolume: number;
  uploadedAudioName: string | null;
  uploadedAudioBuffer: AudioBuffer | null;
  micActive: boolean;
  musicEdit: MusicEditConfig;
  playlist: MusicPlaylistConfig;
}

export interface BeatMarker {
  time: number; // in seconds
  energy: number; // 0 to 1
  isMajorDrop: boolean;
}

export interface AudioAnalysisData {
  detectedBpm: number;
  beatCount: number;
  beatMarkers: BeatMarker[];
  averageRms: number;
  leadingSilence: number;
  trailingSilence: number;
}

export type AutoEditPreset = 'beatSync' | 'cinematic' | 'reelsFast' | 'completePro';

export interface AutoEditOptions {
  preset: AutoEditPreset;
  syncToBeat: boolean;
  autoTrimSilence: boolean;
  autoMatchLoudness: boolean;
  smartMotions: boolean;
  smartTransitions: boolean;
  smartSfx: boolean;
}

export interface AudioReactiveVideoFx {
  enabled: boolean;
  bassPulseZoom: boolean;
  bassShake: boolean;
  beatFlash: boolean;
  rgbSplit: boolean;
  beatParticles: boolean;
  vignettePulse: boolean;
  intensity: number;
}

export interface LyricLine {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export type LyricFontStyle =
  | 'sans-modern'      // Montserrat / Inter modern bold
  | 'serif-cinema'     // Playfair / Cinzel luxury serif
  | 'cyber-tech'       // Orbitron futuristic HUD
  | 'neon-script'      // Pacifico neon cursive
  | 'retro-mono'       // Space Mono / Terminal
  | 'pop-rounded';     // Fredoka TikTok reels pop rounded

export type LyricAnimationVariant =
  | 'karaoke-glow'     // Progressive word/line glow
  | 'neon-badge'       // Frosted card backdrop with neon border
  | 'cinema-sub'       // Clean cinematic movie subtitle
  | 'gradient-bold'    // Punchy multi-color gradient
  | 'bounce-pulse'     // Bounces rhythmically with bass
  | 'typewriter-word'; // Progressive typewriter reveal

export type LyricPosition = 'bottom' | 'center' | 'top' | 'above-equalizer';

export interface LyricsConfig {
  enabled: boolean;
  lines: LyricLine[];
  fontStyle: LyricFontStyle;
  animationVariant: LyricAnimationVariant;
  position: LyricPosition;
  fontSize: number; // 20 to 64
  textColor: string;
  highlightColor: string;
  outlineColor: string;
  showBox: boolean;
  boxBgColor: string;
  textCase: 'uppercase' | 'normal' | 'capitalize';
  offsetSeconds: number; // -5 to +5s
}
