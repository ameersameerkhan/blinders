import { loadFont } from "@remotion/fonts";
import { Easing, interpolate, spring, staticFile } from "remotion";

loadFont({ family: "Geist", url: staticFile("Geist.woff2"), weight: "300 700" });
loadFont({ family: "Geist Mono", url: staticFile("GeistMono.woff2"), weight: "300 500" });

export const FPS = 30;
export const DURATION = 924; // the music runs 30.8s

export const C = {
  bg: "#0f0e0d",
  surface: "#1c1a18",
  surface2: "#262321",
  line: "#2e2b28",
  text: "#efebe5",
  text2: "#a49e95",
  text3: "#857f77",
  accent: "#f0b44c",
  onAccent: "#1e1609",
};

export const SANS = "Geist, -apple-system, sans-serif";
export const MONO = "'Geist Mono', ui-monospace, monospace";

// The track is ~115 BPM with its first downbeat at 0.407s and the drop on beat 24.
const BEAT_S = 0.522;
const FIRST_BEAT_S = 0.407;
export const beat = (n: number) => Math.round((FIRST_BEAT_S + n * BEAT_S) * FPS);

export const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Fade and lift an element in, starting at frame `at`.
export const rise = (frame: number, at: number, distance = 40, duration = 16) => {
  const t = interpolate(frame, [at, at + duration], [0, 1], { ...clamp, easing: ease });
  return { opacity: t, transform: `translateY(${(1 - t) * distance}px)` };
};

export const pop = (frame: number, at: number, fps = FPS) =>
  spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 180, mass: 0.6 } });

export const settle = (frame: number, at: number, fps = FPS) =>
  spring({ frame: frame - at, fps, config: { damping: 200 } });
