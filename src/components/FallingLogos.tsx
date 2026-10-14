import { useMemo } from "react";
import cbsMark from "@/assets/cbs-mark-small.png.asset.json";

const COUNT = 40;

export function FallingLogos() {
  const drops = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        left: (i * 97.3) % 100,
        delay: ((i * 0.37) % 2.4).toFixed(2),
        duration: (3.6 + ((i * 0.53) % 2.2)).toFixed(2),
        size: 22 + ((i * 13) % 18),
      })),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {drops.map((d, i) => (
        <img
          key={i}
          src={cbsMark.url}
          alt=""
          className="absolute top-0"
          style={{
            left: `${d.left}%`,
            width: d.size,
            animation: `logo-fall ${d.duration}s linear ${d.delay}s both`,
          }}
        />
      ))}
    </div>
  );
}
