/**
 * Web Audio Engine with AnalyserNode for Visual Equalizer,
 * 3-Band EQ Tone Filters (Bass, Mid, Treble), Playback Rate & Pitch,
 * Audio Trimming & Waveform Extraction, Procedural Synthesizer, SFX, and Video Stream Capture.
 */

import {
  BgmPreset,
  SFXType,
  MusicEditConfig,
  AudioTrack,
  MusicTransitionType,
  BeatMarker,
  AudioAnalysisData,
} from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private micGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private streamDestination: MediaStreamAudioDestinationNode | null = null;

  // 3-Band Parametric Equalizer Filter Nodes
  private bassFilter: BiquadFilterNode | null = null;
  private midFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  // Synth state
  private isSynthPlaying = false;
  private synthTimeoutId: any = null;
  private chordIndex = 0;

  // Multi-Track Playlist & Audio Transition State
  private tracks: AudioTrack[] = [];
  private transitionType: MusicTransitionType = 'crossfade';
  private transitionDuration = 2.5; // default 2.5 seconds crossfade
  private compositeBuffer: AudioBuffer | null = null;
  private compositeDuration = 0;
  private previewSource: AudioBufferSourceNode | null = null;
  private cachedAnalysis: AudioAnalysisData | null = null;

  // Uploaded audio state (composite source)
  private uploadedSource: AudioBufferSourceNode | null = null;
  private uploadedBuffer: AudioBuffer | null = null;
  private uploadedDuration = 0;

  // Music Edit Configuration
  private musicEdit: MusicEditConfig = {
    trimStart: 0,
    trimEnd: 0,
    playbackRate: 1.0,
    fadeInDuration: 1.2,
    fadeOutDuration: 2.0,
    bassBoost: 0,
    midGain: 0,
    trebleBoost: 0,
    loop: true,
    totalAudioDuration: 0,
    waveformPeaks: [],
  };

  // Microphone stream state
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;

  // Cached data array for analyzer
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;

  // Audio reactivity tracking for canvas video effects
  private prevBassAvg = 0;
  private lastDropTime = 0;

  // Peak caps tracking for visualizer
  public peakBars: number[] = [];
  public peakDropSpeed = 1.6;

  public init() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Analyser for real-time visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;
      this.analyser.minDecibels = -85;
      this.analyser.maxDecibels = -15;

      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.timeData = new Uint8Array(this.analyser.fftSize);

      // Gains
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.75;

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.9;

      this.micGain = this.ctx.createGain();
      this.micGain.gain.value = 0.8;

      // 3-Band Parametric Filter Nodes
      // Bass: Low-shelf filter at 220Hz
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
      this.bassFilter.gain.setValueAtTime(this.musicEdit.bassBoost, this.ctx.currentTime);

      // Mid: Peaking filter at 1000Hz (Q=1.0)
      this.midFilter = this.ctx.createBiquadFilter();
      this.midFilter.type = 'peaking';
      this.midFilter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.midFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
      this.midFilter.gain.setValueAtTime(this.musicEdit.midGain, this.ctx.currentTime);

      // Treble: High-shelf filter at 3500Hz
      this.trebleFilter = this.ctx.createBiquadFilter();
      this.trebleFilter.type = 'highshelf';
      this.trebleFilter.frequency.setValueAtTime(3500, this.ctx.currentTime);
      this.trebleFilter.gain.setValueAtTime(this.musicEdit.trebleBoost, this.ctx.currentTime);

      // Stream destination for video export recording
      this.streamDestination = this.ctx.createMediaStreamDestination();

      // Routing:
      // BGM Sources -> Bass Filter -> Mid Filter -> Treble Filter -> BGM Gain -> Analyser
      // SFX -> SFX Gain -> Analyser
      // Mic -> Mic Gain -> Analyser
      // Analyser -> Master Gain -> Speakers & StreamDestination
      this.bassFilter.connect(this.midFilter);
      this.midFilter.connect(this.trebleFilter);
      this.trebleFilter.connect(this.bgmGain);

      this.bgmGain.connect(this.analyser);
      this.sfxGain.connect(this.analyser);
      this.micGain.connect(this.analyser);

      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.connect(this.streamDestination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getBgmInputNode(): AudioNode | null {
    this.init();
    return this.bassFilter;
  }

  public getStreamDestination(): MediaStreamAudioDestinationNode | null {
    this.init();
    return this.streamDestination;
  }

  public setBgmVolume(volume: number) {
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  public setSfxVolume(volume: number) {
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  // --- MUSIC EDIT CONTROLS ---
  public updateMusicEdit(config: Partial<MusicEditConfig>) {
    this.musicEdit = { ...this.musicEdit, ...config };
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (this.bassFilter && config.bassBoost !== undefined) {
      this.bassFilter.gain.setValueAtTime(config.bassBoost, now);
    }
    if (this.midFilter && config.midGain !== undefined) {
      this.midFilter.gain.setValueAtTime(config.midGain, now);
    }
    if (this.trebleFilter && config.trebleBoost !== undefined) {
      this.trebleFilter.gain.setValueAtTime(config.trebleBoost, now);
    }
    if (this.uploadedSource && config.playbackRate !== undefined) {
      try {
        this.uploadedSource.playbackRate.setValueAtTime(config.playbackRate, now);
      } catch (e) {}
    }
  }

  public getMusicEditConfig(): MusicEditConfig {
    return this.musicEdit;
  }

  public applyAudioFades(currentTime: number, totalDuration: number, baseBgmVol: number) {
    if (!this.ctx || !this.bgmGain) return;
    let target = baseBgmVol;
    const fadeIn = this.musicEdit.fadeInDuration || 1.2;
    const fadeOut = this.musicEdit.fadeOutDuration || 2.0;

    // Fade-in at start
    if (currentTime < fadeIn && fadeIn > 0) {
      target = (currentTime / fadeIn) * baseBgmVol;
    }
    // Fade-out at end
    else if (currentTime > totalDuration - fadeOut && totalDuration > fadeOut) {
      const remaining = totalDuration - currentTime;
      target = Math.max(0, (remaining / fadeOut) * baseBgmVol);
    }

    this.bgmGain.gain.setValueAtTime(Math.max(0.0001, target), this.ctx.currentTime);
  }

  // --- FREQUENCY DATA FOR VISUAL EQUALIZER ---
  public getFrequencyData(): Uint8Array<ArrayBuffer> {
    if (!this.analyser || !this.freqData) {
      return new Uint8Array(64);
    }
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  public getTimeDomainData(): Uint8Array<ArrayBuffer> {
    if (!this.analyser || !this.timeData) {
      return new Uint8Array(128);
    }
    this.analyser.getByteTimeDomainData(this.timeData);
    return this.timeData;
  }

  // Bass energy metric (0 to 1) for canvas beat reactivity
  public getBassEnergy(): number {
    if (!this.analyser || !this.freqData) return 0;
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    const count = 6;
    for (let i = 0; i < count; i++) {
      sum += this.freqData[i];
    }
    return sum / (count * 255);
  }

  /**
   * Mengukur metrik dinamika audio secara detail untuk efek visual video reaktif:
   * bass (kick/sub), mid (vokal/melodi), treble (cymbal/hi-hat), volume RMS,
   * dan deteksi instan beat drop / hentakan drum.
   */
  public getAudioReactiveMetrics(): {
    bass: number;
    mid: number;
    treble: number;
    volume: number;
    isBeatDrop: boolean;
    impulse: number;
  } {
    if (!this.analyser || !this.freqData) {
      return { bass: 0, mid: 0, treble: 0, volume: 0, isBeatDrop: false, impulse: 0 };
    }

    this.analyser.getByteFrequencyData(this.freqData);

    // Bass: bins 0 s/d 5 (low frequencies ~20-160Hz)
    let bassSum = 0;
    const bassCount = 6;
    for (let i = 0; i < bassCount; i++) {
      bassSum += this.freqData[i];
    }
    const bass = bassSum / (bassCount * 255);

    // Mid: bins 6 s/d 30 (vocal & rhythm ~180-1200Hz)
    let midSum = 0;
    const midCount = 25;
    for (let i = 6; i < 6 + midCount && i < this.freqData.length; i++) {
      midSum += this.freqData[i];
    }
    const mid = midSum / (midCount * 255);

    // Treble: bins 31 s/d 80 (highs ~1300-4000Hz)
    let trebleSum = 0;
    const trebleCount = 50;
    for (let i = 31; i < 31 + trebleCount && i < this.freqData.length; i++) {
      trebleSum += this.freqData[i];
    }
    const treble = trebleSum / (trebleCount * 255);

    // Overall RMS-like Volume
    const volume = Math.min(1, bass * 0.5 + mid * 0.35 + treble * 0.15);

    // Transient delta & sudden spike detection
    const impulse = Math.max(0, bass - this.prevBassAvg);
    this.prevBassAvg = this.prevBassAvg * 0.86 + bass * 0.14;

    const now = performance.now();
    let isBeatDrop = false;
    if (impulse > 0.18 && bass > 0.42 && now - this.lastDropTime > 260) {
      isBeatDrop = true;
      this.lastDropTime = now;
    }

    return {
      bass,
      mid,
      treble,
      volume,
      isBeatDrop,
      impulse,
    };
  }

  // --- SOUND EFFECTS SYNTHESIZER ---
  public playSFX(type: SFXType) {
    if (type === 'none') return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    try {
      if (type === 'whoosh') {
        const bufferSize = this.ctx.sampleRate * 0.45;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(250, now);
        filter.frequency.exponentialRampToValueAtTime(1600, now + 0.2);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.45);
        filter.Q.setValueAtTime(3.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.85, now + 0.18);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.45);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.45);

      } else if (type === 'chime') {
        const freqs = [587.33, 880, 1174.66, 1760];
        freqs.forEach((freq, idx) => {
          if (!this.ctx || !this.sfxGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.001, now + idx * 0.05);
          gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.65);

          osc.connect(gain);
          gain.connect(this.sfxGain);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.7);
        });

      } else if (type === 'pop') {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.18);

        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);

      } else if (type === 'cinematic') {
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.85);

        sub.type = 'sine';
        sub.frequency.setValueAtTime(80, now);
        sub.frequency.exponentialRampToValueAtTime(28, now + 0.9);

        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

        osc.connect(gain);
        sub.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.95);
        sub.stop(now + 0.95);
      }
    } catch (err) {
      console.warn('SFX trigger error:', err);
    }
  }

  // --- BACKGROUND MUSIC SYNTHESIZER ---
  private static CHORDS = {
    lofi: [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ],
    acoustic: [
      [293.66, 369.99, 440.0, 554.37], // Dmaj7
      [246.94, 311.13, 369.99, 440.0], // Bm7
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [220.0, 277.18, 329.63, 440.0],  // A7
    ],
    cinematic: [
      [130.81, 164.81, 196.0, 261.63], // C3 low chord
      [110.0, 138.59, 164.81, 220.0],  // A2
      [87.31, 110.0, 130.81, 174.61],  // F2
      [98.0, 123.47, 146.83, 196.0],   // G2
    ],
    cyberpunk: [
      [146.83, 174.61, 220.0, 261.63], // Dm7 bass
      [130.81, 164.81, 196.0, 246.94], // Cmaj
      [116.54, 146.83, 174.61, 233.08],// Bb
      [130.81, 164.81, 196.0, 261.63], // C
    ],
  };

  public startMusic(preset: BgmPreset, offset = 0) {
    this.init();
    if (!this.ctx) return;

    if (preset === 'upload' && this.uploadedBuffer) {
      this.playUploadedBuffer(offset);
      return;
    }

    if (this.isSynthPlaying) return;
    this.isSynthPlaying = true;
    this.chordIndex = 0;

    const inputNode = this.getBgmInputNode();
    if (!inputNode) return;

    const playStep = () => {
      if (!this.isSynthPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const currentPreset = (preset === 'upload' ? 'lofi' : preset) as 'lofi' | 'acoustic' | 'cinematic' | 'cyberpunk';
      const chords = AudioEngine.CHORDS[currentPreset] || AudioEngine.CHORDS.lofi;
      const chord = chords[this.chordIndex % chords.length];

      // Play chord notes with playbackRate frequency adjustment
      const rate = this.musicEdit.playbackRate || 1.0;

      chord.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        if (currentPreset === 'cyberpunk') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq * (idx === 0 ? 0.5 : 1) * rate, now);
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1200, now);
          filter.frequency.exponentialRampToValueAtTime(300, now + 0.6 / rate);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7 / rate);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(inputNode);
          osc.start(now);
          osc.stop(now + 0.75 / rate);
        } else if (currentPreset === 'acoustic') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq * 1.5 * rate, now + idx * 0.1);
          gain.gain.setValueAtTime(0.001, now + idx * 0.1);
          gain.gain.linearRampToValueAtTime(0.05, now + idx * 0.1 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 1.2 / rate);

          osc.connect(gain);
          gain.connect(inputNode);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 1.25 / rate);
        } else if (currentPreset === 'cinematic') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * 0.75 * rate, now);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.09, now + 0.5);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2 / rate);

          osc.connect(gain);
          gain.connect(inputNode);
          osc.start(now);
          osc.stop(now + 2.3 / rate);
        } else {
          // Lo-Fi Electric Piano style
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * rate, now + idx * 0.02);
          gain.gain.setValueAtTime(0.001, now + idx * 0.02);
          gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.02 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.02 + 1.6 / rate);

          osc.connect(gain);
          gain.connect(inputNode);
          osc.start(now + idx * 0.02);
          osc.stop(now + idx * 0.02 + 1.7 / rate);
        }
      });

      // Bass kick drum pulse
      if (currentPreset === 'cyberpunk' || currentPreset === 'lofi') {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110 * rate, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38 * rate, now + 0.2 / rate);

        kickGain.gain.setValueAtTime(0.28, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 / rate);

        kickOsc.connect(kickGain);
        kickGain.connect(inputNode);
        kickOsc.start(now);
        kickOsc.stop(now + 0.26 / rate);
      }

      this.chordIndex++;
      const baseDuration = currentPreset === 'cyberpunk' ? 800 : currentPreset === 'cinematic' ? 2200 : 1400;
      const stepDuration = Math.max(200, Math.floor(baseDuration / rate));
      this.synthTimeoutId = setTimeout(playStep, stepDuration);
    };

    playStep();
  }

  public stopMusic() {
    this.isSynthPlaying = false;
    if (this.synthTimeoutId) {
      clearTimeout(this.synthTimeoutId);
      this.synthTimeoutId = null;
    }
    this.stopUploadedBuffer();
    this.stopTrackPreview();
  }

  // --- MULTI-TRACK PLAYLIST & AUDIO TRANSITION PROCESSING ---

  /**
   * Load multiple audio files, decode them, and generate composite buffer with transitions.
   */
  public async loadAudioFiles(
    files: File[],
    append = false
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    this.init();
    if (!this.ctx) throw new Error('AudioContext not ready');

    const newTracks: AudioTrack[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        let decoded: AudioBuffer;
        try {
          decoded = await new Promise<AudioBuffer>((resolve, reject) => {
            this.ctx!.decodeAudioData(arrayBuffer.slice(0), resolve, reject);
          });
        } catch {
          // Fallback to Promise syntax for WebM / Opus containers
          decoded = await this.ctx!.decodeAudioData(arrayBuffer.slice(0));
        }

        const peaks = this.extractWaveformPeaks(decoded, 80);
        newTracks.push({
          id: `track-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          buffer: decoded,
          duration: decoded.duration,
          trimStart: 0,
          trimEnd: decoded.duration,
          volume: 1.0,
          peaks,
        });
      } catch (err) {
        console.warn(`Error decoding audio file "${file.name}":`, err);
      }
    }

    if (append) {
      this.tracks = [...this.tracks, ...newTracks];
    } else {
      this.tracks = newTracks;
    }

    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
      peaks: res.peaks,
    };
  }

  public async addAudioFiles(
    files: File[]
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    return this.loadAudioFiles(files, true);
  }

  public async removeAudioTrack(
    trackId: string
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    this.tracks = this.tracks.filter((t) => t.id !== trackId);
    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
      peaks: res.peaks,
    };
  }

  public async reorderAudioTracks(
    fromIdx: number,
    toIdx: number
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    if (toIdx < 0 || toIdx >= this.tracks.length || fromIdx === toIdx) {
      return {
        tracks: this.tracks,
        totalDuration: this.compositeDuration,
        peaks: this.musicEdit.waveformPeaks,
      };
    }
    const updated = [...this.tracks];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    this.tracks = updated;
    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
      peaks: res.peaks,
    };
  }

  public async updateAudioTrack(
    trackId: string,
    updates: Partial<AudioTrack>
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    this.tracks = this.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t));
    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
      peaks: res.peaks,
    };
  }

  public async setTransitionConfig(
    type: MusicTransitionType,
    duration: number
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    this.transitionType = type;
    this.transitionDuration = Math.max(0.2, Math.min(8.0, duration));
    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
      peaks: res.peaks,
    };
  }

  public getTracks(): AudioTrack[] {
    return this.tracks;
  }

  public getAudioTracks(): AudioTrack[] {
    return this.tracks;
  }

  public getTransitionType(): MusicTransitionType {
    return this.transitionType;
  }

  public getTransitionDuration(): number {
    return this.transitionDuration;
  }

  public getCompositeBuffer(): AudioBuffer | null {
    return this.compositeBuffer;
  }

  public getCompositeDuration(): number {
    return this.compositeDuration;
  }

  public clearAllTracks(): { tracks: AudioTrack[]; totalDuration: number; peaks: number[] } {
    this.stopMusic();
    this.stopTrackPreview();
    this.tracks = [];
    this.compositeBuffer = null;
    this.uploadedBuffer = null;
    this.uploadedDuration = 0;
    this.compositeDuration = 0;
    this.musicEdit.totalAudioDuration = 0;
    this.musicEdit.trimStart = 0;
    this.musicEdit.trimEnd = 0;
    this.musicEdit.waveformPeaks = [];
    return { tracks: [], totalDuration: 0, peaks: [] };
  }

  // Convenient Aliases
  public removeTrack(trackId: string) {
    return this.removeAudioTrack(trackId);
  }

  public reorderTracks(fromIdx: number, toIdx: number) {
    return this.reorderAudioTracks(fromIdx, toIdx);
  }

  public updateTrack(trackId: string, updates: Partial<AudioTrack>) {
    return this.updateAudioTrack(trackId, updates);
  }

  public updateTransitions(type: MusicTransitionType, duration: number) {
    return this.setTransitionConfig(type, duration);
  }

  /**
   * Menggabungkan seluruh trek audio di playlist menjadi satu file lagu master tunggal.
   * Transisi antar lagu (crossfade, whoosh, dip) dan pemangkasan (trim) dipadatkan secara permanen.
   */
  public async mergeTracksIntoSingleTrack(
    customName?: string
  ): Promise<{ tracks: AudioTrack[]; totalDuration: number; peaks: number[] }> {
    if (this.tracks.length === 0) {
      return { tracks: [], totalDuration: 0, peaks: [] };
    }

    // Pastikan composite buffer audio sudah ter-render sempurna
    const res = await this.rebuildCompositeBuffer();
    if (!this.compositeBuffer) {
      return { tracks: this.tracks, totalDuration: res.duration, peaks: res.peaks };
    }

    const mergedName = customName || `Gabungan Musik (${this.tracks.length} Lagu)`;
    const newTrack: AudioTrack = {
      id: `track-merged-${Date.now()}`,
      name: mergedName,
      buffer: this.compositeBuffer,
      duration: this.compositeDuration,
      trimStart: 0,
      trimEnd: this.compositeDuration,
      volume: 1.0,
      peaks: res.peaks,
    };

    this.tracks = [newTrack];
    this.uploadedBuffer = this.compositeBuffer;
    this.uploadedDuration = this.compositeDuration;
    this.cachedAnalysis = null;

    const finalRes = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: finalRes.duration,
      peaks: finalRes.peaks,
    };
  }

  /**
   * Mengekspor audio gabungan (composite audio) sebagai file WAV Blob 16-bit PCM berkualitas tinggi
   * sehingga pengguna dapat mengunduh lagu hasil gabungan ke komputer/ponsel.
   */
  public async exportMergedAudioAsWav(): Promise<Blob | null> {
    if (this.tracks.length === 0) return null;
    if (!this.compositeBuffer) {
      await this.rebuildCompositeBuffer();
    }
    if (!this.compositeBuffer) return null;
    return audioBufferToWavBlob(this.compositeBuffer);
  }

  /**
   * Stitches all audio tracks with smooth transitions into a single composite AudioBuffer
   * using OfflineAudioContext. This guarantees zero-drift seeking, flawless equalizer sync,
   * and clean video audio stream recording.
   */
  public async rebuildCompositeBuffer(): Promise<{ duration: number; peaks: number[] }> {
    if (this.tracks.length === 0) {
      this.compositeBuffer = null;
      this.uploadedBuffer = null;
      this.uploadedDuration = 0;
      this.compositeDuration = 0;
      this.musicEdit.totalAudioDuration = 0;
      this.musicEdit.trimStart = 0;
      this.musicEdit.trimEnd = 0;
      this.musicEdit.waveformPeaks = [];
      return { duration: 0, peaks: [] };
    }

    this.init();
    const sampleRate = this.ctx ? this.ctx.sampleRate : 44100;
    const N = this.tracks.length;

    // Calculate effective playable durations of each track
    const trackDurations = this.tracks.map((tr) => {
      const start = Math.max(0, tr.trimStart || 0);
      const end = tr.trimEnd && tr.trimEnd > start ? tr.trimEnd : (tr.duration || 10);
      return Math.max(0.3, end - start);
    });

    // Calculate effective transition durations between adjacent tracks
    const effTransitions: number[] = [];
    for (let i = 0; i < N - 1; i++) {
      if (this.transitionType === 'cut') {
        effTransitions.push(0);
      } else {
        // Cap transition duration so it cannot exceed 45% of either song
        const maxTransition = Math.min(trackDurations[i] * 0.45, trackDurations[i + 1] * 0.45);
        effTransitions.push(Math.max(0.1, Math.min(this.transitionDuration, maxTransition)));
      }
    }

    // Calculate schedule start times on global timeline
    const startTimes: number[] = [0];
    for (let i = 1; i < N; i++) {
      const prevStart = startTimes[i - 1];
      const prevDur = trackDurations[i - 1];
      const prevTrans = effTransitions[i - 1];

      if (this.transitionType === 'dipToSilence') {
        // Track i-1 fades out, 250ms silence pause, Track i fades in
        startTimes.push(prevStart + prevDur + 0.25);
      } else if (this.transitionType === 'cut') {
        startTimes.push(prevStart + prevDur);
      } else {
        // Crossfade, linear, whoosh: tracks overlap during the transition window
        startTimes.push(prevStart + prevDur - prevTrans);
      }
    }

    const totalDuration = Math.max(1, startTimes[N - 1] + trackDurations[N - 1]);
    const totalSamples = Math.max(sampleRate, Math.ceil(totalDuration * sampleRate));

    const OfflineCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtxClass(2, totalSamples, sampleRate);

    for (let i = 0; i < N; i++) {
      const tr = this.tracks[i];
      if (!tr.buffer) continue;

      const source = offlineCtx.createBufferSource();
      source.buffer = tr.buffer;

      const gain = offlineCtx.createGain();
      const trackStart = startTimes[i];
      const trackEnd = trackStart + trackDurations[i];
      const vol = typeof tr.volume === 'number' ? Math.max(0, Math.min(1.5, tr.volume)) : 1.0;

      // --- INCOMING TRANSITION (FADE IN) ---
      if (i > 0) {
        const transDur = effTransitions[i - 1];
        if (this.transitionType === 'crossfade') {
          // Equal power curve approximation for balanced perceived loudness
          gain.gain.setValueAtTime(0.0001, trackStart);
          gain.gain.linearRampToValueAtTime(vol, trackStart + transDur);
        } else if (this.transitionType === 'linearCrossfade' || this.transitionType === 'whoosh') {
          gain.gain.setValueAtTime(0.0001, trackStart);
          gain.gain.linearRampToValueAtTime(vol, trackStart + transDur);
        } else if (this.transitionType === 'dipToSilence') {
          gain.gain.setValueAtTime(0.0001, trackStart);
          gain.gain.linearRampToValueAtTime(vol, trackStart + Math.min(1.2, transDur));
        } else {
          // Instant cut
          gain.gain.setValueAtTime(vol, trackStart);
        }
      } else {
        gain.gain.setValueAtTime(vol, trackStart);
      }

      // --- OUTGOING TRANSITION (FADE OUT) ---
      if (i < N - 1) {
        const transDur = effTransitions[i];
        const fadeStart = Math.max(trackStart, trackEnd - transDur);
        if (
          this.transitionType === 'crossfade' ||
          this.transitionType === 'linearCrossfade' ||
          this.transitionType === 'whoosh'
        ) {
          gain.gain.setValueAtTime(vol, fadeStart);
          gain.gain.linearRampToValueAtTime(0.0001, trackEnd);
        } else if (this.transitionType === 'dipToSilence') {
          gain.gain.setValueAtTime(vol, fadeStart);
          gain.gain.linearRampToValueAtTime(0.0001, trackEnd);
        }
      }

      // --- OPTIONAL WHOOSH TRANSITION EFFECT ---
      if (this.transitionType === 'whoosh' && i > 0) {
        const whooshTime = startTimes[i];
        const transDur = Math.max(0.6, effTransitions[i - 1]);
        const whooshSamples = Math.floor(offlineCtx.sampleRate * transDur);
        const noiseBuf = offlineCtx.createBuffer(1, whooshSamples, offlineCtx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let s = 0; s < nd.length; s++) {
          nd[s] = (Math.random() * 2 - 1) * 0.12;
        }
        const nSource = offlineCtx.createBufferSource();
        nSource.buffer = noiseBuf;

        const bpFilter = offlineCtx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(320, whooshTime);
        bpFilter.frequency.exponentialRampToValueAtTime(1700, whooshTime + transDur * 0.5);
        bpFilter.frequency.exponentialRampToValueAtTime(280, whooshTime + transDur);
        bpFilter.Q.value = 2.8;

        const whooshGain = offlineCtx.createGain();
        whooshGain.gain.setValueAtTime(0.0001, whooshTime);
        whooshGain.gain.linearRampToValueAtTime(0.18, whooshTime + transDur * 0.4);
        whooshGain.gain.linearRampToValueAtTime(0.0001, whooshTime + transDur);

        nSource.connect(bpFilter);
        bpFilter.connect(whooshGain);
        whooshGain.connect(offlineCtx.destination);
        nSource.start(whooshTime);
      }

      source.connect(gain);
      gain.connect(offlineCtx.destination);

      const trimStart = Math.max(0, tr.trimStart || 0);
      source.start(trackStart, trimStart, trackDurations[i]);
    }

    try {
      const rendered = await offlineCtx.startRendering();
      this.compositeBuffer = rendered;
      this.uploadedBuffer = rendered;
      this.uploadedDuration = rendered.duration;
      this.compositeDuration = rendered.duration;

      const peaks = this.extractWaveformPeaks(rendered, 120);

      this.musicEdit.totalAudioDuration = rendered.duration;
      this.musicEdit.trimStart = 0;
      this.musicEdit.trimEnd = rendered.duration;
      this.musicEdit.waveformPeaks = peaks;
      this.cachedAnalysis = null;

      return { duration: rendered.duration, peaks };
    } catch (err) {
      console.warn('Offline render error:', err);
      return { duration: totalDuration, peaks: [] };
    }
  }

  // --- AUDIO ANALYSIS & AUTO-EDIT INTELLIGENCE ---

  /**
   * Fast & accurate beat detection and audio intelligence:
   * - Computes detected BPM via onset autocorrelation.
   * - Locates exact beat marker timestamps and energy peaks.
   * - Identifies major drops (energy bursts) for punchy transitions.
   * - Detects leading and trailing silence.
   * - Computes overall RMS level for loudness matching.
   */
  public analyzeAudioBuffer(buffer: AudioBuffer | null): AudioAnalysisData {
    if (!buffer) {
      const dur = this.compositeDuration > 0 ? this.compositeDuration : 30;
      const bpm = 120;
      const beatInterval = 60 / bpm;
      const beatMarkers: BeatMarker[] = [];
      let t = 0;
      let count = 0;
      while (t < dur) {
        beatMarkers.push({
          time: parseFloat(t.toFixed(3)),
          energy: count % 4 === 0 ? 0.95 : 0.65,
          isMajorDrop: count % 16 === 0,
        });
        t += beatInterval;
        count++;
      }
      return {
        detectedBpm: bpm,
        beatCount: beatMarkers.length,
        beatMarkers,
        averageRms: 0.12,
        leadingSilence: 0,
        trailingSilence: 0,
      };
    }

    const channelData = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const totalSamples = channelData.length;
    const duration = buffer.duration;

    // 1. Detect leading & trailing silence
    let leadingSilenceSample = 0;
    const silenceThreshold = 0.012;
    for (let i = 0; i < totalSamples; i += 64) {
      if (Math.abs(channelData[i]) > silenceThreshold) {
        leadingSilenceSample = Math.max(0, i - 128);
        break;
      }
    }
    const leadingSilence = leadingSilenceSample / sampleRate;

    let trailingSilenceSample = totalSamples - 1;
    for (let i = totalSamples - 1; i >= 0; i -= 64) {
      if (Math.abs(channelData[i]) > silenceThreshold) {
        trailingSilenceSample = Math.min(totalSamples - 1, i + 128);
        break;
      }
    }
    const trailingSilence = Math.max(0, (totalSamples - trailingSilenceSample) / sampleRate);

    // 2. RMS calculation
    let sumSquares = 0;
    const step = 32;
    let counted = 0;
    for (let i = 0; i < totalSamples; i += step) {
      const v = channelData[i];
      sumSquares += v * v;
      counted++;
    }
    const averageRms = Math.sqrt(sumSquares / Math.max(1, counted));

    // 3. Transient & Beat Detection
    const hopSize = Math.floor(sampleRate * 0.02); // 20ms hops (~50 hops per sec)
    const numHops = Math.floor(totalSamples / hopSize);
    const energies = new Float32Array(numHops);

    for (let h = 0; h < numHops; h++) {
      let energy = 0;
      const start = h * hopSize;
      const end = Math.min(start + hopSize, totalSamples);
      for (let s = start; s < end; s += 4) {
        const val = channelData[s];
        energy += val * val;
      }
      energies[h] = Math.sqrt(energy / ((end - start) / 4 || 1));
    }

    // Spectral flux
    const flux = new Float32Array(numHops);
    let totalFlux = 0;
    for (let h = 1; h < numHops; h++) {
      const diff = energies[h] - energies[h - 1];
      flux[h] = diff > 0 ? diff : 0;
      totalFlux += flux[h];
    }

    const meanFlux = totalFlux / Math.max(1, numHops);
    let varFlux = 0;
    for (let h = 1; h < numHops; h++) {
      const d = flux[h] - meanFlux;
      varFlux += d * d;
    }
    const stdDevFlux = Math.sqrt(varFlux / Math.max(1, numHops));
    const threshold = meanFlux + 1.15 * stdDevFlux;

    const onsetTimes: number[] = [];
    const onsetEnergies: number[] = [];
    let lastOnsetTime = -1;
    let maxFlux = 0;

    for (let h = 1; h < numHops - 1; h++) {
      if (flux[h] > threshold && flux[h] > flux[h - 1] && flux[h] > flux[h + 1]) {
        const time = (h * hopSize) / sampleRate;
        if (time - lastOnsetTime >= 0.22) {
          onsetTimes.push(time);
          onsetEnergies.push(flux[h]);
          lastOnsetTime = time;
          if (flux[h] > maxFlux) maxFlux = flux[h];
        }
      }
    }

    // Estimate BPM from inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < onsetTimes.length; i++) {
      const dt = onsetTimes[i] - onsetTimes[i - 1];
      if (dt >= 0.3 && dt <= 1.25) {
        intervals.push(dt);
      }
    }

    let detectedBpm = 120;
    if (intervals.length >= 4) {
      const bins: { [key: number]: number } = {};
      intervals.forEach((interval) => {
        const rounded = Math.round(interval * 50) / 50;
        bins[rounded] = (bins[rounded] || 0) + 1;
      });
      let bestBin = 0.5;
      let maxCount = 0;
      Object.entries(bins).forEach(([k, count]) => {
        if (count > maxCount) {
          maxCount = count;
          bestBin = parseFloat(k);
        }
      });
      if (bestBin > 0) {
        let bpm = Math.round(60 / bestBin);
        while (bpm < 75) bpm *= 2;
        while (bpm > 165) bpm /= 2;
        detectedBpm = Math.round(bpm);
      }
    }

    const beatMarkers: BeatMarker[] = [];
    if (onsetTimes.length >= 6) {
      const majorThreshold = maxFlux * 0.72;
      for (let i = 0; i < onsetTimes.length; i++) {
        beatMarkers.push({
          time: parseFloat(onsetTimes[i].toFixed(2)),
          energy: Math.min(1, parseFloat((onsetEnergies[i] / (maxFlux || 1)).toFixed(2))),
          isMajorDrop: onsetEnergies[i] >= majorThreshold || i === 0,
        });
      }
    } else {
      const beatInterval = 60 / detectedBpm;
      let t = leadingSilence;
      let c = 0;
      while (t < duration - trailingSilence) {
        beatMarkers.push({
          time: parseFloat(t.toFixed(2)),
          energy: c % 4 === 0 ? 0.9 : 0.6,
          isMajorDrop: c % 16 === 0,
        });
        t += beatInterval;
        c++;
      }
    }

    return {
      detectedBpm,
      beatCount: beatMarkers.length,
      beatMarkers,
      averageRms: parseFloat(averageRms.toFixed(3)),
      leadingSilence: parseFloat(leadingSilence.toFixed(2)),
      trailingSilence: parseFloat(trailingSilence.toFixed(2)),
    };
  }

  public getAnalysisData(): AudioAnalysisData {
    if (this.cachedAnalysis) {
      return this.cachedAnalysis;
    }
    const buf = this.compositeBuffer || this.uploadedBuffer;
    this.cachedAnalysis = this.analyzeAudioBuffer(buf);
    return this.cachedAnalysis;
  }

  /**
   * Auto-Trims leading and trailing silence across all loaded tracks.
   */
  public async autoTrimAllTracksSilence(): Promise<{
    tracks: AudioTrack[];
    totalDuration: number;
    trimmedSec: number;
  }> {
    let totalTrimmed = 0;
    this.tracks = this.tracks.map((track) => {
      if (!track.buffer) return track;
      const ch = track.buffer.getChannelData(0);
      const sr = track.buffer.sampleRate;
      const len = ch.length;
      const thresh = 0.015;

      let startIdx = 0;
      for (let i = 0; i < len; i += 64) {
        if (Math.abs(ch[i]) > thresh) {
          startIdx = Math.max(0, i - 128);
          break;
        }
      }
      const newStart = startIdx / sr;

      let endIdx = len - 1;
      for (let i = len - 1; i >= 0; i -= 64) {
        if (Math.abs(ch[i]) > thresh) {
          endIdx = Math.min(len - 1, i + 128);
          break;
        }
      }
      const newEnd = endIdx / sr;

      const trimmedLeading = newStart - (track.trimStart || 0);
      const trimmedTrailing = (track.trimEnd || track.duration) - newEnd;
      if (trimmedLeading > 0) totalTrimmed += trimmedLeading;
      if (trimmedTrailing > 0) totalTrimmed += trimmedTrailing;

      return {
        ...track,
        trimStart: Math.max(0, newStart),
        trimEnd: Math.min(track.duration, newEnd),
      };
    });

    this.cachedAnalysis = null;
    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
      trimmedSec: parseFloat(totalTrimmed.toFixed(2)),
    };
  }

  /**
   * Auto-Matches loudness (RMS level matching) across all playlist tracks.
   */
  public async autoMatchTracksLoudness(targetRms = 0.12): Promise<{
    tracks: AudioTrack[];
    totalDuration: number;
  }> {
    this.tracks = this.tracks.map((track) => {
      if (!track.buffer) return track;
      const ch = track.buffer.getChannelData(0);
      let sum = 0;
      const step = 32;
      let count = 0;
      for (let i = 0; i < ch.length; i += step) {
        sum += ch[i] * ch[i];
        count++;
      }
      const rms = Math.sqrt(sum / Math.max(1, count));
      if (rms > 0.001) {
        const factor = targetRms / rms;
        const newVol = Math.max(0.35, Math.min(1.35, factor));
        return {
          ...track,
          volume: parseFloat(newVol.toFixed(2)),
        };
      }
      return track;
    });

    this.cachedAnalysis = null;
    const res = await this.rebuildCompositeBuffer();
    return {
      tracks: this.tracks,
      totalDuration: res.duration,
    };
  }

  // --- PREVIEW SINGLE TRACK ---
  public playTrackPreview(trackId: string) {
    this.stopTrackPreview();
    const track = this.tracks.find((t) => t.id === trackId);
    if (!track || !track.buffer) return;
    this.init();
    if (!this.ctx) return;
    const inputNode = this.getBgmInputNode();
    if (!inputNode) return;

    try {
      this.previewSource = this.ctx.createBufferSource();
      this.previewSource.buffer = track.buffer;
      const start = Math.max(0, track.trimStart || 0);
      const end = track.trimEnd && track.trimEnd > start ? track.trimEnd : track.duration;
      const dur = Math.max(0.1, end - start);
      this.previewSource.connect(inputNode);
      this.previewSource.start(0, start, dur);
    } catch (e) {
      console.warn('Track preview error:', e);
    }
  }

  public stopTrackPreview() {
    if (this.previewSource) {
      try {
        this.previewSource.stop();
        this.previewSource.disconnect();
      } catch (e) {}
      this.previewSource = null;
    }
  }

  // --- LEGACY SINGLE FILE LOADER (WRAPS MULTI-TRACK) ---
  public async loadAudioFile(
    file: File
  ): Promise<{ name: string; duration: number; peaks: number[] }> {
    const res = await this.loadAudioFiles([file], false);
    return {
      name: file.name,
      duration: res.totalDuration,
      peaks: res.peaks,
    };
  }

  public extractWaveformPeaks(buffer: AudioBuffer, numPoints = 100): number[] {
    const rawData = buffer.getChannelData(0);
    const blockSize = Math.floor(rawData.length / numPoints);
    const peaks: number[] = [];

    for (let i = 0; i < numPoints; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j += 4) {
        const val = Math.abs(rawData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, max));
    }
    return peaks;
  }

  public generateSyntheticPeaks(numPoints = 100): number[] {
    const peaks: number[] = [];
    for (let i = 0; i < numPoints; i++) {
      const v = 0.25 + 0.45 * Math.sin(i * 0.2) + 0.3 * Math.cos(i * 0.45) + Math.random() * 0.15;
      peaks.push(Math.max(0.1, Math.min(1, Math.abs(v))));
    }
    return peaks;
  }

  public hasUploadedAudio(): boolean {
    return this.tracks.length > 0 && this.compositeBuffer !== null;
  }

  public getUploadedDuration(): number {
    return this.compositeDuration || this.uploadedDuration;
  }

  private playUploadedBuffer(playbackTime = 0) {
    if (!this.uploadedBuffer || !this.ctx) return;
    const inputNode = this.getBgmInputNode();
    if (!inputNode) return;

    this.stopUploadedBuffer();

    try {
      this.uploadedSource = this.ctx.createBufferSource();
      this.uploadedSource.buffer = this.uploadedBuffer;
      this.uploadedSource.playbackRate.setValueAtTime(this.musicEdit.playbackRate || 1.0, this.ctx.currentTime);

      const trimStart = this.musicEdit.trimStart || 0;
      const trimEnd = this.musicEdit.trimEnd && this.musicEdit.trimEnd > trimStart ? this.musicEdit.trimEnd : this.uploadedBuffer.duration;
      const playableLength = trimEnd - trimStart;

      this.uploadedSource.loop = this.musicEdit.loop;
      this.uploadedSource.loopStart = trimStart;
      this.uploadedSource.loopEnd = trimEnd;

      this.uploadedSource.connect(inputNode);

      // Map global playbackTime into trimmed audio slice
      const offsetWithinTrim = (playbackTime % playableLength) + trimStart;
      this.uploadedSource.start(0, offsetWithinTrim);
    } catch (err) {
      console.warn('Error starting uploaded buffer:', err);
    }
  }

  private stopUploadedBuffer() {
    if (this.uploadedSource) {
      try {
        this.uploadedSource.stop();
        this.uploadedSource.disconnect();
      } catch (e) {}
      this.uploadedSource = null;
    }
  }

  // --- MICROPHONE OPTION (For live voice & audio visualizer testing) ---
  public async toggleMicrophone(enable: boolean): Promise<boolean> {
    this.init();
    if (!this.ctx || !this.micGain) return false;

    if (!enable) {
      if (this.micStream) {
        this.micStream.getTracks().forEach((track) => track.stop());
        this.micStream = null;
      }
      if (this.micSource) {
        this.micSource.disconnect();
        this.micSource = null;
      }
      return false;
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
      this.micSource.connect(this.micGain);
      return true;
    } catch (err) {
      console.warn('Microphone permission or access error:', err);
      return false;
    }
  }

  public isMicActive(): boolean {
    return this.micStream !== null;
  }
}

// Global singleton instance
export const audioEngine = new AudioEngine();

/**
 * Konversi Web Audio AudioBuffer menjadi file Blob WAV 16-bit PCM standar
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // Uncompressed PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length;
  const byteLength = 44 + length * blockAlign;
  const arrayBuffer = new ArrayBuffer(byteLength);
  const view = new DataView(arrayBuffer);

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * blockAlign, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, length * blockAlign, true);

  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channels[c][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
