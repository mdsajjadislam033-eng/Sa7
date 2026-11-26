// True 2:1 Isometric Projection & Geometric Utilities

export const ISO_TILE_W = 64;
export const ISO_TILE_H = 32;
export const ISO_Z_SCALE = 1.0;

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Converts 3D world coordinates (x, y, z) into 2D isometric screen offset (px, py)
 * World +X goes down-right, World +Y goes down-left, World +Z goes straight up.
 */
export function worldToIso(wx: number, wy: number, wz = 0): Vec2 {
  return {
    x: (wx - wy) * 0.8660254, // cos(30°)
    y: (wx + wy) * 0.4330127 - wz, // sin(30°)/something for clean 2:1 iso
  };
}

/**
 * Inverse transform from isometric canvas offset (z=0 ground plane) back to world (wx, wy).
 */
export function isoToWorld(ix: number, iy: number): Vec2 {
  const a = ix / 0.8660254;
  const b = iy / 0.4330127;
  return {
    x: (a + b) * 0.5,
    y: (b - a) * 0.5,
  };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function normalizeAngle(angle: number): number {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function lerpAngle(from: number, to: number, t: number): number {
  const diff = normalizeAngle(to - from);
  return from + diff * t;
}

export function distSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Shortest distance from point (px, py) to line segment (x1,y1)-(x2,y2)
 */
export function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = distSq(x1, y1, x2, y2);
  if (l2 === 0) return dist(px, py, x1, y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = clamp(t, 0, 1);
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return dist(px, py, projX, projY);
}

/**
 * Adjusts hex color brightness by factor (-1 to +1)
 */
export function shadeColor(hex: string, percent: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  const r = clamp(Math.round(((num >> 16) & 0xff) * (1 + percent)), 0, 255);
  const g = clamp(Math.round(((num >> 8) & 0xff) * (1 + percent)), 0, 255);
  const b = clamp(Math.round((num & 0xff) * (1 + percent)), 0, 255);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
