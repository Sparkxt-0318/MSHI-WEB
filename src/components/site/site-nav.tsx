'use client';

import Link from 'next/link';
import * as React from 'react';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/biosensor', label: 'Biosensor' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/methods', label: 'Methods' },
  { href: '/paper', label: 'Paper' },
  { href: '/about', label: 'About' },
];

export function SiteNav() {
  const [open, setOpen] = React.useState(false);

  // Close the mobile menu on Escape for keyboard users.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/85 backdrop-blur-sm">
      <nav className="container-research flex h-16 items-center justify-between">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-serif text-lg font-bold tracking-tight text-ink hover:text-accent"
        >
          MSHI
          <span className="ml-1 hidden font-mono text-xs font-normal uppercase tracking-meta text-ink-soft sm:inline">
            · research portfolio
          </span>
        </Link>

        {/* Inline nav — tablet and up. Below md the six items can't share a
            row with the wordmark on a phone, so they collapse behind the
            menu button. */}
        <ul className="hidden items-center gap-6 md:flex">
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

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="site-mobile-menu"
          className="-mr-2 inline-flex items-center justify-center p-2 text-ink-soft transition-colors hover:text-accent md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile dropdown. Absolutely positioned so it overlays the page rather
          than growing the sticky header — otherwise it would push the
          full-height /atlas map down and introduce a scrollbar. */}
      {open ? (
        <div
          id="site-mobile-menu"
          className="absolute inset-x-0 top-full border-b border-rule bg-paper/95 shadow-lg backdrop-blur-sm md:hidden"
        >
          <ul className="container-research flex flex-col py-1">
            {NAV_ITEMS.map((item) => (
              <li
                key={item.href}
                className="border-b border-rule/60 last:border-b-0"
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-mono text-sm uppercase tracking-meta text-ink-soft transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
