import { VEHICLE_SPEC_MAP } from '../data/bangladeshWorld';
import { EquippedOutfit, WorldVehicle } from '../types/game';
import { shadeColor, worldToIso } from './isoMath';

interface VehicleRenderOpts {
  ctx: CanvasRenderingContext2D;
  v: WorldVehicle;
  camX: number;
  camY: number;
  isNight: boolean;
  isPlayerInside: boolean;
  playerOutfit?: EquippedOutfit;
  timeSec: number;
}

/**
 * Helper to project a local vehicle-space point (lx forward, ly right, lz up)
 * into screen coordinates using the vehicle's world position & yaw angle,
 * then true 2:1 isometric projection.
 */
function projLocal(
  v: WorldVehicle,
  lx: number,
  ly: number,
  lz: number,
  camX: number,
  camY: number
): { x: number; y: number } {
  const cos = Math.cos(v.angle);
  const sin = Math.sin(v.angle);
  const wx = v.x + lx * cos - ly * sin;
  const wy = v.y + lx * sin + ly * cos;
  const iso = worldToIso(wx, wy, v.z + lz);
  return {
    x: iso.x - camX,
    y: iso.y - camY,
  };
}

function drawIsoPrism(
  ctx: CanvasRenderingContext2D,
  v: WorldVehicle,
  camX: number,
  camY: number,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  topColor: string,
  sideColorA: string,
  sideColorB: string,
  strokeColor?: string
): void {
  const cornersBottom = [
    projLocal(v, x0, y0, z0, camX, camY), // 0 FL
    projLocal(v, x1, y0, z0, camX, camY), // 1 BL
    projLocal(v, x1, y1, z0, camX, camY), // 2 BR
    projLocal(v, x0, y1, z0, camX, camY), // 3 FR
  ];
  const cornersTop = [
    projLocal(v, x0, y0, z1, camX, camY),
    projLocal(v, x1, y0, z1, camX, camY),
    projLocal(v, x1, y1, z1, camX, camY),
    projLocal(v, x0, y1, z1, camX, camY),
  ];

  // Draw the two visible side faces (facing down in screen Y)
  const faces = [
    { idxA: 0, idxB: 1, col: sideColorA },
    { idxA: 1, idxB: 2, col: sideColorB },
    { idxA: 2, idxB: 3, col: sideColorA },
    { idxA: 3, idxB: 0, col: sideColorB },
  ].map((f) => {
    const avgY =
      (cornersBottom[f.idxA].y +
        cornersBottom[f.idxB].y +
        cornersTop[f.idxA].y +
        cornersTop[f.idxB].y) *
      0.25;
    return { ...f, avgY };
  });

  // Sort back-to-front so frontmost visible faces draw last
  faces.sort((a, b) => a.avgY - b.avgY);
  for (let i = 2; i < 4; i++) {
    const f = faces[i];
    ctx.fillStyle = f.col;
    ctx.beginPath();
    ctx.moveTo(cornersBottom[f.idxA].x, cornersBottom[f.idxA].y);
    ctx.lineTo(cornersBottom[f.idxB].x, cornersBottom[f.idxB].y);
    ctx.lineTo(cornersTop[f.idxB].x, cornersTop[f.idxB].y);
    ctx.lineTo(cornersTop[f.idxA].x, cornersTop[f.idxA].y);
    ctx.closePath();
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // Top face
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(cornersTop[0].x, cornersTop[0].y);
  ctx.lineTo(cornersTop[1].x, cornersTop[1].y);
  ctx.lineTo(cornersTop[2].x, cornersTop[2].y);
  ctx.lineTo(cornersTop[3].x, cornersTop[3].y);
  ctx.closePath();
  ctx.fill();
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.9;
    ctx.stroke();
  }
}

