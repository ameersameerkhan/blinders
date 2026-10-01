import { C } from "./theme";

// The Blinders mark: a narrow slit of light on a dark square.
export const Mark: React.FC<{ size: number; slit?: string; style?: React.CSSProperties }> = ({ size, slit = C.accent, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none",
      ...style,
    }}
  >
    <div style={{ width: size * 0.19, height: size * 0.58, borderRadius: size, background: slit }} />
  </div>
);
