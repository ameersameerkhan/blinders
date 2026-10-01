// Shared between the service worker (via importScripts), the popup and the block page.

const DEFAULT_BLOCKED_SITES = [
  "youtube.com",
  "instagram.com",
  "pinterest.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "tiktok.com",
  "bbc.co.uk",
  "bbc.com",
  "ndtv.com",
  "techcrunch.com",
  "netflix.com",
  "web.whatsapp.com",
  "web.telegram.org",
  "open.spotify.com",
  "canva.com",
  "linkedin.com",
  "quora.com",
  "medium.com",
  "reddit.com",
  "indiehackers.com",
  "producthunt.com",
  "starterstory.com",
  "chess.com",
  "miniclip.com",
  "lichess.org",
  "8ballpool.com",
  "chess24.com",
  "chessbase.com",
  "gmail.com",
  "slack.com",
];

const DURATIONS = [
  { label: "25m", minutes: 25 },
  { label: "1h", minutes: 60 },
  { label: "2h", minutes: 120 },
  { label: "No limit", minutes: 0 },
];

const HOSTNAME_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,61}[a-z0-9]$/;

// Turns whatever someone pastes ("https://www.YouTube.com/watch?v=1") into a bare
// hostname ("youtube.com"). Returns null when the input isn't a usable domain.
function normalizeSite(input) {
  let value = String(input || "").trim().toLowerCase();
  if (!value) return null;
  value = value.replace(/^[a-z][a-z0-9+.-]*:\/\//, "");
  value = value.split(/[/?#]/)[0];
  value = value.replace(/^[^@]*@/, "").replace(/:\d+$/, "").replace(/\.$/, "");
  value = value.replace(/^(www|m)\./, "");
  return HOSTNAME_RE.test(value) ? value : null;
}

// Splits a block of text (one site per line, or comma/space separated) into
// unique normalized sites, keeping track of anything that couldn't be read.
function parseSiteList(text) {
  const sites = [];
  const invalid = [];
  for (const token of String(text || "").split(/[\s,]+/)) {
    if (!token) continue;
    const site = normalizeSite(token);
    if (!site) invalid.push(token);
    else if (!sites.includes(site)) sites.push(site);
  }
  return { sites, invalid };
}

// True when hostname is one of the blocked sites or a subdomain of one.
function isHostBlocked(hostname, sites) {
  const host = String(hostname || "").toLowerCase().replace(/^www\./, "");
  return sites.some((site) => host === site || host.endsWith("." + site));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function minutesLeft(focus, now = Date.now()) {
  if (!focus || !focus.active || !focus.endsAt) return null;
  return Math.max(0, Math.ceil((focus.endsAt - now) / 60000));
}
