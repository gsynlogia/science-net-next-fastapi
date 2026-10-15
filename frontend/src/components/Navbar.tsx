"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Tablica" },
  { href: "/about", label: "O portalu" },
] as const;

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm">
      <nav className="mx-auto flex max-w-2xl items-center gap-6 p-4">
        <Link href="/" className="text-xl font-bold text-brand-600">
          Science Net
        </Link>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "font-semibold text-brand-700" : "text-slate-600"}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
