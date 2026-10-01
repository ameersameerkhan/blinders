import { AbsoluteFill } from "remotion";
import { Mark } from "./Mark";
import { C, MONO, SANS } from "./theme";

// 1280×720 cover image for YouTube and social posts.
export const Thumbnail: React.FC = () => {
  const r = 96;
  const progress = 0.45;
  const angle = progress * 2 * Math.PI;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, color: C.text, padding: "0 90px", flexDirection: "row", alignItems: "center", gap: 70 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 46 }}>
          <Mark size={52} />
          <span style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>blinders</span>
        </div>
        <div style={{ fontSize: 112, fontWeight: 600, letterSpacing: "-0.05em", lineHeight: 0.98 }}>
          <span style={{ color: C.accent }}>YouTube</span>
          <br />
          can wait.
        </div>
      </div>
      <div style={{ position: "relative", width: 400, height: 400 }}>
        <svg viewBox="0 0 200 200" width={400} height={400} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <circle cx="100" cy="100" r={r} fill="none" stroke="#2a2723" strokeWidth={1.4} />
          <circle cx="100" cy="100" r={r} fill="none" stroke={C.accent} strokeWidth={1.4} strokeLinecap="round" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - progress * 100} transform="rotate(-90 100 100)" />
          <circle cx={100 + r * Math.sin(angle)} cy={100 - r * Math.cos(angle)} r={3.6} fill={C.accent} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: MONO, fontSize: 72, fontWeight: 300, letterSpacing: "-0.04em" }}>
            32<span style={{ margin: "0 -0.14em", position: "relative", top: "-0.06em" }}>:</span>58
          </div>
          <div style={{ fontSize: 20, color: C.text3, marginTop: 10 }}>remaining</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
