// Captures the real popup from the unpacked extension for use in the video.
// Run from the repo root after `npm install`: node promo/scripts/capture.js
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '../../node_modules/puppeteer'));
const EXT = path.resolve(__dirname, '../..');
const OUT = path.resolve(__dirname, '../public');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true, pipe: true, enableExtensions: [EXT] });
  const swT = await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('background.js'));
  const sw = await swT.worker();
  const ev = (fn, ...a) => sw.evaluate(fn, ...a);
  await sleep(800);
  await ev(() => chrome.storage.local.set({ nudges: { date: todayKey(), count: 3 } }));

  const site = await browser.newPage();
  await site.goto('https://news.ycombinator.com/', { timeout: 8000 }).catch(() => {});
  const p = await browser.newPage();
  await p.setViewport({ width: 320, height: 640, deviceScaleFactor: 3 });
  await p.goto(`chrome-extension://${new URL(swT.url()).host}/popup.html`);
  await ev(async () => { const [t] = await chrome.tabs.query({ url: 'https://news.ycombinator.com/*' }); await chrome.tabs.update(t.id, { active: true }); });
  await p.reload(); await sleep(500); await p.bringToFront();
  const shot = async (name) => {
    const h = await p.evaluate(() => document.body.scrollHeight);
    await p.screenshot({ path: `${OUT}/${name}.png`, clip: { x: 0, y: 0, width: 320, height: h } });
    return h;
  };
  const start = await p.$eval('#start', (e) => { const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const h1 = await shot('popup-idle');
  await ev(() => chrome.storage.local.set({ focus: { active: true, startedAt: Date.now() - 1500, endsAt: Date.now() + 60 * 60000 - 1500 } }));
  await sleep(1500);
  const h2 = await shot('popup-active');
  console.log(JSON.stringify({ start, idleHeight: h1, activeHeight: h2 }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
