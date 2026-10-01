const HOLD_MS = 3000;

const $ = (id) => document.getElementById(id);
const els = {
  pill: $("on-pill"),
  idle: $("idle"),
  idleSub: $("idle-sub"),
  durations: $("durations"),
  start: $("start"),
  active: $("active"),
  timer: $("timer"),
  activeSub: $("active-sub"),
  progress: $("progress"),
  progressFill: $("progress-fill"),
  hold: $("hold"),
  holdFill: $("hold-fill"),
  holdLabel: $("hold-label"),
  current: $("current"),
  currentIcon: $("current-icon"),
  currentHost: $("current-host"),
  blockCurrent: $("block-current"),
  currentNote: $("current-note"),
  listLabel: $("list-label"),
  editToggle: $("edit-toggle"),
  addForm: $("add-form"),
  addInput: $("add-input"),
  message: $("message"),
  sites: $("sites"),
  empty: $("empty"),
  editor: $("editor"),
  editorText: $("editor-text"),
  editorCopy: $("editor-copy"),
  editorCancel: $("editor-cancel"),
  editorSave: $("editor-save"),
  shortcut: $("shortcut"),
  nudges: $("nudges"),
};

const state = {
  sites: [],
  focus: { active: false },
  duration: 60,
  currentHost: null,
  editing: false,
  justAdded: null,
};

// --- Rendering ------------------------------------------------------------

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function formatClock(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
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

function renderDurations() {
  els.durations.replaceChildren(
    ...DURATIONS.map(({ label, minutes }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "radio";
      btn.textContent = label;
      btn.setAttribute("aria-checked", String(minutes === state.duration));
      btn.tabIndex = minutes === state.duration ? 0 : -1;
      btn.addEventListener("click", () => selectDuration(minutes));
      return btn;
    })
  );
}

function selectDuration(minutes) {
  state.duration = minutes;
  chrome.storage.sync.set({ lastDuration: minutes });
  renderDurations();
  els.durations.querySelector('[aria-checked="true"]').focus();
}

function renderHero() {
  const { active } = state.focus;
  els.idle.hidden = active;
  els.active.hidden = !active;
  els.pill.hidden = !active;
  els.idleSub.textContent = state.sites.length
    ? `${plural(state.sites.length, "site")} ready to block`
    : "Add a site below to get started";
  if (active) tick();
}

function tick() {
  const { focus } = state;
  if (!focus.active) return;
  const now = Date.now();
  const blocked = plural(state.sites.length, "site");
  if (focus.endsAt) {
    setClock(els.timer, formatClock(focus.endsAt - now));
    els.activeSub.textContent = `left · ${blocked} blocked`;
    els.progress.hidden = false;
    const done = (now - focus.startedAt) / (focus.endsAt - focus.startedAt);
    els.progressFill.style.width = `${Math.min(100, Math.max(0, done * 100))}%`;
    els.holdLabel.textContent = "Hold to stop early";
  } else {
    setClock(els.timer, formatClock(now - focus.startedAt));
    els.activeSub.textContent = `focused so far · ${blocked} blocked`;
    els.progress.hidden = true;
    els.holdLabel.textContent = "Hold to stop";
  }
}

function faviconLetter(host) {
  return host.replace(/^(web|open|www)\./, "").charAt(0);
}

function renderCurrent() {
  const host = state.currentHost;
  els.current.hidden = !host || state.editing;
  if (!host) return;
  const listed = isHostBlocked(host, state.sites);
  els.currentIcon.textContent = faviconLetter(host);
  els.currentHost.textContent = host;
  els.blockCurrent.hidden = listed;
  els.currentNote.hidden = !listed;
}

function renderList() {
  const locked = state.focus.active;
  els.listLabel.textContent = `Blocked · ${state.sites.length}`;
  els.editToggle.hidden = locked || state.editing;
  els.addForm.hidden = state.editing;
  els.sites.hidden = state.editing || !state.sites.length;
  els.empty.hidden = state.editing || state.sites.length > 0;
  els.editor.hidden = !state.editing;

  els.sites.replaceChildren(
    ...state.sites.map((site) => {
      const li = document.createElement("li");
      if (site === state.justAdded) li.classList.add("added");

      const icon = document.createElement("span");
      icon.className = "favicon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = faviconLetter(site);

      const host = document.createElement("span");
      host.className = "host";
      host.textContent = site;

      li.append(icon, host);

      if (!locked) {
        const remove = document.createElement("button");
        remove.className = "remove";
        remove.setAttribute("aria-label", `Remove ${site}`);
        remove.innerHTML =
          '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7m0-7l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        remove.addEventListener("click", () => removeSite(site));
        li.append(remove);
      }
      return li;
    })
  );
  state.justAdded = null;
}

function render() {
  renderHero();
  renderCurrent();
  renderList();
}

function showMessage(text, isError = false) {
  els.message.textContent = text;
  els.message.classList.toggle("error", isError);
}

// --- Actions --------------------------------------------------------------

async function saveSites(sites) {
  try {
    await chrome.storage.sync.set({ blockedSites: sites });
  } catch {
    showMessage("That list is too long for Chrome to sync. Try removing some sites.", true);
    return false;
  }
  state.sites = sites;
  render();
  return true;
}

async function addSite(raw) {
  const site = normalizeSite(raw);
  if (!site) {
    showMessage("That doesn't look like a website. Try something like youtube.com.", true);
    return false;
  }
  if (state.sites.includes(site)) {
    showMessage(`${site} is already on your list.`);
    return false;
  }
  showMessage("");
  state.justAdded = site;
  return saveSites([site, ...state.sites]);
}

async function removeSite(site) {
  if (state.focus.active) return;
  if (await saveSites(state.sites.filter((s) => s !== site))) showMessage(`Removed ${site}.`);
}

function openEditor() {
  state.editing = true;
  els.editorText.value = state.sites.join("\n");
  showMessage("");
  render();
  els.editorText.focus();
  els.editorText.setSelectionRange(0, 0);
  els.editorText.scrollTop = 0;
}

function closeEditor() {
  state.editing = false;
  render();
}

async function saveEditor() {
  const { sites, invalid } = parseSiteList(els.editorText.value);
  // Locked lists can grow during focus, never shrink.
  const next = state.focus.active ? [...state.sites, ...sites.filter((s) => !state.sites.includes(s))] : sites;
  if (!(await saveSites(next))) return;
  state.editing = false;
  render();
  showMessage(
    invalid.length
      ? `Saved. Skipped ${plural(invalid.length, "line")} that didn't look like a website: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`
      : "Saved.",
    invalid.length > 0
  );
}

async function copyList() {
  try {
    await navigator.clipboard.writeText(state.sites.join("\n"));
    els.editorCopy.textContent = "Copied";
  } catch {
    els.editorText.select();
    els.editorCopy.textContent = "Press ⌘C to copy";
  }
  setTimeout(() => (els.editorCopy.textContent = "Copy list"), 1600);
}

function send(message) {
  return chrome.runtime.sendMessage(message);
}

// Hold-to-stop: the fill grows while pressed and resets the moment you let go.
let holdStart = null;
let holdFrame = null;

function beginHold() {
  if (holdStart !== null) return;
  holdStart = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - holdStart) / HOLD_MS);
    els.holdFill.style.width = `${progress * 100}%`;
    if (progress >= 1) {
      holdStart = null;
      els.holdLabel.textContent = "Stopping…";
      send({ type: "stop" });
      return;
    }
    holdFrame = requestAnimationFrame(step);
  };
  holdFrame = requestAnimationFrame(step);
}

