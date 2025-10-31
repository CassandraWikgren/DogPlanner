"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Definiera breadcrumb-mappningar
  const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
    "/dashboard": [{ label: "Dashboard" }],
    "/hunddagis": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Hunddagis" },
    ],
    "/hundpensionat": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Hundpensionat" },
    ],
    "/frisor": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Hundfrisör" },
    ],
    "/admin": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Administration" },
    ],
    "/admin/priser/dagis": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Priser", href: "/admin" },
      { label: "Hunddagis" },
    ],
    "/admin/priser/pensionat": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Priser", href: "/admin" },
      { label: "Pensionat" },
    ],
    "/admin/priser/frisor": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Priser", href: "/admin" },
      { label: "Frisör" },
    ],
    "/admin/users": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Admin", href: "/admin" },
      { label: "Användarhantering" },
    ],
    "/ekonomi": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Ekonomi & Fakturor" },
    ],
    "/owners": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Kunder & Hundägare" },
    ],
    "/rooms": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Rum & Platser" },
    ],
    "/foretagsinformation": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Företagsinformation" },
    ],
    "/subscription": [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Ditt Abonnemang" },
    ],
  };

  // Hämta breadcrumbs för aktuell sökväg
  const breadcrumbs = breadcrumbMap[pathname] || [];

  // Visa inte breadcrumbs på startsidan eller inloggningssidor
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    breadcrumbs.length === 0
  ) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200" aria-label="Breadcrumb">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <ol className="flex items-center space-x-2 text-sm">
          {/* Home icon för första item */}
          <li className="flex items-center">
            <Home className="w-4 h-4 text-gray-400" />
          </li>

          {breadcrumbs.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-gray-600 hover:text-[#2c7a4c] transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#2c7a4c] font-semibold">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
