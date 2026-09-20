import React, { useRef } from 'react';
import {
  Slide,
  SFXType,
  MotionEffect,
  TransitionType,
  TextPosition,
  TextAnimation,
  FitMode,
  ImageFilterSettings,
  ImageTransformSettings,
} from '../types';
import {
  Volume2,
  Copy,
  Trash2,
  Type,
  Film,
  Sliders,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ImagePlus,
  Sparkles,
  Crop,
  ArrowLeft,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { defaultFilter, defaultTransform, sampleStockPhotos } from '../utils/slideRenderer';

interface SlideInspectorProps {
  slide: Slide;
  slideIndex: number;
  totalSlides: number;
  onChange: (updated: Partial<Slide>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSelectStockPhoto: (url: string, title: string) => void;
  canDelete: boolean;
}

export const SlideInspector: React.FC<SlideInspectorProps> = ({
  slide,
  slideIndex,
  totalSlides,
  onChange,
  onDuplicate,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onSelectStockPhoto,
  canDelete,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filter: ImageFilterSettings = slide.filter || { ...defaultFilter };
  const transform: ImageTransformSettings = slide.transform || { ...defaultTransform };

  const handlePlaySFXPreview = () => {
    audioEngine.playSFX(slide.sfx);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          onChange({
            imgElement: img,
            imageSrc: result,
            title: file.name.replace(/\.[^/.]+$/, ''),
          });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFilter = (updated: Partial<ImageFilterSettings>) => {
    onChange({ filter: { ...filter, ...updated } });
  };

  const updateTransform = (updated: Partial<ImageTransformSettings>) => {
    onChange({ transform: { ...transform, ...updated } });
  };

  const handleRotate = () => {
    const nextRot = ((transform.rotation || 0) + 90) % 360;
    updateTransform({ rotation: nextRot });
  };

  const handleFlipH = () => {
    updateTransform({ flipH: !transform.flipH });
  };

  const handleFlipV = () => {
    updateTransform({ flipV: !transform.flipV });
  };

  const handleResetFilters = () => {
    onChange({
      filter: { ...defaultFilter },
      transform: { ...defaultTransform },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Slide Navigation and Order Header */}
      <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded font-mono">
            #{slideIndex + 1}
          </span>
          <span className="text-xs font-semibold text-slate-300 truncate max-w-[140px]">
            {slide.title || `Slide ${slideIndex + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onMoveLeft}
            disabled={slideIndex === 0}
            title="Geser Slide ke Kiri"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveRight}
            disabled={slideIndex === totalSlides - 1}
            title="Geser Slide ke Kanan"
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded disabled:opacity-30 transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* IMAGE SELECTION & STOCK GALLERY */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5 text-cyan-400" />
            Gambar Slide Video
          </span>
          {slide.imageSrc && (
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/40 px-2 py-0.5 rounded">
              Gambar Aktif
            </span>
          )}
        </div>

        {/* Change Image Button & Preview */}
        <div className="flex gap-2.5 items-center">
          <div className="w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
            {slide.imageSrc ? (
              <img src={slide.imageSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">Gradien</span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              <span>Unggah Gambar Baru</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Stock Photo Presets Gallery */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Atau Pilih dari Galeri Foto Bebas Royalti:
          </span>
          <div className="grid grid-cols-5 gap-1.5">
            {sampleStockPhotos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => onSelectStockPhoto(photo.url, photo.title)}
                title={photo.title}
                className="aspect-video rounded-md overflow-hidden border border-slate-800 hover:border-cyan-400 hover:scale-105 transition-all group relative"
              >
                <img src={photo.url} alt={photo.title} className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* IMAGE EDITING: FIT & TRANSFORM */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Crop className="w-3.5 h-3.5 text-indigo-400" />
            Ukuran, Rotasi & Transformasi
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Fit Mode */}
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Penyesuaian (Fit)</label>
            <select
              value={transform.fitMode || 'cover'}
              onChange={(e) => updateTransform({ fitMode: e.target.value as FitMode })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="cover">Cover (Penuh Layar)</option>
              <option value="contain">Contain (Utuh Bersih)</option>
              <option value="fill">Fill (Regangkan)</option>
            </select>
          </div>

          {/* Zoom scale */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Skala Zoom</span>
              <span className="font-mono text-indigo-400">{(transform.zoomScale || 1.0).toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={transform.zoomScale || 1.0}
              onChange={(e) => updateTransform({ zoomScale: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Rotate and Flip Tools */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleRotate}
            className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs rounded-lg transition flex items-center justify-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Putar {transform.rotation || 0}°</span>
          </button>

          <button
            onClick={handleFlipH}
            className={`py-1.5 px-2.5 border text-xs rounded-lg transition flex items-center justify-center gap-1 ${
              transform.flipH
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
            title="Balik Horizontal"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
            <span>Flip H</span>
          </button>

          <button
            onClick={handleFlipV}
            className={`py-1.5 px-2.5 border text-xs rounded-lg transition flex items-center justify-center gap-1 ${
              transform.flipV
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
            title="Balik Vertikal"
          >
            <FlipVertical className="w-3.5 h-3.5" />
            <span>Flip V</span>
          </button>
        </div>
      </div>

      {/* IMAGE FILTERS & COLOR GRADING */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            Filter Visual & Color Grading
          </span>
          <button
            onClick={handleResetFilters}
            className="text-[10px] text-slate-400 hover:text-white transition"
          >
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Brightness */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Kecerahan (Bright)</span>
              <span className="font-mono text-purple-400">{filter.brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="5"
              value={filter.brightness}
              onChange={(e) => updateFilter({ brightness: parseInt(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Kontras</span>
              <span className="font-mono text-purple-400">{filter.contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="160"
              step="5"
              value={filter.contrast}
              onChange={(e) => updateFilter({ contrast: parseInt(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Saturation */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Kejenuhan (Saturate)</span>
              <span className="font-mono text-purple-400">{filter.saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={filter.saturation}
              onChange={(e) => updateFilter({ saturation: parseInt(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Vignette (Vignette darkening for visualizer contrast) */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Vignette Gelap</span>
              <span className="font-mono text-purple-400">{Math.round((filter.vignette ?? 0.4) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={filter.vignette ?? 0.4}
              onChange={(e) => updateFilter({ vignette: parseFloat(e.target.value) })}
              className="w-full accent-purple-500"
            />
          </div>

          {/* Warm Sepia */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Tone Hangat (Sepia)</span>
              <span className="font-mono text-amber-400">{filter.sepia || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filter.sepia || 0}
              onChange={(e) => updateFilter({ sepia: parseInt(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Grayscale (Black & White) */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-400">Hitam Putih (Mono)</span>
              <span className="font-mono text-slate-300">{filter.grayscale || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filter.grayscale || 0}
              onChange={(e) => updateFilter({ grayscale: parseInt(e.target.value) })}
              className="w-full accent-slate-400"
            />
          </div>
        </div>
      </div>

      {/* MOTION & ANIMATION DURATION */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5 text-indigo-400" />
          Efek Gerak Kanvas & Transisi
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Gerak Visual (Motion)</label>
            <select
              value={slide.motion}
              onChange={(e) => onChange({ motion: e.target.value as MotionEffect })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="kenburns">Ken Burns (Pan & Zoom)</option>
              <option value="zoomIn">Zoom In Dinamis</option>
              <option value="zoomOut">Zoom Out Halus</option>
              <option value="panLeft">Pan Geser ke Kiri</option>
              <option value="panRight">Pan Geser ke Kanan</option>
              <option value="static">Statis (Tanpa Gerak)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Jenis Transisi</label>
            <select
              value={slide.transition}
              onChange={(e) => onChange({ transition: e.target.value as TransitionType })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="crossfade">Crossfade Halus</option>
              <option value="slideLeft">Slide dari Kanan</option>
              <option value="slideRight">Slide dari Kiri</option>
              <option value="fadeBlack">Fade Lewat Gelap</option>
            </select>
          </div>
        </div>
      </div>

      {/* SUBTITLE TEXT OVERLAY */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
        <div>
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            Teks / Subtitel Slide
          </label>
          <textarea
            rows={2}
            value={slide.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition resize-none"
            placeholder="Tuliskan teks, lirik, atau pesan untuk slide ini..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Posisi Teks</label>
            <select
              value={slide.textPos}
              onChange={(e) => onChange({ textPos: e.target.value as TextPosition })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="bottom">Bawah (Subtitel)</option>
              <option value="center">Tengah (Judul Utama)</option>
              <option value="top">Atas (Header)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Animasi Teks</label>
            <select
              value={slide.textAnim}
              onChange={(e) => onChange({ textAnim: e.target.value as TextAnimation })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="fade">Fade In & Out</option>
              <option value="pop">Pop Zoom Up</option>
              <option value="slideUp">Slide Naik</option>
              <option value="typewriter">Ketik (Typewriter)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
              <span>Ukuran Font</span>
              <span className="font-mono text-indigo-400">{slide.fontSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="64"
              value={slide.fontSize}
              onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400 block mb-1">Warna & Latar</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={slide.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="w-8 h-8 rounded bg-transparent cursor-pointer border border-slate-700"
              />
              <label className="text-[11px] text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={slide.hasBgBox}
                  onChange={(e) => onChange({ hasBgBox: e.target.checked })}
                  className="rounded accent-indigo-600"
                />
                Kotak Latar
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* SFX SOUND EFFECT */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Efek Suara Transisi (SFX)
          </label>
          <button
            onClick={handlePlaySFXPreview}
            disabled={slide.sfx === 'none'}
            className="text-[10px] bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded transition flex items-center gap-1 disabled:opacity-40"
          >
            <span>Tes Dengar</span>
          </button>
        </div>

        <select
          value={slide.sfx}
          onChange={(e) => onChange({ sfx: e.target.value as SFXType })}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
        >
          <option value="whoosh">Whoosh (Deru Angin Transisi)</option>
          <option value="chime">Chime (Harmoni Nada Lembut)</option>
          <option value="pop">Pop (Ketukan Bass Singkat)</option>
          <option value="cinematic">Cinematic Hit (Sub-Bass Menggelegar)</option>
          <option value="none">Tanpa Efek Suara</option>
        </select>
      </div>

      {/* Action Buttons: Duplicate & Delete */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <button
          onClick={onDuplicate}
          className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition flex items-center gap-1.5 border border-slate-700/60"
        >
          <Copy className="w-3.5 h-3.5 text-indigo-400" />
          Duplikasi Slide
        </button>

        <button
          onClick={onDelete}
          disabled={!canDelete}
          className="px-3 py-1.5 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 rounded-lg transition flex items-center gap-1.5 disabled:opacity-40"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus Slide
        </button>
      </div>
    </div>
  );
};
