import {
  DISTRICT_BY_ID,
  DISTRICTS,
  DIVISION_BY_ID,
  MAIN_MISSIONS,
  VEHICLE_SPEC_MAP,
} from '../data/bangladeshWorld';
import {
  ACTIVITY_SPOTS,
  INITIAL_COLLECTIBLES,
  INITIAL_NPCS,
  INITIAL_VEHICLES,
  ROAD_SEGMENTS,
  TRAFFIC_SPAWNS,
  TREE_PROPS,
  WATER_ZONES,
  WORLD_BUILDINGS,
  WORLD_SIZE,
} from '../data/worldMap';
import {
  ActivitySpot,
  CharacterAnimState,
  CollectibleItem,
  GameSettings,
  HudSnapshot,
  MissionRewardSummary,
  PlayerProgress,
  TimePhase,
  VehicleType,
  WeatherType,
  WorldNPC,
  WorldVehicle,
} from '../types/game';
import { audioEngine } from './audioEngine';
import { renderNPC, renderSajjadCharacter } from './characterRenderer';
import { clamp, dist, lerp, lerpAngle, pointToSegmentDist, worldToIso } from './isoMath';
import { renderVehicle } from './vehicleRenderer';
import {
  renderBuilding,
  renderCollectible,
  renderTree,
  renderWeatherAndLighting,
  renderWorldGroundAndRoads,
} from './worldRenderer';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onToast: (msg: string, tone?: 'info' | 'success' | 'reward') => void;
  onMissionComplete: (summary: MissionRewardSummary) => void;
  onOpenStore: () => void;
  onOpenGarage: () => void;
  onStartActivity: (spot: ActivitySpot) => void;
  onCollectiblePicked: (item: CollectibleItem) => void;
  onDistrictDiscovered: (districtId: string) => void;
  onStateSync: (patch: Partial<PlayerProgress>) => void;
}

