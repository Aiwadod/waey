import { useId, useRef } from "react";
import { useGsap } from "../../motion/gsap.js";

const lines = [
  "M40 120 C180 20 320 210 500 92 S800 34 960 155",
  "M18 300 C150 210 270 410 430 300 S720 214 918 366",
  "M110 520 C280 430 460 610 640 492 S850 450 980 548",
];

const dots = [
  [120, 126],
  [318, 204],
  [520, 96],
  [680, 310],
  [850, 160],
  [228, 472],
  [590, 520],
  [900, 486],
];

export default function WaeyFlowField({ tone = "light" }) {
  const scope = useRef(null);
  // Correction #5: unique filter id per instance so multiple fields don't collide.
  const rawId = useId();
  const blurId = `waey-flow-blur-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useGsap(scope, (gsap, { reduce }) => {
    if (reduce) {
      gsap.set(".waey-flow-line", { opacity: 0.3 });
      gsap.set(".waey-flow-dot", { opacity: 0.48 });
      return;
    }

    // pathLength=1 on the paths makes the draw-on exact regardless of geometry.
    gsap.fromTo(
      ".waey-flow-line",
      { strokeDashoffset: 1, opacity: 0.08 },
      { strokeDashoffset: 0, opacity: 0.42, duration: 1.4, stagger: 0.18, ease: "power3.out" },
    );

    // Finite drift (~30s), then the field settles: long-running ambient motion
    // must stop on its own (WCAG 2.2.2) and stop costing battery.
    gsap.to(".waey-flow-dot", {
      y: -10,
      opacity: 0.85,
      duration: 1.9,
      stagger: 0.16,
      repeat: 15,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, []);

  const stroke = tone === "dark" ? "rgba(168,166,242,0.42)" : "rgba(111,109,208,0.30)";
  const dot = tone === "dark" ? "rgba(95,203,142,0.72)" : "rgba(46,158,104,0.55)";
  const orb = tone === "dark" ? "rgba(202,108,70,0.16)" : "rgba(194,96,58,0.14)";

  return (
    <div ref={scope} className="waey-flow-field" aria-hidden="true">
      <svg viewBox="0 0 1000 620" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id={blurId}>
            <feGaussianBlur stdDeviation="18" />
          </filter>
        </defs>
        <circle className="waey-flow-orb" cx="210" cy="170" r="120" fill={orb} filter={`url(#${blurId})`} />
        <circle className="waey-flow-orb" cx="775" cy="455" r="145" fill={orb} filter={`url(#${blurId})`} />
        {lines.map((d) => (
          <path
            key={d}
            className="waey-flow-line"
            d={d}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
          />
        ))}
        {dots.map(([cx, cy]) => (
          <circle key={`${cx}-${cy}`} className="waey-flow-dot" cx={cx} cy={cy} r="5" fill={dot} />
        ))}
      </svg>
    </div>
  );
}
