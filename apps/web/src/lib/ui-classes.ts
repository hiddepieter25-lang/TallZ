/** Shared form-input styling per DESIGN.md — square, 1px border, no soft focus glow. */
export const inputClasses =
  "h-12 border border-foreground bg-transparent px-4 text-sm outline-none placeholder:text-muted focus:border-orange";

/** Same, for use on a black/dark background (e.g. the login page). */
export const inputClassesDark =
  "h-12 border border-background/30 bg-transparent px-4 text-sm text-background outline-none placeholder:text-background/50 focus:border-background";
