import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true, executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
const cpuRate = Number(process.env.CPU_RATE || 4);
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
await page.addInitScript(() => {
  window.__longTasks = [];
  new PerformanceObserver(list => window.__longTasks.push(...list.getEntries().map(entry => entry.duration))).observe({ type: 'longtask', buffered: true });
});
await page.goto('http://127.0.0.1:4173', { waitUntil: 'networkidle' });
await page.tap('#play-button');
await page.waitForTimeout(1000);
await page.evaluate(() => { window.__longTasks.length = 0; });
const heapBefore = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
const frames = await page.evaluate(() => new Promise(resolve => {
  const deltas = []; let previous = performance.now(); const started = previous;
  function frame(now) {
    deltas.push(now - previous); previous = now;
    if (now - started >= 8000) resolve(deltas); else requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}));
const heapAfter = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
const longTasks = await page.evaluate(() => window.__longTasks);
const diagnostics = await page.evaluate(() => window.__courierDiagnostics?.());
const metrics = await cdp.send('Performance.getMetrics');
await browser.close();

const sorted = [...frames].sort((a,b) => a-b);
const percentile = value => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))];
const namedMetrics = Object.fromEntries(metrics.metrics.map(metric => [metric.name, metric.value]));
console.log(JSON.stringify({
  frames: frames.length,
  fps: +(1000 / (frames.reduce((sum,value) => sum + value,0) / frames.length)).toFixed(1),
  p50: +percentile(.5).toFixed(2), p95: +percentile(.95).toFixed(2), p99: +percentile(.99).toFixed(2),
  over20ms: frames.filter(value => value > 20).length,
  over32ms: frames.filter(value => value > 32).length,
  longTasks: longTasks.length,
  longestTask: +(Math.max(0,...longTasks)).toFixed(2),
  heapDeltaMB: +((heapAfter - heapBefore) / 1048576).toFixed(2),
  scriptDuration: +namedMetrics.ScriptDuration.toFixed(3),
  layoutDuration: +namedMetrics.LayoutDuration.toFixed(3),
  nodes: namedMetrics.Nodes,
  diagnostics,
  cpuThrottle: `${cpuRate}x`, viewport: '390x844@2x'
}, null, 2));
