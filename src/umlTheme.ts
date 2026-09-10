// @ts-nocheck
export const T = {
  bg: "#0b0e14",
  bgDot: "#161c2a",
  panel: "#12161f",
  panel2: "#171c28",
  panel3: "#1c2230",
  border: "#242b3d",
  borderSoft: "#1a2030",
  text: "#e5e8f0",
  textDim: "#8891a5",
  textFaint: "#5c6479",
  amber: "#e8a33d",
  amberSoft: "rgba(232,163,61,0.12)",
  danger: "#e2687a",
  sans: "'Manrope', -apple-system, BlinkMacSystemFont, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
};

export const btnStyle = (filled: boolean, accentColor?: string) => {
  const color = accentColor || T.amber;
  return {
    display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, padding: "7px 13px",
    borderRadius: 7, cursor: "pointer", fontFamily: T.sans, border: `1px solid ${color}`,
    background: filled ? color : "transparent", color: filled ? "#1a1206" : color, whiteSpace: "nowrap",
  };
};
