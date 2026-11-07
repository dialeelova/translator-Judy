let ctx = null
let enabled = localStorage.getItem('sound') !== 'off'

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, start, dur, type, vol) {
  const c = audio()
  const t = c.currentTime + start
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(c.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function bell(freq, start, vol) {
  tone(freq, start, 1.0, 'sine', vol)
  tone(freq * 2, start, 0.55, 'sine', vol * 0.3)
  tone(freq * 3, start, 0.3, 'sine', vol * 0.1)
}

const NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]

export function isSoundOn() { return enabled }
export function setSound(on) {
  enabled = on
  localStorage.setItem('sound', on ? 'on' : 'off')
}

export const sounds = {
  tab() { if (enabled) tone(660, 0, 0.12, 'triangle', 0.05) },
  pop() { if (enabled) { tone(440, 0, 0.09, 'sine', 0.06); tone(660, 0.05, 0.12, 'sine', 0.05) } },
  jar() { if (enabled) { bell(523.25, 0, 0.07); bell(783.99, 0.1, 0.06); bell(1046.5, 0.2, 0.04) } },
  star() { if (enabled) bell(NOTES[Math.floor(Math.random() * NOTES.length)], 0, 0.06) }
}
