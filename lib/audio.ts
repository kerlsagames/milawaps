type OscKind = OscillatorType;

let context: AudioContext | null = null;
let muted = false;

export function setAudioMuted(value: boolean) {
  muted = value;
}

export function isAudioMuted() {
  return muted;
}

function audio(): AudioContext | null {
  if (muted || typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!context) context = new Ctx();
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscKind,
  peak: number,
  slideTo?: number,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + duration);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.02, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

export function playAction(action: "spot" | "surge" | "strike" | "teamwork" | "reset") {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  if (action === "spot") {
    tone(ctx, 784, now, 0.09, "sine", 0.08);
    tone(ctx, 1174, now + 0.08, 0.14, "sine", 0.07);
    return;
  }
  if (action === "surge") {
    [523, 659, 784, 1046].forEach((frequency, index) => {
      tone(ctx, frequency, now + index * 0.07, 0.16, "triangle", 0.07);
    });
    return;
  }
  if (action === "strike") {
    tone(ctx, 240, now, 0.22, "sawtooth", 0.04, 90);
    tone(ctx, 180, now, 0.18, "square", 0.03, 70);
    return;
  }
  if (action === "reset") {
    tone(ctx, 440, now, 0.16, "sine", 0.05, 220);
    return;
  }
  [523, 659, 784].forEach((frequency) => tone(ctx, frequency, now, 0.28, "triangle", 0.05));
  tone(ctx, 1046, now + 0.12, 0.22, "sine", 0.05);
}

export function playChime() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 880, now, 0.18, "sine", 0.045);
  tone(ctx, 1320, now + 0.05, 0.2, "sine", 0.03);
}

export function playUnlock() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  [523, 659, 784, 1046].forEach((frequency, index) => {
    tone(ctx, frequency, now + index * 0.05, 0.18, "sine", 0.06);
  });
}

export function playError() {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  tone(ctx, 196, now, 0.12, "square", 0.04);
  tone(ctx, 155, now + 0.12, 0.16, "square", 0.04);
}

export function playFanfare(jackpot = false) {
  const ctx = audio();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = jackpot
    ? [523, 659, 784, 1046, 1318, 1568]
    : [523, 659, 784, 1046];
  notes.forEach((frequency, index) => {
    tone(ctx, frequency, now + index * 0.08, 0.22, "triangle", 0.06);
  });
}
