"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Heart, Send, CheckCircle, AlertCircle } from "lucide-react";
import OrganisationSelector from "@/components/OrganisationSelector";
import { DogBreedSelect } from "@/components/DogBreedSelect";

interface SubscriptionOption {
  value: string;
  label: string;
  desc: string;
  daysPerWeek: number;
}

export default function HunddagisAnsokanPage() {
  const supabase = createClient();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string>("");

  const [step, setStep] = useState(0); // Start at step 0 for organisation selection
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamiska abonnemangsalternativ baserat på organisationens priser
  const [subscriptionOptions, setSubscriptionOptions] = useState<
    SubscriptionOption[]
  >([]);

  // Formulärdata
  const [formData, setFormData] = useState({
    // Ägare
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    owner_city: "",

    // Hund
    dog_name: "",
    dog_breed: "",
    dog_birth: "",
    dog_gender: "" as "hane" | "tik" | "",
    dog_size: "" as "small" | "medium" | "large" | "",
    dog_height_cm: "",

    // Abonnemang
    subscription_type: "",
    preferred_days: [] as string[],
    preferred_start_date: "",

    // Särskilda behov
    special_care_needs: "",
    is_neutered: false,
    is_escape_artist: false,
    destroys_things: false,
    not_house_trained: false,

    // GDPR
    gdpr_consent: false,
    terms_accepted: false,
  });

  const dayOptions = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

  // Hämta tillgängliga abonnemang när organisation väljs
  useEffect(() => {
    if (!orgId) return;

    const fetchSubscriptionOptions = async () => {
      try {
        const { data, error } = await supabase
          .from("daycare_pricing")
          .select("*")
          .eq("org_id", orgId)
          .single();

        if (error || !data) {
          // Om inga priser finns, visa default-alternativ
          setSubscriptionOptions([
            {
              value: "Dagshund",
              label: "Dagshund",
              desc: "Per dag",
              daysPerWeek: 0,
            },
          ]);
          return;
        }

        const options: SubscriptionOption[] = [];

        // Lägg till abonnemang som har pris > 0
        if (data.subscription_1day && data.subscription_1day > 0) {
          options.push({
            value: "1 dag/vecka",
            label: "1 dag/vecka",
            desc: `${data.subscription_1day} kr/månad`,
            daysPerWeek: 1,
          });
        }
        if (data.subscription_2days && data.subscription_2days > 0) {
          options.push({
            value: "2 dagar/vecka",
            label: "2 dagar/vecka",
            desc: `${data.subscription_2days} kr/månad`,
            daysPerWeek: 2,
          });
        }
        if (data.subscription_3days && data.subscription_3days > 0) {
          options.push({
            value: "3 dagar/vecka",
            label: "3 dagar/vecka",
            desc: `${data.subscription_3days} kr/månad`,
            daysPerWeek: 3,
          });
        }
        if (data.subscription_4days && data.subscription_4days > 0) {
          options.push({
            value: "4 dagar/vecka",
            label: "4 dagar/vecka",
            desc: `${data.subscription_4days} kr/månad`,
            daysPerWeek: 4,
          });
        }
        if (data.subscription_5days && data.subscription_5days > 0) {
          options.push({
            value: "5 dagar/vecka",
            label: "5 dagar/vecka",
            desc: `${data.subscription_5days} kr/månad`,
            daysPerWeek: 5,
          });
        }

        // Lägg alltid till Dagshund om single_day_price finns
        if (data.single_day_price && data.single_day_price > 0) {
          options.push({
            value: "Dagshund",
            label: "Dagshund",
            desc: `${data.single_day_price} kr/dag`,
            daysPerWeek: 0,
          });
        }

        setSubscriptionOptions(options);
      } catch (err) {
        console.error("Error fetching subscription options:", err);
      }
    };

    fetchSubscriptionOptions();
  }, [orgId]);

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      preferred_days: prev.preferred_days.includes(day)
        ? prev.preferred_days.filter((d) => d !== day)
        : [...prev.preferred_days, day],
    }));
  };

  const validateStep1 = () => {
    if (!orgId) return "Välj ett hunddagis att ansöka till";
    return null;
  };

  const validateStep2 = () => {
    if (!formData.parent_name.trim()) return "Ange ditt för- och efternamn";
    if (!formData.parent_email.trim()) return "Ange din e-postadress";
    if (!/^\S+@\S+\.\S+$/.test(formData.parent_email))
      return "Ogiltig e-postadress";
    if (!formData.parent_phone.trim()) return "Ange ditt telefonnummer";
    if (!formData.owner_city.trim()) return "Ange din ort";
    return null;
  };

  const validateStep3 = () => {
    if (!formData.dog_name.trim()) return "Ange hundens namn";
    if (!formData.dog_breed.trim()) return "Ange hundens ras";
    if (!formData.dog_birth) return "Ange hundens födelsedatum";
    if (!formData.dog_gender) return "Ange hundens kön";
    if (!formData.dog_size) return "Ange hundens storlek";
    if (!formData.dog_height_cm || isNaN(Number(formData.dog_height_cm)))
      return "Ange hundens mankhöjd i cm";
    return null;
  };

  const validateStep4 = () => {
    if (!formData.subscription_type) return "Välj önskat abonnemang";

    // Hitta det valda abonnemanget för att kolla daysPerWeek
    const selectedOption = subscriptionOptions.find(
      (opt) => opt.value === formData.subscription_type
    );

    // Om det är ett abonnemang (inte Dagshund) som kräver specifika dagar
    if (selectedOption && selectedOption.daysPerWeek > 0) {
      if (formData.preferred_days.length === 0) {
        return "Välj vilka dagar hunden ska gå";
      }
      if (formData.preferred_days.length !== selectedOption.daysPerWeek) {
        return `Välj exakt ${selectedOption.daysPerWeek} ${selectedOption.daysPerWeek === 1 ? "dag" : "dagar"}`;
      }
    }
    if (!formData.preferred_start_date) return "Ange önskat startdatum";
    if (!formData.terms_accepted)
      return "Du måste bekräfta att du har tagit del av dagisets villkor";
    if (!formData.gdpr_consent)
      return "Du måste godkänna DogPlanners integritetspolicy";
    return null;
  };

  const handleNext = () => {
    setError(null);

    let validationError = null;
    if (step === 0) validationError = validateStep1();
    if (step === 1) validationError = validateStep2();
    if (step === 2) validationError = validateStep3();

    if (validationError) {
      setError(validationError);
      return;
    }

    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setError(null);

    const validationError = validateStep4();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // Validera att vi har org_id
      if (!orgId) {
        throw new Error(
          "Organisation kunde inte identifieras. Vänligen välj ett hunddagis."
        );
      }

      const { error: insertError } = await supabase
        .from("interest_applications")
        .insert([
          {
            org_id: orgId,
            parent_name: formData.parent_name.trim(),
            parent_email: formData.parent_email.trim(),
            parent_phone: formData.parent_phone.trim(),
            owner_city: formData.owner_city.trim(),
            dog_name: formData.dog_name.trim(),
            dog_breed: formData.dog_breed.trim(),
            dog_birth: formData.dog_birth,
            dog_gender: formData.dog_gender,
            dog_size: formData.dog_size as "small" | "medium" | "large",
            dog_height_cm: Number(formData.dog_height_cm),
            subscription_type: formData.subscription_type,
            preferred_days: formData.preferred_days,
            preferred_start_date: formData.preferred_start_date,
            special_care_needs: formData.special_care_needs.trim() || null,
            is_neutered: formData.is_neutered,
            is_escape_artist: formData.is_escape_artist,
            destroys_things: formData.destroys_things,
            not_house_trained: formData.not_house_trained,
            gdpr_consent: formData.gdpr_consent,
            status: "pending",
          },
        ]);

      if (insertError) throw insertError;

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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">
            Tack för din ansökan till {orgName}!
          </h1>
          <p className="text-gray-600 mb-6">
            Vi har mottagit din intresseanmälan för{" "}
            <strong>{formData.dog_name}</strong>.
            <br />
            <br />
            Du kommer att få en bekräftelse via e-post till{" "}
            <strong>{formData.parent_email}</strong> inom kort.
            <br />
            <br />
            <strong>{orgName}</strong> kommer att kontakta dig så snart de har
            gått igenom din ansökan. Detta är vanligtvis inom 1-2 arbetsdagar.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
          >
            Tillbaka till startsidan
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Heart className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Ansök om dagisplats
          </h1>
          <p className="text-gray-600">
            Fyll i formuläret så återkommer vi till dig inom kort
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                  s === step
                    ? "bg-green-600 text-white"
                    : s < step
                      ? "bg-green-200 text-green-800"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {s + 1}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 rounded ${
                    s < step ? "bg-green-600" : "bg-gray-200"
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
          {/* Step 0: Välj hunddagis */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Steg 1: Välj hunddagis
              </h2>
              <p className="text-gray-600 mb-6">
                Välj vilket hunddagis du vill skicka din ansökan till. Du kan
                filtrera på län och kommun för att hitta dagis i ditt område.
              </p>

              <OrganisationSelector
                serviceType="hunddagis"
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
                  plattform som kopplar samman hundägare med hunddagis. När du
                  skickar denna ansökan går den direkt till det valda dagiset
                  som hanterar och godkänner ansökningar. Läs alltid företagets
                  egna villkor och avtal innan du accepterar en dagisplats.
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
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.parent_name}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_name: e.target.value })
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
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.parent_email}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_email: e.target.value })
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
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.parent_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, parent_phone: e.target.value })
                    }
                    placeholder="070-123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ort <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.owner_city}
                    onChange={(e) =>
                      setFormData({ ...formData, owner_city: e.target.value })
                    }
                    placeholder="Stockholm"
                  />
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
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    Storlek <span className="text-red-600">*</span>
                  </label>
                  <select
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.dog_size}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dog_size: e.target.value as
                          | "small"
                          | "medium"
                          | "large",
                      })
                    }
                  >
                    <option value="">Välj storlek</option>
                    <option value="small">Liten (upp till 10 kg)</option>
                    <option value="medium">Medel (10-25 kg)</option>
                    <option value="large">Stor (över 25 kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mankhöjd (cm) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
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
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
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
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
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
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Särskilda behov (allergier, medicin, etc.)
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    value={formData.special_care_needs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        special_care_needs: e.target.value,
                      })
                    }
                    placeholder="T.ex. allergier, mediciner, särskilda behov..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Abonnemang */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Steg 4: Önskat abonnemang
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Typ av abonnemang <span className="text-red-600">*</span>
                  </label>
                  {subscriptionOptions.length === 0 ? (
                    <div className="text-gray-500 p-4 bg-gray-50 rounded-lg">
                      Laddar tillgängliga abonnemang...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {subscriptionOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              subscription_type: option.value,
                              preferred_days: [], // Rensa valda dagar när man byter abonnemang
                            })
                          }
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            formData.subscription_type === option.value
                              ? "border-slate-700 bg-white shadow-md ring-2 ring-slate-700/20"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`font-semibold ${
                              formData.subscription_type === option.value
                                ? "text-slate-700"
                                : "text-gray-800"
                            }`}
                          >
                            {option.label}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {option.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(() => {
                  const selectedOption = subscriptionOptions.find(
                    (opt) => opt.value === formData.subscription_type
                  );
                  return selectedOption && selectedOption.daysPerWeek > 0 ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-800 mb-3">
                        Välj specifika veckodagar{" "}
                        <span className="text-red-600">*</span>
                      </label>
                      <p className="text-sm text-gray-600 mb-4">
                        Välj exakt {selectedOption.daysPerWeek}{" "}
                        {selectedOption.daysPerWeek === 1 ? "dag" : "dagar"}
                      </p>
                      <div className="space-y-2">
                        {dayOptions.map((day) => (
                          <label
                            key={day}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              formData.preferred_days.includes(day)
                                ? "border-slate-700 bg-white shadow-sm"
                                : "border-gray-200 bg-white hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={formData.preferred_days.includes(day)}
                              onChange={() => toggleDay(day)}
                              className="w-5 h-5 text-slate-700 border-gray-300 rounded focus:ring-slate-700"
                            />
                            <span
                              className={`font-medium ${
                                formData.preferred_days.includes(day)
                                  ? "text-slate-700"
                                  : "text-gray-700"
                              }`}
                            >
                              {day}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-3">
                        Valt: {formData.preferred_days.length} av{" "}
                        {selectedOption.daysPerWeek}{" "}
                        {selectedOption.daysPerWeek === 1 ? "dag" : "dagar"}
                      </p>
                    </div>
                  ) : null;
                })()}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Önskat startdatum <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.preferred_start_date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferred_start_date: e.target.value,
                      })
                    }
                  />
                </div>

                {/* GDPR */}
                <div className="pt-6 border-t space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5 flex-shrink-0"
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
                      villkor, regler och avbokningspolicy. Det är mitt ansvar
                      som hundägare att ha läst igenom dagisets specifika
                      bestämmelser innan jag skickar denna ansökan.{" "}
                      <span className="text-red-600">*</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500 mt-0.5 flex-shrink-0"
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
                        className="text-green-600 hover:underline font-medium"
                      >
                        DogPlanners integritetspolicy
                      </Link>{" "}
                      och samtycker till att mina personuppgifter lagras av
                      DogPlanner och delas med <strong>{orgName}</strong> för
                      hantering av min ansökan enligt GDPR.{" "}
                      <span className="text-red-600">*</span>
                    </span>
                  </label>
                </div>
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

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Nästa
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    </div>
  );
}
