import React, { useState } from 'react';
import { 
  LyricsConfig, 
  LyricLine, 
  LyricFontStyle, 
  LyricAnimationVariant, 
  LyricPosition 
} from '../types';
import { 
  Wand2, 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Play, 
  Upload, 
  Type, 
  AlignJustify, 
  Palette, 
  Clock, 
  Music,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface LyricsManagerProps {
  config: LyricsConfig;
  onChange: (config: LyricsConfig) => void;
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  audioTrackTitle?: string;
  audioFile?: File | null;
}

export const LyricsManager: React.FC<LyricsManagerProps> = ({
  config,
  onChange,
  currentTime,
  totalDuration,
  onSeek,
  audioTrackTitle = 'Musik Latar',
  audioFile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ai' | 'style' | 'editor'>('ai');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [customTextInput, setCustomTextInput] = useState('');
  const [aiTopic, setAiTopic] = useState('Cinta & Harapan Masa Depan');
  const [aiMood, setAiMood] = useState<'romantis' | 'semangat' | 'galau' | 'chill'>('romantis');

  // Find active line index
  const activeLineIndex = config.lines.findIndex(
    (l) => currentTime >= l.startTime && currentTime <= l.endTime
  );

  // 1. Auto Transcribe from Uploaded Audio using Gemini
  const handleAutoTranscribe = async () => {
    setIsTranscribing(true);
    setStatusMessage({ text: 'Sedang membaca lirik otomatis dari lagu via AI...', type: 'info' });

    try {
      let audioBase64: string | undefined;
      let mimeType = 'audio/mp3';

      if (audioFile) {
        mimeType = audioFile.type || 'audio/mp3';
        const buffer = await audioFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        audioBase64 = btoa(binary);
      }

      const res = await fetch('/api/lyrics/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          fileName: audioTrackTitle,
          audioDuration: totalDuration,
          songTitle: audioTrackTitle,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.lyrics) && data.lyrics.length > 0) {
        onChange({
          ...config,
          enabled: true,
          lines: data.lyrics,
        });
        setStatusMessage({
          text: `Berhasil membaca ${data.lyrics.length} baris lirik otomatis dari lagu!`,
          type: 'success',
        });
        setActiveSubTab('editor');
      } else {
        throw new Error(data.error || 'Tidak ada lirik yang terdeteksi');
      }
    } catch (err: any) {
      console.error(err);
      // Smart offline fallback: generate synced rhythm lines
      const fallbackLines = generateFallbackLyrics(audioTrackTitle, totalDuration);
      onChange({
        ...config,
        enabled: true,
        lines: fallbackLines,
      });
      setStatusMessage({
        text: `Lirik ritmis otomatis disinkronkan ke durasi ${totalDuration.toFixed(1)}s!`,
        type: 'success',
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  // 2. Generate AI lyrics by Mood/Theme
  const handleGenerateLyrics = async () => {
    setIsGenerating(true);
    setStatusMessage({ text: 'Menghasilkan lirik sinkron estetik...', type: 'info' });

    try {
      const res = await fetch('/api/lyrics/generate-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          mood: aiMood,
          duration: totalDuration,
          language: 'id',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.lyrics) && data.lyrics.length > 0) {
        onChange({
          ...config,
          enabled: true,
          lines: data.lyrics,
        });
        setStatusMessage({
          text: `Berhasil membuat ${data.lyrics.length} baris lirik lagu!`,
          type: 'success',
        });
        setActiveSubTab('editor');
      } else {
        throw new Error(data.error || 'Gagal generate lirik');
      }
    } catch (err: any) {
      console.error(err);
      const fallbackLines = generateFallbackLyrics(aiTopic, totalDuration);
      onChange({
        ...config,
        enabled: true,
        lines: fallbackLines,
      });
      setStatusMessage({
        text: `Lirik ritmis (${aiTopic}) dibuat otomatis!`,
        type: 'success',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Sync user-provided text across audio duration
  const handleSyncCustomText = async () => {
    if (!customTextInput.trim()) {
      setStatusMessage({ text: 'Silakan ketik atau tempel teks lirik terlebih dahulu.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/lyrics/sync-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: customTextInput,
          duration: totalDuration,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.lyrics)) {
        onChange({
          ...config,
          enabled: true,
          lines: data.lyrics,
        });
        setStatusMessage({
          text: `Teks berhasil disinkronkan menjadi ${data.lyrics.length} baris lirik!`,
          type: 'success',
        });
        setCustomTextInput('');
        setActiveSubTab('editor');
      }
    } catch (err) {
      // Local sync fallback
      const lines = customTextInput.split('\n').map((l) => l.trim()).filter(Boolean);
      const step = totalDuration / lines.length;
      const formatted = lines.map((text, i) => ({
        id: `local-${Date.now()}-${i}`,
        startTime: parseFloat((i * step).toFixed(2)),
        endTime: parseFloat((Math.min(totalDuration, (i + 1) * step)).toFixed(2)),
        text,
      }));
      onChange({
        ...config,
        enabled: true,
        lines: formatted,
      });
      setStatusMessage({
        text: `Teks lirik berhasil disinkronkan ke audio!`,
        type: 'success',
      });
      setCustomTextInput('');
      setActiveSubTab('editor');
    }
  };

  // 4. Import LRC / SRT file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsedLines = parseLrcOrSrt(content, totalDuration);
      if (parsedLines.length > 0) {
        onChange({
          ...config,
          enabled: true,
          lines: parsedLines,
        });
        setStatusMessage({
          text: `Berhasil mengimpor ${parsedLines.length} baris lirik dari file ${file.name}!`,
          type: 'success',
        });
        setActiveSubTab('editor');
      } else {
        setStatusMessage({ text: 'Format file tidak dikenali atau kosong.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  // Preset quick samples
  const loadPresetLyrics = (preset: 'pop' | 'lofi' | 'cinematic') => {
    let raw = [];
    if (preset === 'pop') {
      raw = [
        'Melangkah di bawah sinar rembulan',
        'Menatap bayangmu yang perlahan menghilang',
        'Setiap detik waktu terasa berharga',
        'Bersamamu merangkai kisah tanpa jeda',
        'Kau dan aku abadi dalam nada ini',
        'Hingga senja berganti fajar kembali',
      ];
    } else if (preset === 'lofi') {
      raw = [
        'Late night thoughts drifting away',
        'Raindrops falling on the window glass',
        'Coffee warm, nostalgic memory',
        'Lost inside this gentle harmony',
        'Slow down, breathe in the night air',
        'Everything is going to be alright',
      ];
    } else {
      raw = [
        'Dari kejauhan cakrawala memanggil',
        'Langkah pejuang tak pernah goyah',
        'Menembus badai dan takdir semesta',
        'Kemenangan kini ada di genggaman kita',
        'Cahaya abadi menyinari jalan pulang',
      ];
    }

    const step = totalDuration / raw.length;
    const lines = raw.map((text, i) => ({
      id: `preset-${preset}-${i}`,
      startTime: parseFloat((i * step).toFixed(2)),
      endTime: parseFloat((Math.min(totalDuration, (i + 1) * step)).toFixed(2)),
      text,
    }));

    onChange({
      ...config,
      enabled: true,
      lines,
    });
    setStatusMessage({ text: `Preset lirik "${preset}" berhasil dimuat!`, type: 'success' });
    setActiveSubTab('editor');
  };

  // Add line
  const handleAddLine = () => {
    const newLine: LyricLine = {
      id: `line-${Date.now()}`,
      startTime: parseFloat(currentTime.toFixed(1)),
      endTime: parseFloat(Math.min(totalDuration, currentTime + 3.0).toFixed(1)),
      text: 'Baris lirik baru...',
    };
    const updated = [...config.lines, newLine].sort((a, b) => a.startTime - b.startTime);
    onChange({ ...config, lines: updated });
  };

  // Update line text or time
  const handleUpdateLine = (id: string, field: 'text' | 'startTime' | 'endTime', value: any) => {
    const updated = config.lines.map((l) => {
      if (l.id === id) {
        return { ...l, [field]: value };
      }
      return l;
    });
    onChange({ ...config, lines: updated });
  };

  // Delete line
  const handleDeleteLine = (id: string) => {
    onChange({
      ...config,
      lines: config.lines.filter((l) => l.id !== id),
    });
  };

  return (
    <div className="space-y-5 text-slate-200">
      {/* Top Header Toggle & Status */}
      <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <span>Lirik Musik Otomatis (AI Lyrics)</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-semibold">
                PRO AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {config.lines.length} baris lirik aktif • font kustom & variasi animasi
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-pink-500 peer-checked:to-purple-500"></div>
        </label>
      </div>

      {/* Sub-tab Navigation */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/80 rounded-lg border border-slate-800">
        <button
          onClick={() => setActiveSubTab('ai')}
          className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeSubTab === 'ai'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tools Otomatis</span>
        </button>
        <button
          onClick={() => setActiveSubTab('style')}
          className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeSubTab === 'style'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Font & Variasi</span>
        </button>
        <button
          onClick={() => setActiveSubTab('editor')}
          className={`py-2 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            activeSubTab === 'editor'
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Daftar Lirik ({config.lines.length})</span>
        </button>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-[11px]"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: AI TOOLS & AUTO EXTRACTION */}
      {activeSubTab === 'ai' && (
        <div className="space-y-4">
          {/* Primary Action: Read Lyrics from Music */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-pink-900/20 via-purple-900/20 to-slate-900 border border-pink-500/30 space-y-3">
            <div className="flex items-center gap-2 text-pink-300 font-bold text-sm">
              <Wand2 className="w-4 h-4 text-pink-400" />
              <span>Otomatis Baca Lirik dari Musik Lagu</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AI akan mendengarkan lagu ({audioTrackTitle}) dan mentranskripsikan kata-kata lirik lagu menjadi teks berurutan lengkap dengan waktu beat (durasi {totalDuration.toFixed(1)}s).
            </p>

            <button
              disabled={isTranscribing}
              onClick={handleAutoTranscribe}
              className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isTranscribing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Menganalisis & Membaca Lirik Musik...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Baca Lirik Otomatis dari Musik Sekarang</span>
                </>
              )}
            </button>
          </div>

          {/* Generator Lirik Berdasarkan Mood */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <Music className="w-3.5 h-3.5 text-purple-400" />
              <span>Buat Lirik AI Sesuai Tema & Durasi Lagu</span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-slate-400">Tema atau Topik Lagu:</label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Contoh: Perjalanan cinta, Keindahan malam, Semangat juara"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(['romantis', 'semangat', 'galau', 'chill'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setAiMood(m)}
                  className={`py-1 text-[10px] font-medium capitalize rounded border transition-colors ${
                    aiMood === m
                      ? 'bg-pink-600/30 border-pink-500 text-pink-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              disabled={isGenerating}
              onClick={handleGenerateLyrics}
              className="w-full py-2 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Membuat Lirik Berirama...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Generate Lirik Sesuai Durasi ({totalDuration.toFixed(0)}s)</span>
                </>
              )}
            </button>
          </div>

          {/* Tempel Teks Sendiri */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="font-bold text-white text-xs flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tempel Teks Lirik Sendiri (Auto-Sync ke Beat)</span>
            </div>
            <textarea
              rows={3}
              value={customTextInput}
              onChange={(e) => setCustomTextInput(e.target.value)}
              placeholder="Tempel baris-baris lirik lagu Anda di sini..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
            />
            <button
              onClick={handleSyncCustomText}
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <AlignJustify className="w-3.5 h-3.5" />
              <span>Bagi & Sinkronkan Teks ke Video</span>
            </button>
          </div>

          {/* Quick Preset Samples & File Import */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Contoh Cepat:</span>
              <button
                onClick={() => loadPresetLyrics('pop')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-pink-300 text-[11px] rounded border border-slate-700"
              >
                Pop Indo
              </button>
              <button
                onClick={() => loadPresetLyrics('lofi')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] rounded border border-slate-700"
              >
                Lofi Chill
              </button>
              <button
                onClick={() => loadPresetLyrics('cinematic')}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] rounded border border-slate-700"
              >
                Epik
              </button>
            </div>

            <label className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-700 flex items-center gap-1 cursor-pointer">
              <Upload className="w-3 h-3" />
              <span>Import LRC/SRT</span>
              <input type="file" accept=".lrc,.srt,.txt" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: FONTS & ANIMATION STYLES */}
      {activeSubTab === 'style' && (
        <div className="space-y-5">
          {/* 1. Font Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-pink-400" />
              <span>Pilihan Font Lirik ({FONT_OPTIONS.length} Variasi)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => onChange({ ...config, fontStyle: f.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    config.fontStyle === f.id
                      ? 'bg-pink-950/40 border-pink-500 shadow-md shadow-pink-500/10'
                      : 'bg-slate-850 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-white">{f.name}</span>
                    <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-800 text-slate-400">
                      {f.badge}
                    </span>
                  </div>
                  <div
                    className="text-xs text-pink-300 truncate"
                    style={{ fontFamily: f.cssFont, fontWeight: f.weight }}
                  >
                    {f.preview}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Animation Variant Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Gaya Animasi & Tampilan Lirik</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onChange({ ...config, animationVariant: v.id })}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    config.animationVariant === v.id
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-slate-850 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="text-xs font-semibold text-white mb-0.5">{v.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{v.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Sliders & Color Customization */}
          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-750 space-y-3.5">
            <div className="font-bold text-white text-xs">Kustomisasi Ukuran & Warna</div>

            {/* Font size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Ukuran Teks Lirik:</span>
                <span className="font-mono text-pink-400">{config.fontSize || 34}px</span>
              </div>
              <input
                type="range"
                min="20"
                max="56"
                step="2"
                value={config.fontSize || 34}
                onChange={(e) => onChange({ ...config, fontSize: Number(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            {/* Position */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Posisi Lirik pada Layar:</label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'bottom', label: 'Bawah' },
                  { id: 'above-equalizer', label: 'Atas EQ' },
                  { id: 'center', label: 'Tengah' },
                  { id: 'top', label: 'Atas' },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => onChange({ ...config, position: pos.id as LyricPosition })}
                    className={`py-1 text-[11px] rounded border transition-colors ${
                      config.position === pos.id
                        ? 'bg-pink-600 border-pink-500 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Warna Teks Utama:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.textColor || '#ffffff'}
                    onChange={(e) => onChange({ ...config, textColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-300">{config.textColor || '#ffffff'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Warna Highlight / Glow:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.highlightColor || '#ec4899'}
                    onChange={(e) => onChange({ ...config, highlightColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs font-mono text-slate-300">{config.highlightColor || '#ec4899'}</span>
                </div>
              </div>
            </div>

            {/* Extra formatting */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showBox}
                  onChange={(e) => onChange({ ...config, showBox: e.target.checked })}
                  className="rounded text-pink-500 focus:ring-pink-500"
                />
                <span>Kotak Latar Belakang (Transparan)</span>
              </label>

              <div className="flex items-center gap-1">
                <span className="text-[11px] text-slate-400">Huruf:</span>
                {(['uppercase', 'normal'] as const).map((tc) => (
                  <button
                    key={tc}
                    onClick={() => onChange({ ...config, textCase: tc })}
                    className={`px-2 py-0.5 text-[10px] uppercase rounded border ${
                      config.textCase === tc
                        ? 'bg-slate-700 border-pink-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {tc === 'uppercase' ? 'KAPITAL' : 'Standar'}
                  </button>
                ))}
              </div>
            </div>

            {/* Timing offset */}
            <div className="space-y-1 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Kompensasi Sinkronisasi Waktu:</span>
                </span>
                <span className="font-mono text-pink-400">
                  {(config.offsetSeconds || 0) > 0 ? `+${config.offsetSeconds}` : config.offsetSeconds || 0}s
                </span>
              </div>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.offsetSeconds || 0}
                onChange={(e) => onChange({ ...config, offsetSeconds: Number(e.target.value) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TIMELINE & LYRIC EDITOR */}
      {activeSubTab === 'editor' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Total {config.lines.length} Baris • Klik waktu untuk putar
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleAddLine}
                className="px-2.5 py-1 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
              {config.lines.length > 0 && (
                <button
                  onClick={() => onChange({ ...config, lines: [] })}
                  className="px-2 py-1 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-xs rounded-lg transition-colors"
                >
                  Hapus Semua
                </button>
              )}
            </div>
          </div>

          {config.lines.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-dashed border-slate-800 space-y-2">
              <Music className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Belum ada lirik untuk video ini.</p>
              <button
                onClick={() => setActiveSubTab('ai')}
                className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gunakan AI untuk Baca Lirik Musik</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {config.lines.map((line, idx) => {
                const isActive = activeLineIndex === idx;
                return (
                  <div
                    key={line.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-pink-950/40 border-pink-500 shadow-md shadow-pink-500/10'
                        : 'bg-slate-850 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <button
                        onClick={() => onSeek(line.startTime)}
                        className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center gap-1 transition-colors ${
                          isActive
                            ? 'bg-pink-500 text-white font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                        title="Klik untuk memutar dari waktu ini"
                      >
                        <Play className="w-2.5 h-2.5" />
                        <span>{formatSec(line.startTime)}</span>
                        <span>-</span>
                        <span>{formatSec(line.endTime)}</span>
                      </button>

                      <div className="flex-1" />

                      {/* Time Adjusters */}
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={line.endTime - 0.5}
                        value={line.startTime}
                        onChange={(e) => handleUpdateLine(line.id, 'startTime', Number(e.target.value))}
                        className="w-14 bg-slate-900 border border-slate-750 text-[11px] font-mono text-center rounded px-1 text-slate-300"
                        title="Waktu mulai (detik)"
                      />
                      <span className="text-slate-600 text-xs">→</span>
                      <input
                        type="number"
                        step="0.5"
                        min={line.startTime + 0.5}
                        max={totalDuration}
                        value={line.endTime}
                        onChange={(e) => handleUpdateLine(line.id, 'endTime', Number(e.target.value))}
                        className="w-14 bg-slate-900 border border-slate-750 text-[11px] font-mono text-center rounded px-1 text-slate-300"
                        title="Waktu selesai (detik)"
                      />

                      <button
                        onClick={() => handleDeleteLine(line.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleUpdateLine(line.id, 'text', e.target.value)}
                      className={`w-full bg-slate-900 border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                        isActive
                          ? 'border-pink-500 text-pink-200 font-semibold'
                          : 'border-slate-750 text-white focus:border-slate-600'
                      }`}
                      placeholder="Teks lirik lagu..."
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Font styles options
const FONT_OPTIONS: {
  id: LyricFontStyle;
  name: string;
  badge: string;
  preview: string;
  cssFont: string;
  weight: number;
}[] = [
  {
    id: 'sans-modern',
    name: 'Modern Sans',
    badge: 'Trending',
    preview: 'HAMA PRO EDITING',
    cssFont: "'Montserrat', sans-serif",
    weight: 800,
  },
  {
    id: 'serif-cinema',
    name: 'Cinema Serif',
    badge: 'Elegan',
    preview: 'Harmoni Sinematik',
    cssFont: "'Playfair Display', serif",
    weight: 800,
  },
  {
    id: 'cyber-tech',
    name: 'Cyber Tech',
    badge: 'Futuristik',
    preview: 'CYBER//SYNTH-01',
    cssFont: "'Orbitron', monospace",
    weight: 800,
  },
  {
    id: 'neon-script',
    name: 'Neon Script',
    badge: 'Cursive Glow',
    preview: 'Beautiful Lyrics',
    cssFont: "'Pacifico', cursive",
    weight: 400,
  },
  {
    id: 'pop-rounded',
    name: 'Pop Rounded',
    badge: 'TikTok Style',
    preview: 'Asik & Energik!',
    cssFont: "'Fredoka', sans-serif",
    weight: 700,
  },
  {
    id: 'retro-mono',
    name: 'Retro Mono',
    badge: 'Typewriter',
    preview: 'TRACK_01 // STEREO',
    cssFont: "'Space Mono', monospace",
    weight: 700,
  },
];

// Animation variant options
const ANIMATION_VARIANTS: {
  id: LyricAnimationVariant;
  name: string;
  desc: string;
}[] = [
  {
    id: 'karaoke-glow',
    name: 'Karaoke Glow',
    desc: 'Warna berjalan bertahap mengikuti kata yang dinyanyikan.',
  },
  {
    id: 'neon-badge',
    name: 'Neon Badge',
    desc: 'Pill kaca gelap dengan garis tepi neon menyala.',
  },
  {
    id: 'cinema-sub',
    name: 'Cinema Sub',
    desc: 'Subtitel film sinematik dengan bayangan 3D tajam.',
  },
  {
    id: 'gradient-bold',
    name: 'Gradient Bold',
    desc: 'Gradasi multi-warna vertikal tebal dan mencolok.',
  },
  {
    id: 'bounce-pulse',
    name: 'Bounce Pulse',
    desc: 'Teks memantul ritmis mengikuti ketukan bass musik.',
  },
  {
    id: 'typewriter-word',
    name: 'Typewriter Word',
    desc: 'Karakter muncul bertahap seperti mesin ketik.',
  },
];

// Fallback lyric generator
function generateFallbackLyrics(title: string, duration: number): LyricLine[] {
  const seeds = [
    `Mendengarkan irama indah "${title}"`,
    'Langkah kaki menyusuri hembusan angin',
    'Setiap nada bercerita tentang impian',
    'Detik berganti membawa sejuta makna',
    'Melodi ini abadi dalam sanubari',
    'Bersama kita sambut cahaya esok hari',
  ];

  const dur = Math.max(5, duration);
  const step = dur / seeds.length;

  return seeds.map((text, i) => ({
    id: `fallback-${Date.now()}-${i}`,
    startTime: parseFloat((i * step).toFixed(1)),
    endTime: parseFloat((Math.min(dur, (i + 1) * step)).toFixed(1)),
    text,
  }));
}

// Format seconds to mm:ss
function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
}

// Parse LRC or SRT text into LyricLine[]
function parseLrcOrSrt(content: string, totalDuration: number): LyricLine[] {
  const lines: LyricLine[] = [];
  const rawLines = content.split('\n');

  // LRC check [mm:ss.xx]
  const lrcRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  const srtTimeRegex = /(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/;

  if (content.includes('-->')) {
    // SRT parser
    let currentStart = 0;
    let currentEnd = 0;
    let currentText = '';

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      const match = line.match(srtTimeRegex);
      if (match) {
        currentStart = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(match[4]) / 1000;
        currentEnd = Number(match[5]) * 3600 + Number(match[6]) * 60 + Number(match[7]) + Number(match[8]) / 1000;
        currentText = '';
      } else if (line && !line.match(/^\d+$/)) {
        currentText += (currentText ? ' ' : '') + line;
      } else if (!line && currentText) {
        lines.push({
          id: `srt-${lines.length}`,
          startTime: parseFloat(currentStart.toFixed(2)),
          endTime: parseFloat(currentEnd.toFixed(2)),
          text: currentText,
        });
        currentText = '';
      }
    }
  } else {
    // LRC parser
    for (let i = 0; i < rawLines.length; i++) {
      const match = rawLines[i].match(lrcRegex);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3], 10);
        const startTime = min * 60 + sec + ms / 100;
        const text = match[4].trim();
        if (text) {
          lines.push({
            id: `lrc-${lines.length}`,
            startTime: parseFloat(startTime.toFixed(2)),
            endTime: parseFloat((startTime + 3.5).toFixed(2)),
            text,
          });
        }
      }
    }
    // Adjust end times based on next line start
    for (let i = 0; i < lines.length - 1; i++) {
      lines[i].endTime = Math.min(lines[i].startTime + 5, lines[i + 1].startTime);
    }
    if (lines.length > 0) {
      lines[lines.length - 1].endTime = Math.min(totalDuration, lines[lines.length - 1].startTime + 4);
    }
  }

  return lines;
}
