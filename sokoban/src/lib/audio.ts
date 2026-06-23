/**
 * AudioSystem - Web Audio API 合成音效
 *
 * Sokoban 5 个音效：
 * - playMove:    短促轻响（300Hz，50ms，sine）
 * - playPush:    低沉推力（150Hz，100ms，triangle）
 * - playUndo:    反向音（400→200Hz，80ms，sine）
 * - playWin:     上行胜利音阶（C-E-G-C，500ms）
 * - playBlocked: 撞击 thud（80Hz，150ms，sawtooth）
 */

export class AudioSystem {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private masterGain: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.tryInit();
    }
  }

  private tryInit() {
    try {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.18;
      this.masterGain.connect(this.ctx.destination);
    } catch (err) {
      console.warn('[Audio] init failed:', err);
    }
  }

  /** 必须在用户交互后调用以恢复 AudioContext */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  private playTone(
    freq: number,
    durationMs: number,
    type: OscillatorType = 'sine',
    volume = 1,
    freqEnd?: number,
  ) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const t0 = this.ctx.currentTime;
    const dur = durationMs / 1000;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (typeof freqEnd === 'number') {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    }
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // ============ 公开方法 ============

  playMove() {
    this.playTone(300, 50, 'sine', 0.5);
  }

  playPush() {
    this.playTone(150, 100, 'triangle', 0.7);
  }

  playUndo() {
    this.playTone(400, 80, 'sine', 0.6, 200);
  }

  playWin() {
    const ctx = this.ctx;
    if (!this.enabled || !ctx || !this.masterGain) return;
    const t0 = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const start = t0 + i * 0.12;
      const dur = 0.25;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.5, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + dur + 0.05);
    });
  }

  playBlocked() {
    this.playTone(80, 150, 'sawtooth', 0.7);
  }

  /** 通用 UI 切换音（短促三角波） */
  playClick() {
    this.playTone(600, 40, 'triangle', 0.4);
  }
}

export const audio = new AudioSystem();
