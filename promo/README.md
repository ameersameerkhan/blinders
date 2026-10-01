# Blinders launch video

A 30-second, 1080p promo made with [Remotion](https://www.remotion.dev). The scene cuts are timed to the beat of the soundtrack, which was generated with Google's Lyria 3 Clip.

```bash
cd promo
npm install
npm run studio   # preview and scrub in the browser
npm run render   # writes out/blinders-promo.mp4
```

- `src/Promo.tsx` holds the scenes and their timing, in beats.
- `src/BlockPage.tsx` is the extension's block page, rebuilt so its ring can animate.
- `public/popup-*.png` are real captures of the popup. To refresh them after UI changes, run `node promo/scripts/capture.js` from the repo root.