function drawWheel(
  ctx: CanvasRenderingContext2D,
  v: WorldVehicle,
  lx: number,
  ly: number,
  radius: number,
  spin: number,
  steer: number,
  camX: number,
  camY: number,
  isThin = false
): void {
  const p = projLocal(v, lx, ly, radius * 0.55, camX, camY);
  const wheelAngle = v.angle + steer;
  const rx = (Math.cos(wheelAngle) - Math.sin(wheelAngle)) * 0.866;
  const ry = (Math.cos(wheelAngle) + Math.sin(wheelAngle)) * 0.433;
  const tilt = Math.atan2(ry, rx);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(tilt);

  // Tire
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, isThin ? radius * 0.45 : radius * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // Alloy rim / spokes rotating with wheelSpin!
  ctx.strokeStyle = isThin ? '#cbd5e1' : '#94a3b8';
  ctx.lineWidth = isThin ? 1.0 : 1.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.55, (isThin ? radius * 0.45 : radius * 0.65) * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();

  const sCos = Math.cos(spin) * radius * 0.52;
  const sSin = Math.sin(spin) * radius * 0.32;
  ctx.beginPath();
  ctx.moveTo(-sCos, -sSin);
  ctx.lineTo(sCos, sSin);
  ctx.moveTo(sSin, -sCos * 0.6);
  ctx.lineTo(-sSin, sCos * 0.6);
  ctx.stroke();

  ctx.restore();
}

