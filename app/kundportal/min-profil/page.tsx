"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { User, Edit, Save, X } from "lucide-react";

interface OwnerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  personnummer: string | null;
  customer_number: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  contact_person_2: string | null;
  contact_phone_2: string | null;
  gdpr_consent: boolean;
  marketing_consent: boolean;
  photo_consent: boolean;
}

export default function MinProfilPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<OwnerProfile>>({});
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/kundportal/login?redirect=/kundportal/min-profil");
      return;
    }
    if (user) {
      loadProfile();
    }
  }, [user, authLoading, router]);

  async function loadProfile() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await (supabase as any)
        .from("owners")
        .select("*")
        .eq("id", user?.id)
        .single();
      if (dbError) throw dbError;
      setProfile(data);
      setFormData(data);
    } catch (err: any) {
      console.error("[Min profil] Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showNotification(message: string, type: "success" | "error") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleSave() {
    try {
      const { error: updateError } = await (supabase as any)
        .from("owners")
        .update({
          // OBS: full_name kan INTE ändras av kunden - måste ske via pensionatet
          phone: formData.phone,
          address: formData.address,
          postal_code: formData.postal_code,
          city: formData.city,
          contact_person_2: formData.contact_person_2,
          contact_phone_2: formData.contact_phone_2,
          marketing_consent: formData.marketing_consent,
          photo_consent: formData.photo_consent,
        })
        .eq("id", user?.id);
      if (updateError) throw updateError;
      showNotification("Profil uppdaterad!", "success");
      setIsEditing(false);
      loadProfile();
    } catch (err: any) {
      console.error("[Min profil] Fel vid sparande:", err);
      showNotification("Kunde inte spara: " + err.message, "error");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Kunde inte hitta din profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {notification && (
        <div className="fixed top-20 right-4 z-50">
          <div
            className={
              "px-6 py-4 rounded-lg shadow-lg border-2 " +
              (notification.type === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800")
            }
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <User className="h-6 w-6 text-[#2c7a4c]" />
                Min profil
              </h1>
              <p className="text-sm text-gray-500 mt-1">Dina kontouppgifter</p>
            </div>
            {profile.customer_number && (
              <div className="bg-[#E6F4EA] rounded-lg px-3 py-2 text-center">
                <p className="text-xs text-gray-600">Kundnummer</p>
                <p className="text-lg font-bold text-[#2c7a4c]">
                  {profile.customer_number}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-300 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Kontaktuppgifter
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Redigera
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(profile);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Namn
              </label>
              <p className="text-sm text-gray-900 py-2">
                {profile.full_name || "-"}
              </p>
              <p className="text-xs text-gray-400">
                Kontakta pensionatet för att ändra namn
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-post
              </label>
              <p className="text-sm text-gray-900 py-2">
                {profile.email || user?.email || "-"}
              </p>
              <p className="text-xs text-gray-400">
                E-post kan inte ändras här
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefon
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.phone || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Personnummer
              </label>
              <p className="text-sm text-gray-900 py-2">
                {profile.personnummer
                  ? profile.personnummer.substring(0, 8) + "-****"
                  : "-"}
              </p>
              <p className="text-xs text-gray-400">
                Personnummer kan inte ändras
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adress
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.address || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Postnummer
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.postal_code || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.postal_code || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ort
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900 py-2">
                  {profile.city || "-"}
                </p>
              )}
            </div>
          </div>

          {/* Kontaktperson 2 */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Extra kontaktperson (vid nödsituation)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Namn
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.contact_person_2 || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_person_2: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Förnamn Efternamn"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {profile.contact_person_2 || "-"}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefon
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.contact_phone_2 || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone_2: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="070-123 45 67"
                  />
                ) : (
                  <p className="text-sm text-gray-900 py-2">
                    {profile.contact_phone_2 || "-"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Samtycken */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              Samtycken
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">
                  GDPR-samtycke (databehandling)
                </span>
                <span
                  className={
                    "text-sm font-medium " +
                    (profile.gdpr_consent ? "text-green-600" : "text-red-600")
                  }
                >
                  {profile.gdpr_consent ? "Godkänt" : "Ej godkänt"}
                </span>
              </div>
              {isEditing ? (
                <>
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <span className="text-sm text-gray-700">
                      Marknadsföring (nyhetsbrev, erbjudanden)
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.marketing_consent || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marketing_consent: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#2c7a4c] rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <span className="text-sm text-gray-700">
                      Foton på sociala medier
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.photo_consent || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          photo_consent: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-[#2c7a4c] rounded"
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      Marknadsföring
                    </span>
                    <span
                      className={
                        "text-sm font-medium " +
                        (profile.marketing_consent
                          ? "text-green-600"
                          : "text-gray-500")
                      }
                    >
                      {profile.marketing_consent ? "Godkänt" : "Nej"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      Foton på sociala medier
                    </span>
                    <span
                      className={
                        "text-sm font-medium " +
                        (profile.photo_consent
                          ? "text-green-600"
                          : "text-gray-500")
                      }
                    >
                      {profile.photo_consent ? "Godkänt" : "Nej"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-6 mt-6 border-t">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Spara ändringar
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(profile);
                }}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Avbryt
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
