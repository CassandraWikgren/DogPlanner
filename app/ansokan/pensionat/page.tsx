"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { Home, Send, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import OrganisationSelector from "@/components/OrganisationSelector";
import { DogBreedSelect } from "@/components/DogBreedSelect";
import {
  sendApplicationConfirmationEmail,
  sendApplicationNotificationEmail,
} from "@/lib/emailSender";
import { calculatePensionatPrice } from "@/lib/pensionatCalculations";
import type { PriceBreakdown } from "@/types/hundpensionat";

export default function PensionatAnsokanPage() {
  const supabase = createClientComponentClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("");

  const [step, setStep] = useState(0); // Start at step 0 for organisation selection
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prisberäkning
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null
  );
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Formulärdata
  const [formData, setFormData] = useState({
    // Ägare
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    owner_address: "",
    owner_city: "",
    owner_postal_code: "",

    // Hund
    dog_name: "",
    dog_breed: "",
    dog_birth: "",
    dog_gender: "" as "hane" | "tik" | "",
    dog_height_cm: "",

    // Bokning
    checkin_date: "",
    checkout_date: "",
    special_requests: "",

    // Särskilda behov
    is_neutered: false,
    is_escape_artist: false,
    destroys_things: false,
    not_house_trained: false,
    has_allergies: false,
    needs_medication: false,
    medical_notes: "",

    // GDPR
    gdpr_consent: false,
    terms_accepted: false,
  });

  const validateStep1 = () => {
    if (!orgId) return "Välj ett hundpensionat att ansöka till";
    return null;
  };

  const validateStep2 = () => {
    if (!formData.owner_name.trim()) return "Ange ditt för- och efternamn";
    if (!formData.owner_email.trim()) return "Ange din e-postadress";
    if (!/^\S+@\S+\.\S+$/.test(formData.owner_email))
      return "Ogiltig e-postadress";
    if (!formData.owner_phone.trim()) return "Ange ditt telefonnummer";
    if (!formData.owner_city.trim()) return "Ange din ort";
    return null;
  };

  const validateStep3 = () => {
    if (!formData.dog_name.trim()) return "Ange hundens namn";
    if (!formData.dog_breed.trim()) return "Ange hundens ras";
    if (!formData.dog_birth) return "Ange hundens födelsedatum";
    if (!formData.dog_gender) return "Ange hundens kön";
    if (!formData.dog_height_cm || isNaN(Number(formData.dog_height_cm)))
      return "Ange hundens mankhöjd i cm";
    return null;
  };

  const validateStep4 = () => {
    if (!formData.checkin_date) return "Ange incheckningsdatum";
    if (!formData.checkout_date) return "Ange utcheckningsdatum";

    const checkin = new Date(formData.checkin_date);
    const checkout = new Date(formData.checkout_date);

    if (checkout <= checkin)
      return "Utcheckningsdatum måste vara efter incheckningsdatum";
    if (checkin < new Date()) return "Incheckningsdatum måste vara i framtiden";

    return null;
  };

  const validateStep5 = () => {
    if (!formData.gdpr_consent)
      return "Du måste godkänna integritetspolicyn för att skicka ansökan";
    if (!formData.terms_accepted)
      return "Du måste acceptera våra regler och villkor för att skicka ansökan";
    return null;
  };

  const handleNext = () => {
    setError(null);

    let validationError = null;
    if (step === 0) validationError = validateStep1();
    if (step === 1) validationError = validateStep2();
    if (step === 2) validationError = validateStep3();
    if (step === 3) validationError = validateStep4();

    if (validationError) {
      setError(validationError);
      return;
    }

    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError(null);

    const validationError = validateStep5();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Validera att vi har org_id
      if (!orgId) {
        throw new Error(
          "Organisation kunde inte identifieras. Vänligen välj ett hundpensionat."
        );
      }

      // Call API route instead of direct Supabase (bypasses RLS issues)
      const response = await fetch("/api/applications/pension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          owner: {
            full_name: formData.owner_name.trim(),
            email: formData.owner_email.trim().toLowerCase(),
            phone: formData.owner_phone.trim(),
            address: formData.owner_address.trim() || null,
            city: formData.owner_city.trim(),
            postal_code: formData.owner_postal_code.trim() || null,
          },
          dog: {
            name: formData.dog_name.trim(),
            breed: formData.dog_breed.trim(),
            birth: formData.dog_birth,
            gender: formData.dog_gender,
            heightcm: Number(formData.dog_height_cm),
            is_castrated: formData.is_neutered,
            is_escape_artist: formData.is_escape_artist,
            destroys_things: formData.destroys_things,
            is_house_trained: !formData.not_house_trained,
            notes: formData.medical_notes.trim() || null,
          },
          booking: {
            start_date: formData.checkin_date,
            end_date: formData.checkout_date,
            special_requests: formData.special_requests.trim() || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      setSuccess(true);

      // TODO: Send confirmation email via API route
    } catch (err: any) {
      setError(err.message || "Kunde inte skicka ansökan. Försök igen senare.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2c7a4c]/10 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-[#2c7a4c] mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Tack för din ansökan till {orgName}!
          </h1>
          <p className="text-gray-600 mb-6">
            Vi har mottagit din bokningsförfrågan för{" "}
            <strong>{formData.dog_name}</strong>.
            <br />
            <br />
            <strong>Incheckning:</strong>{" "}
            {new Date(formData.checkin_date).toLocaleDateString("sv-SE")}
            <br />
            <strong>Utcheckning:</strong>{" "}
            {new Date(formData.checkout_date).toLocaleDateString("sv-SE")}
            <br />
            <br />
            Du kommer att få en bekräftelse via e-post till{" "}
            <strong>{formData.owner_email}</strong> inom kort.
            <br />
            <br />
            <strong>{orgName}</strong> kommer att kontakta dig så snart de har
            gått igenom din ansökan och kan bekräfta din bokning! Detta är
            vanligtvis inom 1-2 arbetsdagar.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-[#2c7a4c] text-white font-semibold rounded-lg hover:bg-[#236139] transition"
          >
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2c7a4c]/10 to-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2c7a4c]/10 rounded-full mb-4">
            <Home className="h-8 w-8 text-[#2c7a4c]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ansök om pensionatsbokning
          </h1>
          <p className="text-gray-600">
            Fyll i formuläret så återkommer vi med prisuppgift och bekräftelse
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[0, 1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  s === step
                    ? "bg-[#2c7a4c] text-white"
                    : s < step
                      ? "bg-[#2c7a4c]/30 text-[#2c7a4c]"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {s + 1}
              </div>
              {s < 4 && (
                <div
                  className={`w-12 h-1 rounded ${
                    s < step ? "bg-[#2c7a4c]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 0: Välj pensionat */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Steg 1: Välj hundpensionat
              </h2>
              <p className="text-gray-600 mb-6">
                Välj vilket hundpensionat du vill skicka din bokningsförfrågan
                till. Du kan filtrera på län och kommun för att hitta pensionat
                i ditt område.
              </p>

              <OrganisationSelector
                serviceType="hundpensionat"
                selectedOrgId={orgId}
                onSelect={(id, name) => {
                  setOrgId(id);
                  setOrgName(name);
                }}
                required
              />

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ℹ️ <strong>Viktigt att veta:</strong> DogPlanner är en
                  plattform som kopplar samman hundägare med hundpensionat. När
                  du skickar denna bokningsförfrågan går den direkt till det
                  valda pensionatet som hanterar och godkänner bokningar.{" "}
                  <strong>
                    Läs alltid företagets egna villkor och avbokningsregler
                    innan du bekräftar en bokning.
                  </strong>{" "}
                  DogPlanner lämnar inga garantier för pensionatets kvalitet,
                  men alla anslutna företag är verifierade som registrerade
                  företag i Sverige.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Dina uppgifter */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Steg 2: Dina uppgifter
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    För- och efternamn <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.owner_name}
                    onChange={(e) =>
                      setFormData({ ...formData, owner_name: e.target.value })
                    }
                    placeholder="Anna Andersson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-postadress <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.owner_email}
                    onChange={(e) =>
                      setFormData({ ...formData, owner_email: e.target.value })
                    }
                    placeholder="anna@exempel.se"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefonnummer <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.owner_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, owner_phone: e.target.value })
                    }
                    placeholder="070-123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adress
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.owner_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        owner_address: e.target.value,
                      })
                    }
                    placeholder="Storgatan 123"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postnummer
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                      value={formData.owner_postal_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          owner_postal_code: e.target.value,
                        })
                      }
                      placeholder="123 45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ort <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                      value={formData.owner_city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          owner_city: e.target.value,
                        })
                      }
                      placeholder="Stockholm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Om hunden */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Steg 3: Om hunden
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hundens namn <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.dog_name}
                    onChange={(e) =>
                      setFormData({ ...formData, dog_name: e.target.value })
                    }
                    placeholder="Bella"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ras <span className="text-red-600">*</span>
                  </label>
                  <DogBreedSelect
                    value={formData.dog_breed}
                    onChange={(breed) =>
                      setFormData({ ...formData, dog_breed: breed })
                    }
                    placeholder="Välj hundras..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Födelsedatum <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.dog_birth}
                    onChange={(e) =>
                      setFormData({ ...formData, dog_birth: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kön <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.dog_gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dog_gender: e.target.value as "hane" | "tik",
                      })
                    }
                  >
                    <option value="">Välj kön</option>
                    <option value="hane">Hane</option>
                    <option value="tik">Tik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mankhöjd (cm) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    value={formData.dog_height_cm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dog_height_cm: e.target.value,
                      })
                    }
                    placeholder="55"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mankhöjden mäts från marken till ovansidan av skulderbladen
                  </p>
                </div>

                {/* Bocklistor */}
                <div className="space-y-2 pt-4 border-t">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                      checked={formData.is_neutered}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_neutered: e.target.checked,
                        })
                      }
                    />
                    <span className="text-gray-700">
                      Kastrerad/Steriliserad
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                      checked={formData.is_escape_artist}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_escape_artist: e.target.checked,
                        })
                      }
                    />
                    <span className="text-gray-700">
                      Rymningsbenägen / Klättrar över staket
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                      checked={formData.destroys_things}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destroys_things: e.target.checked,
                        })
                      }
                    />
                    <span className="text-gray-700">Biter sönder saker</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                      checked={formData.not_house_trained}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          not_house_trained: e.target.checked,
                        })
                      }
                    />
                    <span className="text-gray-700">Ej rumsren</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                      checked={formData.has_allergies}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          has_allergies: e.target.checked,
                        })
                      }
                    />
                    <span className="text-gray-700">Allergier</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                      checked={formData.needs_medication}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          needs_medication: e.target.checked,
                        })
                      }
                    />
                    <span className="text-gray-700">Tar medicin</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medicinska anteckningar
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    rows={3}
                    value={formData.medical_notes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medical_notes: e.target.value,
                      })
                    }
                    placeholder="T.ex. allergier, mediciner, särskilda behov..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bokningsdetaljer */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Steg 4: Bokningsdetaljer
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Incheckning <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                      value={formData.checkin_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkin_date: e.target.value,
                        })
                      }
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Utcheckning <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                      value={formData.checkout_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkout_date: e.target.value,
                        })
                      }
                      min={
                        formData.checkin_date ||
                        new Date().toISOString().split("T")[0]
                      }
                    />
                  </div>
                </div>

                {formData.checkin_date && formData.checkout_date && (
                  <div className="p-4 bg-[#2c7a4c]/5 border border-[#2c7a4c]/20 rounded-lg">
                    <div className="flex items-center gap-2 text-[#2c7a4c] mb-1">
                      <Calendar className="h-5 w-5" />
                      <span className="font-semibold text-sm">Vistelse</span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {(() => {
                        const nights = Math.ceil(
                          (new Date(formData.checkout_date).getTime() -
                            new Date(formData.checkin_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return `${nights} ${nights === 1 ? "natt" : "nätter"}`;
                      })()}
                    </p>
                    {formData.dog_height_cm && (
                      <div className="mt-3 pt-3 border-t border-[#2c7a4c]/20">
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Uppskattat pris
                        </p>
                        <p className="text-lg font-bold text-[#2c7a4c]">
                          {(() => {
                            const nights = Math.ceil(
                              (new Date(formData.checkout_date).getTime() -
                                new Date(formData.checkin_date).getTime()) /
                                (1000 * 60 * 60 * 24)
                            );
                            const height = parseInt(formData.dog_height_cm);
                            // Enkel prisuppskattning baserat på storlek
                            let pricePerNight = 300; // Liten hund
                            if (height > 60)
                              pricePerNight = 500; // Stor hund
                            else if (height > 40) pricePerNight = 400; // Medelstor hund

                            const totalPrice = nights * pricePerNight;
                            return `${totalPrice.toLocaleString("sv-SE")} kr`;
                          })()}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Slutligt pris kan variera beroende på säsong,
                          helgdagar och tilläggstjänster. Du får en exakt
                          prisuppgift när {orgName} granskar din ansökan.
                        </p>
                      </div>
                    )}
                    {!formData.dog_height_cm && (
                      <p className="text-xs text-gray-500 mt-2">
                        Fyll i hundens mankhöjd för att se en prisuppskattning
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Särskilda önskemål
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    rows={4}
                    value={formData.special_requests}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        special_requests: e.target.value,
                      })
                    }
                    placeholder="T.ex. önskemål om rum, matrutiner, aktiviteter..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Godkännande */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Steg 5: Bekräfta och skicka
              </h2>

              {/* Sammanfattning */}
              <div className="mb-6 p-6 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Sammanfattning av din ansökan
                </h3>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Ägare:</span>
                    <div className="font-medium text-gray-900">
                      {formData.owner_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">E-post:</span>
                    <div className="font-medium text-gray-900">
                      {formData.owner_email}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Hund:</span>
                    <div className="font-medium text-gray-900">
                      {formData.dog_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Ras:</span>
                    <div className="font-medium text-gray-900">
                      {formData.dog_breed}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Incheckning:</span>
                    <div className="font-medium text-gray-900">
                      {new Date(formData.checkin_date).toLocaleDateString(
                        "sv-SE"
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Utcheckning:</span>
                    <div className="font-medium text-gray-900">
                      {new Date(formData.checkout_date).toLocaleDateString(
                        "sv-SE"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* GDPR Checkboxes */}
              <div className="space-y-4 pt-6 border-t">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c] mt-0.5 flex-shrink-0"
                    checked={formData.terms_accepted}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        terms_accepted: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Jag bekräftar att jag har tagit kontakt med{" "}
                    <strong>{orgName}</strong> och tagit del av deras allmänna
                    villkor, regler och avbokningspolicy. Det är mitt ansvar som
                    hundägare att ha läst igenom pensionatets specifika
                    bestämmelser innan jag skickar denna ansökan.{" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c] mt-0.5 flex-shrink-0"
                    checked={formData.gdpr_consent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gdpr_consent: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm text-gray-700">
                    Jag har läst och godkänner{" "}
                    <Link
                      href="/gdpr"
                      target="_blank"
                      className="text-[#2c7a4c] hover:underline font-medium"
                    >
                      DogPlanners integritetspolicy
                    </Link>{" "}
                    och samtycker till att mina personuppgifter lagras av
                    DogPlanner och delas med <strong>{orgName}</strong> för
                    hantering av min bokningsförfrågan enligt GDPR.{" "}
                    <span className="text-red-600">*</span>
                  </span>
                </label>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Vad händer nu?</strong>
                  <br />
                  Din bokningsförfrågan skickas till <strong>
                    {orgName}
                  </strong>{" "}
                  som granskar tillgänglighet och återkommer med prisuppgift och
                  bekräftelse inom 1-2 arbetsdagar. Du får ett bekräftelsemail
                  till {formData.owner_email} så snart {orgName} har behandlat
                  din förfrågan.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                Tillbaka
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-[#2c7a4c] text-white font-semibold rounded-lg hover:bg-[#236139] transition"
              >
                Nästa
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white font-semibold rounded-lg hover:bg-[#236139] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Skickar...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Skicka ansökan
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Har du frågor? Kontakta oss via e-post eller telefon så hjälper vi
            dig!
          </p>
          <p className="mt-2">
            <Link href="/" className="text-[#2c7a4c] hover:underline">
              ← Tillbaka till startsidan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
