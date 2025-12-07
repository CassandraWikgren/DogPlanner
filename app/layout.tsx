"use client";

import "./globals.css";
import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { NotificationProvider } from "@/app/context/NotificationContext";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePathname, useRouter } from "next/navigation";
import Script from "next/script";

/**
 * Wrapper som visar Navbar och Breadcrumbs endast när användaren är inloggad.
 * Kundportalen har sin egen layout och visar INTE personal-navbar.
 * SKYDDAR även personalsidor från kundåtkomst!
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user, isCustomer, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Kundportalen har egen layout - visa INTE personal-navbar där
  const isKundportal = pathname?.startsWith("/kundportal");

  // Publika sidor som alla kan nå
  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/registrera") ||
    pathname?.startsWith("/legal") ||
    pathname?.startsWith("/ansokan") ||
    pathname?.startsWith("/demo") ||
    pathname?.startsWith("/auth");

  // 🛡️ SKYDD: Om kunden försöker nå en personalsida, redirecta till kundportalen
  useEffect(() => {
    if (!loading && user && isCustomer && !isKundportal && !isPublicPage) {
      console.log(
        "🛡️ Kund försökte nå personalsida, redirectar till kundportalen..."
      );
      router.replace("/kundportal/dashboard");
    }
  }, [loading, user, isCustomer, isKundportal, isPublicPage, router]);

  // Om kund försöker nå personalsida, visa ingenting medan redirect pågår
  if (!loading && user && isCustomer && !isKundportal && !isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] text-gray-900">
      {user && !isKundportal && !isCustomer && <Navbar />}
      {user && !isKundportal && !isCustomer && <Breadcrumbs />}
      <main
        className={`flex-1 ${user && !isKundportal && !isCustomer ? "pt-20" : ""}`}
      >
        {children}
      </main>
    </div>
  );
}

/**
 * RootLayout – global HTML-struktur, Auth och grundstil.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Rensa gamla Supabase cookies från deprecated @supabase/auth-helpers-nextjs
  useEffect(() => {
    const migrationKey = "supabase_ssr_migration_done";
    if (!localStorage.getItem(migrationKey)) {
      // Hitta alla gamla Supabase cookies
      const cookies = document.cookie.split(";");
      cookies.forEach((cookie) => {
        const cookieName = cookie.split("=")[0].trim();
        // Ta bort gamla auth-helpers cookies
        if (
          cookieName.startsWith("sb-") &&
          !cookieName.includes("-auth-token-code-verifier")
        ) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      });
      localStorage.setItem(migrationKey, "true");
    }
  }, []);

  // Force viewport meta tag on client-side för att garantera korrekt scaling
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (!metaViewport) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content =
        "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes";
      document.head.appendChild(meta);
    } else {
      // Uppdatera befintlig viewport om den är felaktig
      metaViewport.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
      );
    }
  }, []);

  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes"
        />
      </head>
      <body className="min-h-screen font-sans antialiased selection:bg-[#2c7a4c]/20 selection:text-[#2c7a4c]">
        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <LayoutContent>{children}</LayoutContent>
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
