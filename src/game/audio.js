export class AudioSystem {
  constructor() { this.enabled = true; this.context = null; this.engine = null; }
  unlock() {
    if (!this.context) this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (this.context.state === 'suspended') this.context.resume();
  }
  tone(frequency, duration = .12, type = 'sine', volume = .04, slide = 0) {
    if (!this.enabled) return;
    this.unlock();
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, now); osc.frequency.exponentialRampToValueAtTime(Math.max(20, frequency + slide), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(this.context.destination); osc.start(now); osc.stop(now + duration);
  }
  lane() { this.tone(180, .09, 'triangle', .025, 85); }
  collect(type) { type === 'box' ? (this.tone(520, .12, 'sine', .045, 240), setTimeout(() => this.tone(760, .1, 'sine', .03, 120), 70)) : this.tone(260, .32, 'sawtooth', .035, 520); }
  crash() { this.tone(105, .55, 'sawtooth', .08, -65); }
  click() { this.tone(320, .06, 'triangle', .02, 80); }
}
