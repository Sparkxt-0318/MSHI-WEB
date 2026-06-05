import Link from 'next/link';

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/biosensor', label: 'Biosensor' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/methods', label: 'Methods' },
  { href: '/paper', label: 'Paper' },
  { href: '/about', label: 'About' },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <nav className="container-research flex items-center justify-between py-4">
        <Link
          href="/"
          className="font-serif text-lg font-bold tracking-tight text-ink hover:text-accent"
        >
          MSHI
          <span className="ml-1 font-mono text-xs font-normal uppercase tracking-meta text-ink-soft">
            · research portfolio
          </span>
        </Link>
        <ul className="flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="font-mono text-xs uppercase tracking-meta text-ink-soft transition-colors hover:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
