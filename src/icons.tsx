import React from "react";

type IconProps = { size?: number; color?: string; style?: React.CSSProperties };

function Icon({ children, size = 16, color = "currentColor", style }: IconProps & { children: React.ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">{children}</svg>;
}

export function Plus(props: IconProps) { return <Icon {...props}><path d="M12 5v14M5 12h14" /></Icon>; }
export function Trash2(props: IconProps) { return <Icon {...props}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6" /></Icon>; }
export function X(props: IconProps) { return <Icon {...props}><path d="m6 6 12 12M18 6 6 18" /></Icon>; }
export function Download(props: IconProps) { return <Icon {...props}><path d="M12 3v12M7 10l5 5 5-5M4 21h16" /></Icon>; }
export function Copy(props: IconProps) { return <Icon {...props}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></Icon>; }
export function Check(props: IconProps) { return <Icon {...props}><path d="m5 12 4 4L19 6" /></Icon>; }
export function Boxes(props: IconProps) { return <Icon {...props}><path d="m7 3 5 3 5-3 4 2v6l-4 2-5-3-5 3-4-2V5l4-2ZM3 13v6l4 2 5-3 5 3 4-2v-6M12 6v6M7 9v6M17 9v6" /></Icon>; }
export function ChevronRight(props: IconProps) { return <Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>; }
export function Info(props: IconProps) { return <Icon {...props}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Icon>; }
