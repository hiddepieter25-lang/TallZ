/** Shared button styling per DESIGN.md — rounded pill, uppercase label, 48px tall, hover inverts fill/text (no scale, no shadow). Exported as classes too, for use on <Link>/<a> that need identical styling. */
export const buttonClasses = {
  primary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-6 font-mono text-xs font-medium uppercase tracking-[0.12em] text-white transition-colors duration-150 ease-out hover:bg-background hover:text-accent disabled:opacity-40",
  secondary:
    "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-foreground bg-transparent px-6 font-mono text-xs font-medium uppercase tracking-[0.12em] text-foreground transition-colors duration-150 ease-out hover:bg-foreground hover:text-background disabled:opacity-40",
} as const;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonClasses }) {
  return <button className={`${buttonClasses[variant]} ${className}`} {...props} />;
}
