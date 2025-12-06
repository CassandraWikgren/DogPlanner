"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);

  // Redirect if already logged in (unless ?force=true is in URL)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const forceLogin = urlParams.get("force") === "true";

    if (!authLoading && user && !forceLogin) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // 🔑 Inloggning
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // Omdirigera till dashboard efter lyckad inloggning
        router.push("/dashboard");
      } else {
        setError("Inloggningen misslyckades. Kontrollera dina uppgifter.");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Ett fel uppstod vid inloggning.");
    } finally {
      setLoading(false);
    }
  }

  // 🔁 Skicka återställningsmejl
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage(
        "Ett mejl med återställningslänk har skickats till din adress. Kontrollera din inkorg."
      );
    } catch (err: any) {
      setError(err.message || "Kunde inte skicka återställningsmejl.");
    } finally {
      setLoading(false);
    }
  }

  // Funktion för att rensa demo-cookies
  const clearDemoLogin = () => {
    document.cookie =
      "demoUser=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "demoOrg=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.reload();
  };

  // Kontrollera om demo-cookies finns
  const demoUser =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("demoUser="))
          ?.split("=")[1]
      : null;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {resetMode ? "Återställ lösenord" : "Logga in som företag"}
        </h1>
        <p className="text-center text-sm text-gray-600 mb-4">
          För hundföretag och verksamheter
        </p>
        <p className="text-center text-xs text-gray-500 mb-6 pb-4 border-b">
          Hundägare?{" "}
          <a
            href="/kundportal/login"
            className="text-[#2c7a4c] hover:text-[#236139] font-medium underline"
          >
            Logga in här istället
          </a>
        </p>

        <form
          onSubmit={resetMode ? handleResetPassword : handleLogin}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              E-postadress
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exempel@hunddagis.se"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
            />
          </div>

          {!resetMode && (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-base shadow-sm"
          >
            {loading
              ? "Bearbetar..."
              : resetMode
                ? "Skicka återställningsmejl"
                : "Logga in"}
          </button>
        </form>

        {!resetMode && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setResetMode(true);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline font-medium"
            >
              Har du glömt ditt lösenord?
            </button>
          </div>
        )}

        {resetMode && (
          <div className="text-center mt-4">
            <button
              onClick={() => {
                setResetMode(false);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium hover:underline"
            >
              Tillbaka till inloggning
            </button>
          </div>
        )}

        {!resetMode && (
          <p className="text-center text-sm text-gray-700 mt-4 pt-4 border-t border-gray-200">
            Har du inget konto?{" "}
            <a
              href="/register"
              className="text-[#2c7a4c] font-medium hover:text-[#236139] hover:underline"
            >
              Skapa konto
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
