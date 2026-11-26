import React, { useState } from 'react';
import {
  Award,
  Car,
  Check,
  Compass,
  CreditCard,
  MapPin,
  Navigation,
  Palette,
  RotateCcw,
  Shield,
  ShoppingBag,
  Sparkles,
  Volume2,
  Wrench,
  X,
} from 'lucide-react';
import {
  DISTRICTS,
  DIVISION_BY_ID,
  DIVISIONS,
  MAIN_MISSIONS,
  STORE_ITEMS,
  VEHICLES_CATALOG,
} from '../data/bangladeshWorld';
import { ACTIVITY_SPOTS } from '../data/worldMap';
import { audioEngine } from '../game/audioEngine';
import {
  ActiveModal,
  GameSettings,
  MissionRewardSummary,
  PlayerProgress,
  StoreItem,
  TimePhase,
  VehicleType,
  WeatherType,
} from '../types/game';

export const SAJJAD_PORTRAIT_URL = '/assets/aistudio/file_00000000453c81fa8a8c1f40fc1d2075_d2aede94.png';
export const SA7_LOGO_URL = '/assets/aistudio/file_00000000106c8211bd48f93a232ba1ae_237ac49f.png';

const GARAGE_COLORS = [
  { name: 'Dhaka Emerald', hex: '#065f46' },
  { name: 'Victory Crimson', hex: '#dc2626' },
  { name: 'Royal Gold', hex: '#eab308' },
  { name: 'Padma Sky', hex: '#0284c7' },
  { name: 'Obsidian Black', hex: '#18181b' },
  { name: 'Pearl White', hex: '#f1f5f9' },
];

interface GameMenusProps {
  activeModal: ActiveModal;
  progress: PlayerProgress;
  settings: GameSettings;
  rewardSummary: MissionRewardSummary | null;
  onClose: () => void;
  onBuyItem: (item: StoreItem) => void;
  onEquipItem: (item: StoreItem) => void;
  onBuyVehicle: (type: VehicleType) => void;
  onSummonVehicle: (type: VehicleType) => void;
  onCustomizeVehicle: (type: VehicleType, color?: string, upgradeKey?: 'engineLevel' | 'handlingLevel' | 'armorLevel') => void;
  onFastTravelDistrict: (districtId: string) => void;
  onSelectMission: (missionId: string) => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onResetSave: () => void;
}

