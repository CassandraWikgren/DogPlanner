"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dog, Plus, Edit, Trash2, X, Save, Upload } from "lucide-react";
import type { Database } from "@/types/database";

type DogProfile = Database["public"]["Tables"]["dogs"]["Row"];

interface DogFormData {
  name: string;
  breed: string;
  birth: string;
  heightcm: number | null;
  vaccdhp: string;
  vaccpi: string;
  notes: string;
  photo_url: string;
}

const INITIAL_FORM: DogFormData = {
  name: "",
  breed: "",
  birth: "",
  heightcm: null,
  vaccdhp: "",
  vaccpi: "",
  notes: "",
  photo_url: "",
};

export default function MinaHundarPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDog, setEditingDog] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<DogFormData>(INITIAL_FORM);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/kundportal/login?redirect=/kundportal/mina-hundar");
      return;
    }

    if (user) {
      loadDogs();
    }
  }, [user, authLoading, router]);

  async function loadDogs() {
    setLoading(true);
    setError(null);

    try {
      const ownerId = user?.id;

      const { data, error: dbError } = await (supabase as any)
        .from("dogs")
        .select("*")
        .eq("owner_id", ownerId)
        .order("name");

      if (dbError) throw dbError;

      setDogs(data || []);
    } catch (err: any) {
      console.error("[Mina hundar] Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showNotification(message: string, type: "success" | "error") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function handleEdit(dog: DogProfile) {
    setEditingDog(dog.id);
    setFormData({
      name: dog.name,
      breed: dog.breed || "",
      birth: dog.birth || "",
      heightcm: dog.heightcm,
      vaccdhp: dog.vaccdhp || "",
      vaccpi: dog.vaccpi || "",
      notes: dog.notes || "",
      photo_url: dog.photo_url || "",
    });
    setIsAddingNew(false);
  }

  function handleAddNew() {
    setIsAddingNew(true);
    setEditingDog(null);
    setFormData(INITIAL_FORM);
  }

  function handleCancel() {
    setIsAddingNew(false);
    setEditingDog(null);
    setFormData(INITIAL_FORM);
  }

  async function handleSave() {
    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      if (isAddingNew) {
        // Skapa ny hund
        const { error: insertError } = await (supabase as any)
          .from("dogs")
          .insert({
            owner_id: user?.id,
            org_id: orgId,
            name: formData.name,
            breed: formData.breed,
            birth: formData.birth || null,
            heightcm: formData.heightcm,
            vaccdhp: formData.vaccdhp || null,
            vaccpi: formData.vaccpi || null,
            notes: formData.notes || null,
            photo_url: formData.photo_url || null,
          });

        if (insertError) throw insertError;

        showNotification("✅ Hund tillagd!", "success");
      } else if (editingDog) {
        // Uppdatera befintlig hund
        const { error: updateError } = await (supabase as any)
          .from("dogs")
          .update({
            name: formData.name,
            breed: formData.breed,
            birth: formData.birth || null,
            heightcm: formData.heightcm,
            vaccdhp: formData.vaccdhp || null,
            vaccpi: formData.vaccpi || null,
            notes: formData.notes || null,
            photo_url: formData.photo_url || null,
          })
          .eq("id", editingDog);

        if (updateError) throw updateError;

        showNotification("✅ Hund uppdaterad!", "success");
      }

      handleCancel();
      loadDogs();
    } catch (err: any) {
      console.error("[Mina hundar] Fel vid sparande:", err);
      showNotification(`❌ Kunde inte spara: ${err.message}`, "error");
    }
  }

  async function handleDelete(dogId: string, dogName: string) {
    if (
      !confirm(
        `Är du säker på att du vill ta bort ${dogName}? Detta går inte att ångra.`
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await (supabase as any)
        .from("dogs")
        .delete()
        .eq("id", dogId);

      if (deleteError) throw deleteError;

      showNotification("✅ Hund borttagen", "success");
      loadDogs();
    } catch (err: any) {
      console.error("[Mina hundar] Fel vid borttagning:", err);
      showNotification(`❌ Kunde inte ta bort: ${err.message}`, "error");
    }
  }

  function getSizeCategory(heightcm: number | null): string {
    if (!heightcm) return "Okänd";
    if (heightcm <= 34) return "Liten (0-34 cm)";
    if (heightcm <= 49) return "Mellan (35-49 cm)";
    return "Stor (50+ cm)";
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg border-2 ${
              notification.type === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center pt-20 pb-28"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url('/Hero.jpeg')`,
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            🐕 Mina hundar
          </h1>
          <p className="text-xl text-white/90">
            Hantera och uppdatera dina hundprofiler
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Add New Button */}
        {!isAddingNew && !editingDog && (
          <div className="mb-6 flex justify-between items-center">
            <Link
              href="/kundportal/dashboard"
              className="text-[#2c7a4c] hover:underline"
            >
              ← Tillbaka till portal
            </Link>
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Lägg till hund
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAddingNew || editingDog) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isAddingNew ? "Lägg till ny hund" : "Redigera hundprofil"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Namn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Namn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="T.ex. Bella"
                  required
                />
              </div>

              {/* Ras */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ras
                </label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) =>
                    setFormData({ ...formData, breed: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="T.ex. Golden Retriever"
                />
              </div>

              {/* Födelsedatum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Födelsedatum
                </label>
                <input
                  type="date"
                  value={formData.birth}
                  onChange={(e) =>
                    setFormData({ ...formData, birth: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              </div>

              {/* Mankhöjd */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mankhöjd (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.heightcm || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heightcm: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="T.ex. 45"
                  required
                />
                {formData.heightcm && (
                  <p className="text-sm text-gray-600 mt-1">
                    Storlek: {getSizeCategory(formData.heightcm)}
                  </p>
                )}
              </div>

              {/* Vaccination DHP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vaccination DHP (datum)
                </label>
                <input
                  type="date"
                  value={formData.vaccdhp}
                  onChange={(e) =>
                    setFormData({ ...formData, vaccdhp: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              </div>

              {/* Vaccination PI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vaccination PI (datum)
                </label>
                <input
                  type="date"
                  value={formData.vaccpi}
                  onChange={(e) =>
                    setFormData({ ...formData, vaccpi: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              </div>

              {/* Foto URL (placeholder) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto URL
                </label>
                <input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, photo_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="https://..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  (Bilduppladdning kommer snart)
                </p>
              </div>

              {/* Anteckningar */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anteckningar (mat, allergier, beteende)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="Skriv om matpreferenser, allergier, beteende, mediciner etc."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.heightcm}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Spara
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Dogs List */}
        {!isAddingNew && !editingDog && (
          <div className="space-y-4">
            {dogs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <Dog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Inga hundar ännu
                </h3>
                <p className="text-gray-600 mb-6">
                  Lägg till din första hund för att kunna göra bokningar
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium"
                >
                  Lägg till hund
                </button>
              </div>
            ) : (
              dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      {/* Photo */}
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                        {dog.photo_url ? (
                          <img
                            src={dog.photo_url}
                            alt={dog.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Dog className="w-10 h-10 text-gray-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-1">
                          {dog.name}
                        </h3>
                        {dog.breed && (
                          <p className="text-sm text-gray-600 mb-1">
                            🐾 {dog.breed}
                          </p>
                        )}
                        {dog.heightcm && (
                          <p className="text-sm text-gray-600 mb-1">
                            📏 {dog.heightcm} cm (
                            {getSizeCategory(dog.heightcm)})
                          </p>
                        )}
                        {dog.birth && (
                          <p className="text-sm text-gray-600 mb-1">
                            🎂 Född: {dog.birth}
                          </p>
                        )}
                        {(dog.vaccdhp || dog.vaccpi) && (
                          <p className="text-sm text-gray-600 mb-1">
                            💉 Vaccinationer:{" "}
                            {dog.vaccdhp && `DHP: ${dog.vaccdhp}`}
                            {dog.vaccdhp && dog.vaccpi && ", "}
                            {dog.vaccpi && `PI: ${dog.vaccpi}`}
                          </p>
                        )}
                        {dog.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            📝 {dog.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(dog)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dog.id, dog.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
