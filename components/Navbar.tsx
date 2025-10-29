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
    <nav className="bg-[#2c7a4c] text-white shadow fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logotyp - Klickbar till Dashboard */}
        {/* Visa endast logotypen, större, om utloggad. Logotyp + text om inloggad */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="DogPlanner logotyp"
            width={64}
            height={64}
            priority
            className="rounded-lg"
          />
        </Link>

        {/* Desktop-navigering och användarmeny visas endast om inloggad */}
        {user && (
          <>
            <div className="hidden md:flex gap-8 text-sm font-medium">
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
              <div className="flex flex-col text-right text-sm leading-tight">
                <span className="font-semibold">
                  {user.email?.split("@")[0] || "Användare"}
                </span>
                {role && (
                  <span className="text-xs text-green-100 capitalize">
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
                className="bg-white text-[#2c7a4c] px-4 py-1 rounded-md font-semibold hover:bg-[#e6f4ea] transition"
              >
                Logga ut
              </button>
            </div>
          </>
        )}

        {/* Mobil: hamburgermeny */}
        <button
          className="md:hidden p-2 rounded hover:bg-green-800 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Meny"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
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
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 w-full bg-[#2c7a4c] z-50 md:hidden shadow-lg"
            >
              <div className="flex flex-col px-6 py-6 space-y-4 text-base">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 hover:text-green-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/hunddagis"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 hover:text-green-200"
                >
                  Hunddagis
                </Link>
                <Link
                  href="/hundpensionat"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 hover:text-green-200"
                >
                  Pensionat
                </Link>
                <Link
                  href="/owners"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 hover:text-green-200"
                >
                  Kunder
                </Link>
                <Link
                  href="/rooms"
                  onClick={() => setMenuOpen(false)}
                  className="py-2 hover:text-green-200"
                >
                  Rum
                </Link>

                <div className="border-t border-green-900 pt-3 mt-2">
                  {user ? (
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="w-full bg-white text-[#2c7a4c] px-4 py-2 rounded-md font-semibold hover:bg-[#e6f4ea] transition"
                    >
                      Logga ut
                    </button>
                  ) : (
                    <Link
                      href={"/login" as const}
                      onClick={() => setMenuOpen(false)}
                      className="block text-center bg-white text-[#2c7a4c] px-4 py-2 rounded-md font-semibold hover:bg-[#e6f4ea] transition"
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
