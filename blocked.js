const $ = (id) => document.getElementById(id);
const els = {
  status: $("status"),
  headline: $("headline"),
  ring: $("ring"),
  arc: $("arc"),
  orbit: $("orbit"),
  time: $("time"),
  unit: $("unit"),
  primary: $("primary"),
  primaryLabel: $("primary-label"),
  secondary: $("secondary"),
  foot: $("foot"),
};

const target = (() => {
  try {
    const url = new URL(location.hash.slice(1));
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
})();
const host = target ? target.hostname.replace(/^www\./, "") : null;

let focus = { active: false };
let returnUrl = null;
let primaryAction = closeTab;

function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// Mono digits keep the time steady; the colon is pulled in so it doesn't read "24 : 56".
function setClock(el, text) {
  el.replaceChildren(...text.split(":").flatMap((part, i) =>
    i ? [Object.assign(document.createElement("span"), { className: "colon", textContent: ":" }), part] : [part]
  ));
}

function timeOfDay(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function hostOf(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}

// --- Actions --------------------------------------------------------------

async function closeTab() {
  const tab = await chrome.tabs.getCurrent();
  const siblings = await chrome.tabs.query({ windowId: tab.windowId });
  // Closing the last tab would close the window; open a fresh tab instead.
  if (siblings.length > 1) chrome.tabs.remove(tab.id);
  else chrome.tabs.update(tab.id, { url: "chrome://newtab/" });
}

function goTo(url) {
  location.replace(url);
}

function setActions(primaryLabel, action, showClose) {
  els.primaryLabel.textContent = primaryLabel;
  primaryAction = action;
  els.secondary.hidden = !showClose;
}

// --- Rendering ------------------------------------------------------------

function setProgress(fraction) {
  const f = Math.min(1, Math.max(0, fraction));
  els.arc.style.strokeDashoffset = String(100 - f * 100);
  els.orbit.style.transform = `rotate(${f * 360}deg)`;
}

function renderHeadline(text, site) {
  if (!site) {
    els.headline.textContent = text;
    return;
  }
  const strong = document.createElement("span");
  strong.className = "site";
  strong.textContent = site;
  els.headline.replaceChildren(strong, text);
}

function render() {
  const now = Date.now();
  const ring = els.ring.classList;

  if (!focus.active) {
    // The session ended while this tab was open: let them through.
    els.status.textContent = "Focus session ended";
    els.status.classList.add("ended");
    renderHeadline("Your focus session is over.");
    ring.remove("open");
    ring.add("done");
    setProgress(1);
    els.time.textContent = "Done";
    els.unit.textContent = "nice work";
    if (target) setActions(`Continue to ${host}`, () => goTo(target.href), true);
    else setActions("Close tab", closeTab, false);
    return;
  }

  els.status.classList.remove("ended");
  ring.remove("done");
  renderHeadline(host ? " can wait." : "This site can wait.", host);

  if (focus.endsAt) {
    els.status.replaceChildren("Focus session · ends ", Object.assign(document.createElement("span"), {
      className: "mono",
      textContent: timeOfDay(focus.endsAt),
    }));
    ring.remove("open");
    setProgress((now - focus.startedAt) / (focus.endsAt - focus.startedAt));
    setClock(els.time, clock(focus.endsAt - now));
    els.unit.textContent = "remaining";
  } else {
    els.status.textContent = "Focus session · no time limit";
    ring.add("open");
    els.arc.style.strokeDashoffset = "100";
    els.orbit.style.transform = "";
    setClock(els.time, clock(now - focus.startedAt));
    els.unit.textContent = "focused";
  }

  if (returnUrl) setActions(`Return to ${hostOf(returnUrl)}`, () => goTo(returnUrl), true);
  else setActions("Close tab", closeTab, false);
}

function renderSkipped(count) {
  els.foot.textContent = count ? `${count} ${count === 1 ? "distraction" : "distractions"} skipped today` : "";
}

// --- Data -----------------------------------------------------------------

async function countSkip() {
  const nav = performance.getEntriesByType("navigation")[0];
  const { nudges } = await chrome.storage.local.get("nudges");
  const today = todayKey();
  let count = nudges && nudges.date === today ? nudges.count : 0;
  if (!nav || nav.type !== "reload") {
    count += 1;
    await chrome.storage.local.set({ nudges: { date: today, count } });
  }
  return count;
}

async function loadReturnUrl() {
  const tab = await chrome.tabs.getCurrent();
  if (!tab) return null;
  const key = `return:${tab.id}`;
  const stored = (await chrome.storage.session.get(key))[key];
  return stored && stored !== target?.href ? stored : null;
}

async function init() {
  if (host) document.title = `${host} can wait · Blinders`;
  const [local, url, skipped] = await Promise.all([
    chrome.storage.local.get("focus"),
    loadReturnUrl().catch(() => null),
    countSkip(),
  ]);
  focus = local.focus || { active: false };
  returnUrl = url;
  renderSkipped(skipped);

  // Draw the ring in from empty, then tick once a second.
  render();
  const shown = { offset: els.arc.style.strokeDashoffset, orbit: els.orbit.style.transform };
  if (focus.active && focus.endsAt) {
    setProgress(0);
    els.ring.getBoundingClientRect();
    els.ring.classList.add("intro");
    els.arc.style.strokeDashoffset = shown.offset;
    els.orbit.style.transform = shown.orbit;
    setTimeout(() => els.ring.classList.replace("intro", "ready"), 1250);
  } else {
    els.ring.classList.add("ready");
  }
  setInterval(render, 1000);
}

els.primary.addEventListener("click", () => primaryAction());
els.secondary.addEventListener("click", closeTab);
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement)) primaryAction();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.focus) {
    focus = changes.focus.newValue || { active: false };
    render();
  }
  if (area === "local" && changes.nudges) {
    const n = changes.nudges.newValue;
    renderSkipped(n && n.date === todayKey() ? n.count : 0);
  }
});

init();
