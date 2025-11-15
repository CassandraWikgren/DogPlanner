"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

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
        "📧 Kontrollera din e-post och klicka på verifieringslänken för att aktivera ditt konto."
      );
    } else if (urlMessage === "registration_complete") {
      setMessage("🎉 Registrering klar! Du kan nu logga in.");
    } else if (verified === "true") {
      setMessage("✅ E-posten är verifierad! Du kan nu logga in.");
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

      const supabase = createClientComponentClient();

      // Logga in med Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: email,
          password: password,
        }
      );

      if (authError) {
        let errorMessage = authError.message;
        if (authError.message.includes("Email not confirmed")) {
          errorMessage =
            "📧 Du måste verifiera din e-postadress först. Kontrollera din e-post och klicka på verifieringslänken.";
        } else if (authError.message.includes("Invalid login credentials")) {
          errorMessage =
            "Fel e-postadress eller lösenord. Kontrollera dina uppgifter och försök igen.";
        }
        throw new Error(`${ERROR_CODES.AUTH} ${errorMessage}`);
      }

      if (!data.user) {
        throw new Error(`${ERROR_CODES.AUTH} Inloggning misslyckades`);
      }

      // Kontrollera att användaren är en ägare (inte admin/staff)
      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .select("id, full_name, email")
        .eq("email", email)
        .single();

      if (ownerError || !ownerData) {
        // Logga ut användaren om de inte är en registrerad ägare
        await supabase.auth.signOut();
        throw new Error(
          `${ERROR_CODES.AUTH} Inget kundkonto hittades för denna e-postadress`
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/kundportal">
            <Button variant="ghost" className="mb-4">
              ← Tillbaka till startsidan
            </Button>
          </Link>

          <div className="flex items-center justify-center mb-4">
            <PawPrint className="h-10 w-10 text-[#2c7a4c] mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Logga in</h1>
          </div>

          <p className="text-gray-600">
            Välkommen tillbaka! Logga in för att hantera dina bokningar.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Kundinloggning</CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-lg mb-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{message}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  E-postadress
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                  placeholder="din@epost.se"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Lösenord
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                  placeholder="Ditt lösenord"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2c7a4c] hover:bg-[#245a3e] h-12 text-base font-medium"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loggar in...
                  </span>
                ) : (
                  "Logga in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                href="/kundportal/forgot-password"
                className="text-[#2c7a4c] hover:underline text-sm"
              >
                Glömt lösenord?
              </Link>

              <div className="border-t pt-3">
                <p className="text-sm text-white">Har du inget konto än?</p>
                <Link href="/kundportal/registrera">
                  <Button variant="outline" className="w-full">
                    Skapa nytt konto
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo login för testning */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700 text-center mb-2">
              <strong>För testning:</strong> Använd test-konto
            </p>
            <p className="text-xs text-blue-600 text-center mb-3">
              E-post: <strong>test@dogplanner.se</strong>
            </p>
            <Button
              onClick={() => {
                setEmail("test@dogplanner.se");
              }}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Fyll i test-epost
            </Button>
          </CardContent>
        </Card>
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
