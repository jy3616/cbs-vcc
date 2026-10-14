import { Link } from "@tanstack/react-router";
import cbsLogo from "@/assets/cbs-logo.svg";
import vccLogo from "@/assets/vcc-club-logo.png.asset.json";

type Props = {
  /** "lg" for the job board header, "md" for narrower cards. */
  size?: "md" | "lg";
  /** When true the whole lockup is a link back to the job board. */
  asLink?: boolean;
};

export function BrandLockup({ size = "lg", asLink = true }: Props) {
  const cbs = size === "lg" ? "h-16 w-16" : "h-14 w-14";
  const badge = size === "lg" ? "h-16" : "h-14";
  const divider = size === "lg" ? "h-14" : "h-12";

  const inner = (
    <>
      <img src={cbsLogo} alt="Columbia Business School logo" className={cbs} />
      <span className={`hidden w-px bg-border sm:block ${divider}`} aria-hidden="true" />
      <img
        src={vccLogo.url}
        alt="Columbia Venture Capital Club logo"
        className={`w-auto rounded-md ring-1 ring-border ${badge}`}
      />
    </>
  );

  if (!asLink) {
    return <div className="flex flex-wrap items-center gap-4">{inner}</div>;
  }

  return (
    <Link
      to="/board"
      title="Go to the job board"
      aria-label="Go to the job board"
      className="flex flex-wrap items-center gap-4 rounded-md hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {inner}
    </Link>
  );
}
