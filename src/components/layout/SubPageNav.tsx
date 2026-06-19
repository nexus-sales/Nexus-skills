'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Nexus', activeCheck: (p: string) => p === '/' || p.startsWith('/nexus') },
  { href: '/prompt-builder', label: 'Modo avanzado', activeCheck: (p: string) => p.startsWith('/prompt-builder') },
  { href: '/agentes', label: 'Agentes', activeCheck: (p: string) => p.startsWith('/agentes') },
  { href: '/skills', label: 'Skills', activeCheck: (p: string) => p.startsWith('/skills') },
  { href: '/workflows', label: 'Workflows', activeCheck: (p: string) => p.startsWith('/workflows') },
];

export function SubPageNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-40 flex items-center gap-1 border-b border-border bg-surface3/90 px-5 py-3 backdrop-blur-md"
      aria-label="Navegacion principal"
    >
      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label, activeCheck }) => {
          const active = activeCheck(pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-muted hover:text-text'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
