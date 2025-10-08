"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
    router.push("/login");
  };

  return (
    <nav className="w-full bg-green-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo / Hemlänk */}
        <Link href="/dashboard" className="text-2xl font-bold tracking-tight">
          🐶 DogPlanner
        </Link>

        {/* Navigeringsmeny */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:underline">
                Hem
              </Link>
              <Link href="/hunddagis" className="hover:underline">
                Hunddagis
              </Link>
              <Link href="/hundpensionat" className="hover:underline">
                Pensionat
              </Link>
              <Link href="/foretagsinformation" className="hover:underline">
                Företag
              </Link>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="bg-white text-green-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                {loading ? "Loggar ut..." : "Logga ut"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="bg-white text-green-700 font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Logga in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
