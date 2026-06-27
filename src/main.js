import './styles.css';
import { GameSimulation } from './game/simulation.js';
import { InputController } from './game/input.js';
import { AudioSystem } from './game/audio.js';
import { GameWorld } from './render/world.js';

const $ = id => document.getElementById(id);
const canvas = $('game-canvas');
const sim = new GameSimulation();
const audio = new AudioSystem();
const world = new GameWorld(canvas);

const screens = { menu: $('menu'), pause: $('pause-screen'), gameover: $('game-over'), info: $('info-screen') };
const hud = $('hud');
const score = $('score');
const boxes = $('boxes');
const distance = $('distance');
const toast = $('toast');
const powerup = $('powerup');
let toastTimer = 0;
let resultShown = false;
let hintTimer = 0;
let last = performance.now();

function setScreen(name) {
  Object.entries(screens).forEach(([key, element]) => {
    const active = key === name;
    element.classList.toggle('is-active', active);
    element.setAttribute('aria-hidden', String(!active));
  });
}

function startGame() {
  audio.unlock(); audio.click();
  sim.start(); world.reset(); resultShown = false;
  setScreen(null); hud.classList.remove('is-hidden');
  $('lane-hint').classList.add('show'); hintTimer = 3.5;
  $('speed-lines').classList.remove('active');
}

function goMenu() {
  audio.click(); sim.reset(); world.reset();
  hud.classList.add('is-hidden'); setScreen('menu');
  $('speed-lines').classList.remove('active');
  updateMenuStats();
}

function togglePause(force) {
  if (sim.mode === 'menu' || sim.mode === 'gameover') return;
  const paused = force ?? sim.mode === 'playing';
  sim.setPaused(paused); audio.click();
  setScreen(paused ? 'pause' : null);
}

function showToast(message) {
  toast.textContent = message; toast.classList.remove('show');
  requestAnimationFrame(() => toast.classList.add('show'));
  toastTimer = 2.2;
}

function handleEvent(event) {
  if (!event) return;
  if (event.type === 'stage') showToast(event.label);
  if (event.type === 'collect') { audio.collect(event.collectible); showToast(event.label); }
  if (event.type === 'shield-hit') { audio.crash(); showToast(event.label); }
  if (event.type === 'crash') { audio.crash(); showToast(event.label); document.getElementById('app').animate([{transform:'translate(0)'},{transform:'translate(-8px,3px)'},{transform:'translate(7px,-2px)'},{transform:'translate(0)'}],{duration:360}); }
}

function updateHud() {
  score.textContent = Math.floor(sim.score).toLocaleString('pt-BR');
  boxes.textContent = sim.boxes;
  distance.textContent = `${sim.distance.toFixed(1).replace('.', ',')} km`;
  const data = sim.turbo > 0 ? ['⚡','Turbo',sim.turbo/5] : sim.shield > 0 ? ['◆','Escudo',sim.shield/9] : sim.magnet > 0 ? ['∩','Ímã',sim.magnet/8] : null;
  powerup.classList.toggle('is-hidden', !data);
  if (data) { $('powerup-icon').textContent=data[0]; $('powerup-label').textContent=data[1]; $('powerup-meter').style.transform=`scaleX(${data[2]})`; }
  $('speed-lines').classList.toggle('active', sim.turbo > 0);
}

function showResults() {
  if (resultShown) return; resultShown = true;
  $('final-score').textContent = Math.floor(sim.score).toLocaleString('pt-BR');
  $('final-boxes').textContent = sim.boxes;
  $('final-distance').textContent = `${sim.distance.toFixed(1).replace('.', ',')} km`;
  $('final-record').textContent = sim.best.toLocaleString('pt-BR');
  $('result-title').textContent = sim.newBest ? 'Novo recorde' : 'Fim de rota';
  setTimeout(() => { if (sim.mode === 'gameover') setScreen('gameover'); }, 620);
}

