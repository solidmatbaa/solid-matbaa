"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { pressableTap, pressableTransition } from "@/lib/pressable-motion";

interface TabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200 overflow-x-auto scrollbar-thin">
      <nav className="flex gap-0 min-w-max">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={pressableTap}
            transition={pressableTransition}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
          </motion.button>
        ))}
      </nav>
    </div>
  );
}
