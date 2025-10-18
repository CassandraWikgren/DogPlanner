"use client";

import "./globals.css";
import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { AuthProvider, useAuth } from "@/app/context/AuthContext"; // ✅ korrekt import
import { NotificationProvider } from "@/app/context/NotificationContext";
import Navbar from "@/components/Navbar";

/**
 * Wrapper som visar Navbar endast när användaren är inloggad.
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] text-gray-900">
      {user && <Navbar />}
      <main className={`flex-1 ${user ? "pt-20" : ""}`}>{children}</main>
    </div>
  );
}

/**
 * RootLayout – global HTML-struktur, Supabase, Auth och grundstil.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ Skapa Supabase-klient endast en gång
  const [supabase] = useState(() => createClientComponentClient());

  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased selection:bg-[#2c7a4c]/20 selection:text-[#2c7a4c]">
        <SessionContextProvider supabaseClient={supabase}>
          <AuthProvider>
            <NotificationProvider>
              <LayoutContent>{children}</LayoutContent>
            </NotificationProvider>
          </AuthProvider>
        </SessionContextProvider>
      </body>
    </html>
  );
}
