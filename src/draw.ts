import type { Bullet, Fish, FloatingText, Particle } from './types';
import { FISH_CONFIGS } from './config';

const TAU = Math.PI * 2;
const DEATH_FADE_FRAMES = 36;

function getFishConfig(type: Fish['type']) {
  const config = FISH_CONFIGS.find((fish) => fish.type === type);
  if (!config) {
    throw new Error(`Unknown fish type: ${type}`);
  }
  return config;
}

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0c4a6e');
  grad.addColorStop(0.5, '#075985');
  grad.addColorStop(1, '#0a192f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 130 + t * 0.03) % (w + 200)) - 100;
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 60, h);
    ctx.lineTo(x + 80, h);
    ctx.lineTo(x + 20, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 15; i += 1) {
    const bx = (i * 73 + t * 0.01) % w;
    const by = h - ((t * (0.3 + i * 0.05) + i * 120) % (h + 40));
    const br = 3 + (i % 4);
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();

  const floorGrad = ctx.createLinearGradient(0, h - 82, 0, h);
  floorGrad.addColorStop(0, '#0f3d2e');
  floorGrad.addColorStop(1, '#052e16');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(0, h - 70);
  for (let x = 0; x <= w; x += 40) {
    ctx.lineTo(x, h - 70 + Math.sin(x * 0.04 + t * 0.001) * 8);
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();

  for (let s = 0; s < 7; s += 1) {
    const sx = 56 + s * 136;
    drawSeaweed(ctx, sx, h - 70, t, s);
  }
}

function drawSeaweed(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, seed: number) {
  ctx.save();
  ctx.strokeStyle = seed % 2 === 0 ? '#16a34a' : '#0f766e';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const segments = 6;
  const segH = 12;
  let cx = x;
  let cy = y;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  for (let i = 0; i < segments; i += 1) {
    const wave = Math.sin(t * 0.002 + seed + i * 0.8) * 6;
    cx += wave;
    cy -= segH;
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawFish(ctx: CanvasRenderingContext2D, fish: Fish) {
  const cfg = getFishConfig(fish.type);
  const r = fish.radius;
  const alpha = fish.dead ? Math.max(0, fish.deathTimer / DEATH_FADE_FRAMES) : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(fish.x, fish.y);
