import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
await mkdir('artifacts', { recursive: true });
const errors = [];

async function wire(page) {
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
}

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await wire(desktop);
await desktop.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await desktop.screenshot({ path: 'artifacts/menu-desktop.png' });
await desktop.click('#garage-button');
await desktop.waitForTimeout(1200);
await desktop.screenshot({ path: 'artifacts/garage-desktop.png' });
await desktop.click('#customize-toggle');
await desktop.click('#cabin-swatches .swatch:nth-child(2)');
await desktop.waitForTimeout(350);
await desktop.screenshot({ path: 'artifacts/garage-customize-desktop.png' });
await desktop.click('#customize-close');
await desktop.click('#garage-close');
await desktop.evaluate(() => localStorage.setItem('courierRushBest', '50000'));
await desktop.reload({ waitUntil: 'networkidle' });
await desktop.click('#garage-button');
await desktop.click('[data-vehicle="premium"]');
if (await desktop.locator('#select-vehicle').isDisabled()) throw new Error('Unlocked fleet vehicle is not selectable');
await desktop.waitForTimeout(700);
await desktop.screenshot({ path: 'artifacts/garage-premium-desktop.png' });
await desktop.click('#garage-close');
await desktop.click('#play-button');
await desktop.waitForTimeout(1800);
const fps = await desktop.evaluate(() => new Promise(resolve => { let frames = 0; const start = performance.now(); const tick = now => { frames++; now - start >= 1000 ? resolve(frames) : requestAnimationFrame(tick); }; requestAnimationFrame(tick); }));
if (fps < 25) throw new Error(`Low animation frame rate: ${fps}fps`);
await desktop.keyboard.press('ArrowLeft');
await desktop.waitForTimeout(700);
await desktop.screenshot({ path: 'artifacts/gameplay-desktop.png' });
await desktop.click('#pause-button');
await desktop.waitForTimeout(400);
if (!(await desktop.locator('#pause-screen').getAttribute('class')).includes('is-active')) throw new Error('Pause screen did not open');
await desktop.screenshot({ path: 'artifacts/pause-desktop.png' });

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await wire(mobile);
await mobile.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await mobile.screenshot({ path: 'artifacts/menu-mobile.png' });
await mobile.tap('#garage-button');
await mobile.waitForTimeout(900);
await mobile.screenshot({ path: 'artifacts/garage-mobile.png' });
await mobile.tap('#garage-close');
await mobile.tap('#play-button');
await mobile.waitForTimeout(1300);
await mobile.screenshot({ path: 'artifacts/gameplay-mobile.png' });

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
console.log(`Playtest passed: fleet progression, garage, customization, gameplay, pause and mobile layouts (${fps}fps headless).`);