export const GameMenus: React.FC<GameMenusProps> = ({
  activeModal,
  progress,
  settings,
  rewardSummary,
  onClose,
  onBuyItem,
  onEquipItem,
  onBuyVehicle,
  onSummonVehicle,
  onCustomizeVehicle,
  onFastTravelDistrict,
  onSelectMission,
  onUpdateSettings,
  onResetSave,
}) => {
  const [selectedDiv, setSelectedDiv] = useState<string>('all');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(progress.currentDistrictId);
  const [storeCat, setStoreCat] = useState<string>('all');
  const [selectedGarageType, setSelectedGarageType] = useState<VehicleType>(progress.activeGarageVehicle);

  if (!activeModal) return null;

  const filteredDistricts =
    selectedDiv === 'all' ? DISTRICTS : DISTRICTS.filter((d) => d.divisionId === selectedDiv);
  const activeDistrict = DISTRICTS.find((d) => d.id === selectedDistrictId) ?? DISTRICTS[0];
  const activeGarageSpec = VEHICLES_CATALOG.find((v) => v.type === selectedGarageType) ?? VEHICLES_CATALOG[0];
  const garageOwned = progress.ownedVehicles.includes(selectedGarageType);
  const garageUpg = progress.vehicleUpgrades[selectedGarageType] ?? {
    engineLevel: 0,
    handlingLevel: 0,
    armorLevel: 0,
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6">
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src={SA7_LOGO_URL}
              alt="Sa7 Logo"
              className="h-9 w-9 rounded-lg object-cover border border-emerald-500/40"
            />
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {activeModal === 'MAP' && 'Bangladesh 64-District Atlas'}
                {activeModal === 'STORE' && 'Sa7 Store & Boutique'}
                {activeModal === 'GARAGE' && 'Sa7 Customs & Garage'}
                {activeModal === 'INVENTORY' && 'Sajjad’s Wardrobe & Inventory'}
                {activeModal === 'MISSIONS' && 'Missions & Activities'}
                {activeModal === 'SETTINGS' && 'Game Settings'}
                {activeModal === 'HOW_TO_PLAY' && 'How to Play Sa7'}
                {activeModal === 'CREDITS' && 'Credits & Game Identity'}
                {activeModal === 'REWARD' && 'Mission Accomplished!'}
              </h2>
              <p className="text-xs text-slate-400">
                Sa7 Coins: <span className="font-mono-num font-bold text-amber-400">৳ {progress.coins.toLocaleString()}</span>
                <span className="mx-2" aria-hidden="true">·</span>
                Districts: <span className="font-mono-num text-emerald-400">{progress.discoveredDistricts.length}/64</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="sa7-scroll flex-1 overflow-y-auto p-5">
          {/* 1. 64-DISTRICT BANGLADESH ATLAS */}
          {activeModal === 'MAP' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Interactive National Radar Map */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-emerald-500/30 bg-[#071e1b] p-4">
                  {/* Stylized Bangladesh River & Coast Backdrop SVG */}
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-25">
                    <path
                      d="M15,10 Q45,5 85,20 Q92,45 88,88 Q68,85 52,82 Q30,85 20,70 Q15,40 15,10 Z"
                      fill="#10b981"
                    />
                    <path d="M12,46 Q48,54 88,65" stroke="#38bdf8" strokeWidth="1.6" fill="none" />
                    <path d="M44,15 Q51,48 53,82" stroke="#38bdf8" strokeWidth="1.4" fill="none" />
                  </svg>

                  {/* Plot all 64 District Nodes */}
                  {DISTRICTS.map((d) => {
                    const discovered = progress.discoveredDistricts.includes(d.id);
                    const isSelected = d.id === activeDistrict.id;
                    const isCurrent = d.id === progress.currentDistrictId;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDistrictId(d.id)}
                        title={`${d.name} (${d.banglaName})`}
                        style={{ left: `${d.mapPercentX}%`, top: `${d.mapPercentY}%` }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform cursor-pointer ${
                          isCurrent
                            ? 'h-4 w-4 bg-amber-400 ring-4 ring-amber-400/40 z-20 scale-110'
                            : isSelected
                            ? 'h-3.5 w-3.5 bg-white ring-3 ring-emerald-400 z-10 scale-125'
                            : discovered
                            ? 'h-2.5 w-2.5 bg-emerald-400 hover:scale-150'
                            : 'h-2 w-2 bg-slate-500/80 hover:bg-slate-300 hover:scale-150'
                        }`}
                      />
                    );
                  })}

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/85 rounded-lg px-3 py-1.5 border border-slate-800">
                    <span>Amber: You</span>
                    <span>Green: Discovered</span>
                    <span>Gray: Undiscovered</span>
                  </div>
                </div>

                {/* Selected District Detail Card */}
                <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-emerald-400">
                        {DIVISION_BY_ID[activeDistrict.divisionId]?.name} Division
                      </div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {activeDistrict.name} · {activeDistrict.banglaName}
                      </h3>
                    </div>
                    <span className="text-xs font-mono-num text-amber-400">
                      +৳{activeDistrict.rewardCoins}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-300">
                    <strong>Landmark:</strong> {activeDistrict.landmark}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{activeDistrict.missionDesc}</p>
                  <button
                    type="button"
                    onClick={() => {
                      onFastTravelDistrict(activeDistrict.id);
                      onClose();
                    }}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-semibold text-white cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    Travel to {activeDistrict.name}
                  </button>
                </div>
              </div>

              {/* Division Filter & 64 Districts Directory */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedDiv('all')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      selectedDiv === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    All (64)
                  </button>
                  {DIVISIONS.map((div) => (
                    <button
                      key={div.id}
                      type="button"
                      onClick={() => setSelectedDiv(div.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                        selectedDiv === div.id ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {div.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[52vh] overflow-y-auto sa7-scroll pr-1">
                  {filteredDistricts.map((d) => {
                    const discovered = progress.discoveredDistricts.includes(d.id);
                    const isSel = d.id === activeDistrict.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setSelectedDistrictId(d.id)}
                        className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                          isSel
                            ? 'border-emerald-500 bg-emerald-950/40'
                            : 'border-slate-800 bg-slate-950/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-white truncate">
                            {d.name} <span className="text-slate-400 font-normal">({d.banglaName})</span>
                          </span>
                          {discovered ? (
                            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-400 truncate">{d.landmark}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 2. SA7 STORE */}
          {activeModal === 'STORE' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'clothing', 'accessories', 'equipment', 'collectibles'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStoreCat(cat)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize cursor-pointer ${
                        storeCat === cat ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-slate-400">
                  Buy outfits & gear to customize Sajjad!
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STORE_ITEMS.filter((i) => storeCat === 'all' || i.category === storeCat).map((item) => {
                  const owned = progress.ownedItems.includes(item.id);
                  const equipped =
                    item.slot && progress.equippedOutfit[item.slot] === item.id;
                  const canAfford = progress.coins >= item.price;

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-9 w-9 rounded-lg border border-white/20 shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${item.previewColor} 60%, ${item.accentColor ?? item.previewColor} 100%)`,
                              }}
                            />
                            <div>
                              <h4 className="font-semibold text-sm text-white">{item.name}</h4>
                              <p className="text-[11px] text-emerald-400">{item.banglaName}</p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2.5 text-xs text-slate-400 leading-relaxed">{item.description}</p>
                        {item.statBoost && (
                          <p className="mt-1.5 text-[11px] font-semibold text-sky-400">{item.statBoost}</p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                        <span className="font-mono-num text-sm font-bold text-amber-400">
                          {item.price === 0 ? 'Starter' : `৳ ${item.price}`}
                        </span>
                        {owned ? (
                          item.slot ? (
                            <button
                              type="button"
                              onClick={() => onEquipItem(item)}
                              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                                equipped
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 hover:bg-slate-700 text-white'
                              }`}
                            >
                              {equipped ? 'Equipped' : 'Equip'}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-400">Owned</span>
                          )
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford}
                            onClick={() => onBuyItem(item)}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                              canAfford
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? 'Buy' : 'Need Coins'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. GARAGE & VEHICLE STORE */}
          {activeModal === 'GARAGE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-5 flex flex-col gap-2 max-h-[58vh] overflow-y-auto sa7-scroll pr-1">
                {VEHICLES_CATALOG.map((v) => {
                  const owned = progress.ownedVehicles.includes(v.type);
                  const isSel = v.type === selectedGarageType;
                  return (
                    <button
                      key={v.type}
                      type="button"
                      onClick={() => setSelectedGarageType(v.type)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                        isSel
                          ? 'border-emerald-500 bg-emerald-950/35'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-white">{v.name}</div>
                        <div className="text-xs text-slate-400">{v.banglaName}</div>
                      </div>
                      <div className="text-right">
                        {owned ? (
                          <span className="text-xs font-semibold text-emerald-400">Owned</span>
                        ) : (
                          <span className="font-mono-num text-xs font-bold text-amber-400">৳ {v.price}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-950/75 p-5 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400">
                        {activeGarageSpec.isWatercraft ? 'Watercraft' : 'Land Vehicle'}
                      </span>
                      <h3 className="font-display text-2xl font-bold text-white">{activeGarageSpec.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">{activeGarageSpec.description}</p>
                    </div>
                    <span
                      className="h-12 w-12 rounded-xl border border-white/20 shrink-0"
                      style={{ backgroundColor: garageUpg.customColor || activeGarageSpec.defaultColor }}
                    />
                  </div>

                  {/* Vehicle Stats Bars */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Top Speed</div>
                      <div className="mt-1 font-mono-num text-base font-bold text-white">
                        {Math.round(activeGarageSpec.maxSpeed * 0.22 * (1 + garageUpg.engineLevel * 0.11))} km/h
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Handling</div>
                      <div className="mt-1 font-mono-num text-base font-bold text-sky-400">
                        {Math.round(activeGarageSpec.turnSpeed * 30 * (1 + garageUpg.handlingLevel * 0.1))}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-900 p-3 border border-slate-800">
                      <div className="text-[11px] text-slate-400">Durability</div>
                      <div className="mt-1 font-mono-num text-base font-bold text-emerald-400">
                        {activeGarageSpec.durability + garageUpg.armorLevel * 60}
                      </div>
                    </div>
                  </div>

                  {/* Customization & Upgrades */}
                  {garageOwned && (
                    <div className="mt-5 space-y-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                          <Palette className="w-3.5 h-3.5 text-emerald-400" />
                          Custom Paint Finish
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {GARAGE_COLORS.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => onCustomizeVehicle(selectedGarageType, c.hex)}
                              title={c.name}
                              className="h-8 w-8 rounded-lg border-2 border-white/25 hover:scale-110 transition-transform cursor-pointer"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                          <Wrench className="w-3.5 h-3.5 text-amber-400" />
                          Performance Upgrades (৳ 300 / Level)
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              ['engineLevel', 'Engine Turbo'],
                              ['handlingLevel', 'Sport Tires'],
                              ['armorLevel', 'Chassis Armor'],
                            ] as const
                          ).map(([key, label]) => {
                            const lvl = garageUpg[key] ?? 0;
                            const maxed = lvl >= 3;
                            return (
                              <button
                                key={key}
                                type="button"
                                disabled={maxed || progress.coins < 300}
                                onClick={() => onCustomizeVehicle(selectedGarageType, undefined, key)}
                                className={`rounded-lg border p-2.5 text-left transition-colors ${
                                  maxed
                                    ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                                    : progress.coins >= 300
                                    ? 'border-slate-700 bg-slate-900 hover:border-amber-400 text-white cursor-pointer'
                                    : 'border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                <div className="text-xs font-semibold">{label}</div>
                                <div className="mt-1 font-mono-num text-[11px] text-amber-400">
                                  {maxed ? 'MAX (Lv.3)' : `Lv.${lvl} → +1`}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-800">
                  {garageOwned ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSummonVehicle(selectedGarageType);
                        onClose();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-semibold text-white cursor-pointer"
                    >
                      <Car className="w-4 h-4" />
                      Summon {activeGarageSpec.name} Nearby
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={progress.coins < activeGarageSpec.price}
                      onClick={() => onBuyVehicle(selectedGarageType)}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold ${
                        progress.coins >= activeGarageSpec.price
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Purchase for ৳ {activeGarageSpec.price.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. WARDROBE & INVENTORY */}
          {activeModal === 'INVENTORY' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-4 rounded-xl border border-slate-800 bg-slate-950/75 p-4 flex flex-col items-center text-center">
                <img
                  src={SAJJAD_PORTRAIT_URL}
                  alt="Sajjad — Main Character"
                  className="h-56 w-56 rounded-xl object-cover border border-emerald-500/40"
                />
                <h3 className="mt-3 font-display text-lg font-bold text-white">Sajjad</h3>
                <p className="text-xs text-emerald-400">
                  Level {progress.level} Explorer · {progress.xp} XP
                </p>
                <div className="mt-3 w-full text-left text-xs text-slate-300 space-y-1 border-t border-slate-800 pt-3">
                  <div>
                    Top: <span className="text-white font-medium">{STORE_ITEMS.find((i) => i.id === progress.equippedOutfit.top)?.name}</span>
                  </div>
                  <div>
                    Bottom: <span className="text-white font-medium">{STORE_ITEMS.find((i) => i.id === progress.equippedOutfit.bottom)?.name}</span>
                  </div>
                  <div>
                    Eyewear: <span className="text-white font-medium">{progress.equippedOutfit.eyewear ? STORE_ITEMS.find((i) => i.id === progress.equippedOutfit.eyewear)?.name : 'None'}</span>
                  </div>
                  <div>
                    Backpack: <span className="text-white font-medium">{progress.equippedOutfit.backpack ? 'Explorer Pack' : 'None'}</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
                {progress.ownedItems.map((id) => {
                  const item = STORE_ITEMS.find((i) => i.id === id);
                  if (!item) return null;
                  const isEq = item.slot && progress.equippedOutfit[item.slot] === item.id;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-8 w-8 rounded-lg border border-white/20 shrink-0"
                          style={{ backgroundColor: item.previewColor }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400 capitalize">{item.category}</div>
                        </div>
                      </div>
                      {item.slot ? (
                        <button
                          type="button"
                          onClick={() => onEquipItem(item)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                            isEq
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isEq ? 'Equipped' : 'Equip'}
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-amber-400">Active Gear</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. MISSIONS & SIDE ACTIVITIES */}
          {activeModal === 'MISSIONS' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 space-y-2.5">
                <h3 className="font-display text-sm font-bold text-emerald-400 uppercase tracking-wider">
                  Main Story Missions
                </h3>
                {MAIN_MISSIONS.map((m) => {
                  const done = progress.completedMissions.includes(m.id);
                  const active = progress.activeMissionId === m.id;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-xl border p-4 ${
                        active
                          ? 'border-emerald-500 bg-emerald-950/30'
                          : done
                          ? 'border-slate-800 bg-slate-950/40 opacity-80'
                          : 'border-slate-800 bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-sm text-white">
                            {m.title} <span className="text-xs text-emerald-400">({m.banglaTitle})</span>
                          </h4>
                          <p className="mt-1 text-xs text-slate-300">{m.introText}</p>
                        </div>
                        <span className="font-mono-num text-xs font-bold text-amber-400 shrink-0">
                          +৳{m.rewardCoins}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Objective: {m.objectiveText}
                        </span>
                        {done ? (
                          <span className="text-xs font-semibold text-emerald-400">Completed</span>
                        ) : active ? (
                          <span className="text-xs font-semibold text-amber-300">Active</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectMission(m.id);
                              onClose();
                            }}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1 text-xs font-semibold text-white cursor-pointer"
                          >
                            Track
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-5 space-y-2.5">
                <h3 className="font-display text-sm font-bold text-amber-400 uppercase tracking-wider">
                  Open-World Side Activities
                </h3>
                {ACTIVITY_SPOTS.map((act) => (
                  <div key={act.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <div className="flex justify-between">
                      <div className="font-semibold text-sm text-white">{act.name}</div>
                      <span className="font-mono-num text-xs font-bold text-amber-400">+৳{act.rewardCoins}</span>
                    </div>
                    <div className="text-[11px] text-emerald-400">{act.banglaName}</div>
                    <p className="mt-1 text-xs text-slate-400">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SETTINGS */}
          {activeModal === 'SETTINGS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  Audio & Controls
                </h3>
                <div>
                  <label className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Music Volume</span>
                    <span className="font-mono-num">{Math.round(settings.musicVolume * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.musicVolume}
                    onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <label className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Sound Effects Volume</span>
                    <span className="font-mono-num">{Math.round(settings.sfxVolume * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.sfxVolume}
                    onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <label className="flex items-center justify-between pt-2 cursor-pointer">
                  <span className="text-sm text-slate-200">On-Screen Mobile Touch Controls</span>
                  <input
                    type="checkbox"
                    checked={settings.showTouchControls}
                    onChange={(e) => onUpdateSettings({ showTouchControls: e.target.checked })}
                    className="h-4 w-4 accent-emerald-500"
                  />
                </label>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
                  <Compass className="w-4 h-4 text-sky-400" />
                  Graphics & Atmosphere
                </h3>
                <div>
                  <div className="text-xs text-slate-300 mb-1.5">Graphics Preset</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['low', 'medium', 'high'] as const).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onUpdateSettings({ graphicsQuality: q })}
                        className={`rounded-lg py-2 text-xs font-semibold capitalize cursor-pointer ${
                          settings.graphicsQuality === q
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Time of Day</label>
                    <select
                      value={settings.timeMode}
                      onChange={(e) => onUpdateSettings({ timeMode: e.target.value as 'dynamic' | TimePhase })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="dynamic">Dynamic Cycle</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening Sunset</option>
                      <option value="night">Night Lights</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">Weather</label>
                    <select
                      value={settings.weatherMode}
                      onChange={(e) => onUpdateSettings({ weatherMode: e.target.value as 'dynamic' | WeatherType })}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                    >
                      <option value="dynamic">Dynamic Weather</option>
                      <option value="sunny">Sunny</option>
                      <option value="cloudy">Cloudy</option>
                      <option value="rain">Monsoon Rain</option>
                      <option value="fog">Morning Fog</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onResetSave}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/30 py-2.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Save Progress
                </button>
              </div>
            </div>
          )}

          {/* 7. HOW TO PLAY */}
          {activeModal === 'HOW_TO_PLAY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <h3 className="font-display text-base font-bold text-emerald-400">Desktop Controls</h3>
                <p><strong>WASD / Arrow Keys:</strong> Walk, Run, or Steer Vehicles</p>
                <p><strong>Shift:</strong> Sprint on foot</p>
                <p><strong>Space:</strong> Jump (on foot) / Handbrake Drift (driving)</p>
                <p><strong>E:</strong> Enter/Exit Vehicle, Talk to NPCs, Enter Store/Garage, Play Activities</p>
                <p><strong>H:</strong> Vehicle Horn / Rickshaw Brass Bell</p>
                <p><strong>M:</strong> Open 64-District Bangladesh Atlas</p>
                <p><strong>Mouse Wheel:</strong> Camera Zoom</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                <h3 className="font-display text-base font-bold text-amber-400">Mobile & Exploration Tips</h3>
                <p>Use the left-side virtual joystick to move Sajjad smoothly in all 8 isometric directions, and swipe on the right side of the screen to pan the camera.</p>
                <p>Cross the <strong>Padma Bridge</strong> to travel south, or board a Wooden Boat / Speedboat at river piers!</p>
                <p>Discover all <strong>64 Districts</strong> across <strong>8 Divisions</strong> to collect Heritage Seals and earn Sa7 Coins.</p>
              </div>
            </div>
          )}

          {/* 8. CREDITS */}
          {activeModal === 'CREDITS' && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <img
                src={SA7_LOGO_URL}
                alt="Sa7 Official Artwork"
                className="h-44 w-44 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-2xl"
              />
              <div>
                <h3 className="font-display text-2xl font-black text-white">Sa7</h3>
                <p className="text-emerald-400 font-semibold">শহরটা তোমার, গল্পটাও তোমার!</p>
                <p className="text-xs text-slate-400 mt-1">Explore Bangladesh. Create Your Story.</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-8 py-4">
                <div className="text-xs uppercase tracking-wider text-slate-400">Game Developer</div>
                <div className="mt-1 font-display text-xl font-bold text-white">Md Sazzad Hossain</div>
              </div>
              <p className="max-w-lg text-xs text-slate-400 leading-relaxed">
                Original 2D Isometric Open-World Adventure inspired by Bangladesh’s 8 Divisions, 64 Districts, iconic architecture, rivers, and everyday street culture.
              </p>
            </div>
          )}

          {/* 9. MISSION REWARD MODAL */}
          {activeModal === 'REWARD' && rewardSummary && (
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/40">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                  Mission Complete
                </div>
                <h3 className="mt-1 font-display text-2xl font-black text-white">{rewardSummary.title}</h3>
                <p className="text-sm text-emerald-300">{rewardSummary.subtitle}</p>
              </div>
              <div className="flex gap-4">
                <div className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3">
                  <div className="text-xs text-slate-400">Reward</div>
                  <div className="font-mono-num text-xl font-black text-amber-400">
                    +৳ {rewardSummary.coins}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3">
                  <div className="text-xs text-slate-400">Experience</div>
                  <div className="font-mono-num text-xl font-black text-sky-400">
                    +{rewardSummary.xp} XP
                  </div>
                </div>
              </div>
              {rewardSummary.unlockedItem && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-300">
                  <Sparkles className="w-4 h-4" />
                  Unlocked in Garage: {rewardSummary.unlockedItem}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3 font-display font-bold text-white cursor-pointer"
              >
                Continue Exploring
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
