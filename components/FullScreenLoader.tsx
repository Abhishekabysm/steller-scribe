import React from "react";
import { motion } from "framer-motion";

/**
 * Minimal full-black loading screen with typing animation for brand text.
 */
const letters = "Stellar Scribe".split("");

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 }
  }
};

const letter = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const FullScreenLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50 select-none">
      <motion.div
        className="text-white text-2xl sm:text-3xl font-light font-mono flex"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {letters.map((l, i) => (
          <motion.span key={i} variants={letter} className="inline-block">
            {l === " " ? "\u00A0" : l}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
};

export default FullScreenLoader;
