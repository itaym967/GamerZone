"use client";

import { domAnimation, LazyMotion, m, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export default function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className={className}
        exit="exit"
        initial="initial"
        variants={pageVariants}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
