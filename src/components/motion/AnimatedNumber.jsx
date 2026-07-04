import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { easeOut } from "../../motion/presets.js";

// Counts up from `from` to `value` the first time it scrolls into view, then
// animates on any later value change. Respects reduced motion (snaps to value).
export default function AnimatedNumber({ value, formatter = Math.round, duration = 1, from = 0 }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const latest = useRef(from);
  const started = useRef(false);
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const target = Number(value) || 0;

    if (reduce) {
      latest.current = target;
      setDisplay(target);
      return undefined;
    }

    // Hold at `from` until the number is first seen; after that, follow value changes.
    if (!started.current && !inView) return undefined;
    started.current = true;

    const controls = animate(latest.current, target, {
      duration,
      ease: easeOut,
      onUpdate(next) {
        latest.current = next;
        setDisplay(next);
      },
    });

    return () => controls.stop();
  }, [value, reduce, inView, duration]);

  return <span ref={ref}>{formatter(display)}</span>;
}
