"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressableHover, pressableTap, pressableTransition } from "@/lib/pressable-motion";

type MotionPressableProps = Omit<HTMLMotionProps<"div">, "children"> & {
  disabled?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
};

export function MotionPressable({
  children,
  className,
  disabled,
  fullWidth,
  ...props
}: MotionPressableProps) {
  if (disabled) {
    return <div className={cn(fullWidth && "w-full", className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn("inline-flex", fullWidth && "w-full", className)}
      whileHover={pressableHover}
      whileTap={pressableTap}
      transition={pressableTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}
