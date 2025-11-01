"use client";

import "./globals.css";
import React, { useState } from "react";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { NotificationProvider } from "@/app/context/NotificationContext";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";

/**
 * Wrapper som visar Navbar och Breadcrumbs endast när användaren är inloggad.
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] text-gray-900">
      {user && <Navbar />}
      {user && <Breadcrumbs />}
      <main className={`flex-1 ${user ? "pt-32" : ""}`}>{children}</main>
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
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased selection:bg-[#2c7a4c]/20 selection:text-[#2c7a4c]">
        <AuthProvider>
          <NotificationProvider>
            <LayoutContent>{children}</LayoutContent>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
