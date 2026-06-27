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
await desktop.click('#play-button');
await desktop.waitForTimeout(1800);
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
await mobile.tap('#play-button');
await mobile.waitForTimeout(1300);
await mobile.screenshot({ path: 'artifacts/gameplay-mobile.png' });

await browser.close();
if (errors.length) throw new Error(`Browser errors:\n${errors.join('\n')}`);
console.log('Playtest passed: menu, gameplay, lane input, pause and mobile layouts.');
