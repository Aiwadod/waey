import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { easeOut, routeVariants } from "../../motion/presets.js";

export default function ScreenTransition({ screenKey, children }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screenKey}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={routeVariants}
        transition={{ duration: 0.28, ease: easeOut }}
        style={{ minHeight: "100dvh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
