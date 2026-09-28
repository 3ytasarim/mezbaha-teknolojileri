"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "./nav-data";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {ADMIN_NAV.map((group) => (
        <div key={group.label || "root"}>
          {group.label && (
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {group.label}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-neutral-800 text-neutral-50"
                        : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3 md:hidden">
        <Link href="/admin" aria-label="Yönetim paneli ana sayfa">
          <Image src="/images/brand/logo-white.svg" alt="Mezbaha Teknolojileri" width={483} height={117} unoptimized className="h-8 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200"
        >
          Menü
        </button>
      </div>

      {open && (
        <div id="admin-mobile-nav" className="border-b border-neutral-800 px-4 py-4 md:hidden">
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-neutral-800 px-4 py-6 md:block">
        <Link href="/admin" aria-label="Yönetim paneli ana sayfa" className="mb-6 block px-3">
          <Image src="/images/brand/logo-white.svg" alt="Mezbaha Teknolojileri" width={483} height={117} unoptimized className="h-10 w-auto" />
          <span className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Yönetim Paneli</span>
        </Link>
        <NavLinks />
      </aside>
    </>
  );
}
