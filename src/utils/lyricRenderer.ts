/**
 * Canvas drawing algorithms for synchronized music lyrics overlays
 * Supports 6 distinct fonts, 6 animation variants, audio reactivity, and customizable layout
 */

import { LyricsConfig } from '../types';

export function renderLyrics(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: LyricsConfig,
  currentTime: number,
  bassEnergy: number = 0
) {
  if (!config.enabled || !config.lines || config.lines.length === 0) return;

  const adjustedTime = currentTime + (config.offsetSeconds || 0);

  // Find active lyric line and index
  let activeIndex = -1;
  let activeLine = config.lines.find((line, idx) => {
    if (adjustedTime >= line.startTime && adjustedTime <= line.endTime) {
      activeIndex = idx;
      return true;
    }
    return false;
  });

  // If between lines, find upcoming line if it starts within 0.4s for smooth fade
  let transitionAlpha = 1;
  if (!activeLine) {
    const upcomingIdx = config.lines.findIndex(
      (line) => line.startTime > adjustedTime && line.startTime - adjustedTime < 0.4
    );
    if (upcomingIdx !== -1) {
      activeLine = config.lines[upcomingIdx];
      activeIndex = upcomingIdx;
      transitionAlpha = Math.max(0, 1 - (activeLine.startTime - adjustedTime) / 0.4);
    }
  }

  if (!activeLine || !activeLine.text.trim()) return;

  // Calculate progress within current line [0..1]
  const lineDuration = Math.max(0.5, activeLine.endTime - activeLine.startTime);
  const progress = Math.min(1, Math.max(0, (adjustedTime - activeLine.startTime) / lineDuration));

  // Determine text with case formatting
  let text = activeLine.text.trim();
  if (config.textCase === 'uppercase') {
    text = text.toUpperCase();
  } else if (config.textCase === 'capitalize') {
    text = text.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Determine font family
  const fontFamily = getFontFamily(config.fontStyle);
  const baseFontSize = config.fontSize || 34;

  // Calculate Y position
  let posY = height - 90;
  if (config.position === 'center') posY = height / 2;
  else if (config.position === 'top') posY = 95;
  else if (config.position === 'above-equalizer') posY = height - 175;

  const posX = width / 2;

  ctx.save();
  ctx.globalAlpha = transitionAlpha;

  // Apply Animation Variant
  switch (config.animationVariant) {
    case 'karaoke-glow':
      renderKaraokeGlow(ctx, text, posX, posY, baseFontSize, fontFamily, config, progress, bassEnergy);
      break;
    case 'neon-badge':
      renderNeonBadge(ctx, text, posX, posY, baseFontSize, fontFamily, config, bassEnergy);
      break;
    case 'cinema-sub':
      renderCinemaSub(ctx, text, posX, posY, baseFontSize, fontFamily, config);
      break;
    case 'gradient-bold':
      renderGradientBold(ctx, text, posX, posY, baseFontSize, fontFamily, config, bassEnergy);
      break;
    case 'bounce-pulse':
      renderBouncePulse(ctx, text, posX, posY, baseFontSize, fontFamily, config, bassEnergy);
      break;
    case 'typewriter-word':
      renderTypewriter(ctx, text, posX, posY, baseFontSize, fontFamily, config, progress);
      break;
  }

  ctx.restore();
}

function getFontFamily(fontStyle: string): string {
  switch (fontStyle) {
    case 'serif-cinema':
      return "'Playfair Display', 'Cinzel', serif";
    case 'cyber-tech':
      return "'Orbitron', 'JetBrains Mono', monospace";
    case 'neon-script':
      return "'Pacifico', cursive";
    case 'retro-mono':
      return "'Space Mono', 'JetBrains Mono', monospace";
    case 'pop-rounded':
      return "'Fredoka', 'Plus Jakarta Sans', sans-serif";
    case 'sans-modern':
    default:
      return "'Montserrat', 'Plus Jakarta Sans', sans-serif";
  }
}

// 1. KARAOKE GLOW (PROGRESSIVE HIGHLIGHT AS AUDIO SINGS)
function renderKaraokeGlow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  config: LyricsConfig,
  progress: number,
  bassEnergy: number
) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const startX = x - textWidth / 2;

  // Optional background container box
  if (config.showBox) {
    drawFrostedBox(ctx, x, y, textWidth + 40, fontSize + 24, config.boxBgColor || 'rgba(0, 0, 0, 0.65)');
  }

  // Base text outline and shadow
  ctx.strokeStyle = config.outlineColor || 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);

  // Dim base text
  ctx.fillStyle = config.textColor || 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(text, x, y);

  // Progressive singing highlight clipped to progress
  if (progress > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(startX - 5, y - fontSize, (textWidth + 10) * progress, fontSize * 2);
    ctx.clip();

    ctx.fillStyle = config.highlightColor || '#ec4899';
    ctx.shadowColor = config.highlightColor || '#ec4899';
    ctx.shadowBlur = 16 + bassEnergy * 15;
    ctx.fillText(text, x, y);

    ctx.restore();
  }
}

