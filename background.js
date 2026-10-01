importScripts("shared.js");

const RULE_ID = 1;
const BLOCKED_PAGE = chrome.runtime.getURL("blocked.html");
const BADGE_BG = "#F0B44C";
const BADGE_TEXT = "#1E1609";
const ICONS = {
  on: { 16: "icons/icon-16.png", 32: "icons/icon-32.png" },
  off: { 16: "icons/off-16.png", 32: "icons/off-32.png" },
};

async function getState() {
  const [{ blockedSites = [] }, { focus = { active: false } }] = await Promise.all([
    chrome.storage.sync.get("blockedSites"),
    chrome.storage.local.get("focus"),
  ]);
  return { blockedSites, focus };
}

// --- Blocking rules -------------------------------------------------------

// One redirect rule covers every blocked domain (and its subdomains). The original
// URL rides along in the hash so the block page can say what was blocked.
function buildRules(sites) {
  if (!sites.length) return [];
  return [
    {
      id: RULE_ID,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { regexSubstitution: `${BLOCKED_PAGE}#\\0` },
      },
      condition: {
        regexFilter: "^https?://.*",
        requestDomains: sites,
        resourceTypes: ["main_frame"],
      },
    },
  ];
}

// Rule updates are queued so rapid changes from the popup can't interleave.
let queue = Promise.resolve();
function sync() {
  queue = queue.then(applyState).catch((err) => console.error("Blinders:", err));
  return queue;
}

async function applyState() {
  const { blockedSites, focus } = await getState();

  if (focus.active && focus.endsAt && focus.endsAt <= Date.now()) {
    await chrome.storage.local.set({ focus: { active: false } });
    return; // the storage change triggers another sync
  }

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules: focus.active ? buildRules(blockedSites) : [],
  });

  await updateGuard(focus.active ? blockedSites : []);
  await updateAlarms(focus);
  await updateAction(focus);
  if (focus.active) await enforceOpenTabs(blockedSites);
}

// Second layer for sites whose service worker serves pages from cache, which
// bypasses the network rule above. guard.js only runs on blocked sites during focus.
const GUARD_ID = "guard";
async function updateGuard(sites) {
  const registered = await chrome.scripting.getRegisteredContentScripts({ ids: [GUARD_ID] });
  if (registered.length) await chrome.scripting.unregisterContentScripts({ ids: [GUARD_ID] });
  if (!sites.length) return;
  await chrome.scripting.registerContentScripts([
    {
      id: GUARD_ID,
      js: ["guard.js"],
      matches: sites.map((site) => `*://*.${site}/*`),
      runAt: "document_start",
    },
  ]);
}

// Reload any open tab that's on a blocked site so the rule catches it.
async function enforceOpenTabs(sites) {
  const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
  for (const tab of tabs) {
    try {
      if (isHostBlocked(new URL(tab.url).hostname, sites)) {
        await chrome.tabs.reload(tab.id);
      }
    } catch {
      // Tab closed or URL unreadable; nothing to do.
    }
  }
}

// --- Timer, badge and icon ------------------------------------------------

async function updateAlarms(focus) {
  await chrome.alarms.clearAll();
  if (!focus.active) return;
  if (focus.endsAt) chrome.alarms.create("focus-end", { when: focus.endsAt });
  chrome.alarms.create("tick", { periodInMinutes: 1 });
}

function badgeText(focus) {
  if (!focus.active) return "";
  const mins = minutesLeft(focus);
  if (mins === null) return "on";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`;
}

async function updateAction(focus) {
  await chrome.action.setIcon({ path: focus.active ? ICONS.on : ICONS.off });
  await chrome.action.setBadgeBackgroundColor({ color: BADGE_BG });
  if (chrome.action.setBadgeTextColor) {
    await chrome.action.setBadgeTextColor({ color: BADGE_TEXT });
  }
  await chrome.action.setBadgeText({ text: badgeText(focus) });
  await chrome.action.setTitle({
    title: focus.active ? "Blinders: focus is on" : "Blinders: focus is off",
  });
}

// --- Focus sessions -------------------------------------------------------

async function startFocus(minutes) {
  const now = Date.now();
  await chrome.storage.local.set({
    focus: { active: true, startedAt: now, endsAt: minutes ? now + minutes * 60000 : null },
  });
  await chrome.storage.sync.set({ lastDuration: minutes });
}

async function stopFocus() {
  await chrome.storage.local.set({ focus: { active: false } });
}

// --- Events ---------------------------------------------------------------

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const { blockedSites, isBlocking } = await chrome.storage.sync.get(["blockedSites", "isBlocking"]);

  // Seed the default list once. After this an empty list stays empty.
  if (reason === "install" && !Array.isArray(blockedSites)) {
    await chrome.storage.sync.set({ blockedSites: DEFAULT_BLOCKED_SITES });
  }

  // v1 stored an on/off flag and unnormalized sites.
  if (Array.isArray(blockedSites)) {
    await chrome.storage.sync.set({ blockedSites: parseSiteList(blockedSites.join("\n")).sites });
  }
  if (isBlocking !== undefined) {
    if (isBlocking) await chrome.storage.local.set({ focus: { active: true, startedAt: Date.now(), endsAt: null } });
    await chrome.storage.sync.remove("isBlocking");
  }

  sync();
});

chrome.runtime.onStartup.addListener(sync);

chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === "sync" && changes.blockedSites) || (area === "local" && changes.focus)) sync();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "focus-end") return stopFocus();
  if (alarm.name === "tick") {
    const { focus } = await getState();
    if (focus.active && focus.endsAt && focus.endsAt <= Date.now()) return stopFocus();
    await updateAction(focus);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "start-focus") return;
  const { focus } = await getState();
  if (!focus.active) {
    const { lastDuration = 60 } = await chrome.storage.sync.get("lastDuration");
    return startFocus(lastDuration);
  }
  // Stopping always goes through the popup's hold-to-stop.
  try {
    await chrome.action.openPopup();
  } catch {
    // openPopup isn't available in every context; the badge already shows focus is on.
  }
});

// Remember the last page in each tab that isn't on the block list, so the block
// page can offer a "Return to …" that never lands on another blocked site.
// Session storage stays on this device and clears when Chrome closes.
chrome.tabs.onUpdated.addListener(async (tabId, { url }) => {
  if (!url || !/^https?:/.test(url)) return;
  const { blockedSites } = await getState();
  try {
    if (isHostBlocked(new URL(url).hostname, blockedSites)) return;
  } catch {
    return;
  }
  await chrome.storage.session.set({ [`return:${tabId}`]: url });
});

chrome.tabs.onRemoved.addListener((tabId) => chrome.storage.session.remove(`return:${tabId}`));

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const run =
    message.type === "start" ? startFocus(message.minutes) :
    message.type === "stop" ? stopFocus() :
    null;
  if (!run) return false;
  run.then(() => sendResponse({ ok: true }), (err) => sendResponse({ ok: false, error: String(err) }));
  return true;
});