function updateMenuStats() {
  $('menu-record').textContent = sim.best.toLocaleString('pt-BR');
  const completed = [sim.best >= 2000, sim.totalBoxes >= 25, sim.best >= 5000].filter(Boolean).length;
  $('mission-progress').textContent = `${completed} / 3`;
}

function showInfo(type) {
  audio.click();
  const title = $('info-title'), eyebrow = $('info-eyebrow'), content = $('info-content');
  if (type === 'missions') {
    eyebrow.textContent = 'Central de entregas'; title.textContent = 'Missões';
    const missions = [
      ['Piloto de estrada', 'Faça 2.000 pontos', Math.min(1,sim.best/2000), `${Math.min(sim.best,2000)} / 2.000`],
      ['Carga valiosa', 'Colete 25 caixas', Math.min(1,sim.totalBoxes/25), `${Math.min(sim.totalBoxes,25)} / 25`],
      ['Longa distância', 'Faça 5.000 pontos', Math.min(1,sim.best/5000), `${Math.min(sim.best,5000)} / 5.000`]
    ];
    content.innerHTML = missions.map(m=>`<div class="mission"><span><b>${m[0]}</b><br>${m[1]}</span><b>${m[3]}</b><em><i style="width:${m[2]*100}%"></i></em></div>`).join('');
  } else if (type === 'records') {
    eyebrow.textContent = 'Seu melhor percurso'; title.textContent = 'Recordes';
    content.innerHTML = `<div class="result-score"><span>Melhor pontuação</span><strong>${sim.best.toLocaleString('pt-BR')}</strong></div><div class="result-grid"><div><span>Caixas totais</span><b>${sim.totalBoxes}</b></div><div><span>Motorista</span><b>Novato</b></div><div><span>Rota</span><b>Brasil</b></div></div>`;
  } else {
    eyebrow.textContent = 'Ajuste sua viagem'; title.textContent = 'Configurações';
    content.innerHTML = `<div class="setting"><span>Áudio procedural</span><button id="sound-toggle" class="toggle ${audio.enabled?'on':''}" aria-label="Alternar áudio"></button></div><div class="setting"><span>Qualidade gráfica</span><b>Automática</b></div><div class="setting"><span>Controles</span><b>Swipe / Setas</b></div>`;
    setTimeout(()=>$('sound-toggle')?.addEventListener('click',e=>{audio.enabled=!audio.enabled;e.currentTarget.classList.toggle('on',audio.enabled);}),0);
  }
  setScreen('info');
}

new InputController($('app'), {
  left: () => { if (sim.move(-1)) audio.lane(); },
  right: () => { if (sim.move(1)) audio.lane(); },
  pause: () => togglePause(),
  confirm: () => { if (sim.mode === 'menu') startGame(); }
});

$('play-button').addEventListener('click', startGame);
$('again-button').addEventListener('click', startGame);
$('pause-button').addEventListener('click', () => togglePause(true));
$('resume-button').addEventListener('click', () => togglePause(false));
$('restart-button').addEventListener('click', startGame);
document.querySelectorAll('.menu-return').forEach(button => button.addEventListener('click', goMenu));
$('missions-button').addEventListener('click', () => showInfo('missions'));
$('records-button').addEventListener('click', () => showInfo('records'));
$('settings-button').addEventListener('click', () => showInfo('settings'));
$('info-close').addEventListener('click', () => { audio.click(); setScreen('menu'); });

document.addEventListener('visibilitychange', () => { if (document.hidden && sim.mode === 'playing') togglePause(true); });
window.addEventListener('blur', () => { if (sim.mode === 'playing') togglePause(true); });

function loop(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  sim.update(dt); world.sync(sim, dt); world.render();
  handleEvent(sim.event); updateHud();
  if (sim.mode === 'gameover') showResults();
  if (toastTimer > 0 && (toastTimer -= dt) <= 0) toast.classList.remove('show');
  if (hintTimer > 0 && (hintTimer -= dt) <= 0) $('lane-hint').classList.remove('show');
  requestAnimationFrame(loop);
}

updateMenuStats();
requestAnimationFrame(loop);

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js');
