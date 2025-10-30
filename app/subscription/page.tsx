"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
};

type Invoice = {
  id: string;
  amount: number;
  status: "paid" | "pending" | "overdue";
  due_date: string;
  paid_date?: string;
  invoice_number: string;
};

export default function SubscriptionPage() {
  const { user, subscription, loading } = useAuth();
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subInfo, setSubInfo] = useState<SubData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (subscription) setSubInfo(subscription);
    if (user?.email) setEmail(user.email);
  }, [subscription, user]);

  // Ladda fakturor
  useEffect(() => {
    if (!user) return;
    loadInvoices();
  }, [user]);

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
        paid_date: inv.paid_at,
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
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-[#2c7a4c] hover:underline mb-4 inline-block"
          >
            ← Tillbaka till Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Ditt Abonnemang</h1>
          <p className="text-gray-600 mt-2">
            Hantera ditt konto och betalningar
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-6 py-4 text-green-800">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-6 py-4 text-red-700">
            {error}
          </div>
        )}

        {/* Locked Warning */}
        {locked && (
          <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-bold text-orange-900 mb-1">
                  {canceled ? "⚠️ Abonnemang avslutat" : "⚠️ Konto låst"}
                </h3>
                <p className="text-orange-800 text-sm">
                  {canceled
                    ? "Ditt abonnemang har avslutats. Du kan inte göra några ändringar förrän du återaktiverar ditt konto."
                    : "Din betalning är förfallen. Kontot är låst tills fakturan betalas."}
                </p>
                {canceled && (
                  <button
                    onClick={handleReactivate}
                    disabled={updating}
                    className="mt-4 px-6 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] font-semibold transition disabled:opacity-50"
                  >
                    {updating ? "Bearbetar..." : "Återaktivera Abonnemang"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Plan Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Nuvarande Plan
              </h2>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-3xl font-bold text-[#2c7a4c]">
                    {planNames[currentPlan]}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {planPrices[currentPlan]} kr/månad
                  </div>
                </div>
                <div
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    active
                      ? "bg-green-100 text-green-800"
                      : canceled
                      ? "bg-gray-100 text-gray-800"
                      : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {active ? "✓ Aktiv" : canceled ? "Avslutad" : "Låst"}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kundnummer:</span>
                  <span className="font-mono font-semibold">
                    {customerNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betalas:</span>
                  <span className="font-semibold">1 månad i förväg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betalmetod:</span>
                  <span className="font-semibold">Stripe</span>
                </div>
              </div>

              {active && !canceled && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="mt-4 w-full py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition"
                >
                  Avsluta Abonnemang
                </button>
              )}
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Kontouppgifter
                </h2>
                {!editing && !locked && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[#2c7a4c] hover:underline font-medium"
                  >
                    Redigera
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-postadress
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    />
                  ) : (
                    <div className="text-gray-900">
                      {email || user?.email || "Ingen"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefonnummer
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="070-123 45 67"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    />
                  ) : (
                    <div className="text-gray-900">{phone || "Ej angivet"}</div>
                  )}
                </div>

                {editing && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex-1 bg-[#2c7a4c] text-white py-2 rounded-lg hover:bg-[#236139] font-semibold transition disabled:opacity-50"
                    >
                      {updating ? "Sparar..." : "Spara"}
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-semibold transition"
                    >
                      Avbryt
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Invoices Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Fakturor
              </h2>

              {invoices.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  Inga fakturor ännu
                </p>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">
                          {inv.invoice_number}
                        </div>
                        <div className="text-sm text-gray-600">
                          Förfaller:{" "}
                          {new Date(inv.due_date).toLocaleDateString("sv-SE")}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {inv.amount} kr
                        </div>
                        <div
                          className={`text-sm font-semibold ${
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
          </div>

          {/* Right Column - Plan Options */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Planer</h3>

              <div className="space-y-3">
                <div
                  className={`border-2 rounded-lg p-4 ${
                    currentPlan === "basic"
                      ? "border-[#2c7a4c] bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="font-bold text-gray-900">Basic</div>
                  <div className="text-2xl font-bold text-[#2c7a4c] my-2">
                    99 kr<span className="text-sm text-gray-600">/mån</span>
                  </div>
                  <div className="text-sm text-gray-600">En tjänst</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Hunddagis eller Pensionat eller Frisör
                  </div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 ${
                    currentPlan === "kombi"
                      ? "border-[#2c7a4c] bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="font-bold text-gray-900">Kombi</div>
                  <div className="text-2xl font-bold text-[#2c7a4c] my-2">
                    199 kr<span className="text-sm text-gray-600">/mån</span>
                  </div>
                  <div className="text-sm text-gray-600">Två tjänster</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Hunddagis + Pensionat eller andra kombinationer
                  </div>
                </div>

                <div
                  className={`border-2 rounded-lg p-4 ${
                    currentPlan === "full"
                      ? "border-[#2c7a4c] bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="font-bold text-gray-900">Full</div>
                  <div className="text-2xl font-bold text-[#2c7a4c] my-2">
                    299 kr<span className="text-sm text-gray-600">/mån</span>
                  </div>
                  <div className="text-sm text-gray-600">Alla tjänster</div>
                  <div className="text-xs text-gray-500 mt-2">
                    Hunddagis + Pensionat + Frisör
                  </div>
                </div>
              </div>

              {active && !canceled && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  <Link
                    href="/pricing"
                    className="text-[#2c7a4c] hover:underline font-medium"
                  >
                    Byt plan →
                  </Link>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-2">💡 Tips</h3>
              <p className="text-sm text-blue-800">
                Alla abonnemang betalas 1 månad i förväg. Om betalning uteblir
                låses kontot automatiskt.
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Avsluta Abonnemang?
              </h3>
              <p className="text-gray-600 mb-6">
                Är du säker på att du vill avsluta ditt abonnemang? Ditt konto
                kommer att låsas och du kommer inte kunna göra några ändringar
                förrän du återaktiverar det.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelSubscription}
                  disabled={updating}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition disabled:opacity-50"
                >
                  {updating ? "Avslutar..." : "Ja, avsluta"}
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-semibold transition"
                >
                  Nej, behåll
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
