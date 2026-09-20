import { Slide, ImageFilterSettings, ImageTransformSettings, AudioReactiveVideoFx } from '../types';

export interface AudioReactiveVideoMetrics {
  bass: number;
  mid: number;
  treble: number;
  volume: number;
  isBeatDrop: boolean;
  impulse: number;
}

export const sampleStockPhotos = [
  {
    id: 'stock-mountains',
    title: 'Pegunungan & Danau Fajar',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1280&auto=format&fit=crop&q=80',
    category: 'Alam',
  },
  {
    id: 'stock-concert',
    title: 'Panggung Konser Musik & Laser',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&auto=format&fit=crop&q=80',
    category: 'Musik',
  },
  {
    id: 'stock-cyberpunk',
    title: 'Gemerlap Kota Malam Neon',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&auto=format&fit=crop&q=80',
    category: 'Neon',
  },
  {
    id: 'stock-aurora',
    title: 'Cahaya Hijau Aurora Borealis',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1280&auto=format&fit=crop&q=80',
    category: 'Alam',
  },
  {
    id: 'stock-sunset',
    title: 'Matahari Terbenam di Pantai',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&auto=format&fit=crop&q=80',
    category: 'Sunset',
  },
];

export const defaultFilter: ImageFilterSettings = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sepia: 0,
  grayscale: 0,
  hueRotate: 0,
  blur: 0,
  vignette: 0.4,
};

export const defaultTransform: ImageTransformSettings = {
  fitMode: 'cover',
  rotation: 0,
  flipH: false,
  flipV: false,
  zoomScale: 1.0,
};

export const initialSlides: Slide[] = [
  {
    id: 'slide-1',
    title: 'Pesona Fajar Harmoni',
    text: 'Harmoni Fajar & Ritme Alam Semesta',
    textPos: 'bottom',
    textAnim: 'fade',
    fontSize: 38,
    textColor: '#ffffff',
    hasBgBox: true,
    motion: 'kenburns',
    transition: 'crossfade',
    sfx: 'whoosh',
    gradient: ['#1e1b4b', '#0284c7'],
    imgElement: null,
    filter: { ...defaultFilter },
    transform: { ...defaultTransform },
  },
  {
    id: 'slide-2',
    title: 'Sinkronisasi Audio & Visual',
    text: 'Visualizer Equalizer Real-Time & SFX',
    textPos: 'center',
    textAnim: 'pop',
    fontSize: 42,
    textColor: '#fef08a',
    hasBgBox: true,
    motion: 'zoomIn',
    transition: 'slideLeft',
    sfx: 'chime',
    gradient: ['#064e3b', '#0d9488'],
    imgElement: null,
    filter: { ...defaultFilter },
    transform: { ...defaultTransform },
  },
  {
    id: 'slide-3',
    title: 'Penutup Sinematik',
    text: 'Audio Fade Lembut & Ekspor Video Studio',
    textPos: 'bottom',
    textAnim: 'typewriter',
    fontSize: 36,
    textColor: '#ffffff',
    hasBgBox: true,
    motion: 'zoomOut',
    transition: 'fadeBlack',
    sfx: 'cinematic',
    gradient: ['#881337', '#4c1d95'],
    imgElement: null,
    filter: { ...defaultFilter },
    transform: { ...defaultTransform },
  },
];

