import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Award,
  Backpack,
  BookOpen,
  Car,
  Compass,
  Play,
  RotateCcw,
  Save,
  Settings,
  ShoppingBag,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameHUD } from './components/GameHUD';
import { GameMenus, SA7_LOGO_URL, SAJJAD_PORTRAIT_URL } from './components/GameMenus';
import { MiniGamesModal } from './components/MiniGamesModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { DISTRICT_BY_ID, MAIN_MISSIONS, VEHICLE_SPEC_MAP } from './data/bangladeshWorld';
import { audioEngine } from './game/audioEngine';
import { Sa7GameEngine } from './game/gameEngine';
import {
  ActiveModal,
  ActivitySpot,
  GameScreenState,
  GameSettings,
  HudSnapshot,
  MissionRewardSummary,
  PlayerProgress,
  StoreItem,
  VehicleType,
} from './types/game';

const SAVE_KEY = 'sa7_bangladesh_save_v1';
const SETTINGS_KEY = 'sa7_bangladesh_settings_v1';

const DEFAULT_PROGRESS: PlayerProgress = {
  coins: 450,
  xp: 0,
  level: 1,
  health: 100,
  maxHealth: 100,
  playerX: 2410,
  playerY: 2255,
  playerAngle: Math.PI * 0.25,
  currentDistrictId: 'dhaka',
  discoveredDistricts: ['dhaka'],
  completedMissions: [],
  activeMissionId: MAIN_MISSIONS[0].id,
  ownedItems: ['top_bd_jersey', 'bot_cargo', 'shoe_green_high'],
  equippedOutfit: {
    top: 'top_bd_jersey',
    bottom: 'bot_cargo',
    shoes: 'shoe_green_high',
    hat: null,
    eyewear: null,
    backpack: null,
  },
  ownedVehicles: ['bicycle'],
  activeGarageVehicle: 'bicycle',
  vehicleUpgrades: {},
  collectedIds: [],
  achievements: [],
  stats: {
    distanceDrivenKm: 0,
    distanceWalkedKm: 0,
    activitiesCompleted: 0,
    photosTaken: 0,
    fishCaught: 0,
  },
};

const getDefaultTouchMode = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 840);

const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  musicVolume: 0.45,
  sfxVolume: 0.75,
  muted: false,
  showTouchControls: getDefaultTouchMode(),
  timeMode: 'dynamic',
  weatherMode: 'dynamic',
  cameraZoom: 1.08,
};

function loadProgress(): { progress: PlayerProgress; hasExistingSave: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { progress: DEFAULT_PROGRESS, hasExistingSave: false };
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    return {
      progress: {
        ...DEFAULT_PROGRESS,
        ...parsed,
        equippedOutfit: {
          ...DEFAULT_PROGRESS.equippedOutfit,
          ...(parsed.equippedOutfit ?? {}),
        },
        stats: {
          ...DEFAULT_PROGRESS.stats,
          ...(parsed.stats ?? {}),
        },
      },
      hasExistingSave: true,
    };
  } catch {
    return { progress: DEFAULT_PROGRESS, hasExistingSave: false };
  }
}

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<GameSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const INITIAL_HUD: HudSnapshot = {
  health: 100,
  maxHealth: 100,
  coins: 450,
  xp: 0,
  level: 1,
  speedKmh: 0,
  inVehicle: false,
  vehicleName: null,
  vehicleType: null,
  vehicleHealth: 0,
  currentDistrictName: 'Dhaka · ঢাকা',
  currentDivisionName: 'Dhaka',
  timePhase: 'afternoon',
  clockText: '9:30 AM',
  weather: 'sunny',
  interactionPrompt: null,
  interactionActionType: null,
  activeMissionTitle: MAIN_MISSIONS[0].title,
  activeMissionObjective: MAIN_MISSIONS[0].objectiveText,
  missionDistanceM: 120,
  missionBearingRad: 0,
  fps: 60,
  playerX: 2410,
  playerY: 2255,
  playerAngle: 0,
  missionTargetX: MAIN_MISSIONS[0].targetX,
  missionTargetY: MAIN_MISSIONS[0].targetY,
  nearbyVehicles: [],
  nearbyActivities: [],
};

