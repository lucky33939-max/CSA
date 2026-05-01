import type { FishConfig } from './types';

export const FISH_CONFIGS: FishConfig[] = [
  {
    type: 'smallGold',
    label: 'Ca Vang',
    color: '#FBBF24',
    accentColor: '#FEF3C7',
    finColor: '#F59E0B',
    radius: 12,
    speed: 2.2,
    hp: 1,
    points: 50,
    spawnWeight: 50,
  },
  {
    type: 'blue',
    label: 'Ca Xanh',
    color: '#22D3EE',
    accentColor: '#A5F3FC',
    finColor: '#0891B2',
    radius: 22,
    speed: 1.5,
    hp: 2,
    points: 150,
    spawnWeight: 20,
  },
  {
    type: 'red',
    label: 'Ca Do',
    color: '#EF4444',
    accentColor: '#FECACA',
    finColor: '#B91C1C',
    radius: 32,
    speed: 1,
    hp: 3,
    points: 400,
    spawnWeight: 15,
  },
  {
    type: 'dragonFish',
    label: 'Ca Rong',
    color: '#A855F7',
    accentColor: '#F0ABFC',
    finColor: '#7E22CE',
    radius: 40,
    speed: 0.7,
    hp: 5,
    points: 1500,
    spawnWeight: 15,
  },
  {
    type: 'fairy',
    label: 'Tien Ca',
    color: '#F9A8D4',
    accentColor: '#FBCFE8',
    finColor: '#EC4899',
    radius: 18,
    speed: 2.6,
    hp: 1,
    points: 300,
    spawnWeight: 0,
  },
  {
    type: 'dragonBoss',
    label: 'Boss Rong',
    color: '#7C3AED',
    accentColor: '#FDE68A',
    finColor: '#EF4444',
    radius: 60,
    speed: 1.2,
    hp: 10,
    points: 5000,
    spawnWeight: 0,
  },
];

export const CANNON_POWERS = [1, 2, 3, 5, 8] as const;
export type CannonPowerLevel = (typeof CANNON_POWERS)[number];

export const CANNON_COSTS = [1, 2, 3, 5, 8] as const;

export const MAX_FISH = 24;
export const SHOOT_COOLDOWN = 180;
export const BULLET_SPEED = 14;
export const CANVAS_W = 1200;
export const CANVAS_H = 800;
