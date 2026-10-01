// Registered by background.js only while focus is on, and only for blocked sites.
// Catches page loads that a site's own service worker answers from cache, which
// declarativeNetRequest never sees (x.com, Slack and other web apps do this).
location.replace(`${chrome.runtime.getURL("blocked.html")}#${location.href}`);
