"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import NotificationDropdown from "@/components/NotificationDropdown";
import Image from "next/image";
import {
  Menu,
  X,
  Home,
  Dog,
  Building2,
  Scissors,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEnabledServices } from "@/lib/hooks/useEnabledServices";

export default function Navbar() {
  const { user, role, signOut: logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { hasDaycare, hasBoarding, hasGrooming } = useEnabledServices();

  return (
    <nav className="bg-[#2c7a4c] text-white shadow-md fixed top-0 left-0 w-full z-50">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Mobil: hamburgermeny - visas alltid när inloggad - VÄNSTER SIDA */}
        {user && (
          <button
            className="md:hidden p-2 rounded hover:bg-green-700 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meny"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}

        {/* Logo - större och länka till dashboard */}
        <Link
          href={user ? "/dashboard" : "/"}
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <Image
            src="/logo.png"
            alt="DogPlanner"
            width={70}
            height={70}
            priority
            className="rounded-lg"
          />
        </Link>

        {/* Användarmeny (inga nav-länkar) */}
        {user && (
          <>
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
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed top-0 left-0 w-64 h-full bg-[#2c7a4c] z-50 md:hidden shadow-2xl"
            >
              <div className="flex flex-col px-6 py-6 space-y-3 text-base text-white">
                {/* Stäng-knapp */}
                <button
                  onClick={() => setMenuOpen(false)}
                  className="self-start p-2 hover:bg-green-700 rounded transition text-white"
                  aria-label="Stäng meny"
                >
                  <X size={24} />
                </button>

                {/* Navigeringslänkar */}
                <div className="space-y-1 pt-4 border-b border-green-600 pb-4">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-green-700 transition text-white"
                  >
                    <Home size={20} />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                  {hasDaycare && (
                    <Link
                      href="/hunddagis"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-green-700 transition text-white"
                    >
                      <Dog size={20} />
                      <span className="font-medium">Hunddagis</span>
                    </Link>
                  )}
                  {hasBoarding && (
                    <Link
                      href="/hundpensionat"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-green-700 transition text-white"
                    >
                      <Building2 size={20} />
                      <span className="font-medium">Hundpensionat</span>
                    </Link>
                  )}
                  {hasGrooming && (
                    <Link
                      href="/frisor"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-green-700 transition text-white"
                    >
                      <Scissors size={20} />
                      <span className="font-medium">Hundfrisör</span>
                    </Link>
                  )}
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-green-700 transition text-white"
                  >
                    <Settings size={20} />
                    <span className="font-medium">Admin</span>
                  </Link>
                </div>

                {/* Användarmeny */}
                <div className="pt-4">
                  {user && (
                    <div className="mb-3 text-sm text-white">
                      <p className="font-semibold">
                        {user.email?.split("@")[0]}
                      </p>
                      {role && (
                        <p className="text-xs text-green-100 capitalize">
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
                      className="w-full bg-white text-[#2c7a4c] px-4 py-3 rounded-md font-semibold hover:bg-green-50 transition shadow-sm"
                    >
                      Logga ut
                    </button>
                  ) : (
                    <Link
                      href={"/login" as const}
                      onClick={() => setMenuOpen(false)}
                      className="block text-center bg-white text-[#2c7a4c] px-4 py-3 rounded-md font-semibold hover:bg-green-50 transition shadow-sm"
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
