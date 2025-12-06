"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SubData = {
  status?: string;
  trial_ends_at?: string | null;
  expired: boolean;
  plan?: "basic" | "kombi" | "full";
  stripe_customer_id?: string;
  customer_number?: string;
  org_name?: string;
  period_end?: string | null;
};

type Invoice = {
  id: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  due_date: string;
  paid_at?: string;
  invoice_number: string;
};

export default function SubscriptionPage() {
  const supabase = createClient();

  const { user, subscription, loading } = useAuth();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subInfo, setSubInfo] = useState<SubData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "kombi" | "full">(
    "basic"
  );
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (subscription) {
      setSubInfo(subscription);
    }
    if (user?.email) setEmail(user.email);
    if (user?.user_metadata?.phone) setPhone(user.user_metadata.phone);

    // Hämta org_name från user metadata eller organisation
    if (user?.user_metadata?.org_name) {
      setOrgName(user.user_metadata.org_name);
    }
  }, [subscription, user]);

  // Ladda fakturor
  useEffect(() => {
    if (!user) return;
    loadInvoices();
  }, [user]);

  async function loadInvoices() {
    if (!supabase || !user) return;

    try {
      // Hämta fakturor från databasen
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Konvertera till vårt format
      const formattedInvoices: Invoice[] = (data || []).map((inv: any) => ({
        id: inv.id,
        amount: inv.total_amount || 0,
        status: inv.payment_status || "pending",
        due_date: inv.due_date,
        paid_at: inv.paid_at,
        invoice_number: inv.invoice_number || `INV-${inv.id.slice(0, 8)}`,
      }));

      setInvoices(formattedInvoices);
    } catch (e: any) {
      console.error("Kunde inte ladda fakturor:", e);
    }
  }

  async function handleUpdateProfile() {
    if (!supabase || !user) return;

    try {
      setUpdating(true);
      setError(null);
      setMessage(null);

      // Uppdatera email och phone i auth metadata
      const updates: any = {};
      if (email !== user.email) {
        updates.email = email;
      }
      if (phone) {
        updates.data = { phone: phone };
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.auth.updateUser(updates);
        if (updateError) throw updateError;
      }

      setMessage("✅ Dina uppgifter har uppdaterats");
      setEditing(false);
    } catch (e: any) {
      setError(e.message || "Kunde inte uppdatera uppgifter");
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancelSubscription() {
    if (!supabase || !user) return;

    try {
      setUpdating(true);
      setError(null);

      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      // Avsluta abonnemang via API
      const res = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error || "Kunde inte avsluta abonnemang");

      setMessage("⚠️ Ditt abonnemang har avslutats. Kontot är nu låst.");
      setSubInfo({ ...subInfo, status: "canceled", expired: true });
      setShowCancelModal(false);

      // Reload page efter 2 sekunder
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleReactivate() {
    if (!supabase) return;

    try {
      setUpdating(true);
      setError(null);

      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch("/api/subscription/reactivate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Kunde inte återaktivera");

      setMessage("🎉 Ditt abonnemang har återaktiverats!");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleChangePlan() {
    if (!supabase || !user) return;

    try {
      setUpdating(true);
      setError(null);
      setMessage(null);

      // Uppdatera plan i databasen (profiles tabellen)
      const { error: updateError } = await supabase
        .from("profiles")
        // @ts-expect-error - subscription_plan kolumnen finns men saknas i Supabase type definition
        .update({ subscription_plan: selectedPlan })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setMessage(
        `✅ Ditt abonnemang har ändrats till ${
          selectedPlan === "basic"
            ? "Basic"
            : selectedPlan === "kombi"
              ? "Kombi"
              : "Full"
        }!`
      );
      if (subInfo) {
        setSubInfo({
          ...subInfo,
          plan: selectedPlan,
          expired: subInfo.expired || false,
        });
      }
      setShowChangePlanModal(false);

      // Reload efter 2 sekunder
      setTimeout(() => window.location.reload(), 2000);
    } catch (e: any) {
      setError(e.message || "Kunde inte ändra abonnemang");
    } finally {
      setUpdating(false);
    }
  }

  async function handleUpgrade() {
    if (!supabase) {
      setError("Databaskoppling saknas");
      return;
    }

    try {
      setUpdating(true);
      setMessage(null);
      setError(null);

      // ✅ Här kan du antingen:
      // 1. Köra Stripe Checkout (rekommenderat)
      // 2. Eller simulera en manuell aktivering (för test)

      // Exempel: Simulerad uppgradering (ingen Stripe än)
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (!res.ok)
        throw new Error(
          json?.error || "Kunde inte uppgradera prenumerationen."
        );

      setMessage("🎉 Ditt konto är nu aktiverat!");
      setSubInfo({ ...subInfo, status: "active", expired: false });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        <p>Laddar...</p>
      </main>
    );
  }

  const trialEndDate = subInfo?.trial_ends_at
    ? new Date(subInfo.trial_ends_at).toLocaleDateString("sv-SE")
    : null;

  const expired = subInfo?.expired || false;
  const active = subInfo?.status === "active";
  const canceled = subInfo?.status === "canceled";
  const locked = expired || canceled;

  // Plan info
  const planNames = {
    basic: "Basic",
    kombi: "Kombi",
    full: "Full",
  };
  const planPrices = {
    basic: 99,
    kombi: 199,
    full: 299,
  };
  const currentPlan = subInfo?.plan || "basic";
  const customerNumber =
    subInfo?.customer_number || `KD-${user?.id?.slice(0, 8).toUpperCase()}`;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Kompakt header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-[#2C7A4C] transition-colors"
            >
              ← Tillbaka
            </Link>
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Mitt Abonnemang
            </h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Messages */}
        {message && (
          <div className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-800 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Locked Warning */}
        {locked && (
          <div className="mb-6 rounded-md border-2 border-orange-400 bg-orange-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">
                  {canceled ? "Abonnemang avslutat" : "Kontot är låst"}
                </h3>
                <p className="text-orange-800 text-sm mb-3">
                  {canceled
                    ? `Ditt abonnemang har avslutats. Du kan fortfarande se dina uppgifter men inte göra ändringar. ${
                        subInfo?.period_end
                          ? `Abonnemanget löper ut ${new Date(
                              subInfo.period_end
                            ).toLocaleDateString("sv-SE")}.`
                          : ""
                      }`
                    : "Din betalning är förfallen. Kontot låses tills fakturan betalas."}
                </p>
                {canceled && (
                  <button
                    onClick={handleReactivate}
                    disabled={updating}
                    className="px-6 py-2.5 h-10 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-medium transition disabled:opacity-50 text-sm"
                  >
                    {updating ? "Aktiverar..." : "Starta abonnemang igen"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Left Side - Overview */}
          <div className="space-y-5">
            {/* Company & Subscription Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Företagsuppgifter
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Företag</span>
                  <span className="font-medium text-gray-900">
                    {orgName || "Inget namn angivet"}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Kundnummer</span>
                  <span className="font-mono font-medium text-gray-900">
                    {customerNumber}
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Nuvarande plan</span>
                  <span className="font-semibold text-[#2C7A4C]">
                    {planNames[currentPlan]} ({planPrices[currentPlan]} kr/mån)
                  </span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={`font-medium ${
                      active
                        ? "text-green-600"
                        : canceled
                          ? "text-gray-600"
                          : "text-orange-600"
                    }`}
                  >
                    {active ? "✓ Aktiv" : canceled ? "Avslutad" : "Låst"}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Betalning</span>
                  <span className="font-medium text-gray-900">
                    1 månad i förväg
                  </span>
                </div>
              </div>

              {active && !canceled && (
                <button
                  onClick={() => setShowChangePlanModal(true)}
                  disabled={locked}
                  className="mt-4 w-full py-2 bg-[#2C7A4C] text-white rounded-md hover:bg-[#236139] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Byt abonnemang
                </button>
              )}
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Kontaktuppgifter
                </h2>
                {!editing && !locked && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[#2C7A4C] hover:underline font-semibold text-sm"
                  >
                    Ändra
                  </button>
                )}
              </div>{" "}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    E-post
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {email || user?.email || "Ingen"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Telefon
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="070-123 45 67"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    />
                  ) : (
                    <div className="text-sm text-gray-900">
                      {phone || "Ej angivet"}
                    </div>
                  )}
                </div>

                {editing && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 bg-[#2c7a4c] text-white py-2 rounded-md hover:bg-[#236139] font-medium transition disabled:opacity-50 text-sm"
                    >
                      {updating ? "Sparar..." : "Spara"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 font-medium transition text-sm"
                    >
                      Avbryt
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Button */}
            {active && !canceled && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-2 text-red-600 hover:bg-red-50 rounded-md border border-red-300 font-medium transition text-sm"
              >
                Avsluta abonnemang
              </button>
            )}
          </div>

          {/* Right Side - Invoices */}
          <div className="space-y-5">
            <div className="bg-white rounded-md shadow-sm border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Fakturor
              </h2>

              {invoices.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">
                  Inga fakturor ännu
                </p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between border border-gray-200 rounded-md p-3"
                    >
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {inv.invoice_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          Förfaller:{" "}
                          {new Date(inv.due_date).toLocaleDateString("sv-SE")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 text-sm">
                          {inv.amount} kr
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            inv.status === "paid"
                              ? "text-green-600"
                              : inv.status === "overdue"
                                ? "text-red-600"
                                : "text-orange-600"
                          }`}
                        >
                          {inv.status === "paid"
                            ? "✓ Betald"
                            : inv.status === "overdue"
                              ? "Förfallen"
                              : "Väntar"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center gap-2">
                <span>💡</span> Viktigt att veta
              </h3>
              <ul className="text-xs text-blue-800 space-y-1.5">
                <li>• Betalas alltid 1 månad i förväg</li>
                <li>• Utebliven betalning låser kontot automatiskt</li>
                <li>• Vid avslut fortsätter tjänsten till periodens slut</li>
                <li>• Ingen återbetalning vid avslut mitt i perioden</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Vill du avsluta ditt abonnemang?
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                Om du avslutar nu får du fortsätta använda tjänsten till{" "}
                {subInfo?.period_end
                  ? new Date(subInfo.period_end).toLocaleDateString("sv-SE")
                  : "periodens slut"}
                .
              </p>
              <p className="text-gray-600 text-sm mb-5">
                Efter det låses ditt konto och du kan bara se dina uppgifter,
                inte göra ändringar. Du kan alltid starta abonnemanget igen.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={updating}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-md hover:bg-red-700 font-medium transition disabled:opacity-50 text-sm"
                >
                  {updating ? "Avslutar..." : "Ja, avsluta"}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md hover:bg-gray-200 font-medium transition text-sm"
                >
                  Nej, behåll
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Plan Modal */}
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-md shadow-xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Välj nytt abonnemang
              </h3>

              <div className="space-y-3 mb-5">
                <label className="flex items-start gap-3 p-4 border-2 rounded-md cursor-pointer hover:border-[#2c7a4c] transition">
                  <input
                    type="radio"
                    name="plan"
                    value="basic"
                    checked={selectedPlan === "basic"}
                    onChange={(e) => setSelectedPlan(e.target.value as "basic")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Basic - 99 kr/mån
                    </div>
                    <div className="text-sm text-gray-600">
                      En tjänst (Hunddagis eller Pensionat eller Frisör)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-md cursor-pointer hover:border-[#2c7a4c] transition">
                  <input
                    type="radio"
                    name="plan"
                    value="kombi"
                    checked={selectedPlan === "kombi"}
                    onChange={(e) => setSelectedPlan(e.target.value as "kombi")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Kombi - 199 kr/mån
                    </div>
                    <div className="text-sm text-gray-600">
                      Två tjänster (t.ex. Hunddagis + Pensionat)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-md cursor-pointer hover:border-[#2c7a4c] transition">
                  <input
                    type="radio"
                    name="plan"
                    value="full"
                    checked={selectedPlan === "full"}
                    onChange={(e) => setSelectedPlan(e.target.value as "full")}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      Full - 299 kr/mån
                    </div>
                    <div className="text-sm text-gray-600">
                      Alla tjänster (Hunddagis + Pensionat + Frisör)
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleChangePlan}
                  disabled={updating}
                  className="flex-1 bg-[#2c7a4c] text-white py-2.5 rounded-md hover:bg-[#236139] font-medium transition disabled:opacity-50 text-sm"
                >
                  {updating ? "Uppdaterar..." : "Byt abonnemang"}
                </button>
                <button
                  onClick={() => setShowChangePlanModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md hover:bg-gray-200 font-medium transition text-sm"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
