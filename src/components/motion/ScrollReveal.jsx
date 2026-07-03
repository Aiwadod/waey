import { motion, useReducedMotion } from "framer-motion";
import { easeOut, revealItem, viewportOnce } from "../../motion/presets.js";

export default function ScrollReveal({ as = "div", children, delay = 0, className, style }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;

  if (reduce) {
    return (
      <MotionTag className={className} style={style}>
        {children}
      </MotionTag>
    );
  }

  return (
    <MotionTag
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={revealItem}
      transition={{ duration: 0.42, delay, ease: easeOut }}
    >
      {children}
    </MotionTag>
  );
}
