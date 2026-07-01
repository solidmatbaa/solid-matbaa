export const pressableHover = {
  scale: 1.05,
  boxShadow: "0 12px 24px -8px rgba(0, 0, 0, 0.18)",
};

export const pressableTap = {
  scale: 0.96,
};

export const pressableTransition = {
  type: "spring" as const,
  stiffness: 420,
  damping: 28,
};
