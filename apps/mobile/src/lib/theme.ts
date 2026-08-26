/**
 * The design tokens from DESIGN.md, as React Native values.
 *
 * Kept deliberately small: colours, type scale, spacing, radii. Anything
 * web-only (hover states, CSS variables, Tailwind classes) has no equivalent
 * here — on touch there is no hover, so state is shown with pressed/active
 * styling instead.
 */

export const colors = {
  background: "#FFFFFF",
  foreground: "#000000",
  card: "#FFFFFF",
  muted: "#737373",
  line: "rgba(0,0,0,0.12)",
  /** No colour accent — contrast does the work. Kept as a token so the one
   *  place to change it later is here, not scattered through the screens. */
  accent: "#000000",
  onAccent: "#FFFFFF",
  danger: "#DC2626",
} as const;

export const fonts = {
  regular: "Archivo_400Regular",
  medium: "Archivo_500Medium",
  semibold: "Archivo_600SemiBold",
  bold: "Archivo_700Bold",
} as const;

export const type = {
  hero: { fontFamily: fonts.bold, fontSize: 40, lineHeight: 42, letterSpacing: -0.8 },
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 32, letterSpacing: -0.4 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 25 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  /** Uppercase, tracked — the structural labels from DESIGN.md. */
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: "uppercase" as const,
  },
  price: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 20 },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 } as const;

export const radius = { card: 16, pill: 999 } as const;

/** iOS and Android both treat 44pt as the minimum comfortable tap target. */
export const MIN_TAP = 44;
