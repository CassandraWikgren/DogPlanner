"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { useImageUpload } from "@/lib/imageUpload";

export default function NewDogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    upload: uploadImage,
    uploading: imageUploading,
    error: imageError,
  } = useImageUpload();

  // Dog form state
  const [dogForm, setDogForm] = useState({
    name: "",
    breed: "",
    birth: "",
    heightcm: "",
    subscription: "",
    days: [] as string[],
    notes: "",
    photo_url: "",
  });

  // Owner form state
  const [ownerForm, setOwnerForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setDogForm((prev) => ({ ...prev, photo_url: "" }));
  };

  const dayOptions = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

  const toggleDay = (day: string) => {
    setDogForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const validate = (): string | null => {
    if (!dogForm.name.trim()) return "Hundens namn är obligatoriskt";
    if (!ownerForm.full_name.trim()) return "Ägarens namn är obligatoriskt";
    if (ownerForm.email && !/^\S+@\S+\.\S+$/.test(ownerForm.email)) {
      return "Ogiltig e-postadress";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      // 1. Ladda upp bild om vald
      let photoUrl = "";
      if (selectedImage) {
        const uploadedUrl = await uploadImage(
          selectedImage,
          "dogs",
          `${dogForm.name.trim()}_${Date.now()}`
        );
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }

      // 2. Skapa eller hitta ägare
      let ownerId: string;

      // Kolla om ägaren redan finns
      const { data: existingOwner } = await supabase
        .from("owners")
        .select("id")
        .eq("email", ownerForm.email.toLowerCase().trim())
        .eq("org_id", orgId)
        .single();

      if (existingOwner) {
        ownerId = (existingOwner as any).id;
      } else {
        // Skapa ny ägare
        const { data: newOwner, error: ownerError } = await supabase
          .from("owners")
          .insert({
            ...ownerForm,
            full_name: ownerForm.full_name.trim(),
            email: ownerForm.email
              ? ownerForm.email.toLowerCase().trim()
              : null,
            org_id: orgId,
          } as any)
          .select("id")
          .single();

        if (ownerError) throw ownerError;
        ownerId = (newOwner as any).id;
      }

      // 3. Skapa hund
      const { data: newDog, error: dogError } = await supabase
        .from("dogs")
        .insert({
          name: dogForm.name.trim(),
          breed: dogForm.breed.trim() || null,
          birth: dogForm.birth || null,
          heightcm: dogForm.heightcm ? parseInt(dogForm.heightcm) : null,
          subscription: dogForm.subscription || null,
          days: dogForm.days.join(","),
          notes: dogForm.notes || null,
          photo_url: photoUrl || null,
          owner_id: ownerId,
          org_id: orgId,
        } as any)
        .select("id, name")
        .single();

      if (dogError) throw dogError;

      setSuccess(`Hund "${(newDog as any).name}" har lagts till!`);

      // Redirect efter 1.5 sekunder
      setTimeout(() => {
        router.push("/hunddagis");
      }, 1500);
    } catch (err: any) {
      console.error("Error creating dog:", err);
      setError(`Fel vid sparande: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2c7a4c]">
            Lägg till ny hund
          </h1>
          <p className="text-gray-600 mt-1">
            Fyll i hundens och ägarens information
          </p>
        </div>
        <Link
          href="/hunddagis"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Tillbaka
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Ägare Section */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ägare</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namn *
              </label>
              <input
                type="text"
                required
                placeholder="För- och efternamn"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={ownerForm.full_name}
                onChange={(e) =>
                  setOwnerForm((prev) => ({
                    ...prev,
                    full_name: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                placeholder="070-123 45 67"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={ownerForm.phone}
                onChange={(e) =>
                  setOwnerForm((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-post
              </label>
              <input
                type="email"
                placeholder="namn@exempel.se"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={ownerForm.email}
                onChange={(e) =>
                  setOwnerForm((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adress
              </label>
              <input
                type="text"
                placeholder="Gata 123, 123 45 Stad"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={ownerForm.address}
                onChange={(e) =>
                  setOwnerForm((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {/* Hund Section */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Hund</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Namn *
              </label>
              <input
                type="text"
                required
                placeholder="Hundens namn"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={dogForm.name}
                onChange={(e) =>
                  setDogForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ras
              </label>
              <input
                type="text"
                placeholder="t.ex. Golden Retriever"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={dogForm.breed}
                onChange={(e) =>
                  setDogForm((prev) => ({ ...prev, breed: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Födelsedatum
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={dogForm.birth}
                onChange={(e) =>
                  setDogForm((prev) => ({ ...prev, birth: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mankhöjd (cm)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="t.ex. 55"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={dogForm.heightcm}
                onChange={(e) =>
                  setDogForm((prev) => ({ ...prev, heightcm: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abonnemang
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={dogForm.subscription}
                onChange={(e) =>
                  setDogForm((prev) => ({
                    ...prev,
                    subscription: e.target.value,
                  }))
                }
              >
                <option value="">Välj abonnemang</option>
                <option value="Heltid">Heltid</option>
                <option value="Deltid">Deltid</option>
                <option value="Tillfällig">Tillfällig</option>
                <option value="Prova-på">Prova-på</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto av hunden
              </label>

              {!previewUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="dog-photo"
                  />
                  <label
                    htmlFor="dog-photo"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                      📷
                    </div>
                    <span className="text-sm text-gray-600">
                      Klicka för att ladda upp foto
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      JPG, PNG eller WebP (max 5MB)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={previewUrl}
                    alt="Förhandsvisning"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}

              {imageError && (
                <p className="text-red-600 text-sm mt-1">{imageError}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Veckodagar
              </label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      dogForm.days.includes(day)
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anteckningar
              </label>
              <textarea
                rows={3}
                placeholder="Allergier, mediciner, beteende, etc..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-green-500"
                value={dogForm.notes}
                onChange={(e) =>
                  setDogForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {/* Submit buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/hunddagis"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={submitting || imageUploading}
            className="rounded-lg bg-[#2c7a4c] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting || imageUploading ? "Sparar..." : "Spara hund"}
          </button>
        </div>
      </form>
    </div>
  );
}
