"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SWEDISH_LAN, KOMMUNER_BY_LAN } from "@/lib/swedishLocations";

export default function RegisterCompanyPage() {
  const router = useRouter();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Nya fält för location + service type
  const [lan, setLan] = useState("");
  const [kommun, setKommun] = useState("");
  const [serviceType, setServiceType] = useState<string[]>([]);

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

    if (!firstName.trim()) return setErr("Förnamn är obligatoriskt.");
    if (!lastName.trim()) return setErr("Efternamn är obligatoriskt.");
    if (!email.trim()) return setErr("E-post är obligatoriskt.");
    if (!phone.trim()) return setErr("Telefonnummer är obligatoriskt.");
    if (!orgName.trim()) return setErr("Företagsnamn är obligatoriskt.");
    if (!orgNumber.trim())
      return setErr("Organisationsnummer är obligatoriskt.");
    if (!lan.trim()) return setErr("Välj län.");
    if (!kommun.trim()) return setErr("Välj kommun.");
    if (serviceType.length === 0) return setErr("Välj minst en tjänstetyp.");
    if (!password.trim() || password.length < 6)
      return setErr("Välj ett lösenord med minst 6 tecken.");
    if (!acceptedTerms)
      return setErr("Du måste godkänna våra villkor för att fortsätta.");

    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // 🟢 Skapa användaren i Supabase
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone.trim(),
            org_name: orgName.trim(),
            org_number: orgNumber.trim(),
            lan: lan.trim(),
            kommun: kommun.trim(),
            service_types: serviceType, // Array av valda tjänster
          },
          // Efter bekräftelse skickas användaren till /login
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
        },
      });

      if (error) throw error;

      // ✅ Skicka till "tack"-sidan
      router.push("/register/success");
    } catch (e: any) {
      setErr(e?.message || "Ett oväntat fel inträffade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-[#2c7a4c] text-center mb-2">
          Registrera dig
        </h1>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Förnamn */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Förnamn
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="Ditt förnamn"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>

          {/* Efternamn */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Efternamn
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="Ditt efternamn"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>

          {/* E-post */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              E-post
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="din@email.se"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Telefonnummer */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Telefonnummer
            </label>
            <input
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="070-123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Företagets namn */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Företagets namn
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="Ditt företag AB"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          {/* Organisationsnummer */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Organisationsnummer
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="123456-7890"
              value={orgNumber}
              onChange={(e) => setOrgNumber(e.target.value)}
              required
            />
          </div>

          {/* Län */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Län <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              value={lan}
              onChange={(e) => {
                setLan(e.target.value);
                setKommun(""); // Reset kommun when län changes
              }}
              required
            >
              <option value="">Välj län...</option>
              {SWEDISH_LAN.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Detta hjälper kunder hitta er via lokalsökning
            </p>
          </div>

          {/* Kommun */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Kommun <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={kommun}
              onChange={(e) => setKommun(e.target.value)}
              disabled={!lan}
              required
            >
              <option value="">
                {lan ? "Välj kommun..." : "Välj län först..."}
              </option>
              {lan &&
                KOMMUNER_BY_LAN[lan]?.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
            </select>
          </div>

          {/* Tjänstetyper */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Vilka tjänster erbjuder ni?{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceType.includes("hunddagis")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setServiceType([...serviceType, "hunddagis"]);
                    } else {
                      setServiceType(
                        serviceType.filter((t) => t !== "hunddagis")
                      );
                    }
                  }}
                  className="w-4 h-4 text-[#2c7a4c] focus:ring-[#2c7a4c]"
                />
                <span className="font-medium">🐕 Hunddagis</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceType.includes("hundpensionat")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setServiceType([...serviceType, "hundpensionat"]);
                    } else {
                      setServiceType(
                        serviceType.filter((t) => t !== "hundpensionat")
                      );
                    }
                  }}
                  className="w-4 h-4 text-[#2c7a4c] focus:ring-[#2c7a4c]"
                />
                <span className="font-medium">🏠 Hundpensionat</span>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceType.includes("hundfrisor")}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setServiceType([...serviceType, "hundfrisor"]);
                    } else {
                      setServiceType(
                        serviceType.filter((t) => t !== "hundfrisor")
                      );
                    }
                  }}
                  className="w-4 h-4 text-[#2c7a4c] focus:ring-[#2c7a4c]"
                />
                <span className="font-medium">✂️ Hundfrisör</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Välj alla tjänster ni erbjuder. Ni kan ändra detta senare.
            </p>
          </div>

          {/* Lösenord */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-900">
              Lösenord
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
              placeholder="Minst 6 tecken"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Villkor */}
          <div className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#2c7a4c] focus:ring-[#2c7a4c]"
              required
            />
            <label htmlFor="terms" className="text-sm text-gray-700">
              Jag godkänner DogPlanners allmänna villkor.
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white font-semibold py-3 rounded-lg text-base shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Skapar konto…" : "Skapa konto"}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Har du redan konto?{" "}
            <Link
              href="/login"
              className="text-[#2c7a4c] font-semibold hover:underline hover:text-[#236139]"
            >
              Logga in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