export default function App() {
  const [{ progress: initialProg, hasExistingSave }, setSaveState] = useState(loadProgress);
  const [progress, setProgress] = useState<PlayerProgress>(initialProg);
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [screen, setScreen] = useState<GameScreenState>('LOADING');
  const [loadPct, setLoadPct] = useState(18);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeMiniGame, setActiveMiniGame] = useState<ActivitySpot | null>(null);
  const [rewardSummary, setRewardSummary] = useState<MissionRewardSummary | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [toast, setToast] = useState<{ msg: string; tone: 'info' | 'success' | 'reward' } | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Sa7GameEngine | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string, tone: 'info' | 'success' | 'reward' = 'info') => {
    setToast({ msg, tone });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  // Persist save automatically whenever progress updates during play
  const commitProgress = useCallback((updater: (prev: PlayerProgress) => PlayerProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      const nextLevel = Math.max(1, Math.floor(next.xp / 300) + 1);
      const finalized = nextLevel !== next.level ? { ...next, level: nextLevel } : next;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(finalized));
      } catch {
        // Ignore storage quota errors
      }
      engineRef.current?.syncProgress(finalized);
      return finalized;
    });
  }, []);

  // Online/offline listeners
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // Crisp loading sequence featuring Sa7 branding
  useEffect(() => {
    const t1 = window.setTimeout(() => setLoadPct(68), 260);
    const t2 = window.setTimeout(() => setLoadPct(100), 620);
    const t3 = window.setTimeout(() => setScreen('TITLE_MENU'), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Initialize isolated 60fps Canvas Game Engine once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Sa7GameEngine(canvas, progressRef.current, settings, {
      onHudUpdate: (snapshot) => setHud(snapshot),
      onToast: (msg, tone) => showToast(msg, tone),
      onMissionComplete: (summary) => {
        setRewardSummary(summary);
        setActiveModal('REWARD');
        commitProgress((prev) => {
          const idx = MAIN_MISSIONS.findIndex((m) => m.id === prev.activeMissionId);
          const curMission = MAIN_MISSIONS[idx];
          const nextMission = MAIN_MISSIONS[idx + 1] ?? curMission;
          const nextOwnedVehs =
            curMission?.unlocksVehicle && !prev.ownedVehicles.includes(curMission.unlocksVehicle)
              ? [...prev.ownedVehicles, curMission.unlocksVehicle]
              : prev.ownedVehicles;

          return {
            ...prev,
            coins: prev.coins + summary.coins,
            xp: prev.xp + summary.xp,
            completedMissions: prev.completedMissions.includes(prev.activeMissionId)
              ? prev.completedMissions
              : [...prev.completedMissions, prev.activeMissionId],
            activeMissionId: nextMission.id,
            ownedVehicles: nextOwnedVehs,
          };
        });
      },
      onOpenStore: () => setActiveModal('STORE'),
      onOpenGarage: () => setActiveModal('GARAGE'),
      onStartActivity: (spot) => setActiveMiniGame(spot),
      onCollectiblePicked: (item) => {
        showToast(`Collected ${item.label} (+৳${item.value})`, 'reward');
        commitProgress((prev) => ({
          ...prev,
          coins: prev.coins + item.value,
          xp: prev.xp + 35,
          collectedIds: prev.collectedIds.includes(item.id)
            ? prev.collectedIds
            : [...prev.collectedIds, item.id],
        }));
      },
      onDistrictDiscovered: (districtId) => {
        const d = DISTRICT_BY_ID[districtId];
        if (!d) return;
        audioEngine.playMissionComplete();
        showToast(`Discovered ${d.name} (${d.banglaName})! +৳${d.rewardCoins}`, 'reward');
        commitProgress((prev) => {
          if (prev.discoveredDistricts.includes(districtId)) return prev;
          return {
            ...prev,
            coins: prev.coins + d.rewardCoins,
            xp: prev.xp + d.rewardXp,
            discoveredDistricts: [...prev.discoveredDistricts, districtId],
          };
        });
      },
      onStateSync: (patch) => {
        commitProgress((prev) => ({ ...prev, ...patch }));
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [commitProgress, showToast]);

  // Sync title/paused state to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setTitleMode(screen === 'LOADING' || screen === 'TITLE_MENU');
    engine.setPaused(screen === 'PAUSED' || activeModal !== null || activeMiniGame !== null);
  }, [screen, activeModal, activeMiniGame]);

  // Sync settings to engine & storage
  useEffect(() => {
    engineRef.current?.syncSettings(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Global keyboard shortcuts (Escape pause, M map, Enter start from Title)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen === 'TITLE_MENU' && !activeModal && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        handleStartGame(hasExistingSave);
        return;
      }
      if (e.code === 'Escape') {
        if (activeMiniGame) {
          setActiveMiniGame(null);
        } else if (activeModal) {
          setActiveModal(null);
        } else if (screen === 'PLAYING') {
          setScreen('PAUSED');
        } else if (screen === 'PAUSED') {
          setScreen('PLAYING');
        }
      } else if (e.code === 'KeyM' && screen === 'PLAYING' && !activeMiniGame) {
        setActiveModal((prev) => (prev === 'MAP' ? null : 'MAP'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, activeModal, activeMiniGame, hasExistingSave]);

  const handleStartGame = (continueSaved: boolean) => {
    audioEngine.unlock();
    audioEngine.playClick();
    if (!continueSaved) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(DEFAULT_PROGRESS));
      setProgress(DEFAULT_PROGRESS);
      setSaveState({ progress: DEFAULT_PROGRESS, hasExistingSave: true });
      engineRef.current?.syncProgress(DEFAULT_PROGRESS);
      engineRef.current?.fastTravelToDistrict('dhaka');
    }
    setActiveModal(null);
    setScreen('PLAYING');
  };

  const handleBuyItem = (item: StoreItem) => {
    if (progress.coins < item.price || progress.ownedItems.includes(item.id)) return;
    audioEngine.playPurchase();
    commitProgress((prev) => ({
      ...prev,
      coins: prev.coins - item.price,
      ownedItems: [...prev.ownedItems, item.id],
      equippedOutfit: item.slot
        ? { ...prev.equippedOutfit, [item.slot]: item.id }
        : prev.equippedOutfit,
    }));
    showToast(`Purchased & equipped ${item.name}!`, 'success');
  };

  const handleEquipItem = (item: StoreItem) => {
    if (!item.slot || !progress.ownedItems.includes(item.id)) return;
    audioEngine.playClick();
    commitProgress((prev) => {
      const slot = item.slot!;
      const isOptionalSlot = slot === 'hat' || slot === 'eyewear' || slot === 'backpack';
      const currentlyEquipped = prev.equippedOutfit[slot] === item.id;
      return {
        ...prev,
        equippedOutfit: {
          ...prev.equippedOutfit,
          [slot]: isOptionalSlot && currentlyEquipped ? null : item.id,
        },
      };
    });
  };

  const handleBuyVehicle = (type: VehicleType) => {
    const spec = VEHICLE_SPEC_MAP[type];
    if (progress.coins < spec.price || progress.ownedVehicles.includes(type)) return;
    audioEngine.playPurchase();
    commitProgress((prev) => ({
      ...prev,
      coins: prev.coins - spec.price,
      ownedVehicles: [...prev.ownedVehicles, type],
      activeGarageVehicle: type,
    }));
    showToast(`Purchased ${spec.name}! Summon it from the Garage.`, 'success');
  };

  const handleCustomizeVehicle = (
    type: VehicleType,
    color?: string,
    upgradeKey?: 'engineLevel' | 'handlingLevel' | 'armorLevel'
  ) => {
    if (upgradeKey) {
      if (progress.coins < 300) return;
      const cur = progress.vehicleUpgrades[type]?.[upgradeKey] ?? 0;
      if (cur >= 3) return;
      audioEngine.playPurchase();
      commitProgress((prev) => {
        const existing = prev.vehicleUpgrades[type] ?? {
          engineLevel: 0,
          handlingLevel: 0,
          armorLevel: 0,
        };
        return {
          ...prev,
          coins: prev.coins - 300,
          vehicleUpgrades: {
            ...prev.vehicleUpgrades,
            [type]: { ...existing, [upgradeKey]: existing[upgradeKey] + 1 },
          },
        };
      });
      showToast('Vehicle upgrade installed!', 'success');
    } else if (color) {
      audioEngine.playClick();
      commitProgress((prev) => {
        const existing = prev.vehicleUpgrades[type] ?? {
          engineLevel: 0,
          handlingLevel: 0,
          armorLevel: 0,
        };
        return {
          ...prev,
          vehicleUpgrades: {
            ...prev.vehicleUpgrades,
            [type]: { ...existing, customColor: color },
          },
        };
      });
    }
  };

  const handleResetSave = () => {
    localStorage.removeItem(SAVE_KEY);
    setProgress(DEFAULT_PROGRESS);
    setSaveState({ progress: DEFAULT_PROGRESS, hasExistingSave: false });
    engineRef.current?.syncProgress(DEFAULT_PROGRESS);
    engineRef.current?.fastTravelToDistrict('dhaka');
    setActiveModal(null);
    showToast('Save data reset to fresh journey.', 'info');
  };

  const handleManualSave = () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
    audioEngine.playClick();
    showToast('Progress saved locally!', 'success');
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#071318]">
      {/* Isolated Full-Viewport 2D Isometric Game Canvas */}
      <canvas ref={canvasRef} className="touch-canvas block h-full w-full" />

      {/* LOADING SCREEN */}
      {screen === 'LOADING' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#061815] p-6 text-center">
          <img
            src={SA7_LOGO_URL}
            alt="Sa7 Official Logo"
            className="h-44 w-44 sm:h-52 sm:w-52 rounded-3xl object-cover border-2 border-emerald-500/50 shadow-2xl"
          />
          <h1 className="mt-6 font-display text-3xl font-black tracking-tight text-white">Sa7</h1>
          <p className="mt-1 text-sm font-medium text-emerald-400">
            শহরটা তোমার, গল্পটাও তোমার!
          </p>
          <div className="mt-6 h-2 w-64 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${loadPct}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Loading 8 Divisions & 64 Districts · Developer: Md Sazzad Hossain
          </p>
        </div>
      )}

      {/* TITLE / MAIN MENU SCREEN */}
      {screen === 'TITLE_MENU' && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-gradient-to-r from-slate-950/92 via-slate-950/70 to-slate-950/35 p-5 sm:p-10">
          <div className="flex w-full max-w-6xl flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Brand & Primary Menu */}
            <div className="w-full max-w-md space-y-6">
              <div className="flex items-center gap-4">
                <img
                  src={SA7_LOGO_URL}
                  alt="Sa7 Official Logo"
                  className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-emerald-500/60 shadow-2xl shrink-0"
                />
                <div>
                  <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white">
                    Sa7
                  </h1>
                  <p className="mt-1 text-base font-bold text-emerald-400">
                    শহরটা তোমার, গল্পটাও তোমার!
                  </p>
                  <p className="text-xs text-slate-300">
                    Explore Bangladesh · 8 Divisions · 64 Districts
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {hasExistingSave ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartGame(true)}
                      className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 font-display text-lg font-bold text-white shadow-xl transition-colors cursor-pointer"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Continue Journey (৳ {progress.coins.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartGame(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-800 py-2.5 text-sm font-semibold text-slate-200 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      New Game
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartGame(false)}
                    className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-4 font-display text-lg font-bold text-white shadow-xl transition-colors cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Play Sa7
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveModal('HOW_TO_PLAY')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/85 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    How to Play
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('SETTINGS')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/85 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-sky-400" />
                    Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal('CREDITS')}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/85 hover:bg-slate-800 py-2.5 text-xs font-semibold text-slate-200 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Credits
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
                <div className="text-xs text-slate-400">
                  Game Developer: <span className="font-semibold text-slate-200">Md Sazzad Hossain</span>
                </div>
                <PWAInstallButton />
              </div>

              <p className="text-[11px] text-slate-400">
                WASD Move · Shift Sprint · Space Jump/Drift · E Interact · M Map · Esc Pause
              </p>
            </div>

            {/* Right Showcase: Sajjad Character Portrait */}
            <div className="hidden lg:flex flex-col items-center">
              <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-slate-900/80 p-3 shadow-2xl">
                <img
                  src={SAJJAD_PORTRAIT_URL}
                  alt="Sajjad — Main Playable Character"
                  className="h-80 w-80 rounded-2xl object-cover"
                />
                <div className="mt-2.5 flex items-center justify-between px-1">
                  <div>
                    <div className="font-display text-base font-bold text-white">Sajjad</div>
                    <div className="text-xs text-emerald-400">Protagonist · Bangladesh Explorer</div>
                  </div>
                  <span className="text-xs font-mono-num text-amber-400">64 Districts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE GAME HUD */}
      {screen === 'PLAYING' && !activeModal && !activeMiniGame && (
        <GameHUD
          hud={hud}
          engineRef={engineRef}
          showTouchControls={settings.showTouchControls}
          muted={settings.muted}
          onToggleMute={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
          onOpenModal={(m) => {
            audioEngine.playClick();
            setActiveModal(m);
          }}
          onPause={() => {
            audioEngine.playClick();
            setScreen('PAUSED');
          }}
        />
      )}

      {/* PAUSE MENU OVERLAY */}
      {screen === 'PAUSED' && !activeModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={SA7_LOGO_URL} alt="Sa7 Logo" className="h-10 w-10 rounded-lg object-cover" />
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Game Paused</h2>
                  <p className="text-xs text-emerald-400">{hud.currentDistrictName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, muted: !s.muted }))}
                className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white cursor-pointer"
              >
                {settings.muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setScreen('PLAYING')}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 font-semibold text-white cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Game
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('MAP')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  64-District Map
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('MISSIONS')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  Missions
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('INVENTORY')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Backpack className="w-4 h-4 text-sky-400" />
                  Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('STORE')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  Sa7 Store
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('GARAGE')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Car className="w-4 h-4 text-amber-400" />
                  Garage
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('SETTINGS')}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 py-2.5 text-xs font-semibold text-white cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                  Settings
                </button>
              </div>

              <button
                type="button"
                onClick={handleManualSave}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/35 hover:bg-emerald-900/40 py-2.5 text-sm font-semibold text-emerald-300 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Save Progress
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setScreen('TITLE_MENU');
                }}
                className="rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 cursor-pointer"
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENUS & MODALS */}
      <GameMenus
        activeModal={activeModal}
        progress={progress}
        settings={settings}
        rewardSummary={rewardSummary}
        onClose={() => setActiveModal(null)}
        onBuyItem={handleBuyItem}
        onEquipItem={handleEquipItem}
        onBuyVehicle={handleBuyVehicle}
        onSummonVehicle={(type) => {
          commitProgress((prev) => ({ ...prev, activeGarageVehicle: type }));
          engineRef.current?.summonGarageVehicle(type);
        }}
        onCustomizeVehicle={handleCustomizeVehicle}
        onFastTravelDistrict={(districtId) => engineRef.current?.fastTravelToDistrict(districtId)}
        onSelectMission={(missionId) => {
          commitProgress((prev) => ({ ...prev, activeMissionId: missionId }));
          showToast('Mission waypoint updated!', 'info');
        }}
        onUpdateSettings={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        onResetSave={handleResetSave}
      />

      {/* INTERACTIVE SIDE ACTIVITY MINI-GAMES */}
      {activeMiniGame && (
        <MiniGamesModal
          spot={activeMiniGame}
          hasCameraBonus={progress.ownedItems.includes('eq_camera')}
          hasFishingBonus={progress.ownedItems.includes('eq_fishing_rod')}
          onComplete={(coinsEarned, xpEarned, message) => {
            commitProgress((prev) => ({
              ...prev,
              coins: prev.coins + coinsEarned,
              xp: prev.xp + xpEarned,
              stats: {
                ...prev.stats,
                activitiesCompleted: prev.stats.activitiesCompleted + 1,
                photosTaken:
                  activeMiniGame.type === 'photography'
                    ? prev.stats.photosTaken + 1
                    : prev.stats.photosTaken,
                fishCaught:
                  activeMiniGame.type === 'fishing'
                    ? prev.stats.fishCaught + 1
                    : prev.stats.fishCaught,
              },
            }));
            engineRef.current?.triggerVictoryPose();
            showToast(message, 'reward');
          }}
          onClose={() => setActiveMiniGame(null)}
        />
      )}

      {/* TOAST NOTIFICATIONS */}
      {toast && (
        <div className="pointer-events-none fixed top-20 left-1/2 z-50 -translate-x-1/2">
          <div
            className={`rounded-xl border px-4 py-2 text-xs sm:text-sm font-semibold shadow-2xl ${
              toast.tone === 'reward'
                ? 'border-amber-400/60 bg-slate-950/95 text-amber-300'
                : toast.tone === 'success'
                ? 'border-emerald-400/60 bg-slate-950/95 text-emerald-300'
                : 'border-slate-700 bg-slate-950/95 text-slate-200'
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      {/* OFFLINE INDICATOR */}
      {!isOnline && (
        <div className="pointer-events-none fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-amber-500/95 px-3 py-1 text-xs font-bold text-slate-950 shadow-lg">
          Offline Mode — Playing with cached PWA assets
        </div>
      )}
    </div>
  );
}