function cancelHold() {
  holdStart = null;
  cancelAnimationFrame(holdFrame);
  els.holdFill.style.width = "0";
}

// --- Wiring ---------------------------------------------------------------

els.start.addEventListener("click", () => send({ type: "start", minutes: state.duration }));

els.durations.addEventListener("keydown", (e) => {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!step) return;
  e.preventDefault();
  const i = DURATIONS.findIndex((d) => d.minutes === state.duration);
  selectDuration(DURATIONS[(i + step + DURATIONS.length) % DURATIONS.length].minutes);
});

els.hold.addEventListener("pointerdown", (e) => {
  els.hold.setPointerCapture(e.pointerId);
  beginHold();
});
els.hold.addEventListener("pointerup", cancelHold);
els.hold.addEventListener("pointercancel", cancelHold);
els.hold.addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    beginHold();
  }
});
els.hold.addEventListener("keyup", cancelHold);
els.hold.addEventListener("blur", cancelHold);

els.addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (await addSite(els.addInput.value)) els.addInput.value = "";
});
els.addInput.addEventListener("input", () => {
  if (els.message.classList.contains("error")) showMessage("");
});

els.blockCurrent.addEventListener("click", () => addSite(state.currentHost));

els.editToggle.addEventListener("click", openEditor);
els.editorCancel.addEventListener("click", closeEditor);
els.editorSave.addEventListener("click", saveEditor);
els.editorCopy.addEventListener("click", copyList);
els.editorText.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEditor();
  if (e.key === "Escape") {
    e.preventDefault();
    closeEditor();
  }
});

els.shortcut.addEventListener("click", () => chrome.tabs.create({ url: "chrome://extensions/shortcuts" }));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.blockedSites) state.sites = changes.blockedSites.newValue || [];
  if (area === "local" && changes.focus) {
    state.focus = changes.focus.newValue || { active: false };
    cancelHold();
    showMessage("");
  }
  if (area === "local" && changes.nudges) renderNudges(changes.nudges.newValue);
  render();
});

function renderNudges(nudges) {
  const count = nudges && nudges.date === todayKey() ? nudges.count : 0;
  els.nudges.textContent = count ? `${count} skipped today` : "Nothing skipped yet";
}

async function renderShortcut() {
  const commands = await chrome.commands.getAll();
  const shortcut = commands.find((c) => c.name === "start-focus")?.shortcut;
  els.shortcut.replaceChildren();
  if (shortcut) {
    const kbd = document.createElement("kbd");
    kbd.textContent = shortcut;
    els.shortcut.append(kbd, "start focus");
    els.shortcut.title = "Change shortcut";
  } else {
    els.shortcut.textContent = "Set a keyboard shortcut";
  }
}

async function init() {
  const [sync, local, [tab]] = await Promise.all([
    chrome.storage.sync.get(["blockedSites", "lastDuration"]),
    chrome.storage.local.get(["focus", "nudges"]),
    chrome.tabs.query({ active: true, currentWindow: true }),
  ]);
  state.sites = sync.blockedSites || [];
  state.duration = DURATIONS.some((d) => d.minutes === sync.lastDuration) ? sync.lastDuration : 60;
  state.focus = local.focus || { active: false };

  try {
    const url = new URL(tab?.url || "");
    if (url.protocol === "http:" || url.protocol === "https:") state.currentHost = normalizeSite(url.hostname);
  } catch {
    state.currentHost = null;
  }

  renderDurations();
  renderNudges(local.nudges);
  renderShortcut();
  render();
  setInterval(tick, 1000);
}

init();
