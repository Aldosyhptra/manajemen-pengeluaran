"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Clock3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof Home; accent?: boolean };
const items: readonly NavItem[] = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/chat", label: "Catat", icon: MessageCircle, accent: true },
  { href: "/riwayat", label: "Riwayat", icon: Clock3 },
  { href: "/pengaturan", label: "Atur", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <>
      {/* Desktop top bar >=768px */}
      <header className="hidden border-b border-garis bg-struk md:block">
        <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-4">
          <Link href="/" className="font-heading text-lg font-bold text-tinta">
            Nota Harian
          </Link>
          <nav aria-label="Utama" className="flex items-center gap-1">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors min-h-11 min-w-11 flex items-center justify-center gap-1.5",
                    active
                      ? "bg-biru-nota text-white"
                      : "text-tinta-redup hover:bg-kertas hover:text-tinta",
                    it.accent && !active && "text-biru-nota"
                  )}
                >
                  <it.icon className="size-4" aria-hidden />
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab */}
      <nav
        aria-label="Utama"
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-garis bg-struk px-2 pb-safe md:hidden"
      >
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 min-w-11 flex-col items-center justify-center rounded-lg px-3 py-1 text-xs font-medium transition-colors",
                active ? "text-biru-nota" : "text-tinta-redup",
                it.accent && "font-semibold"
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full",
                  it.accent && "bg-biru-nota text-white",
                  !it.accent && active && "bg-kertas"
                )}
              >
                <it.icon className="size-4" aria-hidden />
              </span>
              <span className={cn(active && "underline decoration-2 underline-offset-4")}>
                {it.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
