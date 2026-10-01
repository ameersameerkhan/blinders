# Privacy policy

_Last updated: October 1, 2026_

Blinders is a Chrome extension that blocks websites you choose while a focus session is running. It is built to collect as little as possible.

## What Blinders stores

- **Your block list** and your **preferred session length**. These are saved with Chrome's `storage.sync`, so Chrome may sync them to other browsers signed in to the same Google account. That sync is handled by Google under your Chrome sync settings.
- **Your current session** (whether one is running and when it ends) and a **daily count of blocked visits**. These are saved locally on your device only.
- **The last page in each tab that isn't on your block list**, so the block page can offer to take you back to it. This is kept in Chrome's temporary session storage on your device and is erased when Chrome closes or the tab closes.

## What Blinders does not do

- It does not collect, transmit, sell, or share any personal data or browsing history.
- It does not read the content of web pages.
- It makes no network requests. There are no analytics, ads, or third-party services.

## Permissions

- **declarativeNetRequest:** lets Chrome redirect blocked sites to the Blinders block page. Matching happens inside Chrome; Blinders never sees the requests.
- **Host access to all sites:** Chrome requires this before an extension can redirect a site. Blinders also uses it to check the address of your current tab (for "Block site"), of open tabs when a session starts (so it can block distracting tabs you already had open), and of each page you open (to remember where "Return to" should take you).
- **scripting:** while a session is running, adds a one-line script to the sites on your block list (and only those) that swaps the page for the block page. This catches sites like x.com that load from their own offline cache, which Chrome's blocking rules can't see. The script reads nothing from the page.
- **storage:** saves your list and settings as described above.
- **alarms:** ends timed sessions and updates the countdown on the toolbar badge.

## Contact

Questions or concerns: open an issue at https://github.com/ameersameerkhan/blinders/issues.
