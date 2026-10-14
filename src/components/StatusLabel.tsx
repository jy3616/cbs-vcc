import { postingStatus, statusText, todayET } from "@/lib/status";

export function StatusLabel({ p, className = "" }: { p: { deadline: string; rolling: boolean; expired: boolean }; className?: string }) {
  const s = postingStatus(p, todayET());
  const tone =
    s.kind === "open" ? "bg-secondary text-secondary-foreground"
    : s.kind === "closing" ? "bg-warning text-warning-foreground font-semibold"
    : "text-destructive font-bold";
  return <span className={`rounded px-2 py-0.5 text-xs ${tone} ${className}`}>{statusText(s)}</span>;
}
