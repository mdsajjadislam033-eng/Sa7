import {
  ActivitySpot,
  CollectibleItem,
  RoadSegment,
  TreeProp,
  WaterZone,
  WorldBuilding,
  WorldNPC,
  WorldVehicle,
} from '../types/game';
import { DISTRICTS } from './bangladeshWorld';

export const WORLD_SIZE = 5800;

// Wide Padma River & Coastal/Lake water zones
export const WATER_ZONES: WaterZone[] = [
  // Padma River running West-East across the heart of Bangladesh (y: 3320..3740)
  {
    id: 'padma_river',
    name: 'Padma River',
    x: 0,
    y: 3340,
    w: 5800,
    d: 390,
  },
  // Kaptai Lake in Chattogram Hill Tracts
  {
    id: 'kaptai_lake',
    name: 'Kaptai Lake',
    x: 4750,
    y: 3780,
    w: 750,
    d: 450,
  },
  // Sundarbans Creek
  {
    id: 'sundarbans_creek',
    name: 'Sundarbans Mangrove River',
    x: 750,
    y: 4850,
    w: 980,
    d: 360,
  },
  // Cox's Bazar Bay of Bengal Shore & Beach
  {
    id: 'bay_of_bengal_beach',
    name: 'Cox’s Bazar Golden Sand',
    x: 4100,
    y: 5280,
    w: 1700,
    d: 180,
    isBeach: true,
  },
  {
    id: 'bay_of_bengal',
    name: 'Bay of Bengal',
    x: 4100,
    y: 5460,
    w: 1700,
    d: 340,
  },
  // Sangsad Bhaban Reflecting Moat
  {
    id: 'sangsad_moat',
    name: 'Sangsad Crescent Lake',
    x: 1920,
    y: 1920,
    w: 360,
    d: 260,
  },
];

