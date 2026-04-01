"use client";

import { usePathname } from "next/navigation";

interface NavLinksProps {
  links: { href: string; label: string }[];
}

export function NavLinks({ links }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden sm:flex items-center gap-1">
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <a
            key={href}
            href={href}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={
              active
                ? { color: "#fff", backgroundColor: "rgba(255,255,255,0.08)" }
                : { color: "#6b7280" }
            }
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
