let audioCtx = null;
let soundCheck = () => true;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

export function setSoundCheck(fn) {
  soundCheck = fn;
}

function playTone(freq, duration = 0.15, type = 'sine', gain = 0.3, startTime = 0) {
  if (!soundCheck()) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  vol.gain.setValueAtTime(gain, ctx.currentTime + startTime);
  vol.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime + startTime);
  osc.stop(ctx.currentTime + startTime + duration);
}

export function playMealCheck() {
  playTone(523, 0.12); // C5
  playTone(659, 0.12, 'sine', 0.3, 0.1); // E5
}

export function playAllMealsDone() {
  playTone(523, 0.15, 'sine', 0.4);
  playTone(659, 0.15, 'sine', 0.4, 0.12);
  playTone(784, 0.2, 'sine', 0.4, 0.24);
}

export function playSuppCheck() {
  playTone(880, 0.15, 'sine', 0.2);
}

export function playAllSuppsDone() {
  playTone(659, 0.15, 'sine', 0.35);
  playTone(784, 0.15, 'sine', 0.35, 0.12);
  playTone(988, 0.2, 'sine', 0.35, 0.24);
}

export function playStreakMilestone() {
  playTone(440, 1.0, 'sine', 0.3);
  playTone(554, 1.0, 'sine', 0.2, 0.1);
}

export function playBadgeUnlocked() {
  // Major chord arpeggio: C→E→G
  playTone(523, 0.3, 'sine', 0.4);
  playTone(659, 0.3, 'sine', 0.4, 0.3);
  playTone(784, 0.4, 'sine', 0.4, 0.6);
}

export function playWeeklyTargetHit() {
  playTone(523, 0.15, 'triangle', 0.4);
  playTone(659, 0.15, 'triangle', 0.4, 0.15);
  playTone(784, 0.15, 'triangle', 0.4, 0.3);
  playTone(1047, 0.3, 'triangle', 0.4, 0.45);
}

export function playFinalGoalFanfare() {
  if (!soundCheck()) return;
  // Full fanfare
  playTone(523, 0.2, 'triangle', 0.5);
  playTone(659, 0.2, 'triangle', 0.5, 0.2);
  playTone(784, 0.2, 'triangle', 0.5, 0.4);
  playTone(1047, 0.4, 'triangle', 0.5, 0.6);
  // Sustained major chord
  playTone(523, 1.5, 'sine', 0.3, 1.0);
  playTone(659, 1.5, 'sine', 0.3, 1.0);
  playTone(784, 1.5, 'sine', 0.3, 1.0);
  playTone(1047, 1.5, 'sine', 0.2, 1.0);
}