// Interconnected smooth road network across Dhaka & Bangladesh
export const ROAD_SEGMENTS: RoadSegment[] = [
  // Central Dhaka Grid & Avenues
  { id: 'r_dhaka_main_ew', x1: 1200, y1: 2400, x2: 3950, y2: 2400, width: 130, hasDivider: true, name: 'Manik Mia — Bijoy Sarani Ave' },
  { id: 'r_dhaka_north_ew', x1: 1800, y1: 1950, x2: 3250, y2: 1950, width: 105, hasDivider: true, name: 'Mirpur — Banani Link Road' },
  { id: 'r_dhaka_south_ew', x1: 1850, y1: 2800, x2: 3200, y2: 2800, width: 105, hasDivider: true, name: 'Old Dhaka Heritage Boulevard' },

  // North-South Central Spine (Rangpur/Mymensingh -> Dhaka -> Padma Bridge -> Barishal)
  { id: 'r_central_ns_north', x1: 2500, y1: 600, x2: 2500, y2: 3340, width: 130, hasDivider: true, name: 'Dhaka–Mymensingh–Mawa Expressway' },
  { id: 'r_padma_bridge', x1: 2500, y1: 3340, x2: 2500, y2: 3730, width: 140, isBridge: true, hasDivider: true, name: 'Padma Multipurpose Bridge' },
  { id: 'r_central_ns_south', x1: 2500, y1: 3730, x2: 2500, y2: 5300, width: 125, hasDivider: true, name: 'Southern Delta Highway' },

  // Dhaka Inner Ring North-South Connectors
  { id: 'r_dhaka_west_ns', x1: 1950, y1: 1950, x2: 1950, y2: 2800, width: 100, hasDivider: false, name: 'Sangsad West Avenue' },
  { id: 'r_dhaka_east_ns', x1: 3050, y1: 1950, x2: 3050, y2: 2800, width: 100, hasDivider: false, name: 'Motijheel Commercial Avenue' },

  // Western Heritage Corridor (Rajshahi, Bogura, Paharpur, Savar, Khulna)
  { id: 'r_west_ns', x1: 1100, y1: 650, x2: 1100, y2: 3340, width: 110, hasDivider: true, name: 'North Bengal Heritage Highway' },
  { id: 'r_west_bridge', x1: 1100, y1: 3340, x2: 1100, y2: 3730, width: 115, isBridge: true, hasDivider: true, name: 'Lalon Shah Bridge' },
  { id: 'r_west_south_ns', x1: 1100, y1: 3730, x2: 1400, y2: 4750, width: 105, hasDivider: false, name: 'Khulna–Sundarbans Road' },
  { id: 'r_north_ew', x1: 700, y1: 700, x2: 2500, y2: 700, width: 100, hasDivider: false, name: 'Rangpur–Dinajpur Trunk Road' },
  { id: 'r_bogura_ew', x1: 950, y1: 1400, x2: 2500, y2: 1400, width: 100, hasDivider: false, name: 'Bogura–Tangail Connector' },

  // Eastern Corridor (Sylhet, Cumilla, Chattogram, Sajek, Cox's Bazar)
  { id: 'r_sylhet_diag', x1: 2500, y1: 1950, x2: 5050, y2: 1200, width: 115, hasDivider: true, name: 'Dhaka–Sylhet Tea Highway' },
  { id: 'r_east_ns', x1: 4350, y1: 1450, x2: 4350, y2: 3340, width: 115, hasDivider: true, name: 'Eastern Border Express' },
  { id: 'r_east_bridge', x1: 4350, y1: 3340, x2: 4350, y2: 3730, width: 120, isBridge: true, hasDivider: true, name: 'Meghna–Gomti Bridge' },
  { id: 'r_ctg_coxs', x1: 4350, y1: 3730, x2: 4850, y2: 5200, width: 120, hasDivider: true, name: 'Chattogram–Cox’s Bazar Marine Drive' },
  { id: 'r_sajek_climb', x1: 4350, y1: 3250, x2: 5280, y2: 3250, width: 95, hasDivider: false, name: 'Sajek Hill Ascent Road' },
  { id: 'r_south_cross', x1: 1400, y1: 4650, x2: 4650, y2: 4650, width: 110, hasDivider: true, name: 'Southern Coastal Connector' },
  { id: 'r_south_mawa_khulna', x1: 1100, y1: 4050, x2: 2500, y2: 4050, width: 105, hasDivider: false, name: 'Gopalganj–Jashore Highway' },
];

