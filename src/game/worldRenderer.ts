import {
  ACTIVITY_SPOTS,
  ROAD_SEGMENTS,
  TREE_PROPS,
  WATER_ZONES,
  WORLD_BUILDINGS,
} from '../data/worldMap';
import {
  CollectibleItem,
  GraphicsQuality,
  TimePhase,
  TreeProp,
  WeatherType,
  WorldBuilding,
} from '../types/game';
import { shadeColor, worldToIso } from './isoMath';

interface WorldTerrainOpts {
  ctx: CanvasRenderingContext2D;
  camX: number;
  camY: number;
  viewW: number;
  viewH: number;
  timeSec: number;
  weather: WeatherType;
  timePhase: TimePhase;
  quality: GraphicsQuality;
}

function pIso(wx: number, wy: number, wz: number, camX: number, camY: number) {
  const iso = worldToIso(wx, wy, wz);
  return { x: iso.x - camX, y: iso.y - camY };
}

function fillIsoRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  z: number,
  camX: number,
  camY: number,
  fill: string | CanvasGradient,
  stroke?: string,
  lineWidth = 1
): void {
  const p0 = pIso(x, y, z, camX, camY);
  const p1 = pIso(x + w, y, z, camX, camY);
  const p2 = pIso(x + w, y + d, z, camX, camY);
  const p3 = pIso(x, y + d, z, camX, camY);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  d: number,
  z0: number,
  z1: number,
  camX: number,
  camY: number,
  topCol: string,
  rightCol: string,
  leftCol: string,
  stroke?: string
): void {
  const b1 = pIso(x + w, y, z0, camX, camY);
  const b2 = pIso(x + w, y + d, z0, camX, camY);
  const b3 = pIso(x, y + d, z0, camX, camY);

  const t0 = pIso(x, y, z1, camX, camY);
  const t1 = pIso(x + w, y, z1, camX, camY);
  const t2 = pIso(x + w, y + d, z1, camX, camY);
  const t3 = pIso(x, y + d, z1, camX, camY);

  // Right visible face (x+w)
  ctx.fillStyle = rightCol;
  ctx.beginPath();
  ctx.moveTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.lineTo(t1.x, t1.y);
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Left visible face (y+d)
  ctx.fillStyle = leftCol;
  ctx.beginPath();
  ctx.moveTo(b2.x, b2.y);
  ctx.lineTo(b3.x, b3.y);
  ctx.lineTo(t3.x, t3.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Top roof face
  ctx.fillStyle = topCol;
  ctx.beginPath();
  ctx.moveTo(t0.x, t0.y);
  ctx.lineTo(t1.x, t1.y);
  ctx.lineTo(t2.x, t2.y);
  ctx.lineTo(t3.x, t3.y);
  ctx.closePath();
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

export function renderWorldGroundAndRoads({
  ctx,
  camX,
  camY,
  viewW,
  viewH,
  timeSec,
  weather,
  timePhase,
  quality,
}: WorldTerrainOpts): void {
  // Base rich emerald-grass ground across viewport
  ctx.fillStyle = timePhase === 'night' ? '#0b2218' : '#2c5e3b';
  ctx.fillRect(0, 0, viewW, viewH);

  // Subtle isometric terrain grid patches (parks, plazas, agricultural plots)
  const tileStep = 280;
  const centerWorld = {
    x: (camX / 0.8660254 + camY / 0.4330127) * 0.5 + viewW * 0.5,
    y: (camY / 0.4330127 - camX / 0.8660254) * 0.5,
  };

  // Regional Biome Ground Patches
  // Dhaka Metro Urban Concrete Pad
  fillIsoRect(ctx, 1850, 1850, 1250, 1120, 0, camX, camY, '#334d3d');
  // Sylhet Tea Hills Emerald Carpet
  fillIsoRect(ctx, 4300, 750, 1250, 1250, 0, camX, camY, '#1f6f3b');
  // Paharpur / North Bengal Terracotta Earth
  fillIsoRect(ctx, 600, 950, 950, 850, 0, camX, camY, '#4d5b35');
  // Sundarbans Dark Mangrove Marsh
  fillIsoRect(ctx, 680, 4300, 1300, 1000, 0, camX, camY, '#1b4738');

  // Crisp subtle isometric grass/tile texture dots in medium/high quality
  if (quality !== 'low') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const minGX = Math.max(0, Math.floor((centerWorld.x - 1600) / tileStep) * tileStep);
    const maxGX = Math.min(5800, minGX + 3400);
    const minGY = Math.max(0, Math.floor((centerWorld.y - 1600) / tileStep) * tileStep);
    const maxGY = Math.min(5800, minGY + 3400);

    for (let gx = minGX; gx <= maxGX; gx += tileStep) {
      const a = pIso(gx, minGY, 0, camX, camY);
      const b = pIso(gx, maxGY, 0, camX, camY);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let gy = minGY; gy <= maxGY; gy += tileStep) {
      const a = pIso(minGX, gy, 0, camX, camY);
      const b = pIso(maxGX, gy, 0, camX, camY);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  // Water Zones (Padma River, Kaptai Lake, Sundarbans Creek, Bay of Bengal Beach & Sea)
  for (const wz of WATER_ZONES) {
    if (wz.isBeach) {
      fillIsoRect(ctx, wz.x, wz.y, wz.w, wz.d, 0, camX, camY, '#e7cb8f', '#d4b16a', 2);
    } else {
      const waterGrad = ctx.createLinearGradient(0, 0, viewW, viewH);
      if (timePhase === 'night') {
        waterGrad.addColorStop(0, '#082f49');
        waterGrad.addColorStop(1, '#0c4a6e');
      } else if (timePhase === 'evening') {
        waterGrad.addColorStop(0, '#0369a1');
        waterGrad.addColorStop(1, '#b45309');
      } else {
        waterGrad.addColorStop(0, '#0284c7');
        waterGrad.addColorStop(1, '#0d9488');
      }
      fillIsoRect(ctx, wz.x, wz.y, wz.w, wz.d, -2, camX, camY, waterGrad, '#bae6fd', 2);

      // Animated shimmering river waves
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)';
      ctx.lineWidth = 1.6;
      const step = quality === 'low' ? 160 : 95;
      for (let rx = wz.x + 40; rx < wz.x + wz.w - 40; rx += step) {
        for (let ry = wz.y + 45; ry < wz.y + wz.d - 45; ry += 85) {
          const drift = Math.sin(timeSec * 2 + rx * 0.015) * 14;
          const wp = pIso(rx + drift, ry, -1, camX, camY);
          if (wp.x < -60 || wp.x > viewW + 60 || wp.y < -60 || wp.y > viewH + 60) continue;
          ctx.beginPath();
          ctx.moveTo(wp.x - 14, wp.y);
          ctx.quadraticCurveTo(wp.x, wp.y - 3, wp.x + 14, wp.y);
          ctx.stroke();
        }
      }
    }
  }

  // High-Detail Isometric Roads, Footpaths, Kerbs, Lane Markings & Bridges
  for (const r of ROAD_SEGMENTS) {
    const dx = r.x2 - r.x1;
    const dy = r.y2 - r.y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const halfW = r.width * 0.5;
    const sidewalkW = halfW + 16;
    const zRoad = r.isBridge ? 14 : 0.5;

    // 1. Raised Stone Footpath / Sidewalk border
    const sw1 = pIso(r.x1 + nx * sidewalkW, r.y1 + ny * sidewalkW, zRoad, camX, camY);
    const sw2 = pIso(r.x2 + nx * sidewalkW, r.y2 + ny * sidewalkW, zRoad, camX, camY);
    const sw3 = pIso(r.x2 - nx * sidewalkW, r.y2 - ny * sidewalkW, zRoad, camX, camY);
    const sw4 = pIso(r.x1 - nx * sidewalkW, r.y1 - ny * sidewalkW, zRoad, camX, camY);

    ctx.fillStyle = r.isBridge ? '#94a3b8' : '#9ca3af';
    ctx.beginPath();
    ctx.moveTo(sw1.x, sw1.y);
    ctx.lineTo(sw2.x, sw2.y);
    ctx.lineTo(sw3.x, sw3.y);
    ctx.lineTo(sw4.x, sw4.y);
    ctx.closePath();
    ctx.fill();

    // Bridge concrete deck underside & piers
    if (r.isBridge) {
      const p3b = pIso(r.x2 - nx * sidewalkW, r.y2 - ny * sidewalkW, -2, camX, camY);
      const p4b = pIso(r.x1 - nx * sidewalkW, r.y1 - ny * sidewalkW, -2, camX, camY);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(sw4.x, sw4.y);
      ctx.lineTo(sw3.x, sw3.y);
      ctx.lineTo(p3b.x, p3b.y);
      ctx.lineTo(p4b.x, p4b.y);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Smooth Textured Asphalt Surface
    const a1 = pIso(r.x1 + nx * halfW, r.y1 + ny * halfW, zRoad + 0.5, camX, camY);
    const a2 = pIso(r.x2 + nx * halfW, r.y2 + ny * halfW, zRoad + 0.5, camX, camY);
    const a3 = pIso(r.x2 - nx * halfW, r.y2 - ny * halfW, zRoad + 0.5, camX, camY);
    const a4 = pIso(r.x1 - nx * halfW, r.y1 - ny * halfW, zRoad + 0.5, camX, camY);

    ctx.fillStyle = weather === 'rain' ? '#1e293b' : '#2b3440';
    ctx.beginPath();
    ctx.moveTo(a1.x, a1.y);
    ctx.lineTo(a2.x, a2.y);
    ctx.lineTo(a3.x, a3.y);
    ctx.lineTo(a4.x, a4.y);
    ctx.closePath();
    ctx.fill();

    // Wet road sheen during rain
    if (weather === 'rain') {
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.16)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 3. Crisp White Edge Lines
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.68)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(a1.x, a1.y);
    ctx.lineTo(a2.x, a2.y);
    ctx.moveTo(a4.x, a4.y);
    ctx.lineTo(a3.x, a3.y);
    ctx.stroke();

    // 4. Center Divider / Dashed Yellow Lane Markings
    const c1 = pIso(r.x1, r.y1, zRoad + 0.8, camX, camY);
    const c2 = pIso(r.x2, r.y2, zRoad + 0.8, camX, camY);
    ctx.save();
    ctx.strokeStyle = r.hasDivider ? '#facc15' : '#e2e8f0';
    ctx.lineWidth = r.hasDivider ? 2.4 : 1.6;
    ctx.setLineDash(r.hasDivider ? [16, 12] : [12, 14]);
    ctx.beginPath();
    ctx.moveTo(c1.x, c1.y);
    ctx.lineTo(c2.x, c2.y);
    ctx.stroke();
    ctx.restore();

    // 5. Iconic Steel Warren Truss Arches on Padma Bridge!
    if (r.isBridge) {
      const spanCount = 6;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.6;
      for (let s = 0; s < spanCount; s++) {
        const tA = s / spanCount;
        const tB = (s + 1) / spanCount;
        const tM = (tA + tB) * 0.5;

        const baseA = pIso(r.x1 + dx * tA + nx * halfW, r.y1 + dy * tA + ny * halfW, zRoad + 2, camX, camY);
        const topM = pIso(r.x1 + dx * tM + nx * halfW, r.y1 + dy * tM + ny * halfW, zRoad + 44, camX, camY);
        const baseB = pIso(r.x1 + dx * tB + nx * halfW, r.y1 + dy * tB + ny * halfW, zRoad + 2, camX, camY);

        ctx.beginPath();
        ctx.moveTo(baseA.x, baseA.y);
        ctx.lineTo(topM.x, topM.y);
        ctx.lineTo(baseB.x, baseB.y);
        ctx.stroke();

        const rBaseA = pIso(r.x1 + dx * tA - nx * halfW, r.y1 + dy * tA - ny * halfW, zRoad + 2, camX, camY);
        const rTopM = pIso(r.x1 + dx * tM - nx * halfW, r.y1 + dy * tM - ny * halfW, zRoad + 44, camX, camY);
        const rBaseB = pIso(r.x1 + dx * tB - nx * halfW, r.y1 + dy * tB - ny * halfW, zRoad + 2, camX, camY);

        ctx.beginPath();
        ctx.moveTo(rBaseA.x, rBaseA.y);
        ctx.lineTo(rTopM.x, rTopM.y);
        ctx.lineTo(rBaseB.x, rBaseB.y);
        ctx.stroke();
      }
    }
  }

  // Shahbagh / Dhaka Central Roundabout (Chattar) at (2500, 2400)
  const chattar = pIso(2500, 2400, 1, camX, camY);
  ctx.fillStyle = '#2b3440';
  ctx.beginPath();
  ctx.ellipse(chattar.x, chattar.y, 118, 59, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([10, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Center green fountain monument in Dhaka Chattar
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.ellipse(chattar.x, chattar.y, 44, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Zebra Crossings at key Dhaka intersections
  const drawZebra = (wx: number, wy: number) => {
    const p = pIso(wx, wy, 1.2, camX, camY);
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.78)';
    ctx.lineWidth = 3;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(p.x + i * 7 - 5, p.y + i * 3.5 + 3);
      ctx.lineTo(p.x + i * 7 + 5, p.y + i * 3.5 - 3);
      ctx.stroke();
    }
  };
  drawZebra(2500, 2290);
  drawZebra(2500, 2510);
  drawZebra(2380, 2400);
  drawZebra(2620, 2400);

  // Activity Zone Ground Rings
  for (const act of ACTIVITY_SPOTS) {
    const ap = pIso(act.x, act.y, 1.5, camX, camY);
    if (ap.x < -80 || ap.x > viewW + 80 || ap.y < -80 || ap.y > viewH + 80) continue;
    const pulse = 1 + Math.sin(timeSec * 3.2) * 0.08;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(ap.x, ap.y, 34 * pulse, 17 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(250, 204, 21, 0.14)';
    ctx.fill();
  }
}

/**
 * Renders each Bangladeshi Landmark & Building with bespoke architectural geometry
 */
export function renderBuilding(
  ctx: CanvasRenderingContext2D,
  b: WorldBuilding,
  camX: number,
  camY: number,
  isNight: boolean
): void {
  const halfW = b.w * 0.5;
  const halfD = b.d * 0.5;
  const x0 = b.x - halfW;
  const y0 = b.y - halfD;

  // Ground shadow
  fillIsoRect(ctx, x0 + 18, y0 + 18, b.w, b.d, 0.5, camX, camY, 'rgba(3, 10, 16, 0.28)');

  if (b.kind === 'sangsad') {
    // Jatiya Sangsad Bhaban: Iconic concrete geometric cylinders & central assembly octagon
    drawIsoBox(ctx, x0, y0, b.w, b.d, 0, 20, camX, camY, '#cbd5e1', '#94a3b8', '#64748b', '#475569');
    drawIsoBox(
      ctx,
      x0 + 30,
      y0 + 30,
      b.w - 60,
      b.d - 60,
      20,
      85,
      camX,
      camY,
      '#e2e8f0',
      '#cbd5e1',
      '#94a3b8',
      '#64748b'
    );
    drawIsoBox(
      ctx,
      x0 + 62,
      y0 + 62,
      b.w - 124,
      b.d - 124,
      85,
      b.h,
      camX,
      camY,
      '#f1f5f9',
      '#cbd5e1',
      '#94a3b8',
      '#64748b'
    );
    // Signature triangular & circular concrete cutouts
    const fCenter = pIso(b.x + halfW - 30, b.y, 52, camX, camY);
    ctx.fillStyle = isNight ? '#fde047' : '#0f172a';
    ctx.beginPath();
    ctx.arc(fCenter.x, fCenter.y, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.kind === 'shaheed_minar') {
    // Central Shaheed Minar: stepped white marble platform, red rising sun disc, 5 white columns
    drawIsoBox(ctx, x0, y0, b.w, b.d, 0, 12, camX, camY, '#f8fafc', '#cbd5e1', '#94a3b8', '#64748b');
    const sunP = pIso(b.x - 10, b.y - 10, 48, camX, camY);
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(sunP.x, sunP.y, 26, 0, Math.PI * 2);
    ctx.fill();

    // 5 iconic pillars
    const pillarOffsets = [-36, -18, 0, 18, 36];
    pillarOffsets.forEach((off, idx) => {
      const h = idx === 2 ? 96 : idx === 1 || idx === 3 ? 72 : 54;
      drawIsoBox(
        ctx,
        b.x + off - 4,
        b.y - 18,
        8,
        8,
        12,
        h,
        camX,
        camY,
        '#ffffff',
        '#e2e8f0',
        '#cbd5e1',
        '#94a3b8'
      );
    });
  } else if (b.kind === 'savar_memorial') {
    // National Martyrs' Memorial (7 soaring triangular concrete spires)
    drawIsoBox(ctx, x0, y0, b.w, b.d, 0, 10, camX, camY, '#e2e8f0', '#94a3b8', '#64748b');
    const baseL = pIso(b.x - 50, b.y + 30, 10, camX, camY);
    const baseR = pIso(b.x + 50, b.y - 30, 10, camX, camY);
    const baseC = pIso(b.x, b.y, 10, camX, camY);
    for (let i = 0; i < 7; i++) {
      const h = 55 + i * 18;
      const apex = pIso(b.x - 18 + i * 6, b.y - 18 + i * 6, h, camX, camY);
      ctx.fillStyle = i % 2 === 0 ? '#f1f5f9' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(baseL.x + i * 5, baseL.y - i * 3);
      ctx.lineTo(apex.x, apex.y);
      ctx.lineTo(baseC.x, baseC.y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(baseC.x, baseC.y);
      ctx.lineTo(apex.x, apex.y);
      ctx.lineTo(baseR.x - i * 4, baseR.y + i * 3);
      ctx.closePath();
      ctx.fill();
    }
  } else if (b.kind === 'paharpur') {
    // Stepped terracotta Buddhist Vihara pyramid
    drawIsoBox(ctx, x0, y0, b.w, b.d, 0, 28, camX, camY, '#c2410c', '#9a3412', '#7c2d12', '#431407');
    drawIsoBox(ctx, x0 + 28, y0 + 28, b.w - 56, b.d - 56, 28, 62, camX, camY, '#ea580c', '#c2410c', '#9a3412');
    drawIsoBox(ctx, x0 + 56, y0 + 56, b.w - 112, b.d - 112, 62, b.h, camX, camY, '#f59e0b', '#b45309', '#78350f');
  } else if (b.kind === 'lalbagh') {
    // Mughal terracotta fort with central dome
    drawIsoBox(ctx, x0, y0, b.w, b.d, 0, b.h * 0.75, camX, camY, b.roofColor, b.color, shadeColor(b.color, -0.25), '#451a03');
    const domeP = pIso(b.x, b.y, b.h * 0.78, camX, camY);
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(domeP.x, domeP.y, 24, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(domeP.x - 1.5, domeP.y - 34, 3, 12);
  } else {
    // Standard detailed buildings (Sa7 Store, Garage, Cha Dokan, Bazaar, Apartments, Homes)
    drawIsoBox(
      ctx,
      x0,
      y0,
      b.w,
      b.d,
      0,
      b.h,
      camX,
      camY,
      b.roofColor,
      b.color,
      shadeColor(b.color, -0.22),
      'rgba(15, 23, 42, 0.45)'
    );

    // Rooftop details (water tank or awning or illuminated windows)
    if (b.kind === 'apartment' || b.kind === 'cox_hotel') {
      const floors = Math.floor(b.h / 26);
      for (let fl = 1; fl < floors; fl++) {
        for (let wx = 18; wx < b.w - 18; wx += 26) {
          const wp = pIso(x0 + wx, y0 + b.d, fl * 22, camX, camY);
          ctx.fillStyle = isNight ? '#fef08a' : '#38bdf8';
          ctx.fillRect(wp.x - 5, wp.y - 6, 10, 8);
        }
      }
      // Rooftop water tank
      drawIsoBox(ctx, b.x - 14, b.y - 14, 24, 24, b.h, b.h + 18, camX, camY, '#0f172a', '#334155', '#1e293b');
    }

    // Storefront / Landmark Signboard
    if (b.kind === 'sa7_store' || b.kind === 'sa7_garage' || b.kind === 'shop_cha') {
      const signP = pIso(b.x, y0 + b.d + 2, b.h * 0.75, camX, camY);
      ctx.fillStyle = b.kind === 'sa7_store' ? '#065f46' : b.kind === 'sa7_garage' ? '#b45309' : '#78350f';
      ctx.beginPath();
      ctx.roundRect(signP.x - 32, signP.y - 11, 64, 18, 4);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        b.kind === 'sa7_store' ? 'Sa7 STORE' : b.kind === 'sa7_garage' ? 'Sa7 GARAGE' : 'CHA DOKAN',
        signP.x,
        signP.y + 1
      );
    }
  }
}

export function renderTree(
  ctx: CanvasRenderingContext2D,
  t: TreeProp,
  camX: number,
  camY: number,
  timeSec: number
): void {
  const p = pIso(t.x, t.y, 0, camX, camY);
  const sway = Math.sin(timeSec * 1.6 + t.x * 0.02) * 2.2 * t.scale;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(t.scale, t.scale);

  // Soft shadow
  ctx.fillStyle = 'rgba(3, 10, 16, 0.25)';
  ctx.beginPath();
  ctx.ellipse(4, 2, 18, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  if (t.kind === 'tea_bush') {
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.ellipse(0, -6, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(sway * 0.4, -11, 14, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (t.kind === 'palm') {
    // Curved coconut trunk
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(4, -24, sway, -48);
    ctx.stroke();

    // Palm fronds
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + sway * 0.02;
      ctx.strokeStyle = i % 2 === 0 ? '#16a34a' : '#15803d';
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(sway, -48);
      ctx.quadraticCurveTo(sway + Math.cos(a) * 14, -54 + Math.sin(a) * 6, sway + Math.cos(a) * 24, -40 + Math.sin(a) * 11);
      ctx.stroke();
    }
  } else {
    // Lush Banyan / Mango / Mangrove canopy
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(-3.5, -24, 7, 24);

    const baseGreen = t.kind === 'mangrove' ? '#115e59' : '#166534';
    const topGreen = t.kind === 'mangrove' ? '#0d9488' : '#22c55e';

    ctx.fillStyle = baseGreen;
    ctx.beginPath();
    ctx.arc(sway * 0.6, -32, 18, 0, Math.PI * 2);
    ctx.arc(-10 + sway * 0.5, -27, 13, 0, Math.PI * 2);
    ctx.arc(10 + sway * 0.5, -27, 13, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = topGreen;
    ctx.beginPath();
    ctx.arc(sway, -37, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderCollectible(
  ctx: CanvasRenderingContext2D,
  c: CollectibleItem,
  camX: number,
  camY: number,
  timeSec: number
): void {
  const hover = Math.sin(timeSec * 4 + c.x) * 4 + 14;
  const p = pIso(c.x, c.y, hover, camX, camY);
  const gP = pIso(c.x, c.y, 0, camX, camY);

  ctx.save();
  ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
  ctx.beginPath();
  ctx.ellipse(gP.x, gP.y, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(p.x, p.y);
  const spinW = Math.max(0.25, Math.abs(Math.cos(timeSec * 3.2 + c.x)));
  ctx.scale(spinW, 1);

  ctx.fillStyle = c.kind === 'emblem' ? '#10b981' : '#facc15';
  ctx.beginPath();
  ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 8px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.kind === 'emblem' ? 'BD' : '৳', 0, 0.5);
  ctx.restore();
}

export function renderWeatherAndLighting(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  timePhase: TimePhase,
  weather: WeatherType,
  timeSec: number,
  camX: number,
  camY: number,
  quality: GraphicsQuality
): void {
  // Time-of-day atmospheric tint
  if (timePhase === 'morning') {
    ctx.fillStyle = 'rgba(253, 224, 71, 0.06)';
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (timePhase === 'evening') {
    const g = ctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, 'rgba(234, 88, 12, 0.16)');
    g.addColorStop(1, 'rgba(124, 45, 18, 0.22)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (timePhase === 'night') {
    ctx.fillStyle = 'rgba(6, 15, 32, 0.52)';
    ctx.fillRect(0, 0, viewW, viewH);

    // Warm glowing streetlamp cones along central Dhaka & Bridge!
    if (quality !== 'low') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let wy = 1950; wy <= 3750; wy += 240) {
        const lp = pIso(2420, wy, 20, camX, camY);
        if (lp.x < -120 || lp.x > viewW + 120 || lp.y < -120 || lp.y > viewH + 120) continue;
        const rg = ctx.createRadialGradient(lp.x, lp.y, 4, lp.x, lp.y, 75);
        rg.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
        rg.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(lp.x, lp.y, 75, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Monsoon Rain & Fog effects
  if (weather === 'cloudy') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (weather === 'fog') {
    ctx.fillStyle = 'rgba(203, 213, 225, 0.28)';
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (weather === 'rain') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fillRect(0, 0, viewW, viewH);
    const drops = quality === 'low' ? 60 : quality === 'medium' ? 120 : 200;
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < drops; i++) {
      const rx = ((i * 197 + timeSec * 420) % (viewW + 120)) - 60;
      const ry = ((i * 313 + timeSec * 980) % (viewH + 120)) - 60;
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 10, ry + 24);
    }
    ctx.stroke();
  }
}
