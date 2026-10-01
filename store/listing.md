# Chrome Web Store listing

Copy and paste these into the developer dashboard.

## Store listing tab

**Name** (from manifest): Blinders: Block Distracting Sites

**Summary** (from manifest, 132 characters max):
Block distracting sites while you focus. Timed sessions, one-click blocking, no account, and nothing leaves your browser.

**Category:** Productivity → Workflow & Planning

**Language:** English

**Description:**

```
Blinders keeps the sites that steal your attention out of sight while you work.

Pick a session length, hit Start focus, and every site on your list redirects to a calm page with a countdown and one button that takes you back to what you were working on. When the session ends, everything opens normally again.

Made for anyone whose hands open YouTube before their brain has decided anything.

WHAT IT DOES
• Focus sessions: 25 minutes, 1 hour, 2 hours, or no limit. The toolbar badge counts down.
• Block the site you're on with one click.
• Tabs you already had open on blocked sites are caught the moment a session starts.
• Ending a session early takes a 3-second hold. A small pause that beats impulse.
• Your list is locked during a session. You can add sites, but not remove them.
• Edit your list as text to paste or copy it in one go. Handy for moving between Chrome profiles.
• Keyboard shortcut (Alt+Shift+F) to start a session.
• See how many times today Blinders caught you.

PRIVATE BY DESIGN
• No account, no analytics, no ads.
• Blinders makes no network requests. Your list never leaves Chrome.
• Open source: read every line at https://github.com/ameersameerkhan/blinders

Comes with a starter list of common distractions (social, video, news, games). Remove anything you need for work, or add your own.
```

**Graphic assets** (in `store/`):
- Store icon: `icons/icon-128.png`
- Screenshots (1280×800): `store/screenshot-1.png` … `store/screenshot-4.png` (upload in that order)
- Small promo tile (440×280): `store/promo-small.png`
- Marquee promo tile (1400×560, optional): `store/promo-marquee.png`

**Official URL:** leave as None (it only lists domains you've verified in Google Search Console).
**Homepage URL:** https://github.com/ameersameerkhan/blinders
**Support URL:** https://github.com/ameersameerkhan/blinders/issues

## Privacy practices tab

**Single purpose:**
Blinders blocks websites the user chooses for the length of a focus session the user starts, redirecting them to a page inside the extension.

**Permission justifications:**

- **declarativeNetRequest:** Used to redirect requests to sites on the user's block list to the extension's block page while a focus session is running. Rules are created only from the list the user controls.
- **Host permissions (<all_urls>):** Chrome requires host access for declarativeNetRequest redirect rules, and the user can add any website to their block list. Host access is also used to read the current tab's address for the "Block site" button, to reload already-open tabs on blocked sites when a session starts, and to remember the last non-blocked page in each tab (in session storage, cleared when Chrome closes) so the block page can offer a "Return to" button. Page content is never read and nothing is transmitted.
- **scripting:** While a focus session is running, registers a one-line content script that matches only the sites on the user's block list and replaces the page with the extension's block page. This is needed because sites with a service worker (for example x.com) can serve navigations from cache, which declarativeNetRequest does not see. The script reads no page content and is unregistered when the session ends.
- **storage:** Saves the user's block list, preferred session length, current session state, and a daily count of blocked visits.
- **alarms:** Ends timed focus sessions on schedule and updates the countdown on the toolbar badge once a minute.

**Remote code:** No, I am not using remote code.

**Data usage:** Check none of the data types. Blinders does not collect or transmit user data.

Certify all three disclosures:
- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/ameersameerkhan/blinders/blob/main/PRIVACY.md

## Distribution tab

- Visibility: Public
- Regions: All regions
- Pricing: Free

## Notes

- Broad host permissions usually mean an in-depth review. Plan for a few days to a couple of weeks.
- Upload `dist/blinders-<version>.zip` from `./scripts/package.sh`. Bump `version` in `manifest.json` for every new upload.
