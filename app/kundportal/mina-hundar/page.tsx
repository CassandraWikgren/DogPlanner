"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Dog, Plus, Edit, Trash2, X, Save, Camera } from "lucide-react";
import type { Database } from "@/types/database";
import { DOG_BREEDS } from "@/lib/dogBreeds";

type DogProfile = Database["public"]["Tables"]["dogs"]["Row"];

interface DogFormData {
  name: string;
  breed: string;
  birth: string;
  heightcm: number | null;
  gender: string;
  vaccdhp: string;
  vaccpi: string;
  insurance_company: string;
  insurance_number: string;
  is_castrated: boolean;
  destroys_things: boolean;
  is_house_trained: boolean;
  is_escape_artist: boolean;
  can_be_with_other_dogs: boolean;
  allergies: string;
  medications: string;
  food_info: string;
  behavior_notes: string;
  medical_notes: string;
  notes: string;
  photo_url: string;
}

const INITIAL_FORM: DogFormData = {
  name: "",
  breed: "",
  birth: "",
  heightcm: null,
  gender: "",
  vaccdhp: "",
  vaccpi: "",
  insurance_company: "",
  insurance_number: "",
  is_castrated: false,
  destroys_things: false,
  is_house_trained: true,
  is_escape_artist: false,
  can_be_with_other_dogs: true,
  allergies: "",
  medications: "",
  food_info: "",
  behavior_notes: "",
  medical_notes: "",
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
      gender: (dog as any).gender || "",
      vaccdhp: dog.vaccdhp || "",
      vaccpi: dog.vaccpi || "",
      insurance_company: (dog as any).insurance_company || "",
      insurance_number: (dog as any).insurance_number || "",
      is_castrated: (dog as any).is_castrated || false,
      destroys_things: (dog as any).destroys_things || false,
      is_house_trained: (dog as any).is_house_trained !== false,
      is_escape_artist: (dog as any).is_escape_artist || false,
      can_be_with_other_dogs: (dog as any).can_be_with_other_dogs !== false,
      allergies: (dog as any).allergies || "",
      medications: (dog as any).medications || "",
      food_info: (dog as any).food_info || "",
      behavior_notes: (dog as any).behavior_notes || "",
      medical_notes: (dog as any).medical_notes || "",
      notes: dog.notes || "",
      photo_url: dog.photo_url || "",
    });
    setPreviewUrl(dog.photo_url || null);
    setIsAddingNew(false);
  }

  function handleAddNew() {
    setIsAddingNew(true);
    setEditingDog(null);
    setFormData(INITIAL_FORM);
    setPreviewUrl(null);
  }

  function handleCancel() {
    setIsAddingNew(false);
    setEditingDog(null);
    setFormData(INITIAL_FORM);
    setPreviewUrl(null);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("dogId", editingDog || "new");
      const response = await fetch("/api/upload-dog-photo", {
        method: "POST",
        body: formDataUpload,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Uppladdning misslyckades");
      }
      setFormData({ ...formData, photo_url: result.url });
      setPreviewUrl(result.url);
      showNotification("Bild uppladdad!", "success");
    } catch (err: any) {
      console.error("[Bilduppladdning] Fel:", err);
      showNotification(err.message, "error");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    try {
      // 🛡️ VIKTIGT: Kundportal-hundar ska ALDRIG ha org_id!
      // org_id sätts ENDAST när pensionatet godkänner en bokning
      // Detta förhindrar att kundhundar dyker upp på hunddagis-listan
      const dogData = {
        name: formData.name,
        breed: formData.breed,
        birth: formData.birth || null,
        heightcm: formData.heightcm,
        gender: formData.gender || null,
        vaccdhp: formData.vaccdhp || null,
        vaccpi: formData.vaccpi || null,
        insurance_company: formData.insurance_company || null,
        insurance_number: formData.insurance_number || null,
        is_castrated: formData.is_castrated,
        destroys_things: formData.destroys_things,
        is_house_trained: formData.is_house_trained,
        is_escape_artist: formData.is_escape_artist,
        can_be_with_other_dogs: formData.can_be_with_other_dogs,
        allergies: formData.allergies || null,
        medications: formData.medications || null,
        food_info: formData.food_info || null,
        behavior_notes: formData.behavior_notes || null,
        medical_notes: formData.medical_notes || null,
        notes: formData.notes || null,
        photo_url: formData.photo_url || null,
      };
      if (isAddingNew) {
        // 🛡️ ENDAST owner_id sätts - org_id är ALLTID null för kundportal-hundar
        // org_id sätts senare av pensionatet när bokning godkänns
        const insertData: any = { owner_id: user?.id, ...dogData };
        // org_id utelämnas helt - hundar i kundportalen har INGEN org_id

        const { error: insertError } = await (supabase as any)
          .from("dogs")
          .insert(insertData);
        if (insertError) throw insertError;
        showNotification("Hund tillagd!", "success");
      } else if (editingDog) {
        const { error: updateError } = await (supabase as any)
          .from("dogs")
          .update(dogData)
          .eq("id", editingDog);
        if (updateError) throw updateError;
        showNotification("Hund uppdaterad!", "success");
      }
      handleCancel();
      loadDogs();
    } catch (err: any) {
      console.error("[Mina hundar] Fel vid sparande:", err);
      showNotification("Kunde inte spara: " + err.message, "error");
    }
  }

  async function handleDelete(dogId: string, dogName: string) {
    if (!confirm("Ta bort " + dogName + "?")) return;
    try {
      const { error: deleteError } = await (supabase as any)
        .from("dogs")
        .delete()
        .eq("id", dogId);
      if (deleteError) throw deleteError;
      showNotification("Hund borttagen", "success");
      loadDogs();
    } catch (err: any) {
      console.error("[Mina hundar] Fel vid borttagning:", err);
      showNotification("Kunde inte ta bort: " + err.message, "error");
    }
  }

  function getSizeCategory(heightcm: number | null): string {
    if (!heightcm) return "Okänd";
    if (heightcm <= 34) return "Liten";
    if (heightcm <= 49) return "Mellan";
    return "Stor";
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
                <Dog className="h-6 w-6 text-[#2c7a4c]" />
                Mina hundar
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Hantera dina hundprofiler
              </p>
            </div>
            <div className="bg-[#E6F4EA] rounded-lg px-3 py-2 text-center">
              <p className="text-xl font-bold text-[#2c7a4c]">{dogs.length}</p>
              <p className="text-xs text-gray-600">Registrerade</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        {error && (
          <div className="mb-5 bg-red-50 border border-red-300 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {!isAddingNew && !editingDog && (
          <div className="mb-5 flex justify-end">
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Lägg till hund
            </button>
          </div>
        )}

        {(isAddingNew || editingDog) && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-5">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {isAddingNew ? "Lägg till ny hund" : "Redigera hundprofil"}
              </h2>
              <button
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-6 flex flex-col items-center">
              <div className="relative">
                <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Förhandsgranskning"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Dog className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#2c7a4c] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#235d3a] disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Klicka för att ladda upp bild (max 5MB)
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Grundläggande information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Namn *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. Bella"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ras
                  </label>
                  <select
                    value={formData.breed}
                    onChange={(e) =>
                      setFormData({ ...formData, breed: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white"
                  >
                    <option value="">Välj ras...</option>
                    {DOG_BREEDS.map((breed) => (
                      <option key={breed} value={breed}>
                        {breed}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Kön
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white"
                  >
                    <option value="">Välj...</option>
                    <option value="hane">Hane</option>
                    <option value="tik">Tik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Födelsedatum
                  </label>
                  <input
                    type="date"
                    value={formData.birth}
                    onChange={(e) =>
                      setFormData({ ...formData, birth: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mankhöjd (cm) *
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. 45"
                  />
                  {formData.heightcm && (
                    <p className="text-xs text-gray-500 mt-1">
                      Storlek: {getSizeCategory(formData.heightcm)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Hälsa & Försäkring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Försäkringsbolag
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        insurance_company: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. Agria, Folksam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Försäkringsnummer
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        insurance_number: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. 123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vaccination DHP (giltig 3 år)
                  </label>
                  <input
                    type="date"
                    value={formData.vaccdhp}
                    onChange={(e) =>
                      setFormData({ ...formData, vaccdhp: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Vaccination PI (giltig 1 år)
                  </label>
                  <input
                    type="date"
                    value={formData.vaccpi}
                    onChange={(e) =>
                      setFormData({ ...formData, vaccpi: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Allergier
                  </label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) =>
                      setFormData({ ...formData, allergies: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. Kyckling, mjölkprodukter"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mediciner
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) =>
                      setFormData({ ...formData, medications: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Beskriv mediciner och dosering"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Medicinska anteckningar / Vård
                  </label>
                  <textarea
                    value={formData.medical_notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medical_notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. pågående behandling, kroniska tillstånd"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b">
                Beteende & Egenskaper
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.is_castrated}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_castrated: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#2c7a4c] rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Kastrerad / Steriliserad
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.can_be_with_other_dogs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        can_be_with_other_dogs: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#2c7a4c] rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Får leka med andra hundar
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.destroys_things}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        destroys_things: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#2c7a4c] rounded"
                  />
                  <span className="text-sm text-gray-700">Biter på saker</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={!formData.is_house_trained}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_house_trained: !e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#2c7a4c] rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Kissar inne (ej rumsren)
                  </span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={formData.is_escape_artist}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_escape_artist: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#2c7a4c] rounded"
                  />
                  <span className="text-sm text-gray-700">Rymningsbenägen</span>
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Foder / Mat
                  </label>
                  <textarea
                    value={formData.food_info}
                    onChange={(e) =>
                      setFormData({ ...formData, food_info: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. Royal Canin Medium Adult, 200g morgon + kväll"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Beteendeanteckningar
                  </label>
                  <textarea
                    value={formData.behavior_notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        behavior_notes: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. Rädd för åska, vill helst inte vara ensam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Övriga anteckningar
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Övrig information som är bra att veta"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={!formData.name || !formData.heightcm}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Spara
              </button>
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {!isAddingNew && !editingDog && (
          <div className="space-y-3">
            {dogs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
                <Dog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">
                  Inga hundar ännu
                </h3>
                <p className="text-sm text-gray-500 mb-5">
                  Lägg till din första hund för att kunna göra bokningar
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-5 py-2.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] text-sm font-medium"
                >
                  Lägg till hund
                </button>
              </div>
            ) : (
              dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {dog.photo_url ? (
                          <img
                            src={dog.photo_url}
                            alt={dog.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Dog className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                          {dog.name}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-0.5">
                          {dog.breed && <p>🐾 {dog.breed}</p>}
                          {(dog as any).gender && (
                            <p>
                              {(dog as any).gender === "tik"
                                ? "♀️ Tik"
                                : "♂️ Hane"}
                            </p>
                          )}
                          {dog.heightcm && (
                            <p>
                              📏 {dog.heightcm} cm (
                              {getSizeCategory(dog.heightcm)})
                            </p>
                          )}
                          {dog.birth && <p>🎂 Född: {dog.birth}</p>}
                          {(dog as any).insurance_company && (
                            <p>🛡️ {(dog as any).insurance_company}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(dog)}
                        className="action-btn"
                        title="Redigera"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(dog.id, dog.name)}
                        className="action-btn hover:text-red-600"
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
      </main>
    </div>
  );
}