export function renderVehicle({
  ctx,
  v,
  camX,
  camY,
  isNight,
  isPlayerInside,
  timeSec,
}: VehicleRenderOpts): void {
  const spec = VEHICLE_SPEC_MAP[v.type];
  const halfL = spec.length * 0.5;
  const halfW = spec.width * 0.5;

  const center = projLocal(v, 0, 0, 0, camX, camY);

  ctx.save();

  // Ground / water shadow or boat wake ripples
  if (spec.isWatercraft) {
    const bob = Math.sin(timeSec * 3.5 + v.x * 0.02) * 1.8;
    const wakeLen = 14 + Math.abs(v.speed) * 0.1;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.lineWidth = 2;
    const sternL = projLocal(v, -halfL - wakeLen, -halfW * 0.85, 0, camX, camY);
    const sternR = projLocal(v, -halfL - wakeLen, halfW * 0.85, 0, camX, camY);
    const bow = projLocal(v, halfL * 0.6, 0, 0, camX, camY);
    ctx.beginPath();
    ctx.moveTo(bow.x, bow.y + bob);
    ctx.lineTo(sternL.x, sternL.y + bob);
    ctx.moveTo(bow.x, bow.y + bob);
    ctx.lineTo(sternR.x, sternR.y + bob);
    ctx.stroke();

    // Boat hull
    const hullColor = v.color;
    const trimColor = v.secondaryColor;
    const pBow = projLocal(v, halfL, 0, 8 + bob, camX, camY);
    const pMidL = projLocal(v, 4, -halfW, 9 + bob, camX, camY);
    const pMidR = projLocal(v, 4, halfW, 9 + bob, camX, camY);
    const pSternL = projLocal(v, -halfL, -halfW * 0.72, 8 + bob, camX, camY);
    const pSternR = projLocal(v, -halfL, halfW * 0.72, 8 + bob, camX, camY);

    ctx.fillStyle = shadeColor(hullColor, -0.2);
    ctx.beginPath();
    ctx.moveTo(pBow.x, pBow.y + 7);
    ctx.lineTo(pMidL.x, pMidL.y + 7);
    ctx.lineTo(pSternL.x, pSternL.y + 7);
    ctx.lineTo(pSternR.x, pSternR.y + 7);
    ctx.lineTo(pMidR.x, pMidR.y + 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hullColor;
    ctx.beginPath();
    ctx.moveTo(pBow.x, pBow.y);
    ctx.lineTo(pMidL.x, pMidL.y);
    ctx.lineTo(pSternL.x, pSternL.y);
    ctx.lineTo(pSternR.x, pSternR.y);
    ctx.lineTo(pMidR.x, pMidR.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (v.type === 'boat') {
      // Bamboo arched chhoi canopy on traditional Nouka
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -halfL * 0.45,
        halfL * 0.25,
        -halfW * 0.68,
        halfW * 0.68,
        9 + bob,
        22 + bob,
        '#92400e',
        '#78350f',
        '#451a03'
      );
    } else {
      // Speedboat sleek windshield & twin outboard
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -4,
        halfL * 0.35,
        -halfW * 0.6,
        halfW * 0.6,
        9 + bob,
        18 + bob,
        '#38bdf8',
        '#0284c7',
        '#0369a1'
      );
    }

    if (isPlayerInside) {
      const seat = projLocal(v, -4, 0, 14 + bob, camX, camY);
      ctx.fillStyle = '#0b5d3b';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 6, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d69c77';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 13, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // Soft isometric drop shadow
  const fL = projLocal(v, halfL * 1.02, -halfW * 1.05, 0, camX, camY);
  const fR = projLocal(v, halfL * 1.02, halfW * 1.05, 0, camX, camY);
  const bR = projLocal(v, -halfL * 1.02, halfW * 1.05, 0, camX, camY);
  const bL = projLocal(v, -halfL * 1.02, -halfW * 1.05, 0, camX, camY);
  ctx.fillStyle = 'rgba(3, 10, 16, 0.36)';
  ctx.beginPath();
  ctx.moveTo(fL.x + 4, fL.y + 4);
  ctx.lineTo(fR.x + 4, fR.y + 4);
  ctx.lineTo(bR.x + 4, bR.y + 4);
  ctx.lineTo(bL.x + 4, bL.y + 4);
  ctx.closePath();
  ctx.fill();

  // Night headlight beams!
  if (isNight && (isPlayerInside || v.isTraffic) && v.type !== 'bicycle') {
    const hL = projLocal(v, halfL, -halfW * 0.65, 10, camX, camY);
    const hR = projLocal(v, halfL, halfW * 0.65, 10, camX, camY);
    const beamL = projLocal(v, halfL + 170, -halfW * 2.5, 0, camX, camY);
    const beamR = projLocal(v, halfL + 170, halfW * 2.5, 0, camX, camY);

    const grad = ctx.createLinearGradient(center.x, center.y, (beamL.x + beamR.x) * 0.5, (beamL.y + beamR.y) * 0.5);
    grad.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
    grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(hL.x, hL.y);
    ctx.lineTo(beamL.x, beamL.y);
    ctx.lineTo(beamR.x, beamR.y);
    ctx.lineTo(hR.x, hR.y);
    ctx.closePath();
    ctx.fill();
  }

  // Vehicle-specific detailed geometry
  if (v.type === 'bicycle' || v.type === 'motorcycle') {
    const isMoto = v.type === 'motorcycle';
    drawWheel(ctx, v, halfL * 0.72, 0, isMoto ? 8.5 : 8, v.wheelSpin, v.steerAngle, camX, camY, !isMoto);
    drawWheel(ctx, v, -halfL * 0.72, 0, isMoto ? 8.5 : 8, v.wheelSpin, 0, camX, camY, !isMoto);

    // Frame / Tank
    const rear = projLocal(v, -halfL * 0.72, 0, 11, camX, camY);
    const mid = projLocal(v, 0, 0, isMoto ? 16 : 15, camX, camY);
    const front = projLocal(v, halfL * 0.65, 0, 19, camX, camY);

    ctx.strokeStyle = v.color;
    ctx.lineWidth = isMoto ? 5.5 : 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(rear.x, rear.y);
    ctx.lineTo(mid.x, mid.y);
    ctx.lineTo(front.x, front.y);
    ctx.stroke();

    // Handlebars
    const hL = projLocal(v, halfL * 0.6, -7, 21, camX, camY);
    const hR = projLocal(v, halfL * 0.6, 7, 21, camX, camY);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(hL.x, hL.y);
    ctx.lineTo(hR.x, hR.y);
    ctx.stroke();

    if (isPlayerInside) {
      // Rider Sajjad seated on bike/motorcycle!
      const seat = projLocal(v, -4, 0, 20, camX, camY);
      ctx.fillStyle = '#0b5d3b';
      ctx.beginPath();
      ctx.roundRect(seat.x - 5.5, seat.y - 16, 11, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#d69c77';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 21, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isMoto ? '#dc2626' : '#17151a';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 23, 5.1, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  } else if (v.type === 'rickshaw') {
    // 3 wheels (1 front, 2 rear)
    drawWheel(ctx, v, halfL * 0.72, 0, 8.5, v.wheelSpin, v.steerAngle, camX, camY, true);
    drawWheel(ctx, v, -halfL * 0.58, -halfW * 0.88, 9.5, v.wheelSpin, 0, camX, camY, true);
    drawWheel(ctx, v, -halfL * 0.58, halfW * 0.88, 9.5, v.wheelSpin, 0, camX, camY, true);

    // Front handlebars & puller frame
    const frontPost = projLocal(v, halfL * 0.65, 0, 20, camX, camY);
    const frameMid = projLocal(v, 4, 0, 12, camX, camY);
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(frontPost.x, frontPost.y);
    ctx.lineTo(frameMid.x, frameMid.y);
    ctx.stroke();

    // Passenger colorful seat box
    drawIsoPrism(
      ctx,
      v,
      camX,
      camY,
      -halfL * 0.82,
      4,
      -halfW * 0.85,
      halfW * 0.85,
      8,
      19,
      v.color,
      shadeColor(v.color, -0.18),
      shadeColor(v.color, -0.3),
      '#facc15'
    );

    // Signature folded/arched Dhaka floral Rickshaw Hood Canopy!
    drawIsoPrism(
      ctx,
      v,
      camX,
      camY,
      -halfL * 0.86,
      -2,
      -halfW * 0.88,
      halfW * 0.88,
      19,
      36,
      v.secondaryColor,
      '#e11d48',
      '#16a34a',
      '#fde047'
    );

    if (isPlayerInside) {
      const seat = projLocal(v, 10, 0, 17, camX, camY);
      ctx.fillStyle = '#0b5d3b';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 6, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d69c77';
      ctx.beginPath();
      ctx.arc(seat.x, seat.y - 13, 4.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (v.type === 'cng') {
    // Iconic Dhaka Green & Yellow CNG 3-wheeler
    drawWheel(ctx, v, halfL * 0.72, 0, 7.5, v.wheelSpin, v.steerAngle, camX, camY);
    drawWheel(ctx, v, -halfL * 0.62, -halfW * 0.86, 7.5, v.wheelSpin, 0, camX, camY);
    drawWheel(ctx, v, -halfL * 0.62, halfW * 0.86, 7.5, v.wheelSpin, 0, camX, camY);

    // Lower green body
    drawIsoPrism(
      ctx,
      v,
      camX,
      camY,
      -halfL * 0.9,
      halfL * 0.88,
      -halfW * 0.88,
      halfW * 0.88,
      6,
      20,
      v.color,
      shadeColor(v.color, -0.15),
      shadeColor(v.color, -0.28),
      '#052e16'
    );
    // Caged cabin + bright yellow canopy top
    drawIsoPrism(
      ctx,
      v,
      camX,
      camY,
      -halfL * 0.84,
      halfL * 0.45,
      -halfW * 0.84,
      halfW * 0.84,
      20,
      35,
      v.secondaryColor,
      'rgba(15, 23, 42, 0.65)',
      'rgba(30, 41, 59, 0.72)',
      '#facc15'
    );
    // Front windshield glass
    drawIsoPrism(
      ctx,
      v,
      camX,
      camY,
      halfL * 0.45,
      halfL * 0.68,
      -halfW * 0.72,
      halfW * 0.72,
      20,
      33,
      '#38bdf8',
      '#0284c7',
      '#0369a1'
    );
  } else {
    // 4-Wheeled Vehicles (Sedan, SUV, Pickup, Bus, Truck, Coupe)
    drawWheel(ctx, v, halfL * 0.62, -halfW * 0.92, 8.5, v.wheelSpin, v.steerAngle, camX, camY);
    drawWheel(ctx, v, halfL * 0.62, halfW * 0.92, 8.5, v.wheelSpin, v.steerAngle, camX, camY);
    drawWheel(ctx, v, -halfL * 0.62, -halfW * 0.92, 8.5, v.wheelSpin, 0, camX, camY);
    drawWheel(ctx, v, -halfL * 0.62, halfW * 0.92, 8.5, v.wheelSpin, 0, camX, camY);

    const isBus = v.type === 'bus';
    const isTruck = v.type === 'truck';
    const isPickup = v.type === 'pickup';
    const bodyTopZ = isBus ? 36 : isTruck ? 24 : 18;

    // Main lower chassis
    drawIsoPrism(
      ctx,
      v,
      camX,
      camY,
      -halfL,
      halfL,
      -halfW,
      halfW,
      6,
      bodyTopZ,
      v.color,
      shadeColor(v.color, -0.16),
      shadeColor(v.color, -0.32),
      'rgba(15,23,42,0.5)'
    );

    if (isBus) {
      // Bus window band & roof AC units
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -halfL * 0.94,
        halfL * 0.96,
        -halfW * 0.98,
        halfW * 0.98,
        21,
        32,
        '#0f172a',
        '#1e293b',
        '#38bdf8'
      );
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -halfL * 0.5,
        halfL * 0.5,
        -halfW * 0.55,
        halfW * 0.55,
        36,
        40,
        v.secondaryColor,
        '#cbd5e1',
        '#94a3b8'
      );
    } else if (isTruck) {
      // Truck cab front + colorful Bangladeshi cargo container back
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        halfL * 0.38,
        halfL * 0.94,
        -halfW * 0.94,
        halfW * 0.94,
        24,
        42,
        v.color,
        shadeColor(v.color, -0.18),
        '#38bdf8'
      );
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -halfL * 0.98,
        halfL * 0.3,
        -halfW * 0.98,
        halfW * 0.98,
        20,
        46,
        v.secondaryColor,
        '#15803d',
        '#dc2626',
        '#facc15'
      );
    } else if (isPickup) {
      // Pickup front cabin + open rear bed
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -halfL * 0.1,
        halfL * 0.42,
        -halfW * 0.86,
        halfW * 0.86,
        18,
        31,
        v.color,
        '#1e293b',
        '#38bdf8'
      );
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        -halfL * 0.88,
        -halfL * 0.16,
        -halfW * 0.82,
        halfW * 0.82,
        14,
        18.5,
        '#1e293b',
        '#0f172a',
        '#334155'
      );
    } else {
      // Sedan / SUV / Coupe sleek greenhouse cabin
      const cabStart = v.type === 'suv' ? -halfL * 0.78 : -halfL * 0.55;
      const cabEnd = v.type === 'suv' ? halfL * 0.48 : halfL * 0.42;
      const cabTop = v.type === 'suv' ? 32 : 28;
      drawIsoPrism(
        ctx,
        v,
        camX,
        camY,
        cabStart,
        cabEnd,
        -halfW * 0.84,
        halfW * 0.84,
        18,
        cabTop,
        v.color,
        '#1e293b',
        '#38bdf8',
        'rgba(255,255,255,0.18)'
      );
      if (v.type === 'coupe') {
        // Rear GT spoiler wing
        drawIsoPrism(
          ctx,
          v,
          camX,
          camY,
          -halfL * 0.96,
          -halfL * 0.78,
          -halfW * 0.9,
          halfW * 0.9,
          21,
          24,
          v.secondaryColor,
          '#0f172a',
          '#0f172a'
        );
      }
    }

    // Glowing Headlights & Taillights
    const hl1 = projLocal(v, halfL + 0.5, -halfW * 0.68, 12, camX, camY);
    const hl2 = projLocal(v, halfL + 0.5, halfW * 0.68, 12, camX, camY);
    ctx.fillStyle = isNight ? '#fef08a' : '#e2e8f0';
    ctx.beginPath();
    ctx.arc(hl1.x, hl1.y, 2.4, 0, Math.PI * 2);
    ctx.arc(hl2.x, hl2.y, 2.4, 0, Math.PI * 2);
    ctx.fill();

    const tl1 = projLocal(v, -halfL - 0.5, -halfW * 0.68, 12, camX, camY);
    const tl2 = projLocal(v, -halfL - 0.5, halfW * 0.68, 12, camX, camY);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(tl1.x, tl1.y, 2.2, 0, Math.PI * 2);
    ctx.arc(tl2.x, tl2.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
