import { STORE_ITEMS } from '../data/bangladeshWorld';
import { CharacterAnimState, EquippedOutfit, WorldNPC } from '../types/game';
import { shadeColor } from './isoMath';

interface RigRenderParams {
  ctx: CanvasRenderingContext2D;
  screenX: number;
  screenY: number;
  zHeight: number;
  angle: number; // world radians
  animState: CharacterAnimState;
  animTime: number;
  outfit: EquippedOutfit;
  scale?: number;
}

const ITEM_COLOR_MAP = Object.fromEntries(
  STORE_ITEMS.map((i) => [i.id, { primary: i.previewColor, accent: i.accentColor ?? '#ffffff' }])
);

/**
 * Renders Sajjad with full 8-direction isometric proportions, tousled wavy hair,
 * articulated limb kinematics, Bangladesh green-red polo jersey (or equipped outfit),
 * black cargo pants, green-white high-top sneakers, watch, wristband, and optional
 * sunglasses, cap, and explorer backpack matching the reference artwork.
 */
export function renderSajjadCharacter({
  ctx,
  screenX,
  screenY,
  zHeight,
  angle,
  animState,
  animTime,
  outfit,
  scale = 1,
}: RigRenderParams): void {
  // Convert world angle to isometric screen facing vector
  // world +X -> iso (+0.866, +0.433), world +Y -> iso (-0.866, +0.433)
  const dirX = (Math.cos(angle) - Math.sin(angle)) * 0.866;
  const dirY = (Math.cos(angle) + Math.sin(angle)) * 0.433;
  const isoLen = Math.hypot(dirX, dirY) || 1;
  const fx = dirX / isoLen; // horizontal facing (-1 left, +1 right)
  const fy = dirY / isoLen; // depth facing (+1 toward camera, -1 away from camera)

  const facingFront = fy > -0.22;
  const flipX = fx < -0.1 ? -1 : 1;
  const sideStrength = Math.abs(fx);

  const topSpec = ITEM_COLOR_MAP[outfit.top] ?? { primary: '#0b5d3b', accent: '#dc2626' };
  const botSpec = ITEM_COLOR_MAP[outfit.bottom] ?? { primary: '#18181b', accent: '#27272a' };
  const shoeSpec = ITEM_COLOR_MAP[outfit.shoes] ?? { primary: '#15803d', accent: '#ffffff' };

  // Animation kinematics
  let stride = 0;
  let armSwing = 0;
  let bodyBob = 0;
  let torsoLean = 0;
  let crouch = 0;
  let victoryRaise = 0;

  if (animState === 'idle') {
    bodyBob = Math.sin(animTime * 2.4) * 1.1;
  } else if (animState === 'walk') {
    stride = Math.sin(animTime * 9.5) * 6.5;
    armSwing = Math.sin(animTime * 9.5) * 6.0;
    bodyBob = Math.abs(Math.cos(animTime * 9.5)) * 2.2;
    torsoLean = 0.05;
  } else if (animState === 'run') {
    stride = Math.sin(animTime * 13.5) * 10.5;
    armSwing = Math.sin(animTime * 13.5) * 10.0;
    bodyBob = Math.abs(Math.cos(animTime * 13.5)) * 3.8;
    torsoLean = 0.14;
  } else if (animState === 'sprint') {
    stride = Math.sin(animTime * 17.5) * 13.0;
    armSwing = Math.sin(animTime * 17.5) * 12.5;
    bodyBob = Math.abs(Math.cos(animTime * 17.5)) * 4.8;
    torsoLean = 0.22;
  } else if (animState === 'jump') {
    stride = 5.5;
    armSwing = -8;
    torsoLean = 0.08;
  } else if (animState === 'land') {
    crouch = 4.5;
    armSwing = 4;
  } else if (animState === 'interact') {
    armSwing = Math.sin(animTime * 10) * 7 - 5;
    torsoLean = 0.1;
  } else if (animState === 'sit') {
    crouch = 9;
    stride = 4;
  } else if (animState === 'victory') {
    victoryRaise = 1;
    bodyBob = Math.abs(Math.sin(animTime * 7)) * 3.5;
  }

  ctx.save();

  // Ground shadow (scales down smoothly when jumping!)
  const shadowScale = Math.max(0.45, 1 - zHeight * 0.008);
  ctx.fillStyle = 'rgba(4, 12, 18, 0.38)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 2, 13 * shadowScale * scale, 6.5 * shadowScale * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Translate to character root with jump height & body bob
  ctx.translate(screenX, screenY - zHeight - bodyBob + crouch);
  ctx.scale(scale, scale);

  // Rotate slightly for running forward lean
  ctx.rotate(flipX * torsoLean * 0.45);

  const skinBase = '#d69c77';
  const skinShadow = '#b67a56';
  const hairColor = '#17151a';
  const hairHighlight = '#36323e';

  // Backpack (behind torso when facing front, visible on back when facing away)
  const hasBackpack = outfit.backpack === 'acc_backpack';
  if (hasBackpack && facingFront) {
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(-8.5 - flipX * 2, -40, 17, 17, 4);
    ctx.fill();
  }

  // Helper to draw an articulated leg (cargo pants + green/white high-top sneaker)
  const drawLeg = (side: -1 | 1, stepOffset: number) => {
    const hipX = side * (3.8 - sideStrength * 1.4);
    const footX = hipX + fx * stepOffset * 0.85;
    const footY = -1 + Math.max(-4, -Math.abs(stepOffset) * 0.25) + fy * stepOffset * 0.35;
    const kneeX = (hipX + footX) * 0.5 + flipX * 1.4;
    const kneeY = -12 + Math.min(0, stepOffset * 0.15);

    // Cargo pant leg
    ctx.strokeStyle = side === -1 ? shadeColor(botSpec.primary, -0.12) : botSpec.primary;
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(hipX, -22);
    ctx.lineTo(kneeX, kneeY);
    ctx.lineTo(footX, footY - 3);
    ctx.stroke();

    // Cargo side pocket detail
    ctx.fillStyle = shadeColor(botSpec.primary, 0.15);
    ctx.fillRect(kneeX - 2.3, kneeY - 4, 4.6, 5);

    // High-top sneaker (white sole + green/accent upper)
    ctx.fillStyle = shoeSpec.accent;
    ctx.beginPath();
    ctx.ellipse(footX + flipX * 1.4, footY + 0.5, 4.4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = shoeSpec.primary;
    ctx.beginPath();
    ctx.roundRect(footX - 3 + flipX * 0.8, footY - 4.2, 6.6, 4.2, 1.5);
    ctx.fill();
  };

  // Back leg first, then front leg
  const legOrder: Array<-1 | 1> = fy >= 0 ? [-1, 1] : [1, -1];
  drawLeg(legOrder[0], legOrder[0] * stride);
  drawLeg(legOrder[1], legOrder[1] * stride);

  // Back arm helper
  const drawArm = (side: -1 | 1, swing: number, isFront: boolean) => {
    const shoulderX = side * (8.5 - sideStrength * 2.5);
    const shoulderY = -41;
    let handX = shoulderX + fx * swing * 0.75 + side * 1.5;
    let handY = -24 - Math.abs(swing) * 0.2;

    if (victoryRaise) {
      handX = shoulderX + side * 4.5;
      handY = -56 + Math.sin(animTime * 8) * 2;
    }

    const elbowX = (shoulderX + handX) * 0.5 + side * 1.2;
    const elbowY = (shoulderY + handY) * 0.5;

    // Jersey sleeve
    ctx.strokeStyle = isFront ? topSpec.primary : shadeColor(topSpec.primary, -0.15);
    ctx.lineWidth = 5.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(shoulderX + (elbowX - shoulderX) * 0.58, shoulderY + (elbowY - shoulderY) * 0.58);
    ctx.stroke();

    // Red sleeve cuff trim (signature BD jersey detail)
    ctx.strokeStyle = topSpec.accent;
    ctx.lineWidth = 5.6;
    ctx.beginPath();
    ctx.moveTo(shoulderX + (elbowX - shoulderX) * 0.54, shoulderY + (elbowY - shoulderY) * 0.54);
    ctx.lineTo(shoulderX + (elbowX - shoulderX) * 0.64, shoulderY + (elbowY - shoulderY) * 0.64);
    ctx.stroke();

    // Forearm & hand
    ctx.strokeStyle = isFront ? skinBase : skinShadow;
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(shoulderX + (elbowX - shoulderX) * 0.62, shoulderY + (elbowY - shoulderY) * 0.62);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    // Wristwatch on left wrist (-1) & black wristband on right wrist (+1)
    if (side === -1) {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(handX - 2.2, handY - 3, 4.4, 2.4);
    } else {
      ctx.fillStyle = '#18181b';
      ctx.fillRect(handX - 1.8, handY - 2.6, 3.6, 1.5);
    }

    // Hand
    ctx.fillStyle = skinBase;
    ctx.beginPath();
    ctx.arc(handX, handY, 2.3, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw far arm behind torso
  const farSide: -1 | 1 = flipX > 0 ? -1 : 1;
  const nearSide: -1 | 1 = flipX > 0 ? 1 : -1;
  drawArm(farSide, farSide * armSwing, false);

  // Torso (Athletic V-taper Bangladesh Jersey / Equipped Top)
  ctx.fillStyle = topSpec.primary;
  ctx.beginPath();
  ctx.moveTo(-9.2 + sideStrength * 1.5, -43);
  ctx.lineTo(9.2 - sideStrength * 1.5, -43);
  ctx.lineTo(7.4 - sideStrength * 1.2, -22);
  ctx.lineTo(-7.4 + sideStrength * 1.2, -22);
  ctx.closePath();
  ctx.fill();

  // Subtle torso shading & red jersey side/shoulder accents
  ctx.fillStyle = topSpec.accent;
  ctx.beginPath();
  ctx.moveTo(-9.0 + sideStrength * 1.5, -43);
  ctx.lineTo(-4.5, -43);
  ctx.lineTo(-6.5, -36);
  ctx.lineTo(-8.5, -38);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(9.0 - sideStrength * 1.5, -43);
  ctx.lineTo(4.5, -43);
  ctx.lineTo(6.5, -36);
  ctx.lineTo(8.5, -38);
  ctx.closePath();
  ctx.fill();

  // Red tiger/wave side flash on bottom left of jersey (from ref image 1)
  ctx.beginPath();
  ctx.moveTo(4.5, -27);
  ctx.lineTo(7.4 - sideStrength * 1.2, -22);
  ctx.lineTo(2.5, -22);
  ctx.closePath();
  ctx.fill();

  // Collar
  ctx.fillStyle = shadeColor(topSpec.primary, 0.15);
  ctx.beginPath();
  ctx.ellipse(0, -43.5, 4.8, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();

  if (facingFront) {
    // Tiny Bangladesh flag patch on chest right + crest on chest left
    if (outfit.top === 'top_bd_jersey') {
      // Flag rectangle
      ctx.fillStyle = '#047857';
      ctx.fillRect(-5.6, -38.5, 4.2, 2.6);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-3.5, -37.2, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Gold crest
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(3.6, -37.2, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Crisp white chest band ("BANGLADESH" stylized micro-stripe)
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fillRect(-5.5, -33.2, 11, 1.6);
    } else if (outfit.top === 'top_sa7_tee') {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sa7', 0, -32);
    }
  } else if (hasBackpack) {
    // Backpack rendered prominently on back!
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.roundRect(-7.5, -41, 15, 17, 3.5);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(-5.5, -32, 11, 2);
  }

  // Neck
  ctx.fillStyle = skinShadow;
  ctx.fillRect(-2.6, -47, 5.2, 4.5);

  // Head
  const headCenterY = -52.5;
  ctx.fillStyle = skinBase;
  ctx.beginPath();
  ctx.ellipse(0, headCenterY, 6.2, 6.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Jawline shadow
  ctx.fillStyle = 'rgba(130, 75, 45, 0.2)';
  ctx.beginPath();
  ctx.arc(0, headCenterY + 1.5, 5.8, 0.2, Math.PI - 0.2);
  ctx.fill();

  // Face details when facing towards camera
  if (facingFront) {
    const eyeShiftX = fx * 2.1;
    // Eyebrows (expressive dark brows matching Sajjad ref)
    ctx.strokeStyle = '#18141c';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(eyeShiftX - 3.6, headCenterY - 1.5);
    ctx.lineTo(eyeShiftX - 1.2, headCenterY - 1.8);
    ctx.moveTo(eyeShiftX + 1.2, headCenterY - 1.8);
    ctx.lineTo(eyeShiftX + 3.6, headCenterY - 1.5);
    ctx.stroke();

    if (outfit.eyewear === 'acc_sunglasses') {
      // Sleek Aviator Street Shades (matching Image 2!)
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.roundRect(eyeShiftX - 4.5, headCenterY - 1.2, 3.9, 2.7, 0.8);
      ctx.roundRect(eyeShiftX + 0.6, headCenterY - 1.2, 3.9, 2.7, 0.8);
      ctx.fill();
      ctx.stroke();
      // Bridge
      ctx.beginPath();
      ctx.moveTo(eyeShiftX - 0.6, headCenterY - 0.4);
      ctx.lineTo(eyeShiftX + 0.6, headCenterY - 0.4);
      ctx.stroke();
    } else {
      // Crisp eyes
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(eyeShiftX - 2.3, headCenterY - 0.2, 0.95, 0, Math.PI * 2);
      ctx.arc(eyeShiftX + 2.3, headCenterY - 0.2, 0.95, 0, Math.PI * 2);
      ctx.fill();
    }

    // Subtle nose & confident mouth
    ctx.strokeStyle = skinShadow;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(eyeShiftX, headCenterY + 0.2);
    ctx.lineTo(eyeShiftX + fx * 0.4, headCenterY + 2.1);
    ctx.stroke();

    ctx.strokeStyle = '#8b4d3b';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(eyeShiftX - 1.5, headCenterY + 3.6);
    ctx.quadraticCurveTo(eyeShiftX, headCenterY + 4.1, eyeShiftX + 1.5, headCenterY + 3.6);
    ctx.stroke();
  }

  // Tousled Dark Wavy Hair (Signature silhouette from Sajjad Reference Image 1 & 2)
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.ellipse(0, headCenterY - 4.8, 6.8, 4.4, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Wavy front curls & volume
  ctx.beginPath();
  ctx.arc(-4.2, headCenterY - 4.5, 2.8, 0, Math.PI * 2);
  ctx.arc(-1.2, headCenterY - 6.5, 3.2, 0, Math.PI * 2);
  ctx.arc(2.4, headCenterY - 6.0, 3.1, 0, Math.PI * 2);
  ctx.arc(4.8, headCenterY - 4.0, 2.6, 0, Math.PI * 2);
  ctx.fill();

  if (!facingFront) {
    // Full back of hair when facing north/away
    ctx.beginPath();
    ctx.arc(0, headCenterY - 1.5, 6.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle hair highlight curl
  ctx.strokeStyle = hairHighlight;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(-0.5, headCenterY - 6.3, 2.3, Math.PI * 1.1, Math.PI * 1.85);
  ctx.stroke();

  // Optional Cap
  if (outfit.hat === 'acc_cap') {
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.ellipse(0, headCenterY - 5.2, 6.7, 3.6, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Visor pointing in facing direction
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.ellipse(fx * 4.5, headCenterY - 4.2, 5.2, 2.0, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw near arm in front of torso
  drawArm(nearSide, nearSide * armSwing, true);

  ctx.restore();
}

/**
 * Renders living Bangladeshi NPCs with walking gait and distinct attire.
 */
export function renderNPC(
  ctx: CanvasRenderingContext2D,
  npc: WorldNPC,
  screenX: number,
  screenY: number
): void {
  const isMoving = Math.abs(npc.targetX - npc.x) > 2 || Math.abs(npc.targetY - npc.y) > 2;
  const stride = isMoving ? Math.sin(npc.walkPhase * 8.5) * 5.2 : 0;
  const bob = isMoving ? Math.abs(Math.cos(npc.walkPhase * 8.5)) * 1.8 : Math.sin(npc.walkPhase * 2) * 0.7;

  ctx.save();
  ctx.fillStyle = 'rgba(4, 12, 18, 0.32)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenY + 2, 11, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(screenX, screenY - bob);

  // Legs
  ctx.strokeStyle = npc.pantsColor;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-3, -20);
  ctx.lineTo(-3 + stride * 0.4, -1);
  ctx.moveTo(3, -20);
  ctx.lineTo(3 - stride * 0.4, -1);
  ctx.stroke();

  // Shirt / Panjabi
  ctx.fillStyle = npc.shirtColor;
  ctx.beginPath();
  ctx.roundRect(-7.5, -40, 15, 20, 3);
  ctx.fill();

  // Head
  ctx.fillStyle = '#c98e6b';
  ctx.beginPath();
  ctx.arc(0, -47, 5.5, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Cap
  ctx.fillStyle = npc.role === 'shopkeeper' || npc.role === 'fisherman' ? '#f8fafc' : '#18181b';
  ctx.beginPath();
  ctx.arc(0, -49.5, 5.6, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
