"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressableHover, pressableTap, pressableTransition } from "@/lib/pressable-motion";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-gray-900 hover:bg-brand-600 shadow-sm shadow-brand-500/25 border border-brand-500/40",
  secondary:
    "bg-white text-gray-700 border border-gray-200 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-800",
  danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent shadow-sm",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-xl gap-1.5",
  md: "px-4 py-2 text-sm rounded-2xl gap-2",
  lg: "px-6 py-3 text-base rounded-2xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      ref={ref}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : pressableHover}
      whileTap={isDisabled ? undefined : pressableTap}
      transition={pressableTransition}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Spinner size={size === "lg" ? "md" : "sm"} />}
      {children}
    </motion.button>
  );
});
