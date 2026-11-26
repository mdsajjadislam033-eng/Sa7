export type GameScreenState = 'LOADING' | 'TITLE_MENU' | 'PLAYING' | 'PAUSED';

export type ActiveModal =
  | null
  | 'MAP'
  | 'MISSIONS'
  | 'STORE'
  | 'GARAGE'
  | 'INVENTORY'
  | 'SETTINGS'
  | 'HOW_TO_PLAY'
  | 'CREDITS'
  | 'REWARD';

export type GraphicsQuality = 'low' | 'medium' | 'high';
export type TimePhase = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherType = 'sunny' | 'cloudy' | 'rain' | 'fog';

export type CharacterAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'turn'
  | 'jump'
  | 'land'
  | 'interact'
  | 'enterVehicle'
  | 'exitVehicle'
  | 'sit'
  | 'victory';

export type VehicleType =
  | 'bicycle'
  | 'motorcycle'
  | 'rickshaw'
  | 'cng'
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'bus'
  | 'truck'
  | 'boat'
  | 'speedboat'
  | 'coupe';

export type ClothingSlot = 'top' | 'bottom' | 'shoes' | 'hat' | 'eyewear' | 'backpack';

export interface StoreItem {
  id: string;
  name: string;
  banglaName: string;
  category: 'clothing' | 'accessories' | 'equipment' | 'upgrades' | 'collectibles';
  slot?: ClothingSlot;
  price: number;
  description: string;
  previewColor: string;
  accentColor?: string;
  statBoost?: string;
}

export interface VehicleSpec {
  type: VehicleType;
  name: string;
  banglaName: string;
  price: number;
  isWatercraft: boolean;
  maxSpeed: number; // world units/sec
  accel: number;
  brakePower: number;
  turnSpeed: number; // rad/sec
  grip: number; // 0..1 lateral grip
  durability: number;
  defaultColor: string;
  secondaryColor: string;
  length: number;
  width: number;
  description: string;
}

export interface VehicleUpgradeState {
  engineLevel: number; // 0..3
  handlingLevel: number; // 0..3
  armorLevel: number; // 0..3
  customColor?: string;
}

export interface DivisionInfo {
  id: string;
  name: string;
  banglaName: string;
  biome: 'metro' | 'delta' | 'coast' | 'tea_hills' | 'hill_tracts' | 'mangrove' | 'heritage' | 'riverine';
  color: string;
  description: string;
}

export interface DistrictInfo {
  id: string;
  name: string;
  banglaName: string;
  divisionId: string;
  landmark: string;
  worldX: number; // anchor in world coordinates
  worldY: number;
  mapPercentX: number; // 0..100 for Bangladesh national map
  mapPercentY: number;
  rewardCoins: number;
  rewardXp: number;
  collectibleName: string;
  missionTitle: string;
  missionDesc: string;
}

export type BuildingKind =
  | 'sangsad'
  | 'shaheed_minar'
  | 'savar_memorial'
  | 'lalbagh'
  | 'paharpur'
  | 'sajek_resort'
  | 'tea_pavilion'
  | 'cox_hotel'
  | 'shop_cha'
  | 'shop_bazaar'
  | 'sa7_store'
  | 'sa7_garage'
  | 'apartment'
  | 'house'
  | 'bus_shelter'
  | 'watchtower';

export interface WorldBuilding {
  id: string;
  kind: BuildingKind;
  name: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  color: string;
  roofColor: string;
  landmarkDistrictId?: string;
  interactiveType?: 'store' | 'garage' | 'tea_stall' | 'home' | 'landmark';
}

export interface RoadSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  isBridge?: boolean;
  hasDivider?: boolean;
  name?: string;
}

export interface WaterZone {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  d: number;
  isBeach?: boolean;
}

export interface TreeProp {
  x: number;
  y: number;
  kind: 'banyan' | 'palm' | 'mango' | 'tea_bush' | 'mangrove';
  scale: number;
}

