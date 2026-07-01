"use client";

import type { ComponentProps } from "react";
import { motion } from "framer-motion";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { pressableHover, pressableTap, pressableTransition } from "@/lib/pressable-motion";

type MotionLinkProps = ComponentProps<typeof Link> & {
  fullWidth?: boolean;
};

export function MotionLink({ className, fullWidth, children, ...props }: MotionLinkProps) {
  return (
    <motion.span
      className={cn("inline-flex", fullWidth && "w-full")}
      whileHover={pressableHover}
      whileTap={pressableTap}
      transition={pressableTransition}
    >
      <Link
        className={cn(fullWidth && "w-full", className)}
        {...props}
      >
        {children}
      </Link>
    </motion.span>
  );
}
