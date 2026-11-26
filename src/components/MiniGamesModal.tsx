import React, { useEffect, useState } from 'react';
import { Camera, Fish, Trophy, X } from 'lucide-react';
import { audioEngine } from '../game/audioEngine';
import { ActivitySpot } from '../types/game';

interface Props {
  spot: ActivitySpot;
  hasCameraBonus: boolean;
  hasFishingBonus: boolean;
  onComplete: (coinsEarned: number, xpEarned: number, message: string) => void;
  onClose: () => void;
}

export const MiniGamesModal: React.FC<Props> = ({
  spot,
  hasCameraBonus,
  hasFishingBonus,
  onComplete,
  onClose,
}) => {
  const [meter, setMeter] = useState(50);
  const [dir, setDir] = useState(1);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('Tap action at the green sweet spot!');
  const [finished, setFinished] = useState(false);

  // Smooth oscillating timing bar
  useEffect(() => {
    if (finished) return;
    let raf = 0;
    let last = performance.now();
    let val = meter;
    let d = dir;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const speed = 95 + round * 24;
      val += d * speed * dt;
      if (val >= 100) {
        val = 100;
        d = -1;
      } else if (val <= 0) {
        val = 0;
        d = 1;
      }
      setMeter(val);
      setDir(d);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [round, finished]);

  const handleAction = () => {
    if (finished) return;
    audioEngine.unlock();
    const distFromCenter = Math.abs(meter - 50);

    let pts = 0;
    let msg = '';
    if (distFromCenter <= 8) {
      pts = spot.type === 'cricket' ? 6 : 100;
      msg = spot.type === 'cricket' ? 'MASSIVE SIX! (+6 runs)' : spot.type === 'fishing' ? 'Giant Padma Ilish Caught!' : 'Perfect Golden-Hour Shot!';
      audioEngine.playCoin();
    } else if (distFromCenter <= 20) {
      pts = spot.type === 'cricket' ? 4 : 60;
      msg = spot.type === 'cricket' ? 'Crisp Boundary! (+4 runs)' : spot.type === 'fishing' ? 'Fresh Rui Reeled In!' : 'Clean Sharp Photo!';
      audioEngine.playClick();
    } else {
      pts = spot.type === 'cricket' ? 1 : 20;
      msg = spot.type === 'cricket' ? 'Quick Single (+1 run)' : spot.type === 'fishing' ? 'Small Tangra Fish' : 'Slightly Off-Center';
    }

    const nextScore = score + pts;
    setScore(nextScore);
    setFeedback(msg);

    if (round >= 3) {
      setFinished(true);
      const baseReward = Math.round(spot.rewardCoins * (0.45 + nextScore / (spot.type === 'cricket' ? 18 : 260)));
      const bonusMult =
        (spot.type === 'photography' && hasCameraBonus ? 1.25 : 1) *
        (spot.type === 'fishing' && hasFishingBonus ? 1.3 : 1);
      const finalCoins = Math.max(60, Math.round(baseReward * bonusMult));
      const finalXp = Math.round(finalCoins * 0.6);
      audioEngine.playMissionComplete();
      onComplete(finalCoins, finalXp, `${spot.name} complete! Earned ${finalCoins} Sa7 Coins.`);
    } else {
      setRound((r) => r + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              {spot.type === 'cricket' ? (
                <Trophy className="w-6 h-6" />
              ) : spot.type === 'fishing' ? (
                <Fish className="w-6 h-6" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-white">{spot.name}</h3>
              <p className="text-xs text-emerald-400">{spot.banglaName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-300">{spot.description}</p>

        <div className="mt-5 rounded-xl bg-slate-950 p-4 border border-slate-800">
          <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
            <span>Round {round} / 3</span>
            <span className="font-mono-num text-amber-400">
              Score: {score} {spot.type === 'cricket' ? 'Runs' : 'Pts'}
            </span>
          </div>

          {/* Timing Bar */}
          <div className="relative h-7 w-full overflow-hidden rounded-lg bg-slate-800 border border-slate-700">
            {/* Good zone */}
            <div className="absolute inset-y-0 left-[30%] w-[40%] bg-amber-500/25" />
            {/* Sweet spot */}
            <div className="absolute inset-y-0 left-[42%] w-[16%] bg-emerald-500/55" />
            {/* Moving cursor */}
            <div
              className="absolute inset-y-0 w-2 bg-white shadow-[0_0_10px_#fff]"
              style={{ left: `calc(${meter}% - 4px)` }}
            />
          </div>

          <p className="mt-3 text-center text-sm font-medium text-emerald-300 min-h-[20px]">
            {feedback}
          </p>
        </div>

        <div className="mt-5 flex gap-3">
          {!finished ? (
            <button
              type="button"
              onClick={handleAction}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-display text-base font-bold text-white shadow-lg transition-colors cursor-pointer"
            >
              {spot.type === 'cricket'
                ? 'SWING BAT!'
                : spot.type === 'fishing'
                ? 'REEL IN!'
                : 'SNAP PHOTO!'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-3 font-display text-base font-bold text-slate-950 shadow-lg transition-colors cursor-pointer"
            >
              Collect & Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