export interface ActivitySpot {
  id: string;
  type: 'cricket' | 'fishing' | 'photography' | 'racing' | 'boat_ride';
  name: string;
  banglaName: string;
  x: number;
  y: number;
  rewardCoins: number;
  description: string;
}

export interface MissionStep {
  id: string;
  title: string;
  banglaTitle: string;
  category: 'main' | 'district' | 'side' | 'delivery' | 'photography' | 'driving';
  introText: string;
  objectiveText: string;
  targetX: number;
  targetY: number;
  targetRadius: number;
  requireVehicleType?: VehicleType;
  requireOnFoot?: boolean;
  requireActivity?: ActivitySpot['type'];
  rewardCoins: number;
  rewardXp: number;
  unlocksVehicle?: VehicleType;
  districtId?: string;
}

export interface WorldVehicle {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  z: number;
  angle: number;
  vx: number;
  vy: number;
  speed: number;
  steerAngle: number;
  wheelSpin: number;
  color: string;
  secondaryColor: string;
  health: number;
  maxHealth: number;
  isTraffic?: boolean;
  trafficRouteIndex?: number;
  trafficDir?: 1 | -1;
}

export interface WorldNPC {
  id: string;
  name: string;
  role: 'citizen' | 'shopkeeper' | 'rickshaw_puller' | 'student' | 'fisherman' | 'guide';
  x: number;
  y: number;
  angle: number;
  walkPhase: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
  waitTimer: number;
  shirtColor: string;
  pantsColor: string;
  dialogue: string;
  isSeated?: boolean;
}

export interface CollectibleItem {
  id: string;
  kind: 'coin' | 'emblem' | 'treasure';
  label: string;
  x: number;
  y: number;
  value: number;
  districtId?: string;
  collected: boolean;
}

export interface EquippedOutfit {
  top: string;
  bottom: string;
  shoes: string;
  hat: string | null;
  eyewear: string | null;
  backpack: string | null;
}

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  showTouchControls: boolean;
  timeMode: 'dynamic' | TimePhase;
  weatherMode: 'dynamic' | WeatherType;
  cameraZoom: number;
}

export interface MissionRewardSummary {
  title: string;
  subtitle: string;
  coins: number;
  xp: number;
  unlockedItem?: string;
}

export interface PlayerProgress {
  coins: number;
  xp: number;
  level: number;
  health: number;
  maxHealth: number;
  playerX: number;
  playerY: number;
  playerAngle: number;
  currentDistrictId: string;
  discoveredDistricts: string[];
  completedMissions: string[];
  activeMissionId: string;
  ownedItems: string[];
  equippedOutfit: EquippedOutfit;
  ownedVehicles: VehicleType[];
  activeGarageVehicle: VehicleType;
  vehicleUpgrades: Partial<Record<VehicleType, VehicleUpgradeState>>;
  collectedIds: string[];
  achievements: string[];
  stats: {
    distanceDrivenKm: number;
    distanceWalkedKm: number;
    activitiesCompleted: number;
    photosTaken: number;
    fishCaught: number;
  };
}

export interface HudSnapshot {
  health: number;
  maxHealth: number;
  coins: number;
  xp: number;
  level: number;
  speedKmh: number;
  inVehicle: boolean;
  vehicleName: string | null;
  vehicleType: VehicleType | null;
  vehicleHealth: number;
  currentDistrictName: string;
  currentDivisionName: string;
  timePhase: TimePhase;
  clockText: string;
  weather: WeatherType;
  interactionPrompt: string | null;
  interactionActionType: 'vehicle' | 'npc' | 'activity' | 'building' | 'landmark' | null;
  activeMissionTitle: string;
  activeMissionObjective: string;
  missionDistanceM: number;
  missionBearingRad: number;
  fps: number;
  playerX: number;
  playerY: number;
  playerAngle: number;
  missionTargetX: number;
  missionTargetY: number;
  nearbyVehicles: Array<{ x: number; y: number; type: VehicleType }>;
  nearbyActivities: Array<{ x: number; y: number; type: ActivitySpot['type'] }>;
}
