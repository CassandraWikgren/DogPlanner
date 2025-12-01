"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();

  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Databaskoppling saknas");
      return;
    }

    if (password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      setMessage("Ditt lösenord har uppdaterats!");
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Kunde inte uppdatera lösenordet.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c7a4c] text-center mb-6">
          Återställ lösenord
        </h1>

        {success ? (
          <div className="text-center text-green-700 font-medium">
            {message || "Lösenordet har ändrats."}
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nytt lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bekräfta nytt lösenord
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
              />
            </div>

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-red-700 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded border border-green-200 bg-green-50 px-4 py-2 text-green-700 text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2c7a4c] hover:bg-green-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              {loading ? "Uppdaterar..." : "Spara nytt lösenord"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          <a
            href="/login"
            className="text-[#2c7a4c] hover:underline font-medium"
          >
            Tillbaka till inloggning
          </a>
        </p>
      </div>
    </main>
  );
}
