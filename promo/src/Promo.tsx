import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BlockPage } from "./BlockPage";
import { Browser, Caret, Favicon } from "./Browser";
import { Mark } from "./Mark";
import { C, DURATION, MONO, SANS, beat, clamp, ease, pop, rise, settle } from "./theme";

// Scene boundaries, in beats. The drop lands on beat 24.
const SCENES = [
  { from: 0, to: 5, Scene: Hook },
  { from: 5, to: 12, Scene: Spiral },
  { from: 12, to: 20, Scene: Insight },
  { from: 20, to: 24, Scene: Slit },
  { from: 24, to: 28, Scene: Reveal },
  { from: 28, to: 36, Scene: Start },
  { from: 36, to: 44, Scene: Blocked },
  { from: 44, to: 52, Scene: Features },
  { from: 52, to: null, Scene: EndCard },
];

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, color: C.text }}>
    <Audio src={staticFile("music.mp3")} volume={(f) => interpolate(f, [0, 4, DURATION - 20, DURATION], [0, 1, 1, 0], clamp)} />
    {SCENES.map(({ from, to, Scene }) => {
      const start = beat(from);
      const end = to === null ? DURATION : beat(to);
      return (
        <Sequence key={from} from={start} durationInFrames={end - start}>
          <Scene b={(n: number) => beat(from + n) - start} length={end - start} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);

type SceneProps = { b: (n: number) => number; length: number };

const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", textAlign: "center", ...style }}>{children}</AbsoluteFill>
);

const headline: React.CSSProperties = { fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1.02 };

function fadeOut(frame: number, length: number, frames = 8) {
  return interpolate(frame, [length - frames, length], [1, 0], clamp);
}

// 1. "You open YouTube for a second."
function Hook({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  const words = ["You", "open", "YouTube"];
  return (
    <Center style={{ opacity: fadeOut(f, length) }}>
      <div style={{ ...headline, fontSize: 128 }}>
        {words.map((w, i) => (
          <span key={w} style={{ display: "inline-block", marginRight: 30, ...rise(f, b(i) , 50) }}>
            {w}
          </span>
        ))}
      </div>
      <div style={{ ...headline, fontSize: 128, color: C.accent, ...rise(f, b(3), 50) }}>“for a second.”</div>
    </Center>
  );
}

// 2. Forty minutes later: tabs pile up while the clock runs.
const TABS = ["youtube.com", "x.com", "reddit.com", "instagram.com", "youtube.com", "news.com", "reddit.com", "x.com", "youtube.com", "linkedin.com", "tiktok.com", "reddit.com", "youtube.com", "x.com"];
function Spiral({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  const shown = Math.max(1, Math.min(TABS.length, Math.floor(interpolate(f, [6, 86], [1, TABS.length + 0.99], clamp))));
  const seconds = interpolate(f, [4, 92], [0, 2400], { ...clamp, easing: (t) => t * t });
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(Math.floor(seconds % 60)).padStart(2, "0");
  return (
    <Center style={{ opacity: fadeOut(f, length) }}>
      <div style={{ ...headline, fontSize: 104, ...rise(f, 0, 40) }}>Forty minutes later.</div>
      <div style={{ fontFamily: MONO, fontSize: 40, fontWeight: 300, color: C.text3, marginTop: 24, ...rise(f, b(1), 20) }}>
        {mm}:{ss}
      </div>
      <div style={{ display: "flex", gap: 6, width: 1500, marginTop: 70, height: 52, ...rise(f, 4, 30) }}>
        {TABS.slice(0, shown).map((t, i) => {
          const s = pop(f, 6 + i * 6);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                minWidth: 0,
                height: 52,
                borderRadius: "12px 12px 0 0",
                background: i === shown - 1 ? C.surface2 : C.surface,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 14px",
                fontSize: 17,
                color: C.text2,
                overflow: "hidden",
                whiteSpace: "nowrap",
                transform: `translateY(${(1 - s) * 30}px)`,
                opacity: s,
              }}
            >
              <Favicon letter={t[0]} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{t}</span>
            </div>
          );
        })}
      </div>
    </Center>
  );
}

// 3. "It's not willpower. It's a missing pause."
function Insight({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  const swap = b(4);
  const out = interpolate(f, [swap - 6, swap + 4], [0, 1], { ...clamp, easing: ease });
  return (
    <Center style={{ opacity: fadeOut(f, length, 6) }}>
      <div style={{ position: "relative", height: 140, width: 1600 }}>
        <div style={{ ...headline, fontSize: 112, position: "absolute", inset: 0, ...rise(f, 0, 40), opacity: rise(f, 0).opacity * (1 - out), transform: `translateY(${-out * 50}px)` }}>
          It's not willpower.
        </div>
        <div style={{ ...headline, fontSize: 112, position: "absolute", inset: 0, ...rise(f, swap, 50) }}>
          It's a missing <span style={{ color: C.accent }}>pause.</span>
        </div>
      </div>
    </Center>
  );
}

// 4. A sliver of light opens, then narrows into the mark.
function Slit({ length }: SceneProps) {
  const f = useCurrentFrame();
  const grow = interpolate(f, [0, 26], [0, 1], { ...clamp, easing: ease });
  const shape = interpolate(f, [28, length], [0, 1], { ...clamp, easing: (t) => t * t * (3 - 2 * t) });
  const width = interpolate(shape, [0, 1], [4, 49]);
  const height = interpolate(shape, [0, 1], [grow * 760, 151]);
  return (
    <Center>
      <div style={{ width, height, borderRadius: 99, background: C.accent }} />
    </Center>
  );
}

// 5. The drop: the mark lands, then the name and the promise.
function Reveal({ b }: SceneProps) {
  const f = useCurrentFrame();
  const land = pop(f, 0);
  const slide = settle(f, b(1));
  const size = interpolate(slide, [0, 1], [260, 150]);
  const word = interpolate(slide, [0, 1], [0, 1]);
  return (
    <Center>
      <div style={{ display: "flex", alignItems: "center", gap: interpolate(word, [0, 1], [0, 44]) }}>
        <div style={{ transform: `scale(${interpolate(land, [0, 1], [0.6, 1])})` }}>
          <Mark size={size} slit={C.accent} style={{ background: `rgba(0,0,0,${land})` }} />
        </div>
        <div style={{ ...headline, fontSize: 170, letterSpacing: "-0.05em", maxWidth: word * 700, overflow: "hidden", whiteSpace: "nowrap", opacity: word }}>
          blinders
        </div>
      </div>
      <div style={{ fontSize: 46, color: C.text2, marginTop: 50, letterSpacing: "-0.02em", ...rise(f, b(2), 30) }}>
        Put blinders on the sites that steal your <span style={{ color: C.text }}>focus.</span>
      </div>
    </Center>
  );
}

// 6. Pick a length, hit start: the real popup, clicked.
function Start({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  const scale = 1.25;
  const popup = { left: 1210, top: 170, width: 320 * scale };
  const target = { x: popup.left + 160 * scale, y: popup.top + 176 * scale };
  const click = b(3);
  const move = interpolate(f, [b(1), click - 4], [0, 1], { ...clamp, easing: ease });
  const leave = interpolate(f, [click + 10, click + 40], [0, 1], { ...clamp, easing: ease });
  const cursor = {
    x: interpolate(move, [0, 1], [1780, target.x]) + leave * 160,
    y: interpolate(move, [0, 1], [1040, target.y]) + leave * 260,
  };
  const press = interpolate(f, [click - 2, click + 1, click + 6], [0, 1, 0], clamp);
  const on = interpolate(f, [click, click + 6], [0, 1], clamp);
  const badge = pop(f, click + 2);
  return (
    <AbsoluteFill style={{ opacity: fadeOut(f, length, 6) }}>
      <div style={{ position: "absolute", left: 160, top: 360 }}>
        <div style={{ ...headline, fontSize: 112, ...rise(f, 0, 40) }}>Pick a length.</div>
        <div style={{ ...headline, fontSize: 112, color: C.accent, ...rise(f, b(1), 40) }}>Hit start.</div>
        <div style={{ fontSize: 34, color: C.text2, marginTop: 34, letterSpacing: "-0.01em", ...rise(f, click + 8, 20) }}>
          Every site on your list waits until you're done.
        </div>
      </div>

      {/* Toolbar with the Blinders icon */}
      <div style={{ position: "absolute", left: popup.left - 40, top: 84, width: popup.width + 80, height: 64, borderRadius: 14, background: C.surface, border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 18, padding: "0 22px", ...rise(f, 2, 20) }}>
        <span style={{ width: 22, height: 22, borderRadius: 11, background: C.surface2 }} />
        <span style={{ width: 22, height: 22, borderRadius: 11, background: C.surface2 }} />
        <div style={{ position: "relative" }}>
          <Mark size={30} slit={on ? C.accent : "#9a948b"} />
          <div style={{ position: "absolute", right: -16, bottom: -10, fontFamily: MONO, fontSize: 13, fontWeight: 500, background: C.accent, color: C.onAccent, borderRadius: 5, padding: "1px 5px", transform: `scale(${badge})` }}>60m</div>
        </div>
      </div>

      {/* The popup itself: real screenshots, crossfaded on click */}
      <div style={{ position: "absolute", left: popup.left, top: popup.top, width: popup.width, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.line}`, boxShadow: "0 40px 100px rgba(0,0,0,.6)", ...rise(f, 4, 30) }}>
        <Img src={staticFile("popup-idle.png")} style={{ width: popup.width, display: "block", opacity: 1 - on }} />
        <Img src={staticFile("popup-active.png")} style={{ width: popup.width, display: "block", position: "absolute", top: 0, left: 0, opacity: on }} />
        <div style={{ position: "absolute", left: 16 * scale, top: 156 * scale, width: 288 * scale, height: 40 * scale, borderRadius: 10, background: "#fff", opacity: press * 0.18 * (1 - on) }} />
      </div>

      <Cursor x={cursor.x} y={cursor.y} press={press} opacity={interpolate(f, [b(1) - 2, b(1) + 4], [0, 1], clamp)} />
    </AbsoluteFill>
  );
}

const Cursor: React.FC<{ x: number; y: number; press?: number; opacity?: number }> = ({ x, y, press = 0, opacity = 1 }) => (
  <svg width="36" height="44" viewBox="0 0 18 22" style={{ position: "absolute", left: x - 3, top: y - 2, opacity, transform: `scale(${1 - press * 0.15})`, transformOrigin: "3px 2px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,.5))" }}>
    <path d="M1.5 1.5 L1.5 17 L5.5 13.2 L8.3 19.5 L10.9 18.4 L8.2 12.3 L13.6 12.3 Z" fill="#fff" stroke="#000" strokeWidth="1.1" strokeLinejoin="round" />
  </svg>
);

// 7. Muscle memory types youtube.com. Blinders answers, then sends you back to work.
function Blocked({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  const typed = "youtube.com";
  const typeStart = 8;
  const chars = Math.max(0, Math.min(typed.length, Math.floor((f - typeStart) / 2)));
  const enter = b(2);
  const blocked = f >= enter;
  const back = b(6) + 6;
  const done = f >= back;
  const draw = interpolate(f, [enter + 4, enter + 40], [0, 1], { ...clamp, easing: ease });
  const elapsed = 27 * 60 + (f - enter) / 30;
  const reveal = interpolate(f, [enter, enter + 10], [0, 1], clamp);
  const press = interpolate(f, [back - 8, back - 4, back], [0, 1, 0], clamp);
  const docIn = interpolate(f, [back, back + 10], [0, 1], { ...clamp, easing: ease });

  const url = done ? (
    <span>docs.google.com/document/<span style={{ color: C.text3 }}>q4-plan</span></span>
  ) : blocked ? (
    <span style={{ color: C.text2 }}>Blinders · youtube.com</span>
  ) : (
    <span>
      {typed.slice(0, chars)}
      <Caret frame={f} />
    </span>
  );

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fadeOut(f, length, 6) }}>
      <div style={{ position: "absolute", top: 46, fontFamily: MONO, fontSize: 24, color: C.text3, ...rise(f, 0, 14) }}>27 minutes into a focus session</div>
      <Browser
        width={1560}
        height={900}
        style={{ marginTop: 70, ...rise(f, 0, 30) }}
        tabTitle={done ? "Q4 plan · Google Docs" : blocked ? "youtube.com can wait · Blinders" : "New Tab"}
        tabIcon={done ? <Favicon letter="D" color="#2f4a6b" /> : blocked ? <Mark size={18} /> : undefined}
        url={url}
      >
        {!blocked && <AbsoluteFill style={{ background: "#1d1c1a" }} />}
        {blocked && !done && (
          <div style={{ position: "absolute", inset: 0, opacity: reveal, transform: `scale(${interpolate(reveal, [0, 1], [0.985, 1])})` }}>
            <BlockPage site="youtube.com" progress={0.45 * draw} remaining={60 * 60 - elapsed} endsAt="3:40 PM" returnTo="docs.google.com" pressed={press} skipped={3} />
          </div>
        )}
        {done && <Doc t={docIn} />}
      </Browser>
      <Cursor
        x={interpolate(f, [b(4), back - 8], [1500, 820], { ...clamp, easing: ease })}
        y={interpolate(f, [b(4), back - 8], [1000, 790], { ...clamp, easing: ease })}
        press={press}
        opacity={interpolate(f, [b(4), b(4) + 6, back + 14, back + 22], [0, 1, 1, 0], clamp)}
      />
    </AbsoluteFill>
  );
}

const Doc: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: "#f4f1ec", alignItems: "center", paddingTop: 60, opacity: t }}>
    <div style={{ width: 760, height: 900, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,.08)", padding: "64px 72px", transform: `translateY(${(1 - t) * 20}px)` }}>
      <div style={{ fontSize: 34, fontWeight: 600, color: "#1c1a17", letterSpacing: "-0.02em", marginBottom: 28 }}>Q4 plan</div>
      {[0.92, 0.84, 0.96, 0.6, 0, 0.88, 0.94, 0.7, 0, 0.9, 0.82, 0.45].map((w, i) => (
        <div key={i} style={{ height: 12, width: `${w * 100}%`, background: w ? "#e4e0da" : "transparent", borderRadius: 6, marginBottom: 16 }} />
      ))}
    </div>
  </AbsoluteFill>
);

// 8. The features, each taking the spotlight in turn.
const FEATURES = ["Block any site in one click.", "Quit early? Hold for three seconds.", "One button back to your work.", "Nothing leaves your browser."];
function Features({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 200, opacity: fadeOut(f, length, 6) }}>
      {FEATURES.map((text, i) => {
        const at = b(i * 2);
        const next = i < FEATURES.length - 1 ? b(i * 2 + 2) : null;
        const dim = next === null ? 0 : interpolate(f, [next - 2, next + 6], [0, 1], clamp);
        const visible = f >= at - 1;
        return (
          <div key={text} style={{ display: "flex", alignItems: "baseline", gap: 36, margin: "18px 0", opacity: visible ? 1 : 0, ...(visible ? rise(f, at, 36, 12) : {}) }}>
            <span style={{ fontFamily: MONO, fontSize: 30, color: dim ? C.text3 : C.accent, width: 50 }}>0{i + 1}</span>
            <span style={{ ...headline, fontSize: 84, color: dim > 0.5 ? C.text3 : C.text }}>{text}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

// 9. Sign-off.
function EndCard({ b, length }: SceneProps) {
  const f = useCurrentFrame();
  const land = pop(f, 0);
  return (
    <Center style={{ opacity: interpolate(f, [length - 14, length], [1, 0], clamp) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36, transform: `scale(${interpolate(land, [0, 1], [0.9, 1])})`, opacity: land }}>
        <Mark size={128} />
        <div style={{ ...headline, fontSize: 150, letterSpacing: "-0.05em" }}>blinders</div>
      </div>
      <div style={{ fontSize: 48, marginTop: 46, letterSpacing: "-0.02em", ...rise(f, b(1), 24) }}>
        Free on the <span style={{ color: C.accent }}>Chrome Web Store</span>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 26, color: C.text3, marginTop: 22, ...rise(f, b(2), 18) }}>Open source · No account · No tracking</div>
    </Center>
  );
}
