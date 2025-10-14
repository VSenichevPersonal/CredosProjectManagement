export const breakpoints = {
  mobile: "0px",
  tablet: "768px",
  desktop: "1024px",
  wide: "1440px",
} as const

export const mediaQueries = {
  mobile: `@media (min-width: ${breakpoints.mobile})`,
  tablet: `@media (min-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`,
  wide: `@media (min-width: ${breakpoints.wide})`,
} as const
