import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-3 px-4 font-mono text-xs uppercase tracking-[0.1em] text-muted sm:flex-row sm:justify-between sm:px-8">
        <span>© {new Date().getFullYear()} TallZ</span>
        <div className="flex gap-6">
          <Link href="/about" className="hover:text-orange">
            About
          </Link>
          <Link href="/feedback" className="hover:text-orange">
            Feedback
          </Link>
          <Link href="/privacy" className="hover:text-orange">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
