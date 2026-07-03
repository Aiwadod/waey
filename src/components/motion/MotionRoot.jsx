import { MotionConfig } from "framer-motion";
import { easeOut } from "../../motion/presets.js";

export default function MotionRoot({ children }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.22, ease: easeOut }}>
      {children}
    </MotionConfig>
  );
}
