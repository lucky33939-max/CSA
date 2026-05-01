import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { Bullet, Fish, GameState, GameStats, Vec2 } from './types';
import {
  BULLET_SPEED,
  CANVAS_H,
  CANVAS_W,
  CANNON_COSTS,
  CANNON_POWERS,
  FISH_CONFIGS,
  MAX_FISH,
  SHOOT_COOLDOWN,
} from './config';
import {
  drawBackground,
  drawBullet,
  drawCannon,
  drawFish,
  drawFloatingText,
  drawParticle,
} from './draw';

const CANNON_X = CANVAS_W / 2;
const CANNON_Y = CANVAS_H - 50;
const DEATH_FADE_FRAMES = 36;
const COMBO_WINDOW = 1000;

function makeInitialState(): GameState {
  return {
    score: 0,
    coins: 100,
    cannonAngle: -Math.PI / 2,
    cannonPower: CANNON_POWERS[0],
    bullets: [],
    fish: [],
    particles: [],
    floatingTexts: [],
    nextId: 1,
    running: true,
    level: 1,
    fishKilled: 0,
    shootCooldown: 0,
    combo: 0,
    comboTimer: 0,
    wave: 0,
    bulletsFired: 0,
    hits: 0,
  };
}

function pickWeighted(): Fish['type'] {
  const spawnableConfigs = FISH_CONFIGS.filter((config) => config.spawnWeight > 0);
  const total = spawnableConfigs.reduce((sum, config) => sum + config.spawnWeight, 0);
  let roll = Math.random() * total;

  for (const config of spawnableConfigs) {
    roll -= config.spawnWeight;
    if (roll <= 0) {
      return config.type;
    }
  }

  return 'smallGold';
}

function getFishConfig(type: Fish['type']) {
  const config = FISH_CONFIGS.find((fish) => fish.type === type);
  if (!config) {
    throw new Error(`Unknown fish type: ${type}`);
  }
  return config;
}

function spawnFish(id: number, level: number, forcedType?: Fish['type'], forcedPosition?: Vec2): Fish {
  const type = forcedType ?? pickWeighted();
  const config = getFishConfig(type);
  const fromLeft = forcedPosition ? false : Math.random() > 0.5;
  const y = forcedPosition?.y ?? config.radius + 88 + Math.random() * (CANVAS_H - 210 - config.radius * 2);
  const speedBoost = 1 + Math.min(0.42, (level - 1) * 0.035);
  const speed = config.speed * speedBoost * (0.84 + Math.random() * 0.34);

  return {
    id,
    type,
    x: forcedPosition?.x ?? (fromLeft ? -config.radius : CANVAS_W + config.radius),
    y,
    vx: fromLeft ? speed : -speed,
    vy: 0,
    angle: 0,
    hp: config.hp,
    maxHp: config.hp,
    radius: config.radius,
    points: config.points,
    dead: false,
    deathTimer: 0,
    waveOffset: Math.random() * Math.PI * 2,
    waveAmp: 0.3 + Math.random() * 0.4,
    waveFreq: 0.8 + Math.random() * 0.8,
    animFrame: 0,
    animTimer: 0,
    tailAngle: 0,
