"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, role, signOut: logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#2c7a4c] text-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo - alltid till vänster, större och länka till dashboard */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="DogPlanner"
            width={60}
            height={60}
            priority
            className="rounded-lg"
          />
        </Link>

        {/* Desktop-navigering och användarmeny visas endast om inloggad */}
        {user && (
          <>
            <div className="hidden md:flex gap-6 text-sm font-medium">
              <Link
                href="/dashboard"
                className="hover:text-green-200 transition-colors py-2 px-3 rounded-md hover:bg-green-700"
              >
                Dashboard
              </Link>
              <Link
                href="/hunddagis"
                className="hover:text-green-200 transition-colors py-2 px-3 rounded-md hover:bg-green-700"
              >
                Hunddagis
              </Link>
              <Link
                href="/hundpensionat"
                className="hover:text-green-200 transition-colors py-2 px-3 rounded-md hover:bg-green-700"
              >
                Pensionat
              </Link>
              <Link
                href="/owners"
                className="hover:text-green-200 transition-colors py-2 px-3 rounded-md hover:bg-green-700"
              >
                Kunder
              </Link>
              <Link
                href="/rooms"
                className="hover:text-green-200 transition-colors py-2 px-3 rounded-md hover:bg-green-700"
              >
                Rum
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-4">
              {/* Notifikations-dropdown */}
              <NotificationDropdown />
              <div className="flex flex-col text-right text-xs leading-tight">
                <span className="font-semibold">
                  {user.email?.split("@")[0] || "Användare"}
                </span>
                {role && (
                  <span className="text-[10px] text-green-100 capitalize">
                    {role === "admin"
                      ? "Administratör"
                      : role === "staff"
                      ? "Personal"
                      : role === "groomer"
                      ? "Frisör"
                      : "Hundägare"}
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="bg-white text-[#2c7a4c] px-4 py-2 rounded-md text-sm font-semibold hover:bg-green-50 transition"
              >
                Logga ut
              </button>
            </div>
          </>
        )}

        {/* Mobil: hamburgermeny - visas alltid när inloggad */}
        {user && (
          <button
            className="md:hidden p-2 rounded hover:bg-green-700 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meny"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* 🪄 Overlay + animerad mobilmeny */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Bakgrundsoverlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Själva menyn */}
            <motion.div
              key="mobile-menu"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 right-0 w-64 h-full bg-[#2c7a4c] z-50 md:hidden shadow-2xl"
            >
              <div className="flex flex-col px-6 py-6 space-y-3 text-base">
                {/* Stäng-knapp */}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="self-end p-2 hover:bg-green-700 rounded transition"
                  aria-label="Stäng meny"
                >
                  <X size={24} />
                </button>

                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-3 hover:bg-green-700 rounded transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/hunddagis"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-3 hover:bg-green-700 rounded transition"
                >
                  Hunddagis
                </Link>
                <Link
                  href="/hundpensionat"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-3 hover:bg-green-700 rounded transition"
                >
                  Pensionat
                </Link>
                <Link
                  href="/owners"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-3 hover:bg-green-700 rounded transition"
                >
                  Kunder
                </Link>
                <Link
                  href="/rooms"
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-3 hover:bg-green-700 rounded transition"
                >
                  Rum
                </Link>

                <div className="border-t border-green-700 pt-4 mt-4">
                  {user && (
                    <div className="mb-3 text-sm">
                      <p className="font-semibold">
                        {user.email?.split("@")[0]}
                      </p>
                      {role && (
                        <p className="text-xs text-green-200 capitalize">
                          {role === "admin"
                            ? "Administratör"
                            : role === "staff"
                            ? "Personal"
                            : role === "groomer"
                            ? "Frisör"
                            : "Hundägare"}
                        </p>
                      )}
                    </div>
                  )}
                  {user ? (
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="w-full bg-white text-[#2c7a4c] px-4 py-3 rounded-md font-semibold hover:bg-green-50 transition"
                    >
                      Logga ut
                    </button>
                  ) : (
                    <Link
                      href={"/login" as const}
                      onClick={() => setMenuOpen(false)}
                      className="block text-center bg-white text-[#2c7a4c] px-4 py-3 rounded-md font-semibold hover:bg-green-50 transition"
                    >
                      Logga in
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
