import { motion } from "framer-motion";

export default function Spinner({ className }: { className?: string }) {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      className={
        className ??
        "border-bg/30 border-t-bg inline-block h-3.5 w-3.5 rounded-full border-2"
      }
    />
  );
}
