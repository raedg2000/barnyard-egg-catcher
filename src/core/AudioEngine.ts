/**
 * Small audio controller for the game.
 *
 * Preferred music file:
 *   public/assets/audio/old-macdonald-pixabay.mp3
 *
 * If the MP3 is missing, the game falls back to a browser-generated melody and
 * keeps working offline.
 */
export class AudioEngine {
  private static singleton: AudioEngine | null = null;

  static get instance(): AudioEngine {
    if (!AudioEngine.singleton) AudioEngine.singleton = new AudioEngine();
    return AudioEngine.singleton;
  }

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private pixabayTrack: HTMLAudioElement | null = null;
  private pixabayFallbackTimer: number | null = null;
  private pixabayUnavailable = false;
  private pixabayPlaying = false;
  private nextNoteTime = 0;
  private note = 0;
  private enabled = true;

  private readonly pixabayTrackPath = "assets/audio/old-macdonald-pixabay.mp3";
  private readonly melody = [392, 440, 494, 523, 587, 659, 587, 523, 494, 440, 392, 330, 392, 494, 587, 659];
  private readonly bass = [196, 196, 220, 220, 247, 247, 220, 220];

  get isEnabled(): boolean {
    return this.enabled;
  }

  resume(): void {
    this.ensure();
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  startMusic(): void {
    if (this.pixabayPlaying || this.musicTimer !== null) return;
    this.resume();

    if (!this.pixabayUnavailable) {
      this.tryStartPixabayMusic();
      return;
    }

    this.startGeneratedMusic();
  }

  stopMusic(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;

    if (this.pixabayFallbackTimer !== null) window.clearTimeout(this.pixabayFallbackTimer);
    this.pixabayFallbackTimer = null;

    if (this.pixabayTrack) {
      this.pixabayTrack.pause();
      this.pixabayTrack.currentTime = 0;
    }
    this.pixabayPlaying = false;
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
    this.ensure();

    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(value ? 0.75 : 0.0, this.ctx.currentTime, 0.035);
    }

    if (this.pixabayTrack) {
      this.pixabayTrack.volume = value ? 0.36 : 0;
      this.pixabayTrack.muted = !value;
    }
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  playCatch(): void {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.tone(880, now, 0.08, "triangle", this.sfxGain, 0.23);
    this.tone(1175, now + 0.05, 0.10, "triangle", this.sfxGain, 0.20);
  }

  playCrack(): void {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.noise(now, 0.12, this.sfxGain, 0.32);
    this.tone(92, now, 0.16, "sawtooth", this.sfxGain, 0.08);
  }

  playCluck(): void {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    this.tone(520, now, 0.045, "square", this.sfxGain, 0.07);
    this.tone(410, now + 0.055, 0.055, "square", this.sfxGain, 0.06);
  }

  playLevelUp(): void {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [523, 659, 784, 1046].forEach((freq, index) => {
      this.tone(freq, now + index * 0.075, 0.14, "triangle", this.sfxGain!, 0.16);
    });
  }

  playGameOver(): void {
    this.resume();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [392, 330, 262, 196].forEach((freq, index) => {
      this.tone(freq, now + index * 0.13, 0.2, "sawtooth", this.sfxGain!, 0.11);
    });
  }

  private ensure(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.master.gain.value = this.enabled ? 0.75 : 0;
    this.musicGain.gain.value = 0.12;
    this.sfxGain.gain.value = 0.48;

    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);
  }

  private tryStartPixabayMusic(): void {
    this.pixabayTrack ??= this.createPixabayAudioElement();
    const track = this.pixabayTrack;
    track.volume = this.enabled ? 0.36 : 0;
    track.muted = !this.enabled;

    const onReady = (): void => {
      if (this.pixabayFallbackTimer !== null) window.clearTimeout(this.pixabayFallbackTimer);
      this.pixabayFallbackTimer = null;
      this.pixabayPlaying = true;
    };

    const onUnavailable = (): void => {
      if (this.pixabayFallbackTimer !== null) window.clearTimeout(this.pixabayFallbackTimer);
      this.pixabayFallbackTimer = null;
      this.pixabayPlaying = false;
      this.pixabayUnavailable = true;
      this.startGeneratedMusic();
    };

    track.addEventListener("playing", onReady, { once: true });
    track.addEventListener("error", onUnavailable, { once: true });

    const playPromise = track.play();
    if (playPromise) playPromise.then(onReady).catch(onUnavailable);

    this.pixabayFallbackTimer = window.setTimeout(() => {
      if (!this.pixabayPlaying) onUnavailable();
    }, 1400);
  }

  private createPixabayAudioElement(): HTMLAudioElement {
    const track = new Audio(this.pixabayTrackPath);
    track.loop = true;
    track.preload = "auto";
    track.volume = this.enabled ? 0.36 : 0;
    track.muted = !this.enabled;
    return track;
  }

  private startGeneratedMusic(): void {
    this.resume();
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNoteTime = this.ctx.currentTime + 0.08;
    this.note = 0;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 90);
    this.scheduleMusic();
  }

  private scheduleMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.45) {
      const i = this.note % this.melody.length;
      this.tone(this.melody[i], this.nextNoteTime, 0.16, "triangle", this.musicGain, 0.105);
      if (i % 4 === 0) this.tone(this.bass[(i / 4) % this.bass.length], this.nextNoteTime, 0.34, "sine", this.musicGain, 0.085);
      if (i % 8 === 7) this.noise(this.nextNoteTime, 0.035, this.musicGain, 0.012);
      this.nextNoteTime += 0.24;
      this.note += 1;
    }
  }

  private tone(freq: number, start: number, duration: number, type: OscillatorType, destination: AudioNode, gainValue: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(freq, start);
    osc.type = type;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private noise(start: number, duration: number, destination: AudioNode, gainValue: number): void {
    if (!this.ctx) return;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    src.buffer = buffer;
    src.connect(gain).connect(destination);
    src.start(start);
    src.stop(start + duration);
  }
}
