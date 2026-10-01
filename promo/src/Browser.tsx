import { C, MONO, SANS } from "./theme";
import { Mark } from "./Mark";

// A minimal Chrome-like window: one tab, an address bar, and a content area.
export const Browser: React.FC<{
  width: number;
  height: number;
  tabTitle: string;
  tabIcon?: React.ReactNode;
  url: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, tabTitle, tabIcon, url, children, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 14,
      overflow: "hidden",
      background: "#1d1c1a",
      border: `1px solid ${C.line}`,
      boxShadow: "0 40px 120px rgba(0,0,0,0.55)",
      display: "flex",
      flexDirection: "column",
      fontFamily: SANS,
      ...style,
    }}
  >
    <div style={{ height: 46, display: "flex", alignItems: "flex-end", padding: "0 16px", gap: 10, background: "#161514" }}>
      <div style={{ display: "flex", gap: 8, alignSelf: "center", marginRight: 12 }}>
        {["#3a3632", "#3a3632", "#3a3632"].map((c, i) => (
          <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
        ))}
      </div>
      <div
        style={{
          height: 36,
          width: 300,
          borderRadius: "10px 10px 0 0",
          background: "#1d1c1a",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 14px",
          color: C.text2,
          fontSize: 14,
          whiteSpace: "nowrap",
          overflow: "hidden",
        }}
      >
        {tabIcon}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{tabTitle}</span>
      </div>
    </div>
    <div style={{ height: 52, display: "flex", alignItems: "center", gap: 14, padding: "0 16px", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ color: C.text3, fontSize: 18, letterSpacing: 6 }}>‹ ›</span>
      <div
        style={{
          flex: 1,
          height: 34,
          borderRadius: 17,
          background: "#262421",
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          color: C.text,
          fontSize: 16,
        }}
      >
        {url}
      </div>
      <Mark size={22} />
    </div>
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);

export const Caret: React.FC<{ frame: number }> = ({ frame }) => (
  <span style={{ display: "inline-block", width: 2, height: 20, marginLeft: 2, background: C.accent, opacity: Math.floor(frame / 8) % 2 ? 0 : 1 }} />
);

export const Favicon: React.FC<{ letter: string; color?: string }> = ({ letter, color = C.surface2 }) => (
  <span
    style={{
      width: 18,
      height: 18,
      borderRadius: 5,
      background: color,
      color: C.text2,
      fontSize: 11,
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
      fontFamily: MONO,
      textTransform: "uppercase",
    }}
  >
    {letter}
  </span>
);
