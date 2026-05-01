import { useCallback, useRef, useState } from 'react';
import { Coins, Crosshair, Fish, Flame, Gauge, RotateCcw, Trophy, Waves, Zap } from 'lucide-react';
import { CANVAS_H, CANVAS_W, CANNON_COSTS, CANNON_POWERS, FISH_CONFIGS } from './config';
import type { GameStats } from './types';
import { useGameLoop } from './useGameLoop';

const initialStats: GameStats = {
  score: 0,
  coins: 100,
  level: 1,
  wave: 0,
  combo: 0,
  remainingFish: 0,
  bulletsFired: 0,
  hits: 0,
  accuracy: 0,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stats, setStats] = useState<GameStats>(initialStats);
  const [powerLevel, setPowerLevelState] = useState(0);

  const handleStatsUpdate = useCallback((nextStats: GameStats) => {
    setStats(nextStats);
  }, []);

  const { resetGame, setPowerLevel } = useGameLoop(canvasRef, handleStatsUpdate);

  const handlePowerChange = (level: number) => {
    setPowerLevelState(level);
    setPowerLevel(level);
  };

  const handleReset = () => {
    setPowerLevelState(0);
    setPowerLevel(0);
    setStats(initialStats);
    resetGame();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#06131b] text-slate-50">
      <div className="fixed inset-0 bg-[linear-gradient(180deg,#082234_0%,#093c4a_42%,#07131a_100%)]" />
      <div className="fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-5">
        <header className="flex w-full max-w-[1200px] items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-lg border border-cyan-200/30 bg-cyan-300/10 shadow-lg shadow-cyan-950/40">
              <Fish className="h-7 w-7 text-cyan-200" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-4xl font-black leading-none text-white sm:text-5xl">
                BAN CA
              </h1>
              <p className="mt-1 text-sm font-bold uppercase text-amber-300">
                Ocean Hunter
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="grid h-11 w-11 place-items-center rounded-lg border border-white/10 bg-white/10 text-cyan-100 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-amber-300"
            aria-label="Reset run"
            title="Reset run"
          >
            <RotateCcw className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <section
          className="relative w-full max-w-[1200px] overflow-hidden rounded-lg border border-cyan-200/25 bg-slate-950 shadow-cabinet"
          aria-label="Ban Ca game board"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/75 to-transparent px-3 py-3">
            <div className="flex min-h-9 items-center gap-2 rounded-lg border border-cyan-200/20 bg-black/45 px-3 py-1.5 shadow-lg shadow-black/20 backdrop-blur-md">
              <Trophy className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <span className="text-sm font-black text-white">{stats.score.toLocaleString()}</span>
            </div>

            <div className="hidden min-h-9 items-center gap-3 rounded-lg border border-cyan-200/15 bg-cyan-950/40 px-3 py-1.5 text-xs font-bold text-cyan-100 backdrop-blur-md sm:flex">
              <span className="flex items-center gap-1.5">
                <Waves className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                Wave {stats.wave || 1}
              </span>
              <span className="h-4 w-px bg-cyan-100/20" />
              <span>Lv {stats.level}</span>
              {stats.combo > 1 && (
                <>
                  <span className="h-4 w-px bg-cyan-100/20" />
                  <span className="flex items-center gap-1.5 text-rose-200">
                    <Flame className="h-4 w-4 text-rose-300" aria-hidden="true" />
                    {stats.combo}x
                  </span>
                </>
              )}
            </div>
