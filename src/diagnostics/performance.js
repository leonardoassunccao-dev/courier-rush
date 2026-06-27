export class PerformanceGovernor {
  constructor(onLevelChange) {
    this.onLevelChange = onLevelChange;
    this.levels = ['low', 'balanced', 'high'];
    this.levelIndex = 2;
    this.samples = new Float32Array(240);
    this.sampleIndex = 0;
    this.sampleCount = 0;
    this.framesSinceChange = 0;
    this.onLevelChange('high');
  }

  record(dt, active) {
    if (!active || document.hidden) return;
    const milliseconds = Math.min(100, dt * 1000);
    this.samples[this.sampleIndex] = milliseconds;
    this.sampleIndex = (this.sampleIndex + 1) % this.samples.length;
    this.sampleCount = Math.min(this.sampleCount + 1, this.samples.length);
    this.framesSinceChange++;
    if (this.sampleCount < 120 || this.framesSinceChange < 120 || this.framesSinceChange % 60 !== 0) return;

    let total = 0;
    let slowFrames = 0;
    for (let index = 0; index < this.sampleCount; index++) {
      const value = this.samples[index];
      total += value;
      if (value > 22) slowFrames++;
    }
    const average = total / this.sampleCount;
    if ((average > 19 || slowFrames > this.sampleCount * .12) && this.levelIndex > 0) {
      this.setLevel(this.levelIndex - 1);
    } else if (average < 17.2 && slowFrames < this.sampleCount * .015 && this.framesSinceChange > 720 && this.levelIndex < 2) {
      this.setLevel(this.levelIndex + 1);
    }
  }

  setLevel(index) {
    this.levelIndex = index;
    this.framesSinceChange = 0;
    this.sampleCount = 0;
    this.sampleIndex = 0;
    this.onLevelChange(this.levels[index]);
  }

  get level() { return this.levels[this.levelIndex]; }
}
