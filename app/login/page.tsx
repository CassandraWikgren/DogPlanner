"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
      console.log(
        "LoginPage: User already logged in, redirecting to dashboard"
      );
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // 🔑 Inloggning
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!supabase) {
      setError("Databaskoppling saknas");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔑 Login result:", data, error); // <== Felsökning i terminalen

      if (error) throw error;

      if (data?.user) {
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

    if (!supabase) {
      setError("Databaskoppling saknas");
      setLoading(false);
      return;
    }

    try {
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
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        {demoUser && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm text-blue-700 mb-2">
              Du är inloggad som demo-användare: <strong>{demoUser}</strong>
            </p>
            <p className="text-xs text-blue-600 mb-2">
              Du kan fortfarande logga in med en riktig användare nedan, eller:
            </p>
            <div className="flex gap-2">
              <button
                onClick={clearDemoLogin}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
              >
                Logga ut från demo
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm bg-[#2c7a4c] text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition"
              >
                Gå till dashboard
              </button>
            </div>
          </div>
        )}

        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2c7a4c] to-[#1f5738] rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">
          {resetMode ? "Återställ lösenord" : "Logga in till DogPlanner"}
        </h1>

        <form
          onSubmit={resetMode ? handleResetPassword : handleLogin}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              E-postadress
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exempel@hunddagis.se"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
            />
          </div>

          {!resetMode && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 text-sm font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white font-semibold py-3 rounded-lg text-base shadow-sm transition disabled:opacity-60"
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
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
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
              className="text-sm text-[#2c7a4c] hover:text-[#236139] hover:underline font-medium"
            >
              Tillbaka till inloggning
            </button>
          </div>
        )}

        {!resetMode && (
          <p className="text-center text-sm text-gray-600 mt-6">
            Har du inget konto?{" "}
            <a
              href="/register"
              className="text-[#2c7a4c] font-semibold hover:underline hover:text-[#236139]"
            >
              Skapa konto
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
