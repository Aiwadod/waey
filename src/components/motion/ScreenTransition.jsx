import { motion, useReducedMotion } from "framer-motion";
import { easeOut, routeVariants } from "../../motion/presets.js";

// Enter-only route transition. We intentionally avoid AnimatePresence here:
// wrapping the stateful auth screens in AnimatePresence remounts their
// controlled inputs on the enter-completion re-render (resetting the login
// form). A keyed motion.div animates each screen in on mount and, because the
// `screen` key is stable while a screen is active, never remounts mid-screen.
export default function ScreenTransition({ screenKey, children }) {
  const reduce = useReducedMotion();

  if (reduce) return <>{children}</>;

  return (
    <motion.div
      key={screenKey}
      initial="hidden"
      animate="visible"
      variants={routeVariants}
      transition={{ duration: 0.28, ease: easeOut }}
      style={{ minHeight: "100dvh" }}
    >
      {children}
    </motion.div>
  );
}
