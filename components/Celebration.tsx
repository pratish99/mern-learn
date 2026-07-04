"use client";

import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 8 });

export default function Celebration({ id }: { id: number }) {
  return (
    <motion.div
      key={id}
      className="relative flex h-14 w-14 shrink-0 items-center justify-center"
      initial="hidden"
      animate="visible"
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 16 }}
        className="bg-success text-bg z-10 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
      >
        ✓
      </motion.div>
      {PARTICLES.map((_, i) => {
        const angle = (i / PARTICLES.length) * Math.PI * 2;
        const dx = Math.cos(angle) * 30;
        const dy = Math.sin(angle) * 30;
        return (
          <motion.span
            key={i}
            className="bg-accent absolute h-1.5 w-1.5 rounded-full"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0 }}
            transition={{ duration: 0.55, delay: 0.05, ease: "easeOut" }}
          />
        );
      })}
    </motion.div>
  );
}
