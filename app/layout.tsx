"use client";

import "./globals.css";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import React from "react";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <>
      {/* Visa navbar om användaren är inloggad */}
      {user && <Navbar />}
      <main className={user ? "pt-20" : ""}>{children}</main>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