export function buildCssFilterString(filter?: ImageFilterSettings): string {
  if (!filter) return 'none';
  const parts: string[] = [];
  if (filter.brightness !== 100) parts.push(`brightness(${filter.brightness}%)`);
  if (filter.contrast !== 100) parts.push(`contrast(${filter.contrast}%)`);
  if (filter.saturation !== 100) parts.push(`saturate(${filter.saturation}%)`);
  if (filter.sepia > 0) parts.push(`sepia(${filter.sepia}%)`);
  if (filter.grayscale > 0) parts.push(`grayscale(${filter.grayscale}%)`);
  if (filter.hueRotate > 0) parts.push(`hue-rotate(${filter.hueRotate}deg)`);
  if (filter.blur > 0) parts.push(`blur(${filter.blur}px)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function drawSlideBackground(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  width: number,
  height: number,
  progress = 0,
  motion = 'static',
  audioFx?: AudioReactiveVideoFx,
  audioMetrics?: AudioReactiveVideoMetrics
) {
  ctx.save();

  const filter = slide.filter || defaultFilter;
  const transform = slide.transform || defaultTransform;

  // Apply CSS Filter if supported by 2D canvas context
  const filterStr = buildCssFilterString(filter);
  if (filterStr !== 'none') {
    ctx.filter = filterStr;
  }

  // Base motion calculation
  let scale = transform.zoomScale || 1.0;
  let transX = 0;
  let transY = 0;

  if (motion === 'kenburns') {
    scale *= 1.0 + progress * 0.14;
    transX = progress * 24 - 12;
    transY = progress * 14 - 7;
  } else if (motion === 'zoomIn') {
    scale *= 1.0 + progress * 0.18;
  } else if (motion === 'zoomOut') {
    scale *= 1.18 - progress * 0.16;
  } else if (motion === 'panLeft') {
    transX = progress * 40 - 20;
  } else if (motion === 'panRight') {
    transX = -progress * 40 + 20;
  }

  // --- EFEK VIDEO REAKTIF MUSIK: BASS PULSE ZOOM ---
  if (audioFx?.enabled && audioFx.bassPulseZoom && audioMetrics) {
    const fxIntensity = audioFx.intensity || 1.0;
    // Denyut zoom video saat hentakan bass / kick drum
    const bassPulse = 1.0 + audioMetrics.bass * 0.09 * fxIntensity;
    scale *= bassPulse;
  }

  // --- EFEK VIDEO REAKTIF MUSIK: SCREEN SHAKE (GUNCANGAN LAYAR) ---
  if (audioFx?.enabled && audioFx.bassShake && audioMetrics && audioMetrics.bass > 0.35) {
    const fxIntensity = audioFx.intensity || 1.0;
    const shakeMag = (audioMetrics.bass - 0.35) * 16 * fxIntensity;
    transX += (Math.random() - 0.5) * shakeMag;
    transY += (Math.random() - 0.5) * shakeMag;
  }

  // Centering & Transforms
  ctx.translate(width / 2, height / 2);

  // Rotation
  if (transform.rotation) {
    ctx.rotate((transform.rotation * Math.PI) / 180);
  }

  // Flip Horizontal & Vertical
  const scaleX = transform.flipH ? -1 : 1;
  const scaleY = transform.flipV ? -1 : 1;
  ctx.scale(scale * scaleX, scale * scaleY);
  ctx.translate(-width / 2 + transX, -height / 2 + transY);

  if (slide.imgElement && slide.imgElement.complete && slide.imgElement.naturalWidth > 0) {
    const img = slide.imgElement;
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    const imgRatio = imgW / imgH;
    const canvasRatio = width / height;
    let dw: number, dh: number, dx: number, dy: number;

    if (transform.fitMode === 'contain') {
      // Fit completely inside canvas
      if (imgRatio > canvasRatio) {
        dw = width;
        dh = width / imgRatio;
        dx = 0;
        dy = (height - dh) / 2;
      } else {
        dh = height;
        dw = height * imgRatio;
        dx = (width - dw) / 2;
        dy = 0;
      }
    } else if (transform.fitMode === 'fill') {
      // Stretch to fill canvas
      dw = width;
      dh = height;
      dx = 0;
      dy = 0;
    } else {
      // 'cover' default
      if (imgRatio > canvasRatio) {
        dh = height;
        dw = height * imgRatio;
        dx = (width - dw) / 2;
        dy = 0;
      } else {
        dw = width;
        dh = width / imgRatio;
        dx = 0;
        dy = (height - dh) / 2;
      }
    }

    // Gambar gambar utama
    ctx.drawImage(img, dx, dy, dw, dh);

    // --- EFEK VIDEO REAKTIF MUSIK: RGB SPLIT GLITCH (CHROMATIC ABERRATION) ---
    if (
      audioFx?.enabled &&
      audioFx.rgbSplit &&
      audioMetrics &&
      (audioMetrics.bass > 0.42 || audioMetrics.isBeatDrop)
    ) {
      const fxIntensity = audioFx.intensity || 1.0;
      const shift = Math.min(20, (audioMetrics.bass - 0.38) * 24 * fxIntensity);
      const splitAlpha = Math.min(0.42, (audioMetrics.bass - 0.35) * 0.9 * fxIntensity);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = splitAlpha;
      // Pergeseran channel Red ke kiri
      ctx.drawImage(img, dx - shift, dy, dw, dh);
      // Pergeseran channel Cyan/Blue ke kanan
      ctx.drawImage(img, dx + shift, dy, dw, dh);
      ctx.restore();
    }
  } else {
    // Stylized gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, slide.gradient[0] || '#1e1b4b');
    grad.addColorStop(1, slide.gradient[1] || '#0284c7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.3, 300, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width * 0.18, height * 0.78, 240, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reset filter for overlays
  ctx.filter = 'none';

  // --- EFEK VIDEO REAKTIF MUSIK: VIGNETTE PULSE ---
  let vignetteIntensity = filter.vignette !== undefined ? filter.vignette : 0.4;
  if (audioFx?.enabled && audioFx.vignettePulse && audioMetrics) {
    const fxIntensity = audioFx.intensity || 1.0;
    // Tepi bingkai berdenyut mengikuti ketukan musik
    vignetteIntensity = Math.min(
      0.95,
      vignetteIntensity * (1.0 + audioMetrics.bass * 0.5 * fxIntensity)
    );
  }

  if (vignetteIntensity > 0) {
    const vignette = ctx.createLinearGradient(0, height * 0.35, 0, height);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, `rgba(0,0,0,${Math.min(0.9, vignetteIntensity * 0.8 + 0.2)})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Subtle edge radial vignette
    const radial = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
    radial.addColorStop(0, 'rgba(0,0,0,0)');
    radial.addColorStop(1, `rgba(0,0,0,${vignetteIntensity * 0.6})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

export function drawSlideText(
  ctx: CanvasRenderingContext2D,
  slide: Slide,
  width: number,
  height: number,
  progress: number
) {
  if (!slide.text || slide.text.trim() === '') return;

  ctx.save();
  ctx.filter = 'none';
  const fontSize = slide.fontSize || 38;
  ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let displayText = slide.text;
  let alpha = 1.0;
  let offsetY = 0;

  if (slide.textAnim === 'fade') {
    if (progress < 0.2) alpha = progress / 0.2;
    else if (progress > 0.85) alpha = (1 - progress) / 0.15;
  } else if (slide.textAnim === 'pop') {
    if (progress < 0.2) {
      const p = progress / 0.2;
      alpha = p;
    }
  } else if (slide.textAnim === 'slideUp') {
    if (progress < 0.25) {
      const p = progress / 0.25;
      offsetY = (1 - p) * 32;
      alpha = p;
    }
  } else if (slide.textAnim === 'typewriter') {
    const charCount = Math.floor(progress * slide.text.length * 2.2);
    displayText = slide.text.slice(0, Math.min(slide.text.length, charCount));
  }

  let y = height * 0.76;
  if (slide.textPos === 'center') y = height * 0.5;
  else if (slide.textPos === 'top') y = height * 0.2;

  y += offsetY;

  const textMetrics = ctx.measureText(displayText);
  const textWidth = textMetrics.width;
  const boxPaddingX = 22;
  const boxPaddingY = 10;

  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

  if (slide.hasBgBox) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.beginPath();
    const rx = width / 2 - textWidth / 2 - boxPaddingX;
    const ry = y - fontSize / 2 - boxPaddingY;
    const rw = textWidth + boxPaddingX * 2;
    const rh = fontSize + boxPaddingY * 2;
    ctx.roundRect(rx, ry, rw, rh, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = slide.textColor || '#ffffff';
  ctx.fillText(displayText, width / 2, y);

  ctx.restore();
}
