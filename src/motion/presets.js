// Framer Motion presets for Waey.
// Correction #2: variants use INDEPENDENT motion values (x/y/scale/opacity/filter),
// never a `transform: "..."` string, so they compose cleanly with whileTap/whileHover.

export const easeOut = [0.23, 1, 0.32, 1];
export const easeInOut = [0.77, 0, 0.175, 1];
export const drawerEase = [0.32, 0.72, 0, 1];

export const viewportOnce = { once: true, amount: 0.24, margin: "0px 0px -80px 0px" };

export const routeVariants = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 16, scale: 0.985 },
  visible: { opacity: 1, filter: "blur(0px)", y: 0, scale: 1 },
  exit: { opacity: 0, filter: "blur(6px)", y: -10, scale: 0.99 },
};

export const revealContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
};

export const revealItem = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export const cardMotion = {
  initial: "hidden",
  whileInView: "visible",
  viewport: viewportOnce,
  variants: revealItem,
  transition: { duration: 0.42, ease: easeOut },
};

export const sheetVariants = {
  hidden: { opacity: 0, y: "100%", scale: 0.98 },
  visible: { opacity: 1, y: "0%", scale: 1 },
  exit: { opacity: 0, y: "100%", scale: 0.985 },
};

// Toast stays horizontally centered via style { left: "50%", x: "-50%" };
// these variants animate only y/opacity/scale so the centering is preserved.
export const toastVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 10, scale: 0.98 },
};

export const pressProps = {
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15, ease: easeOut },
};

// Hover lift for motion nodes (use instead of the CSS .waey-hover-lift class,
// which must not sit on the same node Framer animates — correction #2).
export const hoverLift = {
  whileHover: { y: -3, boxShadow: "0 24px 60px -34px rgba(15, 34, 48, 0.45)" },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.18, ease: easeOut },
};
