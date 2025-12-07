"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PawPrint,
  Calendar,
  Home,
  User,
  LogOut,
  Menu,
  X,
  Bell,
} from "lucide-react";

interface Owner {
  id: string;
  full_name: string;
  customer_number: number | null;
}

/**
 * Kundportal Layout
 * Egen layout för kundportalen som INTE visar personal-navbar
 * Visar istället en kundanpassad header med enkel navigation
 */
export default function KundportalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidor som INTE ska visa kundportal-header (login, registrera, etc)
  const publicPages = [
    "/kundportal/login",
    "/kundportal/registrera",
    "/kundportal/forgot-password",
    "/kundportal",
  ];

  const isPublicPage = publicPages.includes(pathname);

  // Hämta kundinfo om användaren är inloggad
  useEffect(() => {
    const fetchOwner = async () => {
      if (!user) return;

      const supabase = createClient();
      const { data, error } = await supabase
        .from("owners")
        .select("id, full_name, customer_number")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setOwner(data);
      }
    };

    if (user && !isPublicPage) {
      fetchOwner();
    }
  }, [user, isPublicPage]);

  const handleLogout = async () => {
    await signOut();
    router.push("/kundportal/login");
  };

  // Navigation items för kunder
  const navItems = [
    { href: "/kundportal/dashboard", label: "Min portal", icon: Home },
    { href: "/kundportal/mina-hundar", label: "Mina hundar", icon: PawPrint },
    { href: "/kundportal/mina-bokningar", label: "Bokningar", icon: Calendar },
    { href: "/kundportal/min-profil", label: "Min profil", icon: User },
  ];

  // För publika sidor (login, registrera), visa bara children utan header
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  // Omdirigera till login om inte inloggad
  if (!user) {
    router.push("/kundportal/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Kundportal Header */}
      <header className="bg-[#2c7a4c] text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/kundportal/dashboard"
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="DogPlanner"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {/* Notification bell placeholder */}
              <button className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition">
                <Bell className="h-5 w-5" />
              </button>

              {/* User info */}
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <p className="font-medium">
                    {owner?.full_name || user.email?.split("@")[0]}
                  </p>
                  <p className="text-white/70 text-xs">
                    {owner?.customer_number
                      ? `Kund #${owner.customer_number}`
                      : "Hundägare"}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white text-[#2c7a4c] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                >
                  Logga ut
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/20">
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-3 border-t border-white/20">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="text-sm">
                    <p className="font-medium">
                      {owner?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-white/70 text-xs">
                      {owner?.customer_number
                        ? `Kund #${owner.customer_number}`
                        : "Hundägare"}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-[#2c7a4c] rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    Logga ut
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <p>© {new Date().getFullYear()} DogPlanner</p>
            <div className="flex gap-4">
              <Link
                href="/legal/privacy-policy-customer"
                className="hover:text-[#2c7a4c] transition"
              >
                Integritetspolicy
              </Link>
              <Link
                href="/kundportal/kontakt"
                className="hover:text-[#2c7a4c] transition"
              >
                Kontakt
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
