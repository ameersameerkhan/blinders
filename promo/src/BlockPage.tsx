import { C, MONO, SANS } from "./theme";
import { Mark } from "./Mark";

const clock = (s: number) => {
  const t = Math.max(0, Math.floor(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

// The real block page, rebuilt so its ring and countdown can animate.
export const BlockPage: React.FC<{
  site: string;
  progress: number; // 0..1 of the session elapsed
  remaining: number; // seconds
  endsAt: string;
  returnTo: string;
  pressed?: number; // 0..1 press depth on the primary button
  skipped: number;
}> = ({ site, progress, remaining, endsAt, returnTo, pressed = 0, skipped }) => {
  const size = 300;
  const r = 96;
  const angle = progress * 2 * Math.PI;
  const dot = { x: 100 + r * Math.sin(angle), y: 100 - r * Math.cos(angle) };
  const [mm, ss] = clock(remaining).split(":");
  return (
    <div style={{ position: "absolute", inset: 0, background: C.bg, color: C.text, fontFamily: SANS, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 30px", fontSize: 14, color: C.text2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: C.text, fontWeight: 600, fontSize: 16 }}>
          <Mark size={20} />
          blinders
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent }} />
          Focus session · ends <span style={{ fontFamily: MONO }}>{endsAt}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: -30 }}>
        <div style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }}>
          <span style={{ color: C.accent }}>{site}</span> can wait.
        </div>
        <div style={{ position: "relative", width: size, height: size, margin: "34px 0 40px" }}>
          <svg viewBox="0 0 200 200" width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
            <circle cx="100" cy="100" r={r} fill="none" stroke="#24211e" strokeWidth={1} />
            <circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={C.accent}
              strokeWidth={1}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100 - progress * 100}
              transform="rotate(-90 100 100)"
            />
            <circle cx={dot.x} cy={dot.y} r={3} fill={C.accent} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 46, fontWeight: 300, letterSpacing: "-0.04em", lineHeight: 1 }}>
              {mm}
              <span style={{ margin: "0 -0.14em", position: "relative", top: "-0.06em" }}>:</span>
              {ss}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: C.text3 }}>remaining</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: C.accent,
              color: C.onAccent,
              fontWeight: 600,
              fontSize: 16,
              padding: "12px 18px",
              borderRadius: 9,
              display: "flex",
              alignItems: "center",
              gap: 12,
              transform: `scale(${1 - pressed * 0.05})`,
              filter: `brightness(${1 + pressed * 0.12})`,
            }}
          >
            Return to {returnTo}
            <span style={{ fontFamily: MONO, fontSize: 12, border: "1px solid rgba(30,22,9,.3)", borderRadius: 4, padding: "0 5px" }}>↵</span>
          </div>
          <div style={{ color: C.text2, fontSize: 16, padding: "12px 16px" }}>Close tab</div>
        </div>
      </div>
      <div style={{ textAlign: "center", padding: 24, fontFamily: MONO, fontSize: 13, color: C.text3 }}>
        {skipped} distractions skipped today
      </div>
    </div>
  );
};
