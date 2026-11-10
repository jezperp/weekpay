import { ref, watch } from 'vue'

// Coin sounds are synthesized with the Web Audio API, so no audio files are needed.
// Browsers only allow audio after a user gesture; we always play from a tap handler.

const STORAGE_KEY = 'weekpay:sound'

export const soundEnabled = ref(localStorage.getItem(STORAGE_KEY) !== 'off')
watch(soundEnabled, (on) => localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off'))

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(c: AudioContext, freq: number, delay: number, duration: number, volume: number) {
  const t = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(t)
  osc.stop(t + duration + 0.05)
}

// Bright double "cling" with a faint metallic overtone.
export function playCoin() {
  if (!soundEnabled.value) return
  const c = getContext()
  if (!c) return
  tone(c, 2093, 0, 0.25, 0.18) // C7
  tone(c, 4186, 0, 0.12, 0.05) // overtone
  tone(c, 2637, 0.07, 0.4, 0.16) // E7
}

// Soft, lower blip for taking one away.
export function playUndo() {
  if (!soundEnabled.value) return
  const c = getContext()
  if (!c) return
  tone(c, 523, 0, 0.15, 0.12) // C5
  tone(c, 392, 0.07, 0.2, 0.1) // G4
}
