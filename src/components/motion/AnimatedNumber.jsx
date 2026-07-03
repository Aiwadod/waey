import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { easeOut } from "../../motion/presets.js";

export default function AnimatedNumber({ value, formatter = Math.round, duration = 0.8 }) {
  const reduce = useReducedMotion();
  const latest = useRef(Number(value) || 0);
  const [display, setDisplay] = useState(latest.current);

  useEffect(() => {
    const target = Number(value) || 0;

    if (reduce) {
      latest.current = target;
      setDisplay(target);
      return undefined;
    }

    const controls = animate(latest.current, target, {
      duration,
      ease: easeOut,
      onUpdate(next) {
        latest.current = next;
        setDisplay(next);
      },
    });

    return () => controls.stop();
  }, [duration, reduce, value]);

  return <>{formatter(display)}</>;
}
