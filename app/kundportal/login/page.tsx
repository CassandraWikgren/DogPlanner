"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE: "[ERR-1001]",
  AUTH: "[ERR-5001]",
} as const;

function LoginPageContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlMessage = searchParams.get("message");
    const verified = searchParams.get("verified");

    if (urlMessage === "check_email") {
      setMessage(
        "Kontrollera din e-post och klicka på verifieringslänken för att aktivera ditt konto."
      );
    } else if (urlMessage === "registration_complete") {
      setMessage("Registrering klar! Du kan nu logga in.");
    } else if (verified === "true") {
      setMessage("E-posten är verifierad! Du kan nu logga in.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error(`${ERROR_CODES.AUTH} E-post och lösenord krävs`);
      }

      // Skapa Supabase client
      const supabase = createClient();

      // Logga in med Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email,
          password: password,
        }
      );

      if (authError) {
        console.error("[AUTH ERROR] Full error object:", authError);
        console.error("[AUTH ERROR] Message:", authError.message);
        console.error("[AUTH ERROR] Status:", authError.status);

        let errorMessage = authError.message;
        if (authError.message.includes("Email not confirmed")) {
          errorMessage =
            "Du måste verifiera din e-postadress först. Kontrollera din e-post och klicka på verifieringslänken.";
        } else if (authError.message.includes("Invalid login credentials")) {
          errorMessage =
            "Fel e-postadress eller lösenord. Kontrollera dina uppgifter och försök igen.";
        } else if (
          authError.message.includes("Database error") ||
          authError.status === 500
        ) {
          errorMessage =
            "Ett serverfel uppstod. Vänligen försök igen om en stund.";
        }
        throw new Error(`${ERROR_CODES.AUTH} ${errorMessage}`);
      }

      if (!data.user) {
        throw new Error(`${ERROR_CODES.AUTH} Inloggning misslyckades`);
      }

      // Kontrollera att användaren är en registrerad ägare (inte admin/staff)
      // Använd RPC-funktion verify_customer_account som bypasser RLS
      // Detta garanterar att vi alltid kan verifiera kundkontot
      const { data: ownerData, error: ownerError } = await supabase
        .rpc("verify_customer_account", { p_user_id: data.user.id })
        .maybeSingle();

      if (ownerError) {
        console.error("[ERR-1001] Database error checking owner:", ownerError);

        // Om RPC-funktionen inte finns, fallback till direkt query
        // Detta ger bakåtkompatibilitet under deployment
        if (
          ownerError.message.includes("function") ||
          ownerError.code === "42883"
        ) {
          console.warn("RPC function not found, falling back to direct query");
          const { data: fallbackOwner, error: fallbackError } = await supabase
            .from("owners")
            .select("id, full_name, email")
            .eq("id", data.user.id)
            .maybeSingle();

          if (fallbackError || !fallbackOwner) {
            await supabase.auth.signOut();
            throw new Error(
              `${ERROR_CODES.AUTH} Inget kundkonto hittades för denna e-postadress`
            );
          }

          // Fallback lyckades - fortsätt till dashboard
          router.push("/kundportal/dashboard");
          return;
        }

        // Logga ut användaren vid databasfel
        await supabase.auth.signOut();
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte verifiera kundkonto: ${ownerError.message}`
        );
      }

      if (!ownerData) {
        // Användaren finns i auth men inte i owners - kanske admin/staff
        await supabase.auth.signOut();
        throw new Error(
          `${ERROR_CODES.AUTH} Inget kundkonto hittades för denna e-postadress. Om du driver ett hundföretag, använd företagsinloggningen istället.`
        );
      }

      // Framgångsrik inloggning - redirecta till dashboard
      router.push("/kundportal/dashboard");
    } catch (err: any) {
      setError(err.message || `${ERROR_CODES.AUTH} Inloggningen misslyckades`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="text-sm">← Tillbaka till startsidan</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Title Section */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Logga in som hundägare
            </h1>
            <p className="text-sm text-gray-600">
              Välkommen tillbaka! Logga in för att hantera dina bokningar.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Driver du ett hundföretag?{" "}
              <Link
                href="/login"
                className="text-[#2c7a4c] hover:text-[#236139] font-medium underline"
              >
                Logga in här istället
              </Link>
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Kundinloggning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Message */}
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">{message}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="inline h-4 w-4 mr-1" />
                    E-postadress
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all bg-white"
                    placeholder="din@epost.se"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Lösenord
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all bg-white"
                    placeholder="Ditt lösenord"
                    required
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white h-10 text-base font-semibold rounded-lg shadow-sm transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Loggar in...
                    </span>
                  ) : (
                    "Logga in"
                  )}
                </Button>
              </form>

              {/* Links Section */}
              <div className="space-y-3 pt-2">
                <div className="text-center">
                  <Link
                    href="/kundportal/forgot-password"
                    className="text-sm text-[#2c7a4c] hover:text-[#236139] hover:underline font-medium"
                  >
                    Glömt lösenord?
                  </Link>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 text-center mb-3">
                    Har du inget konto än?
                  </p>
                  <Link href="/kundportal/registrera">
                    <Button className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white h-11 rounded-lg font-semibold transition-colors shadow-sm">
                      Skapa konto som hundägare
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Account Info */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 text-center mb-2">
              För testning: Använd test-konto
            </p>
            <p className="text-xs text-blue-700 text-center mb-3">
              E-post: <span className="font-mono">test@dogplanner.se</span>
            </p>
            <Button
              onClick={() => setEmail("test@dogplanner.se")}
              variant="outline"
              className="w-full border-blue-300 text-blue-900 bg-white hover:bg-blue-50 h-9 text-sm font-medium"
            >
              Fyll i test-epost
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div>Laddar...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
