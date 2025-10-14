export const colors = {
  primary: {
    50: "#E8F5F0",
    100: "#C2E6D9",
    200: "#9AD7C2",
    300: "#72C8AB",
    400: "#4AB994",
    500: "#22AA7D",
    600: "#1B8864",
    700: "#14664B",
    800: "#0D4432",
    900: "#062219",
  },
  secondary: {
    50: "#E6F4F7",
    100: "#B8E1E9",
    200: "#8ACEDB",
    300: "#5CBBCD",
    400: "#2EA8BF",
    500: "#0095B1",
    600: "#00778E",
    700: "#00596B",
    800: "#003B48",
    900: "#001D24",
  },
  accent: {
    500: "#0EA5E9",
    600: "#0284C7",
  },
  neutral: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    300: "#CBD5E1",
    400: "#94A3B8",
    500: "#64748B",
    600: "#475569",
    700: "#334155",
    800: "#1E293B",
    900: "#0F172A",
  },
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },
} as const

export type ColorScale = keyof typeof colors
export type ColorShade = keyof (typeof colors)["primary"]
