export const typography = {
  fontFamily: {
    sans: "var(--font-inter)",
    mono: "var(--font-jetbrains-mono)",
  },
  fontSize: {
    h1: { size: "2rem", lineHeight: "2.5rem", weight: "700" },
    h2: { size: "1.5rem", lineHeight: "2rem", weight: "600" },
    h3: { size: "1.25rem", lineHeight: "1.75rem", weight: "600" },
    h4: { size: "1.125rem", lineHeight: "1.75rem", weight: "500" },
    h5: { size: "1rem", lineHeight: "1.5rem", weight: "500" },
    bodyLarge: { size: "1rem", lineHeight: "1.5rem", weight: "400" },
    body: { size: "0.875rem", lineHeight: "1.25rem", weight: "400" },
    bodySmall: { size: "0.75rem", lineHeight: "1rem", weight: "400" },
    caption: { size: "0.75rem", lineHeight: "1rem", weight: "500" },
    overline: { size: "0.6875rem", lineHeight: "1rem", weight: "600" },
    code: { size: "0.875rem", lineHeight: "1.25rem", weight: "400" },
  },
  letterSpacing: {
    heading: "-0.01em",
    body: "0",
    overline: "0.05em",
  },
} as const