export class Sa7GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private rafId: number | null = null;
  private lastTs = 0;
  private elapsedSec = 0;
  private hudThrottle = 0;
  private syncThrottle = 0;
  private fpsAvg = 60;

  private isPaused = false;
  private isTitleBackdrop = true;

  // Player state
  private px = 2410;
  private py = 2255;
  private pz = 0;
  private pvz = 0;
  private pAngle = Math.PI * 0.25;
  private animState: CharacterAnimState = 'idle';
  private animTime = 0;
  private footstepTimer = 0;
  private landTimer = 0;
  private sitTimer = 0;
  private victoryTimer = 0;

  // Vehicle driving state
  private currentVehicle: WorldVehicle | null = null;
  private vehicles: WorldVehicle[] = [];
  private npcs: WorldNPC[] = [];
  private collectibles: CollectibleItem[] = [];
  private particles: Particle[] = [];

  // Camera
  private camX = 0;
  private camY = 0;
  private camZoom = 1.05;
  private camDragOffsetX = 0;
  private camDragOffsetY = 0;
  private shakeTime = 0;
  private shakeMag = 0;

  // Input state
  private heldKeys = new Set<string>();
  private justPressed = new Set<string>();
  private joyX = 0;
  private joyY = 0;
  private touchRun = false;
  private touchGas = false;
  private touchBrake = false;
  private touchSteer = 0;
  private touchHandbrake = false;

  // World Atmosphere
  private worldTimeOfDay = 0.35; // 0..1 (0.25 morning, 0.5 afternoon, 0.75 evening, 0.95 night)
  private dynamicWeather: WeatherType = 'sunny';
  private weatherTimer = 75;

  // External synced progress & settings
  private progress: PlayerProgress;
  private settings: GameSettings;

  // Cached nearby interaction
  private activeInteraction: {
    prompt: string;
    type: 'vehicle' | 'npc' | 'activity' | 'building' | 'landmark';
    execute: () => void;
  } | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    initialProgress: PlayerProgress,
    initialSettings: GameSettings,
    callbacks: EngineCallbacks
  ) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not initialize 2D canvas context');
    this.ctx = context;
    this.progress = initialProgress;
    this.settings = initialSettings;
    this.callbacks = callbacks;

    this.px = initialProgress.playerX;
    this.py = initialProgress.playerY;
    this.pAngle = initialProgress.playerAngle;

    this.initEntities();
    this.snapCameraToPlayer();
    this.bindEvents();
  }

  private initEntities(): void {
    this.vehicles = INITIAL_VEHICLES.map((v) => {
      const upg = this.progress.vehicleUpgrades[v.type];
      return {
        ...v,
        color: upg?.customColor || v.color,
      };
    });

    // Spawn ambient traffic along major roads
    TRAFFIC_SPAWNS.forEach((sp, i) => {
      const seg = ROAD_SEGMENTS[sp.routeIndex];
      if (!seg) return;
      const spec = VEHICLE_SPEC_MAP[sp.type];
      const wx = lerp(seg.x1, seg.x2, sp.t);
      const wy = lerp(seg.y1, seg.y2, sp.t);
      const ang = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1) + (sp.dir === -1 ? Math.PI : 0);
      this.vehicles.push({
        id: `traffic_${i}`,
        type: sp.type,
        x: wx,
        y: wy,
        z: seg.isBridge ? 14 : 0,
        angle: ang,
        vx: 0,
        vy: 0,
        speed: spec.maxSpeed * 0.42,
        steerAngle: 0,
        wheelSpin: 0,
        color: spec.defaultColor,
        secondaryColor: spec.secondaryColor,
        health: spec.durability,
        maxHealth: spec.durability,
        isTraffic: true,
        trafficRouteIndex: sp.routeIndex,
        trafficDir: sp.dir,
      });
    });

    this.npcs = INITIAL_NPCS.map((n) => ({ ...n }));
    this.collectibles = INITIAL_COLLECTIBLES.map((c) => ({
      ...c,
      collected: this.progress.collectedIds.includes(c.id),
    }));
  }

  private snapCameraToPlayer(): void {
    const iso = worldToIso(this.px, this.py, this.pz);
    this.camX = iso.x;
    this.camY = iso.y;
  }

  public start(): void {
    if (this.rafId !== null) return;
    this.lastTs = performance.now();
    const loop = (now: number) => {
      const rawDt = (now - this.lastTs) / 1000;
      this.lastTs = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      if (rawDt > 0) {
        this.fpsAvg = lerp(this.fpsAvg, Math.min(120, 1 / rawDt), 0.08);
      }

      if (!this.isPaused) {
        this.update(dt);
      }
      this.render();
      this.justPressed.clear();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
    audioEngine.updateVehicleEngine(false, null, 0);
  }

  public setTitleMode(isTitle: boolean): void {
    this.isTitleBackdrop = isTitle;
    if (!isTitle) {
      this.snapCameraToPlayer();
      audioEngine.setMood(this.currentVehicle ? 'driving' : 'openworld');
    } else {
      audioEngine.setMood('menu');
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.heldKeys.clear();
      audioEngine.updateVehicleEngine(false, null, 0);
    }
  }

  public syncProgress(next: PlayerProgress): void {
    this.progress = next;
    // Update garage vehicle colors dynamically
    this.vehicles.forEach((v) => {
      if (!v.isTraffic) {
        const upg = next.vehicleUpgrades[v.type];
        if (upg?.customColor) {
          v.color = upg.customColor;
        }
      }
    });
  }

  public syncSettings(next: GameSettings): void {
    this.settings = next;
    audioEngine.setSettings(next.musicVolume, next.sfxVolume, next.muted);
  }

  public summonGarageVehicle(type: VehicleType): void {
    const spec = VEHICLE_SPEC_MAP[type];
    const spawnDist = spec.isWatercraft ? 0 : 72;
    let tx = this.px + Math.cos(this.pAngle) * spawnDist;
    let ty = this.py + Math.sin(this.pAngle) * spawnDist;

    if (spec.isWatercraft) {
      // Summon at Padma Ghat pier if on land
      tx = 2660;
      ty = 3420;
      this.px = 2630;
      this.py = 3320;
      this.currentVehicle = null;
    }

    const existing = this.vehicles.find((v) => !v.isTraffic && v.type === type);
    const upg = this.progress.vehicleUpgrades[type];
    if (existing) {
      existing.x = tx;
      existing.y = ty;
      existing.speed = 0;
      existing.color = upg?.customColor || spec.defaultColor;
    } else {
      this.vehicles.push({
        id: `summon_${type}_${Date.now()}`,
        type,
        x: tx,
        y: ty,
        z: 0,
        angle: this.pAngle,
        vx: 0,
        vy: 0,
        speed: 0,
        steerAngle: 0,
        wheelSpin: 0,
        color: upg?.customColor || spec.defaultColor,
        secondaryColor: spec.secondaryColor,
        health: spec.durability,
        maxHealth: spec.durability,
      });
    }
    this.snapCameraToPlayer();
    this.callbacks.onToast(`${spec.name} delivered nearby!`, 'success');
  }

  public fastTravelToDistrict(districtId: string): void {
    const d = DISTRICT_BY_ID[districtId];
    if (!d) return;
    if (this.currentVehicle) {
      this.currentVehicle.x = d.worldX + 55;
      this.currentVehicle.y = d.worldY + 35;
      this.currentVehicle.speed = 0;
      this.px = this.currentVehicle.x;
      this.py = this.currentVehicle.y;
    } else {
      this.px = d.worldX;
      this.py = d.worldY;
    }
    this.camDragOffsetX = 0;
    this.camDragOffsetY = 0;
    this.snapCameraToPlayer();
    this.checkDistrictDiscovery();
    this.callbacks.onToast(`Arrived in ${d.name} (${d.banglaName})`, 'info');
  }

  public triggerVictoryPose(): void {
    this.victoryTimer = 2.4;
    this.spawnBurst(this.px, this.py, '#facc15', 22);
  }

  // Mobile Touch Controls API
  public setJoystick(x: number, y: number): void {
    this.joyX = clamp(x, -1, 1);
    this.joyY = clamp(y, -1, 1);
  }

  public setTouchButton(btn: 'run' | 'jump' | 'interact' | 'horn' | 'gas' | 'brake' | 'handbrake', down: boolean): void {
    if (btn === 'run') this.touchRun = down;
    if (btn === 'gas') this.touchGas = down;
    if (btn === 'brake') this.touchBrake = down;
    if (btn === 'handbrake') this.touchHandbrake = down;
    if (btn === 'jump' && down) this.justPressed.add('Space');
    if (btn === 'interact' && down) this.justPressed.add('KeyE');
    if (btn === 'horn' && down) this.justPressed.add('KeyH');
  }

  public setTouchSteer(val: number): void {
    this.touchSteer = clamp(val, -1, 1);
  }

  public panCameraBy(dx: number, dy: number): void {
    this.camDragOffsetX = clamp(this.camDragOffsetX - dx / this.camZoom, -260, 260);
    this.camDragOffsetY = clamp(this.camDragOffsetY - dy / this.camZoom, -180, 180);
  }

  public triggerPrimaryInteract(): void {
    this.justPressed.add('KeyE');
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      if (!this.isPaused && !this.isTitleBackdrop) e.preventDefault();
    }
    audioEngine.unlock();
    if (!this.heldKeys.has(e.code)) {
      this.justPressed.add(e.code);
    }
    this.heldKeys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.heldKeys.delete(e.code);
  };

  private handleBlur = () => {
    this.heldKeys.clear();
    this.joyX = 0;
    this.joyY = 0;
    this.touchGas = false;
    this.touchBrake = false;
    this.touchHandbrake = false;
    this.touchSteer = 0;
  };

  private handleWheel = (e: WheelEvent) => {
    if (this.isTitleBackdrop || this.isPaused) return;
    this.settings.cameraZoom = clamp(this.settings.cameraZoom - e.deltaY * 0.0006, 0.72, 1.45);
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: true });
  }

  private unbindEvents(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.canvas.removeEventListener('wheel', this.handleWheel);
  }

  private getCurrentTimePhase(): TimePhase {
    if (this.settings.timeMode !== 'dynamic') return this.settings.timeMode;
    const t = this.worldTimeOfDay;
    if (t < 0.28) return 'morning';
    if (t < 0.65) return 'afternoon';
    if (t < 0.82) return 'evening';
    return 'night';
  }

  private getCurrentWeather(): WeatherType {
    return this.settings.weatherMode === 'dynamic' ? this.dynamicWeather : this.settings.weatherMode;
  }

  private isOnBridge(wx: number, wy: number): boolean {
    for (const r of ROAD_SEGMENTS) {
      if (!r.isBridge) continue;
      if (pointToSegmentDist(wx, wy, r.x1, r.y1, r.x2, r.y2) <= r.width * 0.56) {
        return true;
      }
    }
    return false;
  }

  private isInWater(wx: number, wy: number): boolean {
    if (this.isOnBridge(wx, wy)) return false;
    for (const wz of WATER_ZONES) {
      if (wz.isBeach) continue;
      if (wx >= wz.x && wx <= wz.x + wz.w && wy >= wz.y && wy <= wz.y + wz.d) {
        return true;
      }
    }
    return false;
  }

  private resolveBuildingCollisions(x: number, y: number, radius: number): { x: number; y: number; hit: boolean } {
    let nx = clamp(x, 60, WORLD_SIZE - 60);
    let ny = clamp(y, 60, WORLD_SIZE - 60);
    let hit = false;

    for (const b of WORLD_BUILDINGS) {
      const minX = b.x - b.w * 0.5 - radius;
      const maxX = b.x + b.w * 0.5 + radius;
      const minY = b.y - b.d * 0.5 - radius;
      const maxY = b.y + b.d * 0.5 + radius;

      if (nx > minX && nx < maxX && ny > minY && ny < maxY) {
        hit = true;
        const dLeft = nx - minX;
        const dRight = maxX - nx;
        const dTop = ny - minY;
        const dBottom = maxY - ny;
        const m = Math.min(dLeft, dRight, dTop, dBottom);
        if (m === dLeft) nx = minX;
        else if (m === dRight) nx = maxX;
        else if (m === dTop) ny = minY;
        else ny = maxY;
      }
    }
    return { x: nx, y: ny, hit };
  }

  private update(dt: number): void {
    this.elapsedSec += dt;
    this.animTime += dt;

    // Cycle dynamic time & weather
    this.worldTimeOfDay = (this.worldTimeOfDay + dt * 0.0022) % 1;
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const weathers: WeatherType[] = ['sunny', 'sunny', 'cloudy', 'rain', 'fog'];
      this.dynamicWeather = weathers[Math.floor(Math.random() * weathers.length)];
      this.weatherTimer = 50 + Math.random() * 45;
    }
    audioEngine.updateWeatherAmbience(this.getCurrentWeather());

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    // Smoothly return camera drag offset
    this.camDragOffsetX = lerp(this.camDragOffsetX, 0, dt * 1.8);
    this.camDragOffsetY = lerp(this.camDragOffsetY, 0, dt * 1.8);

    // Title screen scenic camera pan over Dhaka & Padma Bridge
    if (this.isTitleBackdrop) {
      const panX = 2460 + Math.cos(this.elapsedSec * 0.14) * 320;
      const panY = 2320 + Math.sin(this.elapsedSec * 0.11) * 260;
      const iso = worldToIso(panX, panY, 0);
      this.camX = lerp(this.camX, iso.x, dt * 2.5);
      this.camY = lerp(this.camY, iso.y, dt * 2.5);
      this.updateTrafficAndNPCs(dt);
      return;
    }

    // Active Gameplay Input
    if (this.currentVehicle) {
      this.updateVehicleDriving(dt);
    } else {
      this.updateOnFootPlayer(dt);
    }

    this.updateTrafficAndNPCs(dt);
    this.updateCollectiblesAndMissions(dt);
    this.updateParticles(dt);
    this.updateActiveInteraction();

    // Handle Interaction Press (E)
    if (this.justPressed.has('KeyE') && this.activeInteraction) {
      audioEngine.unlock();
      this.activeInteraction.execute();
    }

    // Handle Horn (H)
    if (this.justPressed.has('KeyH')) {
      audioEngine.unlock();
      audioEngine.playHorn(this.currentVehicle ? this.currentVehicle.type : null);
    }

    // Camera Follow with Smooth Velocity Lookahead
    const targetIso = worldToIso(this.px, this.py, this.pz);
    let lookX = 0;
    let lookY = 0;
    if (this.currentVehicle) {
      const vIso = worldToIso(
        this.px + Math.cos(this.currentVehicle.angle) * (this.currentVehicle.speed * 0.24),
        this.py + Math.sin(this.currentVehicle.angle) * (this.currentVehicle.speed * 0.24),
        0
      );
      lookX = vIso.x - targetIso.x;
      lookY = vIso.y - targetIso.y;
    }
    const desiredZoom = this.currentVehicle
      ? clamp(this.settings.cameraZoom - Math.abs(this.currentVehicle.speed) * 0.00035, 0.72, 1.35)
      : this.settings.cameraZoom;
    this.camZoom = lerp(this.camZoom, desiredZoom, dt * 3.2);
    this.camX = lerp(this.camX, targetIso.x + lookX + this.camDragOffsetX, dt * 6.5);
    this.camY = lerp(this.camY, targetIso.y + lookY + this.camDragOffsetY, dt * 6.5);

    // Emit throttled HUD updates (~15Hz so React never slows down the 60fps canvas!)
    this.hudThrottle += dt;
    if (this.hudThrottle >= 0.065) {
      this.hudThrottle = 0;
      this.emitHud();
    }

    // Periodic save sync
    this.syncThrottle += dt;
    if (this.syncThrottle >= 2.0) {
      this.syncThrottle = 0;
      this.callbacks.onStateSync({
        playerX: Math.round(this.px),
        playerY: Math.round(this.py),
        playerAngle: this.pAngle,
      });
    }
  }

  private updateOnFootPlayer(dt: number): void {
    audioEngine.updateVehicleEngine(false, null, 0);

    // Screen-space input vector from keyboard + virtual joystick
    let sx = this.joyX;
    let sy = this.joyY;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) sx -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) sx += 1;
    if (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp')) sy -= 1;
    if (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown')) sy += 1;

    const mag = Math.hypot(sx, sy);
    if (mag > 1) {
      sx /= mag;
      sy /= mag;
    }

    const isSprinting = this.heldKeys.has('ShiftLeft') || this.heldKeys.has('ShiftRight') || this.touchRun;

    if (this.victoryTimer > 0) {
      this.victoryTimer -= dt;
      this.animState = 'victory';
      return;
    }

    if (this.sitTimer > 0) {
      if (mag > 0.2 || this.justPressed.has('Space')) {
        this.sitTimer = 0;
      } else {
        this.animState = 'sit';
        return;
      }
    }

    // Jump & Landing physics
    if (this.justPressed.has('Space') && this.pz === 0) {
      this.pvz = 215;
      audioEngine.playJump();
      this.spawnBurst(this.px, this.py, 'rgba(226, 232, 240, 0.55)', 6);
    }

    if (this.pz > 0 || this.pvz > 0) {
      this.pz += this.pvz * dt;
      this.pvz -= 620 * dt;
      if (this.pz <= 0) {
        this.pz = 0;
        this.pvz = 0;
        this.landTimer = 0.16;
        audioEngine.playLand();
        this.spawnBurst(this.px, this.py, 'rgba(203, 213, 225, 0.6)', 8);
      }
    }
    if (this.landTimer > 0) this.landTimer -= dt;

    if (mag > 0.12) {
      // Transform screen-space direction into true isometric world-space direction!
      const rawWx = sx * 0.7071 + sy * 1.4142;
      const rawWy = -sx * 0.7071 + sy * 1.4142;
      const wLen = Math.hypot(rawWx, rawWy) || 1;
      const dx = rawWx / wLen;
      const dy = rawWy / wLen;

      const targetAngle = Math.atan2(dy, dx);
      this.pAngle = lerpAngle(this.pAngle, targetAngle, dt * 13);

      const moveSpeed = isSprinting ? 235 : mag > 0.65 ? 165 : 105;
      const nextX = this.px + dx * moveSpeed * dt;
      const nextY = this.py + dy * moveSpeed * dt;

      // Prevent walking deep into river unless on bridge
      const hitWater = this.isInWater(nextX, nextY);
      if (!hitWater) {
        const res = this.resolveBuildingCollisions(nextX, nextY, 14);
        this.px = res.x;
        this.py = res.y;
      }

      if (this.pz > 2) {
        this.animState = 'jump';
      } else if (this.landTimer > 0) {
        this.animState = 'land';
      } else {
        this.animState = isSprinting ? 'sprint' : mag > 0.65 ? 'run' : 'walk';
      }

      // Footstep rhythm & dust
      this.footstepTimer -= dt * (isSprinting ? 1.55 : 1.0);
      if (this.footstepTimer <= 0 && this.pz === 0) {
        this.footstepTimer = 0.34;
        audioEngine.playFootstep(isSprinting);
        if (isSprinting) {
          this.spawnBurst(this.px, this.py, 'rgba(203, 213, 225, 0.35)', 2);
        }
      }
    } else {
      if (this.pz > 2) this.animState = 'jump';
      else if (this.landTimer > 0) this.animState = 'land';
      else this.animState = 'idle';
    }
  }

  private updateVehicleDriving(dt: number): void {
    const v = this.currentVehicle;
    if (!v) return;
    const spec = VEHICLE_SPEC_MAP[v.type];
    const upg = this.progress.vehicleUpgrades[v.type];
    const engineMult = 1 + (upg?.engineLevel ?? 0) * 0.11;
    const turnMult = 1 + (upg?.handlingLevel ?? 0) * 0.1;

    const throttle =
      (this.heldKeys.has('KeyW') || this.heldKeys.has('ArrowUp') || this.touchGas ? 1 : 0) -
      (this.heldKeys.has('KeyS') || this.heldKeys.has('ArrowDown') || this.touchBrake ? 1 : 0);

    let steerIn = this.touchSteer;
    if (this.heldKeys.has('KeyA') || this.heldKeys.has('ArrowLeft')) steerIn -= 1;
    if (this.heldKeys.has('KeyD') || this.heldKeys.has('ArrowRight')) steerIn += 1;
    steerIn = clamp(steerIn, -1, 1);

    const handbrake = this.heldKeys.has('Space') || this.touchHandbrake;

    const maxSpd = spec.maxSpeed * engineMult;
    const accel = spec.accel * engineMult;

    if (throttle > 0) {
      v.speed += accel * dt;
    } else if (throttle < 0) {
      if (v.speed > 15) {
        v.speed -= spec.brakePower * dt;
      } else {
        v.speed -= accel * 0.55 * dt; // Reverse
      }
    } else {
      // Rolling drag
      v.speed *= Math.pow(spec.isWatercraft ? 0.35 : 0.22, dt);
      if (Math.abs(v.speed) < 3) v.speed = 0;
    }

    if (handbrake) {
      v.speed *= Math.pow(0.08, dt);
      if (Math.abs(v.speed) > 95 && !spec.isWatercraft) {
        this.spawnBurst(v.x, v.y, 'rgba(148, 163, 184, 0.45)', 1);
      }
    }

    v.speed = clamp(v.speed, -maxSpd * 0.38, maxSpd);

    // Steering responsiveness scaled by speed
    const steerVisualTarget = steerIn * 0.42;
    v.steerAngle = lerp(v.steerAngle, steerVisualTarget, dt * 10);

    const speedFactor = clamp(Math.abs(v.speed) / 90, 0, 1);
    const reverseSign = v.speed >= -2 ? 1 : -1;
    const driftTurnBoost = handbrake ? 1.38 : 1.0;
    v.angle += steerIn * spec.turnSpeed * turnMult * speedFactor * reverseSign * driftTurnBoost * dt;

    // Velocity vector with lateral grip (gives crisp cornering or subtle drift!)
    const targetVx = Math.cos(v.angle) * v.speed;
    const targetVy = Math.sin(v.angle) * v.speed;
    const grip = handbrake ? spec.grip * 0.45 : spec.grip;
    const blend = clamp(grip * 10 * dt, 0, 1);
    v.vx = lerp(v.vx, targetVx, blend);
    v.vy = lerp(v.vy, targetVy, blend);

    const nextX = v.x + v.vx * dt;
    const nextY = v.y + v.vy * dt;

    // Water vs Land surface rules
    const nextInWater = this.isInWater(nextX, nextY);
    if (spec.isWatercraft) {
      if (nextInWater) {
        v.x = clamp(nextX, 60, WORLD_SIZE - 60);
        v.y = clamp(nextY, 60, WORLD_SIZE - 60);
      } else {
        // Gentle bounce off shore
        v.speed *= -0.35;
        v.vx *= -0.35;
        v.vy *= -0.35;
      }
    } else {
      if (nextInWater) {
        // Land vehicles stop at riverbanks unless crossing a bridge!
        v.speed *= -0.25;
        v.vx *= -0.25;
        v.vy *= -0.25;
        this.callbacks.onToast('Use Padma Bridge or a Boat at the pier to cross deep water!', 'info');
      } else {
        const res = this.resolveBuildingCollisions(nextX, nextY, spec.width * 0.55);
        v.x = res.x;
        v.y = res.y;
        if (res.hit && Math.abs(v.speed) > 130) {
          this.triggerShake(0.22, 6);
          v.speed *= -0.3;
          v.vx *= -0.3;
          v.vy *= -0.3;
        }
      }
      v.z = this.isOnBridge(v.x, v.y) ? 14 : 0;
    }

    v.wheelSpin += (v.speed * dt) / 10;
    this.px = v.x;
    this.py = v.y;
    this.pz = v.z;
    this.pAngle = v.angle;

    audioEngine.updateVehicleEngine(true, v.type, v.speed / maxSpd);
  }

  private updateTrafficAndNPCs(dt: number): void {
    // Update AI traffic vehicles smoothly along road segments
    for (const v of this.vehicles) {
      if (!v.isTraffic || v.trafficRouteIndex === undefined) continue;
      const seg = ROAD_SEGMENTS[v.trafficRouteIndex];
      if (!seg) continue;

      const dir = v.trafficDir ?? 1;
      const tx = dir === 1 ? seg.x2 : seg.x1;
      const ty = dir === 1 ? seg.y2 : seg.y1;
      const dx = tx - v.x;
      const dy = ty - v.y;
      const d = Math.hypot(dx, dy);

      if (d < 45) {
        v.trafficDir = dir === 1 ? -1 : 1;
        v.angle += Math.PI;
      } else {
        const desiredAngle = Math.atan2(dy, dx);
        v.angle = lerpAngle(v.angle, desiredAngle, dt * 6);

        // Pause briefly if player is right in front of traffic
        const distToPlayer = dist(v.x, v.y, this.px, this.py);
        const targetSpd = distToPlayer < 95 ? 0 : VEHICLE_SPEC_MAP[v.type].maxSpeed * 0.36;
        v.speed = lerp(v.speed, targetSpd, dt * 3);

        v.x += Math.cos(v.angle) * v.speed * dt;
        v.y += Math.sin(v.angle) * v.speed * dt;
        v.z = this.isOnBridge(v.x, v.y) ? 14 : 0;
        v.wheelSpin += (v.speed * dt) / 10;
      }
    }

    // Update living NPCs wandering footpaths & plazas
    for (const npc of this.npcs) {
      npc.walkPhase += dt;
      const d = dist(npc.x, npc.y, npc.targetX, npc.targetY);
      if (d < 4) {
        npc.waitTimer -= dt;
        if (npc.waitTimer <= 0) {
          const ang = Math.random() * Math.PI * 2;
          const rad = 28 + Math.random() * 65;
          npc.targetX = npc.homeX + Math.cos(ang) * rad;
          npc.targetY = npc.homeY + Math.sin(ang) * rad;
          npc.waitTimer = 1.5 + Math.random() * 2.5;
        }
      } else {
        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const spd = 42;
        npc.x += (dx / d) * spd * dt;
        npc.y += (dy / d) * spd * dt;
        npc.angle = Math.atan2(dy, dx);
      }
    }
  }

  private updateCollectiblesAndMissions(dt: number): void {
    // 1. Collect nearby coins & district emblems
    for (const item of this.collectibles) {
      if (item.collected) continue;
      if (dist(this.px, this.py, item.x, item.y) < 38) {
        item.collected = true;
        audioEngine.playCoin();
        this.spawnBurst(item.x, item.y, '#facc15', 14);
        this.callbacks.onCollectiblePicked(item);
      }
    }

    // 2. Check nearest District Discovery
    this.checkDistrictDiscovery();

    // 3. Check Active Mission completion
    const activeMission = MAIN_MISSIONS.find((m) => m.id === this.progress.activeMissionId);
    if (activeMission && !this.progress.completedMissions.includes(activeMission.id)) {
      const d = dist(this.px, this.py, activeMission.targetX, activeMission.targetY);
      if (d <= activeMission.targetRadius) {
        audioEngine.playMissionComplete();
        this.triggerVictoryPose();
        this.callbacks.onMissionComplete({
          title: activeMission.title,
          subtitle: activeMission.banglaTitle,
          coins: activeMission.rewardCoins,
          xp: activeMission.rewardXp,
          unlockedItem: activeMission.unlocksVehicle
            ? VEHICLE_SPEC_MAP[activeMission.unlocksVehicle].name
            : undefined,
        });
      }
    }
  }

  private checkDistrictDiscovery(): void {
    let nearest = DISTRICTS[0];
    let bestD = Infinity;
    for (const d of DISTRICTS) {
      const dd = dist(this.px, this.py, d.worldX, d.worldY);
      if (dd < bestD) {
        bestD = dd;
        nearest = d;
      }
    }
    if (nearest.id !== this.progress.currentDistrictId) {
      this.progress.currentDistrictId = nearest.id;
      this.callbacks.onStateSync({ currentDistrictId: nearest.id });
    }
    if (bestD < 260 && !this.progress.discoveredDistricts.includes(nearest.id)) {
      this.callbacks.onDistrictDiscovered(nearest.id);
    }
  }

  private updateActiveInteraction(): void {
    if (this.currentVehicle) {
      const spec = VEHICLE_SPEC_MAP[this.currentVehicle.type];
      this.activeInteraction = {
        prompt: `Exit ${spec.name} [E]`,
        type: 'vehicle',
        execute: () => this.exitVehicle(),
      };
      return;
    }

    // 1. Check nearby vehicles to enter
    let closestVeh: WorldVehicle | null = null;
    let closestVehDist = 72;
    for (const v of this.vehicles) {
      if (v.isTraffic) continue;
      const d = dist(this.px, this.py, v.x, v.y);
      if (d < closestVehDist) {
        closestVehDist = d;
        closestVeh = v;
      }
    }
    if (closestVeh) {
      const spec = VEHICLE_SPEC_MAP[closestVeh.type];
      this.activeInteraction = {
        prompt: `Drive ${spec.name} [E]`,
        type: 'vehicle',
        execute: () => this.enterVehicle(closestVeh!),
      };
      return;
    }

    // 2. Check nearby Activity Spots (Cricket, Fishing, Photography)
    for (const act of ACTIVITY_SPOTS) {
      if (dist(this.px, this.py, act.x, act.y) < 62) {
        this.activeInteraction = {
          prompt: `Play ${act.name} [E]`,
          type: 'activity',
          execute: () => this.callbacks.onStartActivity(act),
        };
        return;
      }
    }

    // 3. Check Interactive Buildings (Sa7 Store, Sa7 Garage, Cha Dokan)
    for (const b of WORLD_BUILDINGS) {
      if (!b.interactiveType || b.interactiveType === 'landmark') continue;
      const d = dist(this.px, this.py, b.x, b.y);
      if (d < Math.max(b.w, b.d) * 0.65 + 48) {
        if (b.interactiveType === 'store') {
          this.activeInteraction = {
            prompt: 'Enter Sa7 Store & Boutique [E]',
            type: 'building',
            execute: () => this.callbacks.onOpenStore(),
          };
          return;
        }
        if (b.interactiveType === 'garage') {
          this.activeInteraction = {
            prompt: 'Enter Sa7 Customs & Garage [E]',
            type: 'building',
            execute: () => this.callbacks.onOpenGarage(),
          };
          return;
        }
        if (b.interactiveType === 'tea_stall') {
          this.activeInteraction = {
            prompt: 'Sit & Drink Garom Cha [E]',
            type: 'building',
            execute: () => {
              this.sitTimer = 4.0;
              this.callbacks.onToast('Enjoying hot Bangladeshi Cha! Health restored.', 'success');
              this.callbacks.onStateSync({ health: this.progress.maxHealth });
            },
          };
          return;
        }
      }
    }

    // 4. Check nearby NPCs to talk
    for (const npc of this.npcs) {
      if (dist(this.px, this.py, npc.x, npc.y) < 58) {
        this.activeInteraction = {
          prompt: `Talk to ${npc.name} [E]`,
          type: 'npc',
          execute: () => {
            this.callbacks.onToast(`${npc.name}: "${npc.dialogue}"`, 'info');
          },
        };
        return;
      }
    }

    this.activeInteraction = null;
  }

  private enterVehicle(v: WorldVehicle): void {
    this.currentVehicle = v;
    this.px = v.x;
    this.py = v.y;
    this.pz = v.z;
    audioEngine.setMood('driving');
    audioEngine.playClick();
    this.callbacks.onToast(`Entered ${VEHICLE_SPEC_MAP[v.type].name}`, 'info');
  }

  private exitVehicle(): void {
    if (!this.currentVehicle) return;
    const v = this.currentVehicle;
    const spec = VEHICLE_SPEC_MAP[v.type];
    v.speed *= 0.25;
    if (spec.isWatercraft) {
      // Hop onto Padma / Cox's Bazar pier or bank safely
      this.px = v.x;
      this.py = v.y - 115;
      if (this.isInWater(this.px, this.py)) {
        this.px = 2630;
        this.py = 3315;
      }
    } else {
      this.px = v.x + Math.cos(v.angle + Math.PI * 0.5) * 34;
      this.py = v.y + Math.sin(v.angle + Math.PI * 0.5) * 34;
    }
    this.pz = 0;
    this.currentVehicle = null;
    audioEngine.updateVehicleEngine(false, null, 0);
    audioEngine.setMood('openworld');
    audioEngine.playClick();
  }

  private spawnBurst(wx: number, wy: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * 85;
      this.particles.push({
        x: wx,
        y: wy,
        z: 6 + Math.random() * 10,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        vz: 40 + Math.random() * 90,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: 2.5 + Math.random() * 3,
        color,
      });
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z = Math.max(0, p.z + p.vz * dt);
      p.vz -= 240 * dt;
    }
  }

  private triggerShake(duration: number, magnitude: number): void {
    this.shakeTime = duration;
    this.shakeMag = magnitude;
  }

  private render(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, this.settings.graphicsQuality === 'low' ? 1 : 2);
    const rect = this.canvas.getBoundingClientRect();
    const viewW = Math.max(1, Math.floor(rect.width));
    const viewH = Math.max(1, Math.floor(rect.height));

    if (this.canvas.width !== Math.floor(viewW * dpr) || this.canvas.height !== Math.floor(viewH * dpr)) {
      this.canvas.width = Math.floor(viewW * dpr);
      this.canvas.height = Math.floor(viewH * dpr);
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply zoom & camera center + decaying camera shake
    const shakeX = this.shakeTime > 0 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;
    const shakeY = this.shakeTime > 0 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;

    const scaledW = viewW / this.camZoom;
    const scaledH = viewH / this.camZoom;
    const camLeft = this.camX - scaledW * 0.5 + shakeX;
    const camTop = this.camY - scaledH * 0.5 + shakeY;

    ctx.scale(this.camZoom, this.camZoom);

    const timePhase = this.getCurrentTimePhase();
    const weather = this.getCurrentWeather();
    const isNight = timePhase === 'night';

    // 1. Render Terrain, Water, Roads & Bridges
    renderWorldGroundAndRoads({
      ctx,
      camX: camLeft,
      camY: camTop,
      viewW: scaledW,
      viewH: scaledH,
      timeSec: this.elapsedSec,
      weather,
      timePhase,
      quality: this.settings.graphicsQuality,
    });

    // 2. Active Mission Waypoint Beacon on Ground
    const activeMission = MAIN_MISSIONS.find((m) => m.id === this.progress.activeMissionId);
    if (activeMission && !this.progress.completedMissions.includes(activeMission.id) && !this.isTitleBackdrop) {
      const mp = worldToIso(activeMission.targetX, activeMission.targetY, 2);
      const sx = mp.x - camLeft;
      const sy = mp.y - camTop;
      const pulse = 1 + Math.sin(this.elapsedSec * 4) * 0.14;
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 48 * pulse, 24 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
      ctx.fill();

      // Vertical light pillar
      const grad = ctx.createLinearGradient(sx, sy, sx, sy - 110);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.52)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx - 12, sy - 110, 24, 110);
      ctx.restore();
    }

    // 3. Depth-sorted Isometric Draw Queue (Buildings, Trees, Collectibles, Vehicles, NPCs, Sajjad)
    type DrawEntry = { depth: number; draw: () => void };
    const queue: DrawEntry[] = [];

    const inView = (wx: number, wy: number, pad = 260) => {
      const p = worldToIso(wx, wy, 0);
      const sx = p.x - camLeft;
      const sy = p.y - camTop;
      return sx > -pad && sx < scaledW + pad && sy > -pad && sy < scaledH + pad;
    };

    for (const b of WORLD_BUILDINGS) {
      if (!inView(b.x, b.y, 340)) continue;
      queue.push({
        depth: b.x + b.y,
        draw: () => renderBuilding(ctx, b, camLeft, camTop, isNight),
      });
    }

    for (const t of TREE_PROPS) {
      if (!inView(t.x, t.y, 120)) continue;
      queue.push({
        depth: t.x + t.y,
        draw: () => renderTree(ctx, t, camLeft, camTop, this.elapsedSec),
      });
    }

    for (const c of this.collectibles) {
      if (c.collected || !inView(c.x, c.y, 80)) continue;
      queue.push({
        depth: c.x + c.y,
        draw: () => renderCollectible(ctx, c, camLeft, camTop, this.elapsedSec),
      });
    }

    for (const npc of this.npcs) {
      if (!inView(npc.x, npc.y, 100)) continue;
      const p = worldToIso(npc.x, npc.y, 0);
      queue.push({
        depth: npc.x + npc.y,
        draw: () => renderNPC(ctx, npc, p.x - camLeft, p.y - camTop),
      });
    }

    for (const v of this.vehicles) {
      if (!inView(v.x, v.y, 180)) continue;
      queue.push({
        depth: v.x + v.y,
        draw: () =>
          renderVehicle({
            ctx,
            v,
            camX: camLeft,
            camY: camTop,
            isNight,
            isPlayerInside: this.currentVehicle?.id === v.id,
            playerOutfit: this.progress.equippedOutfit,
            timeSec: this.elapsedSec,
          }),
      });
    }

    if (!this.currentVehicle && !this.isTitleBackdrop) {
      const sp = worldToIso(this.px, this.py, 0);
      queue.push({
        depth: this.px + this.py,
        draw: () =>
          renderSajjadCharacter({
            ctx,
            screenX: sp.x - camLeft,
            screenY: sp.y - camTop,
            zHeight: this.pz,
            angle: this.pAngle,
            animState: this.animState,
            animTime: this.animTime,
            outfit: this.progress.equippedOutfit,
          }),
      });
    }

    queue.sort((a, b) => a.depth - b.depth);
    for (const item of queue) {
      item.draw();
    }

    // 4. Particles (Dust, Skid Smoke, Coin Bursts)
    for (const p of this.particles) {
      const ip = worldToIso(p.x, p.y, p.z);
      ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(ip.x - camLeft, ip.y - camTop, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 5. Dynamic Time-of-Day Grading, Streetlamps & Monsoon Rain/Fog
    renderWeatherAndLighting(
      ctx,
      scaledW,
      scaledH,
      timePhase,
      weather,
      this.elapsedSec,
      camLeft,
      camTop,
      this.settings.graphicsQuality
    );

    ctx.restore();
  }

  private emitHud(): void {
    const currentDistrict = DISTRICT_BY_ID[this.progress.currentDistrictId] ?? DISTRICTS[0];
    const currentDivision = DIVISION_BY_ID[currentDistrict.divisionId];
    const activeMission = MAIN_MISSIONS.find((m) => m.id === this.progress.activeMissionId) ?? MAIN_MISSIONS[0];

    const mDist = Math.round(dist(this.px, this.py, activeMission.targetX, activeMission.targetY) * 0.15);
    const mBear = Math.atan2(activeMission.targetY - this.py, activeMission.targetX - this.px);

    // Format in-game clock
    const totalHours = Math.floor(this.worldTimeOfDay * 24);
    const mins = Math.floor((this.worldTimeOfDay * 24 - totalHours) * 60);
    const ampm = totalHours >= 12 ? 'PM' : 'AM';
    const h12 = totalHours % 12 === 0 ? 12 : totalHours % 12;
    const clockText = `${h12}:${mins.toString().padStart(2, '0')} ${ampm}`;

    const nearbyVehicles = this.vehicles
      .filter((v) => !v.isTraffic && dist(this.px, this.py, v.x, v.y) < 1200)
      .map((v) => ({ x: v.x, y: v.y, type: v.type }));

    const nearbyActivities = ACTIVITY_SPOTS.filter((a) => dist(this.px, this.py, a.x, a.y) < 1200).map((a) => ({
      x: a.x,
      y: a.y,
      type: a.type,
    }));

    this.callbacks.onHudUpdate({
      health: this.progress.health,
      maxHealth: this.progress.maxHealth,
      coins: this.progress.coins,
      xp: this.progress.xp,
      level: this.progress.level,
      speedKmh: this.currentVehicle ? Math.round(Math.abs(this.currentVehicle.speed) * 0.22) : 0,
      inVehicle: !!this.currentVehicle,
      vehicleName: this.currentVehicle ? VEHICLE_SPEC_MAP[this.currentVehicle.type].name : null,
      vehicleType: this.currentVehicle ? this.currentVehicle.type : null,
      vehicleHealth: this.currentVehicle ? this.currentVehicle.health : 0,
      currentDistrictName: `${currentDistrict.name} · ${currentDistrict.banglaName}`,
      currentDivisionName: currentDivision?.name ?? 'Dhaka',
      timePhase: this.getCurrentTimePhase(),
      clockText,
      weather: this.getCurrentWeather(),
      interactionPrompt: this.activeInteraction?.prompt ?? null,
      interactionActionType: this.activeInteraction?.type ?? null,
      activeMissionTitle: activeMission.title,
      activeMissionObjective: activeMission.objectiveText,
      missionDistanceM: mDist,
      missionBearingRad: mBear,
      fps: Math.round(this.fpsAvg),
      playerX: this.px,
      playerY: this.py,
      playerAngle: this.pAngle,
      missionTargetX: activeMission.targetX,
      missionTargetY: activeMission.targetY,
      nearbyVehicles,
      nearbyActivities,
    });
  }
}