// 2. NEON BADGE (FROSTED PILL WITH GLOWING ACCENT BORDER)
function renderNeonBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  config: LyricsConfig,
  bassEnergy: number
) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const paddingX = 32;
  const paddingY = 16;
  const boxW = textWidth + paddingX * 2;
  const boxH = fontSize + paddingY * 2;

  ctx.save();
  // Frosted dark pill
  ctx.beginPath();
  ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 20);
  ctx.fillStyle = config.boxBgColor || 'rgba(10, 15, 30, 0.85)';
  ctx.fill();

  // Neon glowing border
  ctx.strokeStyle = config.highlightColor || '#06b6d4';
  ctx.lineWidth = 2.5 + bassEnergy * 2;
  ctx.shadowColor = config.highlightColor || '#06b6d4';
  ctx.shadowBlur = 14 + bassEnergy * 10;
  ctx.stroke();
  ctx.restore();

  // Text
  ctx.fillStyle = config.textColor || '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(text, x, y);
}

// 3. CINEMA SUBTITLE (CLEAN ELEGANT MOVIE SUBTITLE)
function renderCinemaSub(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  config: LyricsConfig
) {
  ctx.font = `600 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  if (config.showBox) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x - textWidth / 2 - 20, y - fontSize / 2 - 8, textWidth + 40, fontSize + 16);
  }

  // Cinematic crisp drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Delicate black outline
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3.5;
  ctx.strokeText(text, x, y);

  // Soft warm white text
  ctx.fillStyle = config.textColor || '#fffbeb';
  ctx.fillText(text, x, y);
}

// 4. GRADIENT BOLD (MULTI-STOP COLOR GRADIENT)
function renderGradientBold(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  config: LyricsConfig,
  bassEnergy: number
) {
  ctx.font = `800 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  if (config.showBox) {
    drawFrostedBox(ctx, x, y, textWidth + 36, fontSize + 20, config.boxBgColor || 'rgba(15, 23, 42, 0.75)');
  }

  // Strong outline
  ctx.strokeStyle = config.outlineColor || '#000000';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);

  // Vertical linear gradient fill
  const grad = ctx.createLinearGradient(x, y - fontSize / 2, x, y + fontSize / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, config.highlightColor || '#a855f7');
  grad.addColorStop(1, config.textColor || '#ec4899');

  ctx.fillStyle = grad;
  ctx.shadowColor = config.highlightColor || '#a855f7';
  ctx.shadowBlur = 10 + bassEnergy * 12;
  ctx.fillText(text, x, y);
}

// 5. BOUNCE PULSE (TEXT SCALES DYNAMICALLY WITH BASS DROP)
function renderBouncePulse(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  config: LyricsConfig,
  bassEnergy: number
) {
  const scale = 1 + bassEnergy * 0.14;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;

  if (config.showBox) {
    drawFrostedBox(ctx, 0, 0, textWidth + 34, fontSize + 20, config.boxBgColor || 'rgba(0, 0, 0, 0.7)');
  }

  // Glow shadow
  ctx.shadowColor = config.highlightColor || '#ec4899';
  ctx.shadowBlur = 12 + bassEnergy * 20;

  ctx.strokeStyle = config.outlineColor || 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 5;
  ctx.strokeText(text, 0, 0);

  ctx.fillStyle = config.textColor || '#ffffff';
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

// 6. TYPEWRITER (PROGRESSIVE WORD OR LETTER REVEAL)
function renderTypewriter(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fontFamily: string,
  config: LyricsConfig,
  progress: number
) {
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const visibleCharCount = Math.max(1, Math.floor(text.length * progress));
  const visibleText = text.substring(0, visibleCharCount);

  const fullMetrics = ctx.measureText(text);
  const textWidth = fullMetrics.width;

  if (config.showBox) {
    drawFrostedBox(ctx, x, y, textWidth + 36, fontSize + 20, config.boxBgColor || 'rgba(0, 0, 0, 0.7)');
  }

  // Draw typed visible text
  ctx.strokeStyle = config.outlineColor || '#000000';
  ctx.lineWidth = 4;
  ctx.strokeText(visibleText, x, y);

  ctx.fillStyle = config.textColor || '#ffffff';
  ctx.fillText(visibleText, x, y);

  // Blinking terminal cursor
  if (progress < 0.98) {
    const visMetrics = ctx.measureText(visibleText);
    const cursorX = x - textWidth / 2 + visMetrics.width + 4;
    ctx.fillStyle = config.highlightColor || '#06b6d4';
    ctx.fillRect(cursorX, y - fontSize * 0.4, 3, fontSize * 0.8);
  }
}

function drawFrostedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bgColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 12);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
