"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterCompanyPage() {
  const router = useRouter();

  // Form state
  const [orgName, setOrgName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!supabase) {
      setErr("Databaskoppling saknas");
      return;
    }

    if (!orgName.trim()) return setErr("Företagsnamn är obligatoriskt.");
    if (!orgNumber.trim())
      return setErr("Organisationsnummer är obligatoriskt.");
    if (!email.trim()) return setErr("E-post är obligatoriskt.");
    if (!password.trim() || password.length < 6)
      return setErr("Välj ett lösenord med minst 6 tecken.");
    if (!acceptedTerms)
      return setErr("Du måste godkänna våra villkor för att fortsätta.");

    setSubmitting(true);
    try {
      // 🟢 Skapa användaren i Supabase
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || null,
            org_name: orgName.trim(),
            org_number: orgNumber.trim(),
          },
          // Efter bekräftelse skickas användaren till /login
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
        },
      });

      if (error) throw error;

      // ✅ Skicka till "tack"-sidan
      router.replace(
        `/register/success?org=${encodeURIComponent(
          orgName
        )}&email=${encodeURIComponent(email)}`
      );
    } catch (e: any) {
      setErr(e?.message || "Ett oväntat fel inträffade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c7a4c] mb-2">
          Skapa konto för företag
        </h1>
        <p className="text-gray-600 mb-6">
          Ange företagets uppgifter. Du blir administratör för kontot.
        </p>

        {err && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Företagsinformation */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Företagsnamn
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Hunddagis AB"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Organisationsnummer
            </label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: 559123-4567"
              value={orgNumber}
              onChange={(e) => setOrgNumber(e.target.value)}
              required
            />
          </div>

          {/* Användaruppgifter */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ditt namn (valfritt)
              </label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="För- och efternamn"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-post</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                placeholder="namn@exempel.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lösenord</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder="Minst 6 tecken"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Villkor */}
          <div className="flex items-start gap-2 mt-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1"
              required
            />
            <label className="text-sm text-gray-700">
              Jag godkänner{" "}
              <a
                href="/terms"
                target="_blank"
                className="text-[#2c7a4c] hover:underline"
              >
                DogPlanners allmänna villkor
              </a>
              .
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-[#2c7a4c] hover:bg-green-800 text-white font-semibold py-2"
          >
            {submitting ? "Skapar konto…" : "Skapa konto"}
          </button>

          <p className="text-center text-sm text-gray-600 mt-3">
            Har du redan konto?{" "}
            <a href="/login" className="text-[#2c7a4c] hover:underline">
              Logga in
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
