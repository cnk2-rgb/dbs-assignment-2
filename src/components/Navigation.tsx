"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/journal", label: "Journal" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/shopping", label: "Shopping" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[#4a2e20] bg-[#5c3d2e]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-6 flex items-center justify-between h-14">
        <Link href="/" className="font-pixel text-lg font-bold tracking-tight text-amber-100">
          Productivity
        </Link>
        <div className="flex gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#8b6b4a] text-amber-50"
                    : "text-amber-200/70 hover:bg-[#6b4a35] hover:text-amber-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