export const WORLD_BUILDINGS: WorldBuilding[] = [
  // Central Dhaka Core (around 2400, 2400)
  {
    id: 'b_sangsad',
    kind: 'sangsad',
    name: 'Jatiya Sangsad Bhaban',
    x: 2100,
    y: 2050,
    w: 220,
    d: 200,
    h: 130,
    color: '#cbd5e1',
    roofColor: '#94a3b8',
    landmarkDistrictId: 'dhaka',
    interactiveType: 'landmark',
  },
  {
    id: 'b_shaheed_minar',
    kind: 'shaheed_minar',
    name: 'Central Shaheed Minar',
    x: 2630,
    y: 2230,
    w: 130,
    d: 110,
    h: 105,
    color: '#f8fafc',
    roofColor: '#dc2626',
    landmarkDistrictId: 'dhaka',
    interactiveType: 'landmark',
  },
  {
    id: 'b_lalbagh',
    kind: 'lalbagh',
    name: 'Lalbagh Fort',
    x: 2180,
    y: 2660,
    w: 170,
    d: 150,
    h: 90,
    color: '#b45309',
    roofColor: '#9a3412',
    interactiveType: 'landmark',
  },
  {
    id: 'b_sa7_store',
    kind: 'sa7_store',
    name: 'Sa7 Flagship Store & Boutique',
    x: 2650,
    y: 2520,
    w: 120,
    d: 95,
    h: 68,
    color: '#064e3b',
    roofColor: '#10b981',
    interactiveType: 'store',
  },
  {
    id: 'b_sa7_garage',
    kind: 'sa7_garage',
    name: 'Sa7 Customs & Garage',
    x: 2290,
    y: 2515,
    w: 135,
    d: 100,
    h: 64,
    color: '#1e293b',
    roofColor: '#f59e0b',
    interactiveType: 'garage',
  },
  {
    id: 'b_cha_dokan_1',
    kind: 'shop_cha',
    name: 'Mama’r Cha-er Dokan',
    x: 2590,
    y: 2110,
    w: 70,
    d: 60,
    h: 42,
    color: '#92400e',
    roofColor: '#b91c1c',
    interactiveType: 'tea_stall',
  },
  {
    id: 'b_bazaar_1',
    kind: 'shop_bazaar',
    name: 'New Market Bazaar',
    x: 2820,
    y: 2140,
    w: 140,
    d: 100,
    h: 54,
    color: '#334155',
    roofColor: '#ea580c',
  },
  {
    id: 'b_apt_1',
    kind: 'apartment',
    name: 'Dhanmondi Lake View',
    x: 2050,
    y: 2260,
    w: 110,
    d: 95,
    h: 115,
    color: '#e2e8f0',
    roofColor: '#475569',
  },
  {
    id: 'b_apt_2',
    kind: 'apartment',
    name: 'Gulshan Plaza Tower',
    x: 2880,
    y: 2540,
    w: 115,
    d: 100,
    h: 128,
    color: '#cbd5e1',
    roofColor: '#1e293b',
  },
  {
    id: 'b_sajjad_home',
    kind: 'house',
    name: 'Sajjad’s Residence',
    x: 2330,
    y: 2160,
    w: 95,
    d: 85,
    h: 58,
    color: '#fef3c7',
    roofColor: '#047857',
    interactiveType: 'home',
  },
  {
    id: 'b_bus_stop_1',
    kind: 'bus_shelter',
    name: 'Shahbagh Bus Stop',
    x: 2410,
    y: 2320,
    w: 58,
    d: 32,
    h: 30,
    color: '#0284c7',
    roofColor: '#e0f2fe',
  },
  {
    id: 'b_bus_stop_2',
    kind: 'bus_shelter',
    name: 'Mawa Bridge Toll Gate',
    x: 2415,
    y: 3255,
    w: 75,
    d: 36,
    h: 34,
    color: '#0f766e',
    roofColor: '#fef08a',
  },

  // Savar Memorial (West of Dhaka)
  {
    id: 'b_savar',
    kind: 'savar_memorial',
    name: 'National Martyrs’ Memorial (Savar)',
    x: 1450,
    y: 2210,
    w: 170,
    d: 170,
    h: 165,
    color: '#e2e8f0',
    roofColor: '#94a3b8',
    landmarkDistrictId: 'manikganj',
    interactiveType: 'landmark',
  },

  // Paharpur & Mahasthangarh (North-West)
  {
    id: 'b_paharpur',
    kind: 'paharpur',
    name: 'Somapura Mahavihara (Paharpur)',
    x: 960,
    y: 1240,
    w: 190,
    d: 190,
    h: 115,
    color: '#9a3412',
    roofColor: '#c2410c',
    landmarkDistrictId: 'naogaon',
    interactiveType: 'landmark',
  },
  {
    id: 'b_bogura_gate',
    kind: 'lalbagh',
    name: 'Mahasthangarh Citadel',
    x: 1240,
    y: 1520,
    w: 150,
    d: 130,
    h: 82,
    color: '#b45309',
    roofColor: '#78350f',
    landmarkDistrictId: 'bogura',
    interactiveType: 'landmark',
  },

  // Sundarbans (South-West)
  {
    id: 'b_sundarbans_tower',
    kind: 'watchtower',
    name: 'Sundarbans Eco Watchtower',
    x: 1400,
    y: 4680,
    w: 90,
    d: 90,
    h: 110,
    color: '#78350f',
    roofColor: '#15803d',
    landmarkDistrictId: 'khulna',
    interactiveType: 'landmark',
  },

  // Sylhet Tea Hills (North-East)
  {
    id: 'b_sylhet_tea',
    kind: 'tea_pavilion',
    name: 'Sylhet & Jaflong Tea Estate',
    x: 5050,
    y: 1150,
    w: 150,
    d: 120,
    h: 72,
    color: '#fef3c7',
    roofColor: '#15803d',
    landmarkDistrictId: 'sylhet',
    interactiveType: 'landmark',
  },
  {
    id: 'b_sylhet_cha',
    kind: 'shop_cha',
    name: 'Seven-Layer Tea Cabin',
    x: 4860,
    y: 1680,
    w: 80,
    d: 65,
    h: 46,
    color: '#78350f',
    roofColor: '#166534',
    interactiveType: 'tea_stall',
  },

  // Sajek Valley & Kaptai (Far East)
  {
    id: 'b_sajek',
    kind: 'sajek_resort',
    name: 'Sajek Cloud Ridge Resort',
    x: 5260,
    y: 3170,
    w: 145,
    d: 115,
    h: 76,
    color: '#b45309',
    roofColor: '#059669',
    landmarkDistrictId: 'khagrachhari',
    interactiveType: 'landmark',
  },

  // Cox's Bazar Beach Promenade (South-East)
  {
    id: 'b_cox_hotel',
    kind: 'cox_hotel',
    name: 'Cox’s Bazar Sea Pearl Resort',
    x: 4850,
    y: 5050,
    w: 190,
    d: 125,
    h: 120,
    color: '#f8fafc',
    roofColor: '#0284c7',
    landmarkDistrictId: 'coxs_bazar',
    interactiveType: 'landmark',
  },
  {
    id: 'b_cox_store',
    kind: 'shop_bazaar',
    name: 'Burmese Beach Market',
    x: 4580,
    y: 5120,
    w: 130,
    d: 85,
    h: 48,
    color: '#f1f5f9',
    roofColor: '#dc2626',
  },
];

