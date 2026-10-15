"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth/useSession";

const NAV_LINKS = [
  { href: "/", label: "Tablica" },
  { href: "/about", label: "O portalu" },
] as const;

function SessionMenu() {
  const { user, isLoading, signOut } = useSession();

  if (isLoading) {
    return null;
  }
  if (user === null) {
    return (
      <div className="ml-auto flex items-center gap-4 text-sm">
        <Link href="/login" className="text-slate-600">
          Zaloguj się
        </Link>
        <Link href="/register" className="rounded-md bg-brand-600 px-3 py-1.5 text-white">
          Załóż konto
        </Link>
      </div>
    );
  }
  return (
    <div className="ml-auto flex items-center gap-4 text-sm">
      <span className="font-medium text-slate-700">{user.full_name}</span>
      <button type="button" onClick={signOut} className="text-slate-600 hover:text-accent-600">
        Wyloguj
      </button>
    </div>
  );
}

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
        <SessionMenu />
      </nav>
    </header>
  );
}
