import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useGsap } from "../../motion/gsap.js";
import { easeOut } from "../../motion/presets.js";

export default function MotionPage({ children, pageKey, className = "", style }) {
  const scope = useRef(null);
  const reduce = useReducedMotion();

  useGsap(scope, (gsap, { reduce: reduceGsap }) => {
    if (reduceGsap || !scope.current) return;
    const directChildren = Array.from(scope.current.children);
    const revealItems = directChildren.length === 1 && directChildren[0].children.length > 1
      ? Array.from(directChildren[0].children).slice(0, 18)
      : directChildren.slice(0, 18);
    gsap.from(revealItems, {
      y: 10,
      opacity: 0,
      stagger: 0.035,
      duration: 0.24,
      ease: "power3.out",
      clearProps: "transform,opacity",
    });
  }, [pageKey]);

  return (
    <motion.div
      ref={scope}
      key={pageKey}
      data-waey-motion-page
      className={`waey-motion-page ${className}`.trim()}
      initial={reduce ? false : { opacity: 0, transform: "translateY(8px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: reduce ? 0 : 0.24, ease: easeOut }}
      style={style}
    >
      {children}
    </motion.div>
  );
}
