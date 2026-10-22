/**
 * Sound for the whole site, made in the browser: no files, nothing downloaded. It is off until
 * the visitor turns it on, and the choice is kept for their next visit. Every sound is short and
 * quiet, and none of them carries anything the page does not already show.
 */
export type Sound = 'tick' | 'flap' | 'peel' | 'whoosh' | 'thud' | 'slam' | 'crowd' | 'blip' | 'land' | 'meow';

const KEY = 'sound';
let on = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const listeners = new Set<(on: boolean) => void>();

try {
  on = typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === 'on';
} catch {
  // No storage: the sound stays off, as it starts.
}

export const soundOn = () => on;

/** Told whenever the sound is turned on or off. Returns a way to stop listening. */
export function onSound(listen: (on: boolean) => void): () => void {
  listeners.add(listen);
  return () => listeners.delete(listen);
}

export function setSound(next: boolean): void {
  on = next;
  try {
    localStorage.setItem(KEY, next ? 'on' : 'off');
  } catch {
    // Not kept. It still holds for this visit.
  }
  // Turned on by a click, so the browser lets the audio start now.
  if (next) void audio()?.resume();
  for (const listen of listeners) listen(next);
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  return ctx;
}

// White noise, made once and played through filters for paper, air and crowds.
let noiseBuffer: AudioBuffer | null = null;
function noise(a: AudioContext, seconds: number): AudioBufferSourceNode {
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const source = a.createBufferSource();
  source.buffer = noiseBuffer;
  source.start(a.currentTime, Math.random(), seconds);
  return source;
}

/** A volume that rises fast and dies away: the shape of every sound here. */
function envelope(a: AudioContext, peak: number, attack: number, decay: number, at = a.currentTime): GainNode {
  const gain = a.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
  gain.connect(master!);
  return gain;
}

function tone(a: AudioContext, type: OscillatorType, from: number, to: number, seconds: number, peak: number): void {
  const osc = a.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, a.currentTime + seconds);
  osc.connect(envelope(a, peak, 0.005, seconds));
  osc.start();
  osc.stop(a.currentTime + seconds + 0.05);
}

function hiss(a: AudioContext, seconds: number, peak: number, filter: BiquadFilterType, from: number, to: number, q = 1, attack = 0.005): void {
  const source = noise(a, seconds + 0.1);
  const band = a.createBiquadFilter();
  band.type = filter;
  band.Q.value = q;
  band.frequency.setValueAtTime(from, a.currentTime);
  band.frequency.exponentialRampToValueAtTime(to, a.currentTime + seconds);
  source.connect(band).connect(envelope(a, peak, attack, seconds));
}

// Each sound may play only so often, so a burst of calls is one sound, not a roar of them.
const last: Partial<Record<Sound, number>> = {};
const GAP: Partial<Record<Sound, number>> = { flap: 0.05, tick: 0.04, land: 0.03, thud: 0.06 };

/** Plays a sound, if sound is on. Safe to call anywhere, at any time. */
export function sound(name: Sound): void {
  if (!on) return;
  const a = audio();
  if (!a || a.state !== 'running') {
    void a?.resume();
    if (!a || a.state !== 'running') return;
  }
  const now = a.currentTime;
  if (now - (last[name] ?? -1) < (GAP[name] ?? 0)) return;
  last[name] = now;
  switch (name) {
    case 'tick':
      return tone(a, 'sine', 1800, 1400, 0.03, 0.12);
    case 'flap':
      return hiss(a, 0.02, 0.22, 'bandpass', 2600, 2000, 3);
    case 'peel':
      return hiss(a, 0.35, 0.3, 'bandpass', 900, 4200, 2, 0.02);
    case 'whoosh':
      return hiss(a, 0.45, 0.22, 'lowpass', 300, 2600, 0.7, 0.12);
    case 'land':
      return hiss(a, 0.05, 0.12, 'lowpass', 1400, 600);
    case 'blip':
      return tone(a, 'square', 880, 880, 0.06, 0.06);
    case 'thud':
      tone(a, 'sine', 130, 42, 0.28, 0.7);
      return hiss(a, 0.04, 0.25, 'lowpass', 2000, 400);
    case 'slam':
      tone(a, 'sine', 160, 38, 0.4, 0.8);
      return hiss(a, 0.12, 0.35, 'highpass', 1500, 800);
    case 'crowd':
      return hiss(a, 1.6, 0.18, 'bandpass', 700, 1100, 0.6, 0.35);
    case 'meow': {
      // Up and back down, through a soft filter, like a small cat that has something to say.
      const osc = a.createOscillator();
      const soft = a.createBiquadFilter();
      soft.type = 'lowpass';
      soft.frequency.value = 1800;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1050, now + 0.12);
      osc.frequency.linearRampToValueAtTime(560, now + 0.38);
      osc.connect(soft).connect(envelope(a, 0.12, 0.04, 0.36));
      osc.start();
      osc.stop(now + 0.45);
    }
  }
}

/** A soft tick on every button and link the visitor presses, anywhere on the site. */
export function initClicks(): () => void {
  const onDown = (event: PointerEvent) => {
    if ((event.target as Element | null)?.closest?.('button, a')) sound('tick');
  };
  window.addEventListener('pointerdown', onDown, { passive: true });
  return () => window.removeEventListener('pointerdown', onDown);
}
