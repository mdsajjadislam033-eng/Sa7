import { VehicleType, WeatherType } from '../types/game';

export type MusicMood = 'menu' | 'openworld' | 'driving' | 'mission' | 'victory' | 'store';

class Sa7AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  private musicTimer: number | null = null;
  private currentMood: MusicMood = 'menu';
  private stepIdx = 0;

  private musicVol = 0.45;
  private sfxVol = 0.7;
  private muted = false;
  private initialized = false;

  public unlock(): void {
    if (!this.initialized) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.applyVolumes();
      this.initialized = true;
      this.startMusicLoop();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSettings(musicVol: number, sfxVol: number, muted: boolean): void {
    this.musicVol = musicVol;
    this.sfxVol = sfxVol;
    this.muted = muted;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.musicVol * 0.25, now, 0.08);
    this.sfxGain.gain.setTargetAtTime(this.sfxVol * 0.55, now, 0.04);
  }

  public setMood(mood: MusicMood): void {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    this.stepIdx = 0;
  }

  private startMusicLoop(): void {
    if (this.musicTimer !== null) return;
    const scales: Record<MusicMood, number[]> = {
      menu: [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 392.0],
      openworld: [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66],
      driving: [196.0, 246.94, 293.66, 392.0, 293.66, 329.63, 392.0, 493.88],
      mission: [220.0, 246.94, 261.63, 329.63, 349.23, 329.63, 293.66, 246.94],
      victory: [261.63, 329.63, 392.0, 523.25, 659.25, 523.25, 392.0, 523.25],
      store: [293.66, 349.23, 440.0, 523.25, 440.0, 392.0, 349.23, 329.63],
    };

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.muted || this.ctx.state !== 'running') return;
      const notes = scales[this.currentMood];
      const freq = notes[this.stepIdx % notes.length];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = this.currentMood === 'driving' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const dur = this.currentMood === 'driving' ? 0.22 : 0.42;
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.28, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(g);
      g.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + dur + 0.02);

      // Subtle warm bass pad on downbeats
      if (this.stepIdx % 4 === 0) {
        const bass = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(freq * 0.5, now);
        bg.gain.setValueAtTime(0.001, now);
        bg.gain.linearRampToValueAtTime(0.24, now + 0.05);
        bg.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        bass.connect(bg);
        bg.connect(this.musicGain);
        bass.start(now);
        bass.stop(now + 0.78);
      }

      this.stepIdx++;
    }, 360);
  }

  public updateVehicleEngine(active: boolean, vehicleType: VehicleType | null, speedRatio: number): void {
    if (!this.ctx || !this.sfxGain) return;
    if (!active || !vehicleType || vehicleType === 'bicycle' || vehicleType === 'rickshaw') {
      if (this.engineGain) {
        this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      }
      return;
    }

    if (!this.engineOsc || !this.engineGain) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      this.engineOsc.type = 'sawtooth';
      this.engineGain.gain.value = 0.0001;
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();
    }

    const baseFreq: Record<string, number> = {
      cng: 56,
      motorcycle: 72,
      sedan: 48,
      suv: 44,
      pickup: 42,
      bus: 34,
      truck: 32,
      boat: 40,
      speedboat: 62,
      coupe: 58,
    };

    const f = (baseFreq[vehicleType] ?? 48) * (1 + Math.abs(speedRatio) * 1.9);
    const vol = 0.04 + Math.min(0.11, Math.abs(speedRatio) * 0.09);
    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(f, now, 0.06);
    this.engineGain.gain.setTargetAtTime(vol, now, 0.08);
  }

  public updateWeatherAmbience(weather: WeatherType): void {
    if (!this.ctx || !this.sfxGain) return;
    if (weather === 'rain') {
      if (!this.rainNode) {
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        this.rainNode = this.ctx.createBufferSource();
        this.rainNode.buffer = buffer;
        this.rainNode.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 0.7;

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.value = 0.001;

        this.rainNode.connect(filter);
        filter.connect(this.rainGain);
        this.rainGain.connect(this.sfxGain);
        this.rainNode.start();
      }
      this.rainGain?.gain.setTargetAtTime(0.09, this.ctx.currentTime, 0.4);
    } else if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
    }
  }

  public playFootstep(sprint = false): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(sprint ? 125 : 95, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.07);
    g.gain.setValueAtTime(sprint ? 0.14 : 0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playJump(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.16);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  public playLand(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    g.gain.setValueAtTime(0.22, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playHorn(vehicleType: VehicleType | null): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;

    if (vehicleType === 'bicycle' || vehicleType === 'rickshaw') {
      // Classic brass tring-tring bell!
      [0, 0.11].forEach((offset) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1860, now + offset);
        g.gain.setValueAtTime(0.22, now + offset);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(now + offset);
        osc.stop(now + offset + 0.18);
      });
      return;
    }

    // Dual-tone vehicle horn
    const f1 = vehicleType === 'bus' || vehicleType === 'truck' ? 185 : 340;
    const f2 = vehicleType === 'bus' || vehicleType === 'truck' ? 233 : 425;
    [f1, f2].forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.14, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  public playCoin(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      g.gain.setValueAtTime(0.2, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.24);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.26);
    });
  }

  public playPurchase(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.055);
      g.gain.setValueAtTime(0.18, now + i * 0.055);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.22);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.055);
      osc.stop(now + i * 0.055 + 0.24);
    });
  }

  public playMissionComplete(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    [392.0, 493.88, 587.33, 783.99].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      g.gain.setValueAtTime(0.24, now + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.48);
    });
  }

  public playClick(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.05);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.055);
    osc.connect(g);
    g.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }
}

export const audioEngine = new Sa7AudioEngine();
