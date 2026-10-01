# Launch kit

Post these once the store listing is live and you have the link. Replace `<store link>` everywhere. Everything here talks about the product only.

## Video

The 30-second launch video is rendered from `promo/` (`npm run render` writes `promo/out/blinders-promo.mp4`). For the store, upload it to YouTube (unlisted is fine) and paste the link into the listing's video field.

## LinkedIn (main post)

> Most distraction isn't a decision. You open YouTube "for a second" and surface forty minutes later.
>
> I built Blinders to add the half-second of friction that's missing. It's now on the Chrome Web Store.
>
> → Pick a session length and hit start
> → Distracting sites show a calm "youtube.com can wait." page with a countdown
> → One button takes you straight back to what you were working on
> → Quitting early takes a 3-second hold, usually long enough to change your mind
>
> Free, open source, no account, and nothing leaves your browser.
>
> Link in the first comment. I'd love to hear what you'd add.

**First comment:** `Chrome Web Store: <store link> · Code: https://github.com/ameersameerkhan/blinders`

Attach the video. Links in the post body tend to reduce reach on LinkedIn, so keep the link in the first comment.

## X

> You open YouTube "for a second." Forty minutes later…
>
> Blinders is a calm, private site blocker for Chrome: timed focus sessions, a "can wait" page that sends you back to work, and a 3-second hold to quit early.
>
> Free and open source. <store link>

Attach the video. Reply to your own post with the GitHub link.

## Show HN (optional)

**Title:** Show HN: Blinders – a minimal, open-source site blocker for Chrome

> Blinders is a small Chrome extension that blocks the sites on your list for the length of a focus session.
>
> It's about 750 lines of plain JS on Manifest V3 with no build step. Blocking is a single declarativeNetRequest redirect rule using requestDomains, so matching happens inside Chrome. Sites whose service worker serves pages from cache (x.com, for example) bypass declarativeNetRequest, so while a session runs, a one-line content script registered only for blocked sites catches those. Timed sessions use chrome.alarms, and ending one early takes a 3-second hold.
>
> No analytics, no network requests, no account.
>
> Store: <store link>
> Code: https://github.com/ameersameerkhan/blinders

Post on a weekday morning, US Eastern time, and stay around to reply for the first couple of hours.

## Reddit (optional)

Read each subreddit's self-promotion rules first. Lead with what the product does, not the link.

- **r/productivity:** what makes a blocker stick (a pause before quitting, a page that sends you back to work), then the link.
- **r/chrome_extensions** and **r/SideProject:** short post with the video.

## Launch-day checklist

- [x] Rename the GitHub repo to `blinders`
- [ ] Store listing approved
- [ ] Publish, then replace "Coming soon" in the README with the store link
- [ ] Video on YouTube and linked in the store listing
- [ ] LinkedIn post with the video, store link in the first comment; X post the same day
