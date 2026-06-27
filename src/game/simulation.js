const LANES = [-1, 0, 1];
const STAGES = [
  { id: 'cidade', label: 'Saindo de São Paulo', sky: 0xe8935e, fog: 0xcf8d66, night: 0, rain: 0 },
  { id: 'industrial', label: 'Distrito industrial', sky: 0xd47a52, fog: 0xb6755a, night: .08, rain: 0 },
  { id: 'interior', label: 'Rodovia dos Bandeirantes', sky: 0xe7ad70, fog: 0xca9b71, night: .02, rain: 0 },
  { id: 'serra', label: 'Trecho de serra', sky: 0x7999a1, fog: 0x779297, night: .2, rain: .12 },
  { id: 'noite', label: 'Anoitecer na rodovia', sky: 0x172a35, fog: 0x1b3038, night: .82, rain: .08 },
  { id: 'chuva', label: 'Chuva forte', sky: 0x24383d, fog: 0x34494c, night: .65, rain: 1 },
  { id: 'neblina', label: 'Banco de neblina', sky: 0x879293, fog: 0x899293, night: .35, rain: .22 },
];

export class GameSimulation {
  constructor() {
    this.best = Number(localStorage.getItem('courierRushBest') || 0);
    this.totalBoxes = Number(localStorage.getItem('courierRushBoxes') || 0);
    this.nextId = 1;
    this.reset();
  }

  reset() {
    this.mode = 'menu';
    this.time = 0;
    this.score = 0;
    this.boxes = 0;
    this.distance = 0;
    this.speed = 25;
    this.lane = 0;
    this.targetLane = 0;
    this.entities = [];
    this.spawnTimer = .7;
    this.stageIndex = 0;
    this.stage = STAGES[0];
    this.shield = 0;
    this.turbo = 0;
    this.magnet = 0;
    this.fuel = 100;
    this.laneChanged = false;
    this.event = null;
  }

  start() {
    this.reset();
    this.mode = 'playing';
    this.event = { type: 'stage', label: this.stage.label };
  }

  move(direction) {
    if (this.mode !== 'playing') return false;
    const next = Math.max(-1, Math.min(1, this.targetLane + direction));
    if (next === this.targetLane) return false;
    this.targetLane = next;
    this.lane = next;
    this.laneChanged = true;
    return true;
  }

  setPaused(paused) {
    if (paused && this.mode === 'playing') this.mode = 'paused';
    else if (!paused && this.mode === 'paused') this.mode = 'playing';
  }

  update(dt) {
    this.event = null;
    this.laneChanged = false;
    if (this.mode !== 'playing') return;
    dt = Math.min(dt, .05);
    this.time += dt;
    this.distance += this.speed * dt / 1000;
    this.speed = Math.min(48, 25 + this.distance * 2.7) + (this.turbo > 0 ? 11 : 0);
    this.score += this.speed * dt * (this.turbo > 0 ? 2 : 1);
    this.fuel = Math.max(0, this.fuel - dt * .32);
    this.shield = Math.max(0, this.shield - dt);
    this.turbo = Math.max(0, this.turbo - dt);
    this.magnet = Math.max(0, this.magnet - dt);

    const nextStage = Math.min(STAGES.length - 1, Math.floor(this.distance / .58));
    if (nextStage !== this.stageIndex) {
      this.stageIndex = nextStage;
      this.stage = STAGES[nextStage];
      this.event = { type: 'stage', label: this.stage.label };
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnWave();
      this.spawnTimer = Math.max(.58, 1.15 - this.distance * .025) + Math.random() * .32;
    }

    for (let index = 0; index < this.entities.length; index++) {
      const entity = this.entities[index];
      entity.z += this.speed * dt * (entity.kind === 'obstacle' ? entity.pace : 1);
      entity.spin += dt * 2.4;
      if (this.magnet > 0 && entity.kind === 'collectible' && entity.z > -18) entity.lane += (this.lane - entity.lane) * dt * 4.5;

      if (entity.z > -2 && !entity.hit && entity.z < 7.2 && Math.abs(entity.lane - this.lane) < .42) {
        entity.hit = true;
        if (entity.kind === 'obstacle') {
          if (this.shield > 0) {
            this.shield = 0;
            this.score += 75;
            this.event = { type: 'shield-hit', label: 'Escudo absorveu o impacto' };
          } else {
            this.finish();
            this.event = { type: 'crash', label: 'Entrega interrompida' };
            return;
          }
        } else {
          this.collect(entity);
        }
      }
    }
    for (let index = this.entities.length - 1; index >= 0; index--) {
      const entity = this.entities[index];
      if (entity.z >= 18 || entity.collected) this.entities.splice(index, 1);
    }

    if (this.fuel <= 0) {
      this.finish();
      this.event = { type: 'crash', label: 'Combustível esgotado' };
    }
  }

  spawnWave() {
    const distanceFactor = Math.min(1, this.distance / 2.5);
    const safeLane = LANES[Math.floor(Math.random() * LANES.length)];
    const double = Math.random() < .2 + distanceFactor * .42;
    const obstacleLanes = double ? LANES.filter(l => l !== safeLane) : [LANES[Math.floor(Math.random() * 3)]];
    const z = -145 - Math.random() * 18;
    obstacleLanes.forEach((lane, index) => {
      const roll = Math.random();
      const type = roll < .56 ? 'car' : roll < .82 ? 'truck' : 'barrier';
      this.entities.push({ id: this.nextId++, kind: 'obstacle', type, lane, z: z - index * 3, pace: type === 'barrier' ? 1 : .72 + Math.random() * .12, spin: 0, hit: false });
    });

    if (Math.random() < .74) {
      const lane = double ? safeLane : LANES[Math.floor(Math.random() * 3)];
      const roll = Math.random();
      const type = roll < .68 ? 'box' : roll < .78 ? 'fuel' : roll < .87 ? 'turbo' : roll < .94 ? 'shield' : 'magnet';
      this.entities.push({ id: this.nextId++, kind: 'collectible', type, lane, z: z - 12 - Math.random() * 8, pace: 1, spin: Math.random() * 6, hit: false });
    }
  }

  collect(entity) {
    entity.collected = true;
    let label = '';
    if (entity.type === 'box') { this.boxes++; this.score += 120; label = '+120 • Caixa coletada'; }
    if (entity.type === 'fuel') { this.fuel = Math.min(100, this.fuel + 30); this.score += 40; label = 'Combustível +30%'; }
    if (entity.type === 'turbo') { this.turbo = 5; label = 'Turbo ativado'; }
    if (entity.type === 'shield') { this.shield = 9; label = 'Escudo ativado'; }
    if (entity.type === 'magnet') { this.magnet = 8; label = 'Ímã ativado'; }
    this.event = { type: 'collect', collectible: entity.type, label };
  }

  finish() {
    this.mode = 'gameover';
    const rounded = Math.floor(this.score);
    this.totalBoxes += this.boxes;
    localStorage.setItem('courierRushBoxes', this.totalBoxes);
    if (rounded > this.best) {
      this.best = rounded;
      localStorage.setItem('courierRushBest', this.best);
      this.newBest = true;
    } else this.newBest = false;
  }
}

export { STAGES };
