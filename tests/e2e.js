const puppeteer = require('puppeteer');
const http = require('http');

// A local site whose service worker answers navigations from cache, like x.com does.
// Chrome's network-level blocking never sees those navigations.
const SW_PORT = 8771;
const swServer = http.createServer((req, res) => {
  if (req.url === '/sw.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript' });
    return res.end(`self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open('v1').then((c) => c.add('/'))); });
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
self.addEventListener('fetch', (e) => { if (e.request.mode === 'navigate') e.respondWith(caches.match('/').then((r) => r || fetch(e.request))); });`);
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end("<!doctype html><title>sw site</title><script>navigator.serviceWorker.register('/sw.js')</script>");
}).listen(SW_PORT);
const SW_SITE = `http://swsite.com:${SW_PORT}`;
const OK_SITE = `http://oksite.com:${SW_PORT}`;
const path = require('path');
const EXT = path.resolve(__dirname, '..');
const SHOTS = path.join(__dirname, 'screenshots');
require('fs').mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log('  ok  ', name); } else { fail++; console.log('  FAIL', name, extra); }
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, pipe: true, enableExtensions: [EXT], args: ['--no-first-run', '--host-resolver-rules=MAP swsite.com 127.0.0.1, MAP oksite.com 127.0.0.1', `--unsafely-treat-insecure-origin-as-secure=${SW_SITE}`] });
  const swTarget = await browser.waitForTarget((t) => t.type() === 'service_worker' && t.url().endsWith('background.js'));
  const sw = await swTarget.worker();
  const id = new URL(swTarget.url()).host;
  const ev = (fn, ...a) => sw.evaluate(fn, ...a);
  const extUrl = (p) => `chrome-extension://${id}/${p}`;
  await sleep(800);

  console.log('Install');
  const seeded = await ev(() => chrome.storage.sync.get(null));
  check('seeds 31 default sites', seeded.blockedSites?.length === 31, JSON.stringify(seeded));
  check('no rules while off', (await ev(() => chrome.declarativeNetRequest.getDynamicRules())).length === 0);
  check('badge empty while off', (await ev(() => chrome.action.getBadgeText({}))) === '');

  // A distracting tab that's already open before focus starts
  const reddit = await browser.newPage();
  await reddit.goto('https://www.reddit.com/r/all', { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
  check('reddit loads while off', !reddit.url().startsWith('chrome-extension'), reddit.url());

  console.log('Popup (idle)');
  const popup = await browser.newPage();
  await popup.setViewport({ width: 320, height: 620, deviceScaleFactor: 2 });
  await popup.goto(extUrl('popup.html'));
  await sleep(300);
  check('idle hero shown', await popup.$eval('#idle', (e) => !e.hidden));
  check('idle subtitle counts sites', (await popup.$eval('#idle-sub', (e) => e.textContent)) === '31 sites ready to block');
  check('1h preselected', (await popup.$eval('[aria-checked="true"]', (e) => e.textContent)) === '1h');
  await popup.screenshot({ path: SHOTS + '/popup-idle.png', fullPage: true });

  console.log('Add site (normalization, validation)');
  await popup.type('#add-input', 'https://www.Example.org/some/path?q=1');
  await popup.keyboard.press('Enter');
  await sleep(300);
  let sites = (await ev(() => chrome.storage.sync.get('blockedSites'))).blockedSites;
  check('normalizes pasted URL to example.org, added on top', sites[0] === 'example.org', sites[0]);
  check('input cleared', (await popup.$eval('#add-input', (e) => e.value)) === '');
  await popup.type('#add-input', 'YOUTUBE.com');
  await popup.keyboard.press('Enter');
  await sleep(200);
  check('duplicate rejected (case-insensitive)', (await popup.$eval('#message', (e) => e.textContent)).includes('already on your list'));
  await popup.$eval('#add-input', (e) => (e.value = ''));
  await popup.type('#add-input', 'not a site');
  await popup.keyboard.press('Enter');
  await sleep(200);
  check('invalid input shows error', await popup.$eval('#message', (e) => e.classList.contains('error')));
  await popup.$eval('#add-input', (e) => (e.value = ''));

  console.log('Start focus');
  await popup.click('#durations button:nth-child(1)'); // 25m
  await popup.click('#start');
  await sleep(1500);
  const focus = (await ev(() => chrome.storage.local.get('focus'))).focus;
  check('focus active with 25m end', focus.active && Math.abs(focus.endsAt - focus.startedAt - 25 * 60000) < 1000);
  const rules = await ev(() => chrome.declarativeNetRequest.getDynamicRules());
  check('one redirect rule covering 32 domains', rules.length === 1 && rules[0].condition.requestDomains.length === 32);
  check('badge shows minutes', /^2[45]m$/.test(await ev(() => chrome.action.getBadgeText({}))), await ev(() => chrome.action.getBadgeText({})));
  check('popup shows active state', await popup.$eval('#active', (e) => !e.hidden));
  check('remove buttons hidden during focus', (await popup.$$('.remove')).length === 0);
  check('edit-as-text hidden during focus', await popup.$eval('#edit-toggle', (e) => e.hidden));
  await sleep(500);
  check('already-open reddit tab got blocked', reddit.url().startsWith(extUrl('blocked.html')), reddit.url());
  await popup.screenshot({ path: SHOTS + '/popup-active-dark.png', fullPage: true });

  console.log('Blocking');
  const tab = await browser.newPage();
  await tab.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const go = async (u) => { await tab.goto('about:blank'); await tab.goto(u, { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {}); await sleep(400); return tab.url(); };
  let u = await go('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10');
  check('youtube redirected with original URL in hash', u === extUrl('blocked.html#https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10'), u);
  const text = (sel) => tab.$eval(sel, (e) => e.textContent);
  check('block page names the site', (await text('#headline')) === 'youtube.com can wait.', await text('#headline'));
  check('block page shows session end time', /^Focus session · ends \d{1,2}:\d\d/.test(await text('#status')), await text('#status'));
  check('block page counts down', /^2[45]:\d\d$/.test(await text('#time')), await text('#time'));
  check('block page counts skips', (await text('#foot')) === '1 distraction skipped today', await text('#foot'));
  check('nothing to return to in a fresh tab: offers Close tab', (await text('#primary-label')) === 'Close tab' && (await tab.$eval('#secondary', (e) => e.hidden)));
  await sleep(1300);
  await tab.screenshot({ path: SHOTS + '/blocked.png' });
  check('subdomain music.youtube.com blocked', (await go('https://music.youtube.com/')).startsWith(extUrl('blocked.html')));
  check('added site example.org blocked', (await go('http://example.org/')).startsWith(extUrl('blocked.html')));
  u = await go('https://notyoutube.com/'); check('lookalike notyoutube.com not blocked', !u.startsWith('chrome-extension'), u);
  check('example.com not blocked', !(await go('https://example.com/')).startsWith('chrome-extension'));
  const n = (await ev(() => chrome.storage.local.get('nudges'))).nudges;
  check('nudges counted (3 blocked visits + reddit reload not counted)', n.count === 3, JSON.stringify(n));

  console.log('Return to the last allowed page');
  // example.com -> youtube (blocked) -> instagram (blocked): Back would land on another block page.
  await tab.goto('https://www.youtube.com/', { timeout: 8000 }).catch(() => {}); await sleep(300);
  await tab.goto('https://www.instagram.com/', { timeout: 8000 }).catch(() => {}); await sleep(500);
  check('offers to return to the last allowed site', (await text('#primary-label')) === 'Return to example.com', await text('#primary-label'));
  check('Close tab offered alongside', !(await tab.$eval('#secondary', (e) => e.hidden)));
  await Promise.all([tab.waitForNavigation({ timeout: 4000 }).catch(() => {}), tab.click('#primary')]);
  await sleep(500);
  check('return skips the chain of blocked pages', tab.url().startsWith('https://example.com'), tab.url());
  await tab.goto('https://www.instagram.com/', { timeout: 8000 }).catch(() => {}); await sleep(500);
  await Promise.all([tab.waitForNavigation({ timeout: 4000 }).catch(() => {}), tab.keyboard.press('Enter')]);
  await sleep(500);
  check('Enter triggers the return', tab.url().startsWith('https://example.com'), tab.url());

  console.log('Close tab');
  const closer = await browser.newPage();
  await closer.goto('https://www.youtube.com/', { timeout: 8000 }).catch(() => {}); await sleep(500);
  const before = (await browser.pages()).length;
  await closer.click('#primary').catch(() => {}); await sleep(600);
  check('Close tab closes the tab', (await browser.pages()).length === before - 1);

  console.log('Block current site');
  const site = await browser.newPage();
  await site.goto('https://example.net/', { waitUntil: 'domcontentloaded', timeout: 8000 }).catch(() => {});
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 320, height: 620, deviceScaleFactor: 2 });
  await p2.goto(extUrl('popup.html'));
  await ev(async () => { const [t] = await chrome.tabs.query({ url: 'https://example.net/*' }); await chrome.tabs.update(t.id, { active: true }); });
  await p2.reload(); await sleep(400);
  check('current site row shows example.net', (await p2.$eval('#current-host', (e) => e.textContent)) === 'example.net');
  await p2.bringToFront();
  await p2.click('#block-current'); await sleep(1200);
  check('example.net added', (await ev(() => chrome.storage.sync.get('blockedSites'))).blockedSites.includes('example.net'));
  check('row flips to "On your list"', await p2.$eval('#current-note', (e) => !e.hidden));
  check('open example.net tab blocked immediately', site.url().startsWith(extUrl('blocked.html')), site.url());

  console.log('Hold to stop');
  const box = await (await p2.$('#hold')).boundingBox();
  await p2.mouse.move(box.x + 20, box.y + 10);
  await p2.mouse.down(); await sleep(1200); await p2.mouse.up(); await sleep(300);
  check('short hold does not stop', (await ev(() => chrome.storage.local.get('focus'))).focus.active);
  await p2.mouse.down(); await sleep(3400); await p2.mouse.up(); await sleep(800);
  check('3s hold stops focus', !(await ev(() => chrome.storage.local.get('focus'))).focus.active);
  check('hold bar resets after stopping', (await p2.$eval('#hold-fill', (e) => e.style.width)) === '0px' || (await p2.$eval('#hold-fill', (e) => e.style.width)) === '0');
  check('rules cleared', (await ev(() => chrome.declarativeNetRequest.getDynamicRules())).length === 0);
  check('badge cleared', (await ev(() => chrome.action.getBadgeText({}))) === '');
  check('blocked tab offers to continue', (await site.$eval('#primary-label', (e) => e.textContent)) === 'Continue to example.net', await site.$eval('#primary-label', (e) => e.textContent));
  check('youtube reachable after stop', !(await go('https://www.youtube.com/')).startsWith('chrome-extension'));

  console.log('Timed session ends on its own');
  await ev(() => chrome.storage.local.set({ focus: { active: true, startedAt: Date.now(), endsAt: Date.now() + 2500 } }));
  await sleep(800);
  check('rules on during short session', (await ev(() => chrome.declarativeNetRequest.getDynamicRules())).length === 1);
  await sleep(3500);
  check('session ended by alarm', !(await ev(() => chrome.storage.local.get('focus'))).focus.active);
  check('rules off after end', (await ev(() => chrome.declarativeNetRequest.getDynamicRules())).length === 0);

  console.log('No-limit session');
  await p2.click('#durations button:nth-child(4)');
  await p2.click('#start'); await sleep(800);
  check('badge says on', (await ev(() => chrome.action.getBadgeText({}))) === 'on');
  check('hold label for no-limit', (await p2.$eval('#hold-label', (e) => e.textContent)) === 'Hold to stop');
  await ev(() => chrome.storage.local.set({ focus: { active: false } })); await sleep(500);

  console.log('Edit as text');
  await p2.click('#edit-toggle'); await sleep(200);
  await p2.screenshot({ path: SHOTS + '/popup-editor-dark.png', fullPage: true });
  await p2.$eval('#editor-text', (e) => (e.value = 'Reddit.com\nhttps://news.ycombinator.com/item?id=1\nreddit.com, x.com\n???'));
  await p2.click('#editor-save'); await sleep(300);
  sites = (await ev(() => chrome.storage.sync.get('blockedSites'))).blockedSites;
  check('editor parses, normalizes, dedupes', JSON.stringify(sites) === '["reddit.com","news.ycombinator.com","x.com"]', JSON.stringify(sites));
  check('editor reports skipped line', (await p2.$eval('#message', (e) => e.textContent)).includes('Skipped 1 line'));

  console.log('Sync quota');
  await p2.click('#edit-toggle'); await sleep(200);
  await p2.$eval('#editor-text', (e) => (e.value = Array.from({ length: 600 }, (_, i) => `site${i}-example-domain.com`).join('\n')));
  await p2.click('#editor-save'); await sleep(400);
  check('oversized list shows error', (await p2.$eval('#message', (e) => e.textContent)).includes('too long'));
  check('oversized list leaves saved list untouched', (await ev(() => chrome.storage.sync.get('blockedSites'))).blockedSites.length === 3);
  check('editor stays open to fix it', await p2.$eval('#editor', (e) => !e.hidden));
  await p2.click('#editor-cancel'); await sleep(200);

  console.log('Empty list stays empty');
  await p2.click('#edit-toggle'); await p2.$eval('#editor-text', (e) => (e.value = '')); await p2.click('#editor-save'); await sleep(300);
  check('list empty, not reseeded', (await ev(() => chrome.storage.sync.get('blockedSites'))).blockedSites.length === 0);
  check('empty state shown', await p2.$eval('#empty', (e) => !e.hidden));
  check('start with empty list adds no rules', await (async () => { await p2.click('#start'); await sleep(600); return (await ev(() => chrome.declarativeNetRequest.getDynamicRules())).length === 0; })());

  console.log('Sites with a service worker');
  await ev(() => chrome.storage.local.set({ focus: { active: false } }));
  await ev(() => chrome.storage.sync.set({ blockedSites: ['swsite.com'] }));
  const swTab = await browser.newPage();
  await swTab.goto(SW_SITE + '/'); await sleep(1200); await swTab.reload(); await sleep(800);
  check('test site is controlled by its service worker', await swTab.evaluate(() => !!navigator.serviceWorker.controller));
  await swTab.close();
  await ev(() => chrome.storage.local.set({ focus: { active: true, startedAt: Date.now(), endsAt: null } })); await sleep(1200);
  const swNav = await browser.newPage();
  await swNav.goto(OK_SITE + '/fine'); await sleep(500);
  await swNav.goto(SW_SITE + '/').catch(() => {}); await sleep(1200);
  check('service-worker site blocked', swNav.url().startsWith(extUrl('blocked.html')), swNav.url());
  await swNav.goto(SW_SITE + '/some/deep/link').catch(() => {}); await sleep(1200);
  check('service-worker deep link blocked', swNav.url() === extUrl(`blocked.html#${SW_SITE}/some/deep/link`), swNav.url());
  await Promise.all([swNav.waitForNavigation({ timeout: 4000 }).catch(() => {}), swNav.click('#primary')]); await sleep(800);
  check('return goes to the last allowed page', swNav.url().startsWith(OK_SITE), swNav.url());
  await ev(() => chrome.storage.local.set({ focus: { active: false } })); await sleep(800);
  const swOff = await browser.newPage();
  await swOff.goto(SW_SITE + '/').catch(() => {}); await sleep(800);
  check('service-worker site loads again after focus ends', swOff.url().startsWith(SW_SITE), swOff.url());

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  swServer.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
