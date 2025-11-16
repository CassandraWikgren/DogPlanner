"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PublicNavProps {
  currentPage: "customer" | "business";
}

export default function PublicNav({ currentPage }: PublicNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 md:px-16 lg:px-32 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="DogPlanner"
              width={50}
              height={50}
              priority
              className="rounded-lg"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={
                currentPage === "customer"
                  ? "text-primary font-semibold"
                  : "text-gray-700 hover:text-primary font-medium transition-colors"
              }
            >
              För hundägare
            </Link>
            <Link
              href="/foretag"
              className={
                currentPage === "business"
                  ? "text-primary font-semibold"
                  : "text-gray-700 hover:text-primary font-medium transition-colors"
              }
            >
              För företag
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link
              href="/login"
              className="text-gray-700 hover:text-primary font-medium transition-colors"
            >
              Logga in
            </Link>
            {currentPage === "business" && (
              <Link
                href="/register"
                className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-all shadow-sm hover:shadow-md"
              >
                Kom igång gratis
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded hover:bg-gray-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-2">
              <Link
                href="/"
                className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                  currentPage === "customer"
                    ? "bg-green-50 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                För hundägare
              </Link>
              <Link
                href="/foretag"
                className={`block py-3 px-4 rounded-lg font-medium transition-colors ${
                  currentPage === "business"
                    ? "bg-green-50 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                För företag
              </Link>
              <Link
                href="/login"
                className="block py-3 px-4 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                Logga in
              </Link>
              {currentPage === "business" && (
                <Link
                  href="/register"
                  className="block w-full px-6 py-3 bg-primary text-white rounded-lg text-center font-medium hover:bg-primary-dark transition-all mt-4"
                  onClick={() => setMenuOpen(false)}
                >
                  Kom igång gratis
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