// Generate rich regional foliage (banyan, palm, mango, tea bushes, mangroves)
export function generateTreeProps(): TreeProp[] {
  const trees: TreeProp[] = [];
  const seeded = (i: number) => {
    const x = Math.sin(i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  // Dhaka green park & roadside trees
  for (let i = 0; i < 55; i++) {
    const angle = i * 0.45;
    const rad = 280 + seeded(i) * 520;
    const x = 2460 + Math.cos(angle) * rad;
    const y = 2360 + Math.sin(angle) * rad;
    // avoid central roads
    if (Math.abs(x - 2500) < 95 || Math.abs(y - 2400) < 95) continue;
    trees.push({
      x,
      y,
      kind: i % 3 === 0 ? 'banyan' : 'mango',
      scale: 0.85 + seeded(i + 100) * 0.45,
    });
  }

  // Sylhet lush tea bushes
  for (let i = 0; i < 65; i++) {
    const x = 4450 + seeded(i + 200) * 950;
    const y = 850 + seeded(i + 300) * 950;
    trees.push({
      x,
      y,
      kind: i % 4 === 0 ? 'mango' : 'tea_bush',
      scale: 0.85 + seeded(i + 400) * 0.4,
    });
  }

  // Sundarbans dense mangroves
  for (let i = 0; i < 70; i++) {
    const x = 750 + seeded(i + 500) * 1100;
    const y = 4350 + seeded(i + 600) * 850;
    if (y > 4820 && y < 5230) continue;
    trees.push({
      x,
      y,
      kind: 'mangrove',
      scale: 0.9 + seeded(i + 700) * 0.5,
    });
  }

  // Cox's Bazar coastal coconut palms
  for (let i = 0; i < 45; i++) {
    const x = 4150 + (i / 45) * 1450;
    const y = 5240 + (i % 3) * 38;
    trees.push({
      x,
      y,
      kind: 'palm',
      scale: 0.95 + seeded(i + 800) * 0.35,
    });
  }

  // Highway scenic trees along Padma approaches & North Bengal
  for (let i = 0; i < 60; i++) {
    const side = i % 2 === 0 ? -125 : 125;
    const y = 750 + i * 75;
    if (y > 3260 && y < 3800) continue;
    trees.push({
      x: 2500 + side,
      y,
      kind: i % 5 === 0 ? 'palm' : 'banyan',
      scale: 0.9 + seeded(i + 900) * 0.3,
    });
  }

  return trees;
}

export const TREE_PROPS: TreeProp[] = generateTreeProps();

export const INITIAL_VEHICLES: WorldVehicle[] = [
  // Player's starter bicycle parked right outside Sajjad's house in Dhaka
  {
    id: 'v_player_bike',
    type: 'bicycle',
    x: 2405,
    y: 2215,
    z: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#10b981',
    secondaryColor: '#0f172a',
    health: 80,
    maxHealth: 80,
  },
  // Iconic Dhaka Rickshaw & CNG nearby
  {
    id: 'v_dhaka_rickshaw',
    type: 'rickshaw',
    x: 2460,
    y: 2345,
    z: 0,
    angle: Math.PI * 0.5,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#e11d48',
    secondaryColor: '#facc15',
    health: 110,
    maxHealth: 110,
  },
  {
    id: 'v_dhaka_cng',
    type: 'cng',
    x: 2555,
    y: 2350,
    z: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#15803d',
    secondaryColor: '#facc15',
    health: 130,
    maxHealth: 130,
  },
  {
    id: 'v_dhaka_moto',
    type: 'motorcycle',
    x: 2355,
    y: 2470,
    z: 0,
    angle: -Math.PI * 0.5,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#dc2626',
    secondaryColor: '#1e293b',
    health: 100,
    maxHealth: 100,
  },
  {
    id: 'v_dhaka_sedan',
    type: 'sedan',
    x: 2240,
    y: 2450,
    z: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#dc2626',
    secondaryColor: '#0f172a',
    health: 180,
    maxHealth: 180,
  },
  {
    id: 'v_dhaka_bus',
    type: 'bus',
    x: 2440,
    y: 2700,
    z: 0,
    angle: -Math.PI * 0.5,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#b91c1c',
    secondaryColor: '#f8fafc',
    health: 420,
    maxHealth: 420,
  },
  {
    id: 'v_savar_suv',
    type: 'suv',
    x: 1580,
    y: 2345,
    z: 0,
    angle: Math.PI,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#0f766e',
    secondaryColor: '#cbd5e1',
    health: 280,
    maxHealth: 280,
  },
  {
    id: 'v_padma_pickup',
    type: 'pickup',
    x: 2560,
    y: 3260,
    z: 0,
    angle: Math.PI * 0.5,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#0284c7',
    secondaryColor: '#e2e8f0',
    health: 240,
    maxHealth: 240,
  },
  {
    id: 'v_padma_truck',
    type: 'truck',
    x: 2440,
    y: 3820,
    z: 0,
    angle: Math.PI * 0.5,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#eab308',
    secondaryColor: '#dc2626',
    health: 500,
    maxHealth: 500,
  },
  // River & Coastal Watercraft at Piers
  {
    id: 'v_padma_boat',
    type: 'boat',
    x: 2680,
    y: 3420,
    z: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#78350f',
    secondaryColor: '#d97706',
    health: 160,
    maxHealth: 160,
  },
  {
    id: 'v_padma_speedboat',
    type: 'speedboat',
    x: 2320,
    y: 3450,
    z: 0,
    angle: Math.PI,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#f8fafc',
    secondaryColor: '#0ea5e9',
    health: 200,
    maxHealth: 200,
  },
  {
    id: 'v_sundarbans_boat',
    type: 'boat',
    x: 1380,
    y: 4880,
    z: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#78350f',
    secondaryColor: '#10b981',
    health: 160,
    maxHealth: 160,
  },
  {
    id: 'v_cox_speedboat',
    type: 'speedboat',
    x: 4860,
    y: 5470,
    z: 0,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: 0,
    steerAngle: 0,
    wheelSpin: 0,
    color: '#f8fafc',
    secondaryColor: '#dc2626',
    health: 200,
    maxHealth: 200,
  },
];

// Ambient Traffic Vehicles cruising along main corridors
export const TRAFFIC_SPAWNS: Array<{
  type: WorldVehicle['type'];
  routeIndex: number;
  t: number;
  dir: 1 | -1;
}> = [
  { type: 'cng', routeIndex: 0, t: 0.25, dir: 1 },
  { type: 'rickshaw', routeIndex: 0, t: 0.65, dir: -1 },
  { type: 'sedan', routeIndex: 0, t: 0.82, dir: -1 },
  { type: 'bus', routeIndex: 3, t: 0.45, dir: 1 },
  { type: 'cng', routeIndex: 3, t: 0.78, dir: -1 },
  { type: 'truck', routeIndex: 4, t: 0.5, dir: 1 },
  { type: 'motorcycle', routeIndex: 14, t: 0.35, dir: 1 },
  { type: 'suv', routeIndex: 17, t: 0.4, dir: 1 },
];

export const ACTIVITY_SPOTS: ActivitySpot[] = [
  {
    id: 'act_cricket_dhaka',
    type: 'cricket',
    name: 'Dhaka Street Cricket Pitch',
    banglaName: 'গলির ক্রিকেট ম্যাচ',
    x: 2740,
    y: 2370,
    rewardCoins: 180,
    description: 'Time your bat swing to smash sixes against Dhaka neighborhood bowlers!',
  },
  {
    id: 'act_fishing_padma',
    type: 'fishing',
    name: 'Padma River Hilsa Pier',
    banglaName: 'পদ্মা নদীর ইলিশ ধরা',
    x: 2630,
    y: 3320,
    rewardCoins: 220,
    description: 'Cast your line into the Padma River and reel in prized Ilish and Rui.',
  },
  {
    id: 'act_photo_sangsad',
    type: 'photography',
    name: 'Sangsad Architectural Viewpoint',
    banglaName: 'সংসদ ভবন ফটোগ্রাফি',
    x: 2020,
    y: 2210,
    rewardCoins: 200,
    description: 'Frame and capture iconic Bangladeshi landmarks with your lens.',
  },
  {
    id: 'act_photo_cox',
    type: 'photography',
    name: 'Cox’s Bazar Sunset Frame',
    banglaName: 'কক্সবাজার সূর্যাস্ত ফটো',
    x: 4920,
    y: 5260,
    rewardCoins: 280,
    description: 'Capture the golden surf along the world’s longest natural sea beach.',
  },
  {
    id: 'act_fishing_kaptai',
    type: 'fishing',
    name: 'Kaptai Lake Wooden Jetty',
    banglaName: 'কাপ্তাই লেক ফিশিং',
    x: 4820,
    y: 3770,
    rewardCoins: 260,
    description: 'Relax by emerald Kaptai Lake and catch fresh hill-lake fish.',
  },
];

export const INITIAL_NPCS: WorldNPC[] = [
  {
    id: 'npc_tea_mama',
    name: 'Karim Cha-Wala',
    role: 'shopkeeper',
    x: 2570,
    y: 2150,
    angle: Math.PI * 0.4,
    walkPhase: 0,
    homeX: 2570,
    homeY: 2150,
    targetX: 2570,
    targetY: 2150,
    waitTimer: 2,
    shirtColor: '#f59e0b',
    pantsColor: '#334155',
    dialogue: 'Garom cha nibe naki Sajjad bhai? Exploring all 64 districts starts with a good cup of tea!',
  },
  {
    id: 'npc_photographer',
    name: 'Rafi (Photographer)',
    role: 'guide',
    x: 2560,
    y: 2245,
    angle: -Math.PI * 0.6,
    walkPhase: 0,
    homeX: 2560,
    homeY: 2245,
    targetX: 2585,
    targetY: 2260,
    waitTimer: 1.5,
    shirtColor: '#0284c7',
    pantsColor: '#1e293b',
    dialogue: 'Shaheed Minar looks breathtaking today! Check the photo spots across Bangladesh to earn Sa7 Coins.',
  },
  {
    id: 'npc_student_1',
    name: 'Nadia',
    role: 'student',
    x: 2680,
    y: 2330,
    angle: 0,
    walkPhase: 0,
    homeX: 2680,
    homeY: 2330,
    targetX: 2770,
    targetY: 2330,
    waitTimer: 1,
    shirtColor: '#e11d48',
    pantsColor: '#0f172a',
    dialogue: 'Hey Sajjad! Have you tried the cricket pitch behind Shaheed Minar Plaza?',
  },
  {
    id: 'npc_rickshaw_bro',
    name: 'Salam Mia',
    role: 'rickshaw_puller',
    x: 2435,
    y: 2365,
    angle: Math.PI * 0.25,
    walkPhase: 0,
    homeX: 2435,
    homeY: 2365,
    targetX: 2475,
    targetY: 2365,
    waitTimer: 2.5,
    shirtColor: '#16a34a',
    pantsColor: '#1e293b',
    dialogue: 'Press E near any Rickshaw, CNG, or Car to hop in and explore the highways!',
  },
  {
    id: 'npc_padma_fisher',
    name: 'Jamal Majhi',
    role: 'fisherman',
    x: 2610,
    y: 3310,
    angle: Math.PI * 0.5,
    walkPhase: 0,
    homeX: 2610,
    homeY: 3310,
    targetX: 2650,
    targetY: 3310,
    waitTimer: 3,
    shirtColor: '#0369a1',
    pantsColor: '#475569',
    dialogue: 'Padma Bridge stands proud above us! Grab a boat at the pier or try fishing for Ilish.',
  },
  {
    id: 'npc_cox_guide',
    name: 'Tanvir (Beach Patrol)',
    role: 'guide',
    x: 4860,
    y: 5215,
    angle: Math.PI * 0.5,
    walkPhase: 0,
    homeX: 4860,
    homeY: 5215,
    targetX: 4920,
    targetY: 5215,
    waitTimer: 2,
    shirtColor: '#ea580c',
    pantsColor: '#f8fafc',
    dialogue: 'Welcome to Cox’s Bazar! Drive along Marine Drive or take the Speedboat out on the Bay.',
  },
];

export function generateCollectibles(): CollectibleItem[] {
  const items: CollectibleItem[] = [];
  // 1. Place an iconic Heritage Seal near each major landmark & district anchor (first 24 placed around reachable road corridors + all 64 mapped!)
  DISTRICTS.forEach((d, idx) => {
    items.push({
      id: `col_dist_${d.id}`,
      kind: 'emblem',
      label: d.collectibleName,
      x: d.worldX + ((idx % 3) - 1) * 35,
      y: d.worldY + (((idx + 1) % 3) - 1) * 35,
      value: 100,
      districtId: d.id,
      collected: false,
    });
  });

  // 2. Bonus Sa7 Golden Coins along Dhaka streets & Padma Bridge
  const coinCoords: Array<[number, number, number]> = [
    [2450, 2260, 50],
    [2500, 2320, 50],
    [2500, 2400, 75],
    [2600, 2400, 50],
    [2700, 2400, 50],
    [2250, 2400, 50],
    [2050, 2400, 75],
    [1750, 2400, 75],
    [2500, 2700, 50],
    [2500, 3000, 75],
    [2500, 3450, 100],
    [2500, 3550, 100],
    [2500, 3650, 100],
    [4850, 5260, 120],
    [5050, 1250, 120],
    [1400, 4750, 120],
  ];

  coinCoords.forEach(([x, y, val], i) => {
    items.push({
      id: `col_coin_${i}`,
      kind: 'coin',
      label: 'Sa7 Gold Coin',
      x,
      y,
      value: val,
      collected: false,
    });
  });

  return items;
}

export const INITIAL_COLLECTIBLES: CollectibleItem[] = generateCollectibles();
