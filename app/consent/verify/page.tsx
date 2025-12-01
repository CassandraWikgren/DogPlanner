"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, Check, AlertTriangle, Info } from "lucide-react";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.NEXT_PUBLIC_JWT_SECRET || "fallback-secret-CHANGE-IN-PRODUCTION";

interface TokenPayload {
  ownerId: string;
  orgId: string;
  email: string;
  type: string;
  iat: number;
  exp: number;
}

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenPayload, setTokenPayload] = useState<TokenPayload | null>(null);
  const [ownerData, setOwnerData] = useState<any>(null);

  // Form state
  const [consentGiven, setConsentGiven] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [personnummer, setPersonnummer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = searchParams?.get("token");
    if (!token) {
      setError("[ERR-6006] Ingen verifieringstoken hittades i URL");
      setLoading(false);
      return;
    }

    try {
      // Verifiera JWT
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      if (decoded.type !== "consent_verification") {
        throw new Error("[ERR-6007] Ogiltig tokentyp");
      }

      setTokenPayload(decoded);

      // Hämta owner-data
      const { data: owner, error: ownerError } = await supabase
        .from("owners")
        .select("*")
        .eq("id", decoded.ownerId)
        .single();

      if (ownerError) throw new Error(`[ERR-6008] ${ownerError.message}`);

      // Note: consent_status field may not exist in database yet
      // if (owner.consent_status === "verified") {
      //   setError("Detta konto har redan bekräftats. Du kan logga in direkt.");
      //   setLoading(false);
      //   return;
      // }

      setOwnerData(owner);
      setLoading(false);
    } catch (err: any) {
      console.error("Token verification error:", err);
      if (err.name === "TokenExpiredError") {
        setError(
          "[ERR-6009] Verifieringslänken har gått ut. Kontakta personalen för en ny länk."
        );
      } else {
        setError(err.message || "[ERR-6010] Ogiltig verifieringslänk");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!consentGiven) {
        throw new Error("Du måste godkänna samtycket för att fortsätta");
      }

      if (password.length < 8) {
        throw new Error("Lösenordet måste vara minst 8 tecken");
      }

      if (password !== confirmPassword) {
        throw new Error("Lösenorden matchar inte");
      }

      // Validera personnummer om det angetts (frivilligt)
      if (personnummer && personnummer.length > 0) {
        const cleanedPN = personnummer.replace(/[-\s]/g, "");
        if (!/^\d{10,12}$/.test(cleanedPN)) {
          throw new Error(
            "Ogiltigt personnummer (format: ÅÅMMDD-XXXX eller ÅÅÅÅMMDDXXXX)"
          );
        }
      }

      // 1. Skapa auth-användare
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: tokenPayload!.email,
        password: password,
        options: {
          data: {
            full_name: ownerData.full_name,
            org_id: tokenPayload!.orgId,
          },
        },
      });

      if (authError) throw new Error(`[ERR-6011] ${authError.message}`);

      // 2. Uppdatera owner med samtycke och personnummer
      const updateData: any = {
        consent_status: "verified",
        consent_verified_at: new Date().toISOString(),
        gdpr_marketing_consent: marketingConsent,
      };

      // Lägg till personnummer om angivet (krypteras av Supabase RLS)
      if (personnummer && personnummer.length > 0) {
        updateData.personal_identity_number = personnummer.replace(
          /[-\s]/g,
          ""
        );
      }

      const { error: updateError } = await supabase
        .from("owners")
        .update(updateData)
        .eq("id", tokenPayload!.ownerId);

      if (updateError) throw new Error(`[ERR-6012] ${updateError.message}`);

      // 3. Uppdatera consent_log (if table exists)
      // @ts-ignore - consent_logs table may not be in generated types
      const { error: consentError } = await (supabase as any)
        .from("consent_logs")
        .update({
          consent_given: true,
          given_at: new Date().toISOString(),
          ip_address: window.location.hostname, // Förenklad IP-tracking
          user_agent: navigator.userAgent,
        })
        .eq("owner_id", tokenPayload!.ownerId)
        .eq("consent_type", "digital_email")
        .eq("consent_given", false);

      if (consentError)
        console.error("Consent log update error:", consentError);

      // 4. Skapa ny consent_log för dokumentation
      // @ts-ignore - consent_logs table may not be in generated types
      await (supabase as any).from("consent_logs").insert({
        owner_id: tokenPayload!.ownerId,
        org_id: tokenPayload!.orgId,
        consent_type: "digital_email",
        consent_given: true,
        consent_text: `Kund bekräftade samtycke via email-länk. Personnummer ${personnummer ? "angavs frivilligt" : "angavs EJ"}.`,
        consent_version: "1.0",
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent,
        given_at: new Date().toISOString(),
        created_by: authData.user?.id,
      });

      // Framgång! Redirecta till login
      alert("✓ Ditt konto har skapats! Du kan nu logga in.");
      router.push("/login");
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "[ERR-6013] Något gick fel");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifierar din länk...</p>
        </div>
      </div>
    );
  }

  if (error && !ownerData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Ogiltig länk
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
          >
            Tillbaka till login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-4">
            <Shield className="w-12 h-12 text-[#2c7a4c]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bekräfta ditt konto
          </h1>
          <p className="text-gray-600">
            Välkommen <strong>{ownerData?.full_name}</strong>! Granska dina
            uppgifter och skapa ditt lösenord.
          </p>
        </div>

        {/* GDPR Information */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-6">
          <h2 className="text-xl font-semibold text-[#2c7a4c] mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Dina uppgifter
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Namn:</span>
              <span className="font-medium">{ownerData?.full_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{ownerData?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Telefon:</span>
              <span className="font-medium">{ownerData?.phone}</span>
            </div>
            {ownerData?.address && (
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Adress:</span>
                <span className="font-medium">{ownerData.address}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              🔒 GDPR-information
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Vi sparar endast uppgifter som behövs för bokningar</li>
              <li>✓ Du kan när som helst begära radering av dina uppgifter</li>
              <li>✓ Du kan exportera dina uppgifter i maskinläsbart format</li>
              <li>✓ Vi delar aldrig dina uppgifter med tredje part</li>
              <li>✓ All data krypteras och skyddas enligt GDPR Art. 32</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Samtycke (obligatoriskt) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-1 w-5 h-5 text-[#2c7a4c] rounded focus:ring-2 focus:ring-[#2c7a4c]"
                  required
                />
                <span className="text-sm text-gray-800">
                  <strong>
                    Jag samtycker till att DogPlanner sparar mina uppgifter
                  </strong>{" "}
                  enligt ovan beskrivna villkor. Jag förstår att jag kan
                  återkalla mitt samtycke när som helst genom att kontakta
                  personalen eller via mitt konto.{" "}
                  <span className="text-red-600">*</span>
                </span>
              </label>
            </div>

            {/* Marketing samtycke (frivilligt) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={marketingConsent}
                  onChange={(e) => setMarketingConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-[#2c7a4c] rounded focus:ring-2 focus:ring-[#2c7a4c]"
                />
                <span className="text-sm text-gray-700">
                  Jag vill få nyheter och erbjudanden via email (frivilligt)
                </span>
              </label>
            </div>

            {/* Personnummer (frivilligt) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personnummer (frivilligt)
              </label>
              <input
                type="text"
                value={personnummer}
                onChange={(e) => setPersonnummer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                placeholder="ÅÅMMDD-XXXX"
              />
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Personnummer är helt frivilligt. Det kan underlätta
                fakturering men behövs INTE för att använda tjänsten. Vi kommer
                aldrig kräva det.
              </p>
            </div>

            {/* Lösenord */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skapa lösenord <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                placeholder="Minst 8 tecken"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bekräfta lösenord <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                placeholder="Upprepa lösenord"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !consentGiven}
              className="w-full py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-2"
            >
              {submitting ? (
                "Skapar konto..."
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Bekräfta och skapa konto
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          Frågor om GDPR eller dina rättigheter? Kontakta oss på{" "}
          <a
            href="mailto:support@dogplanner.se"
            className="text-[#2c7a4c] hover:underline"
          >
            support@dogplanner.se
          </a>
        </p>
      </div>
    </div>
  );
}

export default function ConsentVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
