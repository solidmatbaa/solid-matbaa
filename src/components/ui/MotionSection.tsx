"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "section" | "div" | "article";
}

export function MotionSection({
  children,
  className,
  delay = 0,
  as = "section",
}: MotionSectionProps) {
  const Component = motion[as];

  return (
    <Component
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}
