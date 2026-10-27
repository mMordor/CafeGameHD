"use client";

import { motion } from "framer-motion";

export default function FloatingDecor() {
  return (
    <>

      <motion.span
        aria-hidden="true"
        className="absolute left-[38%] top-[22%] text-3xl text-white/80"
        animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✳
      </motion.span>

      <motion.span
        aria-hidden="true"
        className="absolute left-[7%] top-[35%] text-xl text-[#9d3916]"
        animate={{ rotate: [0, 25, 0], scale: [1, 1.15, 1] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        ✳
      </motion.span>
    </>
  );
}