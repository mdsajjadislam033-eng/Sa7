import React, { useEffect, useRef, useState } from 'react';
import {
  Backpack,
  Car,
  CloudRain,
  Compass,
  Map as MapIcon,
  Pause,
  ShoppingBag,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { ROAD_SEGMENTS, WATER_ZONES } from '../data/worldMap';
import { Sa7GameEngine } from '../game/gameEngine';
import { ActiveModal, HudSnapshot } from '../types/game';

interface GameHUDProps {
  hud: HudSnapshot;
  engineRef: React.MutableRefObject<Sa7GameEngine | null>;
  showTouchControls: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpenModal: (modal: ActiveModal) => void;
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  hud,
  engineRef,
  showTouchControls,
  muted,
  onToggleMute,
  onOpenModal,
  onPause,
}) => {
  const miniMapRef = useRef<HTMLCanvasElement | null>(null);

  // Virtual joystick state
  const joyBaseRef = useRef<HTMLDivElement | null>(null);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyPointerId = useRef<number | null>(null);

  // Right-side camera swipe state
  const swipePointerId = useRef<number | null>(null);
  const lastSwipePos = useRef({ x: 0, y: 0 });

  // Render live radar Mini-Map
  useEffect(() => {
    const cvs = miniMapRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const size = 128;
    const scale = 0.065; // world units -> minimap px

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#0a1f1c';
    ctx.fillRect(0, 0, size, size);

    ctx.save();
    ctx.translate(size * 0.5, size * 0.5);

    // Draw water zones
    ctx.fillStyle = '#0369a1';
    for (const wz of WATER_ZONES) {
      if (wz.isBeach) continue;
      ctx.fillRect(
        (wz.x - hud.playerX) * scale,
        (wz.y - hud.playerY) * scale,
        wz.w * scale,
        wz.d * scale
      );
    }

    // Draw roads
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const r of ROAD_SEGMENTS) {
      ctx.beginPath();
      ctx.moveTo((r.x1 - hud.playerX) * scale, (r.y1 - hud.playerY) * scale);
      ctx.lineTo((r.x2 - hud.playerX) * scale, (r.y2 - hud.playerY) * scale);
      ctx.stroke();
    }

    // Nearby vehicle dots
    ctx.fillStyle = '#38bdf8';
    for (const v of hud.nearbyVehicles) {
      ctx.beginPath();
      ctx.arc((v.x - hud.playerX) * scale, (v.y - hud.playerY) * scale, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nearby activity dots
    ctx.fillStyle = '#facc15';
    for (const a of hud.nearbyActivities) {
      ctx.beginPath();
      ctx.arc((a.x - hud.playerX) * scale, (a.y - hud.playerY) * scale, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mission Waypoint Beacon (clamped to radar edge if far away)
    const mx = (hud.missionTargetX - hud.playerX) * scale;
    const my = (hud.missionTargetY - hud.playerY) * scale;
    const mDist = Math.hypot(mx, my);
    const maxR = size * 0.43;
    const clampedX = mDist > maxR ? (mx / mDist) * maxR : mx;
    const clampedY = mDist > maxR ? (my / mDist) * maxR : my;

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(clampedX, clampedY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Player directional triangle in center
    ctx.rotate(hud.playerAngle);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4.5, -4);
    ctx.lineTo(-2.5, 0);
    ctx.lineTo(-4.5, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [hud]);

  const handleJoyStart = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    joyPointerId.current = e.pointerId;
    updateJoyFromPointer(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    updateJoyFromPointer(e.clientX, e.clientY);
  };

  const handleJoyEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    joyPointerId.current = null;
    setJoyKnob({ x: 0, y: 0 });
    engineRef.current?.setJoystick(0, 0);
  };

  const updateJoyFromPointer = (cx: number, cy: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;
    const maxR = rect.width * 0.42;
    let dx = cx - centerX;
    let dy = cy - centerY;
    const d = Math.hypot(dx, dy);
    if (d > maxR) {
      dx = (dx / d) * maxR;
      dy = (dy / d) * maxR;
    }
    setJoyKnob({ x: dx, y: dy });
    engineRef.current?.setJoystick(dx / maxR, dy / maxR);
  };

  const handleCameraSwipeStart = (e: React.PointerEvent<HTMLDivElement>) => {
    swipePointerId.current = e.pointerId;
    lastSwipePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleCameraSwipeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipePointerId.current !== e.pointerId) return;
    const dx = e.clientX - lastSwipePos.current.x;
    const dy = e.clientY - lastSwipePos.current.y;
    lastSwipePos.current = { x: e.clientX, y: e.clientY };
    engineRef.current?.panCameraBy(dx, dy);
  };

  const handleCameraSwipeEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipePointerId.current === e.pointerId) {
      swipePointerId.current = null;
    }
  };

  const WeatherIcon =
    hud.weather === 'rain'
      ? CloudRain
      : hud.weather === 'fog' || hud.weather === 'cloudy'
      ? Wind
      : hud.timePhase === 'night'
      ? Moon
      : Sun;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* Right-side touch swipe surface for camera panning on mobile */}
      {showTouchControls && (
        <div
          className="pointer-events-auto fixed inset-y-0 right-0 w-1/2 z-0"
          onPointerDown={handleCameraSwipeStart}
          onPointerMove={handleCameraSwipeMove}
          onPointerUp={handleCameraSwipeEnd}
          onPointerCancel={handleCameraSwipeEnd}
        />
      )}

      {/* TOP BAR CLUSTER */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        {/* Top-Left: Mini-Map + District & Time */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => onOpenModal('MAP')}
            title="Open 64-District Bangladesh Atlas (M)"
            className="pointer-events-auto group relative h-24 w-24 sm:h-32 sm:w-32 overflow-hidden rounded-full border-2 border-emerald-400/70 bg-slate-950 shadow-xl transition-transform hover:scale-[1.03] cursor-pointer"
          >
            <canvas ref={miniMapRef} width={128} height={128} className="h-full w-full" />
            <span className="absolute bottom-1 inset-x-0 text-center text-[10px] font-bold tracking-wider text-emerald-300 bg-slate-950/75 py-0.5">
              MAP · M
            </span>
          </button>

          <div className="hidden sm:flex flex-col gap-1 rounded-xl border border-slate-700/80 bg-slate-950/88 px-3.5 py-2.5 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <Compass className="w-3.5 h-3.5" />
              <span>{hud.currentDistrictName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono-num">
              <WeatherIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>{hud.clockText}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{hud.weather}</span>
              <span aria-hidden="true">·</span>
              <span>{hud.currentDivisionName} Division</span>
            </div>
          </div>
        </div>

        {/* Top-Right: Health, Level, Coins + Quick Menu Actions */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/88 px-3.5 py-2 shadow-lg">
            {/* Health */}
            <div className="flex flex-col gap-1 min-w-[82px]">
              <div className="flex justify-between text-[11px] font-semibold text-slate-300 font-mono-num">
                <span>HP</span>
                <span>
                  {hud.health}/{hud.maxHealth}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round((hud.health / hud.maxHealth) * 100)}%` }}
                />
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            {/* Level */}
            <div className="text-right">
              <div className="text-[10px] font-medium text-slate-400">LVL {hud.level}</div>
              <div className="text-xs font-bold text-sky-400 font-mono-num">{hud.xp} XP</div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            {/* Sa7 Coins */}
            <div className="text-right">
              <div className="text-[10px] font-medium text-slate-400">SA7 COINS</div>
              <div className="text-sm font-extrabold text-amber-400 font-mono-num">
                ৳ {hud.coins.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenModal('MAP')}
              title="64 Districts Map (M)"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-slate-200 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenModal('STORE')}
              title="Sa7 Store"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-slate-200 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenModal('GARAGE')}
              title="Sa7 Garage"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-slate-200 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              <Car className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenModal('INVENTORY')}
              title="Wardrobe & Inventory"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-slate-200 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              <Backpack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onToggleMute}
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-950/90 text-slate-200 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onPause}
              title="Pause Menu (Esc)"
              className="flex h-10 px-3 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950/90 text-xs font-semibold text-white hover:border-emerald-500 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM HUD & TOUCH CONTROLS */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Contextual Interaction Prompt */}
        {hud.interactionPrompt && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => engineRef.current?.triggerPrimaryInteract()}
              className="pointer-events-auto rounded-xl border border-emerald-400/70 bg-slate-950/92 px-5 py-2.5 text-sm font-bold text-emerald-300 shadow-xl hover:bg-emerald-950 transition-colors cursor-pointer"
            >
              {hud.interactionPrompt}
            </button>
          </div>
        )}

        <div className="flex items-end justify-between gap-4">
          {/* Bottom-Left: Virtual Joystick (Mobile) + Active Mission Objective */}
          <div className="flex flex-col gap-2.5">
            {showTouchControls && !hud.inVehicle && (
              <div
                ref={joyBaseRef}
                onPointerDown={handleJoyStart}
                onPointerMove={handleJoyMove}
                onPointerUp={handleJoyEnd}
                onPointerCancel={handleJoyEnd}
                className="pointer-events-auto relative h-28 w-28 rounded-full border-2 border-emerald-400/45 bg-slate-950/60 touch-none"
              >
                <div
                  className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/85 border-2 border-white/80 shadow-lg"
                  style={{
                    transform: `translate(calc(-50% + ${joyKnob.x}px), calc(-50% + ${joyKnob.y}px))`,
                  }}
                />
              </div>
            )}

            {showTouchControls && hud.inVehicle && (
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchSteer(-1)}
                  onPointerUp={() => engineRef.current?.setTouchSteer(0)}
                  onPointerLeave={() => engineRef.current?.setTouchSteer(0)}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-600 bg-slate-950/85 text-lg font-bold text-white active:bg-emerald-600"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchSteer(1)}
                  onPointerUp={() => engineRef.current?.setTouchSteer(0)}
                  onPointerLeave={() => engineRef.current?.setTouchSteer(0)}
                  className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-600 bg-slate-950/85 text-lg font-bold text-white active:bg-emerald-600"
                >
                  ▶
                </button>
              </div>
            )}

            {/* Mission Card */}
            <button
              type="button"
              onClick={() => onOpenModal('MISSIONS')}
              className="pointer-events-auto text-left max-w-xs sm:max-w-sm rounded-xl border border-slate-700/80 bg-slate-950/88 px-3.5 py-2.5 shadow-lg hover:border-emerald-500/70 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-emerald-400">
                <span className="truncate">{hud.activeMissionTitle}</span>
                <span className="font-mono-num shrink-0 text-amber-400">{hud.missionDistanceM}m</span>
              </div>
              <p className="mt-0.5 text-xs text-slate-200 line-clamp-1">{hud.activeMissionObjective}</p>
            </button>
          </div>

          {/* Bottom-Right: Vehicle Speedometer + Touch Action Buttons */}
          <div className="flex flex-col items-end gap-2.5">
            {showTouchControls && !hud.inVehicle && (
              <div className="pointer-events-auto grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchButton('run', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('run', false)}
                  onPointerCancel={() => engineRef.current?.setTouchButton('run', false)}
                  className="h-12 px-3.5 rounded-xl border border-slate-600 bg-slate-950/85 text-xs font-bold text-sky-300 active:bg-sky-700"
                >
                  SPRINT
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchButton('jump', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('jump', false)}
                  className="h-12 px-3.5 rounded-xl border border-slate-600 bg-slate-950/85 text-xs font-bold text-amber-300 active:bg-amber-700"
                >
                  JUMP
                </button>
              </div>
            )}

            {showTouchControls && hud.inVehicle && (
              <div className="pointer-events-auto flex items-center gap-2">
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchButton('horn', true)}
                  className="h-12 px-3 rounded-xl border border-slate-600 bg-slate-950/85 text-xs font-bold text-amber-300 active:bg-amber-700"
                >
                  HORN
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchButton('handbrake', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('handbrake', false)}
                  onPointerCancel={() => engineRef.current?.setTouchButton('handbrake', false)}
                  className="h-12 px-3 rounded-xl border border-slate-600 bg-slate-950/85 text-xs font-bold text-rose-300 active:bg-rose-700"
                >
                  DRIFT
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchButton('brake', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('brake', false)}
                  onPointerCancel={() => engineRef.current?.setTouchButton('brake', false)}
                  className="h-14 w-14 rounded-xl border border-rose-500/60 bg-slate-950/88 text-xs font-bold text-rose-300 active:bg-rose-700"
                >
                  BRAKE
                </button>
                <button
                  type="button"
                  onPointerDown={() => engineRef.current?.setTouchButton('gas', true)}
                  onPointerUp={() => engineRef.current?.setTouchButton('gas', false)}
                  onPointerCancel={() => engineRef.current?.setTouchButton('gas', false)}
                  className="h-14 w-16 rounded-xl border border-emerald-500/70 bg-emerald-950/88 text-xs font-bold text-emerald-300 active:bg-emerald-600"
                >
                  GAS
                </button>
              </div>
            )}

            {hud.inVehicle ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/90 px-4 py-2.5 shadow-lg">
                <div>
                  <div className="text-[11px] font-semibold text-emerald-400">{hud.vehicleName}</div>
                  <div className="text-[10px] text-slate-400">H Horn · Space Drift · E Exit</div>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-black text-white font-mono-num">
                    {hud.speedKmh}
                  </span>
                  <span className="ml-1 text-[10px] font-semibold text-slate-400">KM/H</span>
                </div>
              </div>
            ) : (
              <div className="hidden md:block text-[11px] font-medium text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-1.5">
                WASD Move · Shift Sprint · Space Jump · E Interact · M Map
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
