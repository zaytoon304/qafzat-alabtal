// مدير الصوت — بند 32
// أصوات الواجهة (نقر) من ملفات Kenney الحقيقية (public/assets/audio/ui)
// أصوات اللعب والموسيقى مُولَّدة برمجياً عبر Web Audio API (لا ملفات خارجية، لا مشاكل ترخيص، حجم أصغر)

type SfxName =
  | "jump"
  | "duck"
  | "move"
  | "collect"
  | "collision"
  | "success"
  | "failure"
  | "powerup"
  | "boss"
  | "levelComplete"
  | "gameOver"
  | "uiClick";

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer = 0;
  private musicPlaying = false;
  private muted = false;
  private clickBuffer: HTMLAudioElement;

  constructor() {
    this.clickBuffer = new Audio("/assets/audio/ui/click.ogg");
    this.clickBuffer.volume = 0.5;
  }

  // لازم يُستدعى بعد أول تفاعل من المستخدم (متطلب المتصفحات لتشغيل الصوت)
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.18;
      this.musicGain.connect(this.masterGain);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 1;
  }

  isMuted(): boolean {
    return this.muted;
  }

  private tone(freq: number, durationMs: number, type: OscillatorType = "sine", startDelay = 0, gainValue = 1): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const start = ctx.currentTime + startDelay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.02);
  }

  private sweep(fromFreq: number, toFreq: number, durationMs: number, type: OscillatorType = "sine"): void {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const start = ctx.currentTime;
    osc.frequency.setValueAtTime(fromFreq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, toFreq), start + durationMs / 1000);
    gain.gain.setValueAtTime(0.5, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.02);
  }

  play(name: SfxName): void {
    if (this.muted) return;
    switch (name) {
      case "jump":
        this.sweep(300, 700, 180, "square");
        break;
      case "duck":
        this.sweep(400, 180, 150, "square");
        break;
      case "move":
        this.tone(500, 80, "triangle");
        break;
      case "collect": {
        // اختلاف طفيف بالنغمة كل مرة عشان الصوت ما يصير رتيباً بالتكرار
        const wobble = 0.9 + Math.random() * 0.25;
        this.tone(880 * wobble, 90, "sine");
        this.tone(1320 * wobble, 120, "sine", 0.07);
        break;
      }
      case "collision":
        this.tone(120, 220, "sawtooth", 0, 0.8);
        break;
      case "success":
        this.tone(660, 100, "sine");
        this.tone(880, 100, "sine", 0.1);
        this.tone(1100, 160, "sine", 0.2);
        break;
      case "failure":
        this.sweep(400, 120, 300, "sawtooth");
        break;
      case "powerup":
        this.tone(500, 80, "square");
        this.tone(700, 80, "square", 0.08);
        this.tone(1000, 160, "square", 0.16);
        break;
      case "boss":
        this.tone(90, 400, "sawtooth", 0, 0.9);
        this.tone(70, 500, "sawtooth", 0.15, 0.9);
        break;
      case "levelComplete":
        [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 180, "sine", i * 0.12));
        break;
      case "gameOver":
        [400, 350, 300, 220].forEach((f, i) => this.tone(f, 260, "triangle", i * 0.18));
        break;
      case "uiClick":
        this.clickBuffer.currentTime = 0;
        void this.clickBuffer.play().catch(() => {});
        break;
    }
  }

  startMusic(): void {
    if (this.musicPlaying || this.muted) return;
    this.musicPlaying = true;
    const ctx = this.ensureContext();
    const scale = [261.6, 293.7, 329.6, 392.0, 440.0, 392.0, 329.6, 293.7]; // لحن بسيط مبهج متكرر
    let step = 0;
    const playStep = () => {
      if (!this.musicPlaying) return;
      const freq = scale[step % scale.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(start);
      osc.stop(start + 0.4);
      step++;
      this.musicTimer = window.setTimeout(playStep, 280);
    };
    playStep();
  }

  stopMusic(): void {
    this.musicPlaying = false;
    window.clearTimeout(this.musicTimer);
  }
}

export const audioManager = new AudioManager();
