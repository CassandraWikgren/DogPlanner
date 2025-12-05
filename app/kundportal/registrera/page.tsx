"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, User, Users, AlertCircle, CheckCircle } from "lucide-react";
import { DOG_BREEDS } from "@/lib/dogBreeds";
import { FormErrorBoundary } from "@/components/ErrorBoundaries";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE: "[ERR-1001]",
  VALIDATION: "[ERR-4001]",
  AUTH: "[ERR-5001]",
} as const;

export default function CustomerRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Steg 1: Ägaruppgifter
  const [ownerData, setOwnerData] = useState({
    firstName: "",
    lastName: "",
    personalNumber: "",
    email: "",
    phone: "",
    address: "",
    zipCode: "",
    city: "",
    password: "",
    confirmPassword: "",
    gdprConsent: false,
    marketingConsent: false,
  });

  // Steg 2: Kontaktperson
  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Steg 3: Hunduppgifter (MATCHAR bokningsflödet)
  const [dogData, setDogData] = useState({
    name: "",
    breed: "",
    shoulderHeight: "",
    birthDate: "",
    gender: "",
    insuranceNumber: "",
    insuranceCompany: "",
    vaccinationDHP: "",
    vaccinationPi: "",
    careNotes: "",
    specialNotes: "",
    // Checkboxes för specialbehov
    isCastrated: false,
    escapeTendency: false,
    bitesSeparates: false,
    notHousebroken: false,
    allergies: false,
    takingMedication: false,
  });

  const handleOwnerChange = (field: string, value: string) => {
    if (field === "gdprConsent" || field === "marketingConsent") {
      setOwnerData((prev) => ({ ...prev, [field]: value === "true" }));
    } else {
      setOwnerData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleContactChange = (field: string, value: string) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDogChange = (field: string, value: string | boolean) => {
    setDogData((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep1 = (): string | null => {
    if (!ownerData.firstName) return "Förnamn krävs";
    if (!ownerData.lastName) return "Efternamn krävs";
    if (!ownerData.personalNumber) return "Personnummer krävs";
    if (!ownerData.email) return "E-postadress krävs";

    // Email validation med regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerData.email)) {
      return "E-postadressen måste vara giltig (t.ex. namn@example.com)";
    }

    if (!ownerData.phone) return "Telefonnummer krävs";
    if (!ownerData.password) return "Lösenord krävs";
    if (ownerData.password !== ownerData.confirmPassword)
      return "Lösenorden matchar inte";
    if (ownerData.password.length < 6)
      return "Lösenordet måste vara minst 6 tecken";
    if (!ownerData.gdprConsent)
      return "Du måste godkänna villkoren och GDPR för att fortsätta";
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!dogData.name) return "Hundens namn krävs";
    if (!dogData.breed) return "Ras krävs";
    if (!dogData.birthDate) return "Födelsedatum krävs";
    if (!dogData.gender) return "Kön måste väljas";
    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Skapa Supabase client
      const supabase = createClient();

      // Validera sista steget
      const stepError = validateStep3();
      if (stepError) {
        throw new Error(`${ERROR_CODES.VALIDATION} ${stepError}`);
      }

      // 1. Skapa autentiserad användare med Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: ownerData.email,
        password: ownerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/kundportal/login?verified=true`,
          data: {
            full_name: `${ownerData.firstName} ${ownerData.lastName}`.trim(),
            phone: ownerData.phone,
          },
        },
      });

      if (authError) {
        console.error("[ERR-5001] Auth-fel:", authError);
        throw new Error(`${ERROR_CODES.AUTH} ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error(`${ERROR_CODES.AUTH} Ingen användare skapades`);
      }

      // 2. Skapa ägarprofil i owners-tabellen kopplad till auth-användaren
      const ownerData_insert: any = {
        id: authData.user.id, // Använd samma UUID från auth
        full_name: `${ownerData.firstName} ${ownerData.lastName}`.trim(),
        phone: ownerData.phone,
        email: ownerData.email,
      };

      // Lägg till valfria kolumner om de finns i schemat
      if (ownerData.address) ownerData_insert.address = ownerData.address;
      if (ownerData.zipCode) ownerData_insert.postal_code = ownerData.zipCode;
      if (ownerData.city) ownerData_insert.city = ownerData.city;

      if (contactData.firstName && contactData.lastName) {
        ownerData_insert.contact_person_2 =
          `${contactData.firstName} ${contactData.lastName}`.trim();
      }
      if (contactData.phone) {
        ownerData_insert.contact_phone_2 = contactData.phone;
      }

      // Lägg till consent-fält om de finns
      ownerData_insert.gdpr_consent = ownerData.gdprConsent;
      ownerData_insert.marketing_consent = ownerData.marketingConsent;
      ownerData_insert.photo_consent = false;
      ownerData_insert.notes = `Kundportal-registrering: ${new Date().toLocaleDateString(
        "sv-SE"
      )}`;

      console.log(
        "[DEBUG] Försöker skapa ägarprofil med data:",
        ownerData_insert
      );

      const { data: newOwner, error: ownerError } = await supabase
        .from("owners")
        .insert(ownerData_insert)
        .select()
        .single();

      if (ownerError) {
        console.error("[ERR-1001] Ägarfel:", ownerError);
        // Rensa upp auth-användare om databasfel
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte skapa ägarprofil: ${ownerError.message}`
        );
      }

      // 2. Skapa hunden kopplad till ägaren (dogs.owner_id → owners.id)
      const dogData_insert: any = {
        name: dogData.name,
        breed: dogData.breed,
        owner_id: newOwner.id,
      };

      // Lägg till valfria fält om de finns
      if (dogData.birthDate) dogData_insert.birth_date = dogData.birthDate;
      if (dogData.gender) dogData_insert.gender = dogData.gender;
      if (dogData.shoulderHeight)
        dogData_insert.heightcm = parseFloat(dogData.shoulderHeight);
      if (dogData.isCastrated !== undefined)
        dogData_insert.is_sterilized = dogData.isCastrated;
      if (dogData.careNotes) dogData_insert.medical_notes = dogData.careNotes;
      if (dogData.specialNotes)
        dogData_insert.special_needs = dogData.specialNotes;
      if (dogData.insuranceNumber)
        dogData_insert.insurance_number = dogData.insuranceNumber;
      if (dogData.insuranceCompany)
        dogData_insert.insurance_company = dogData.insuranceCompany;

      // Personlighetsdrag baserat på nya checkboxes
      const personality = [];
      if (dogData.bitesSeparates) personality.push("Biter/sliter sönder saker");
      if (dogData.notHousebroken) personality.push("Ej rumsren");
      if (dogData.escapeTendency) personality.push("Rymningsbenägen");
      if (dogData.isCastrated) personality.push("Kastrerad");

      // Om specialNotes finns, lägg till det i personality_traits också
      if (dogData.specialNotes && personality.length === 0) {
        personality.push(dogData.specialNotes);
      }

      if (personality.length > 0)
        dogData_insert.personality_traits = personality;

      const { data: newDog, error: dogError } = await supabase
        .from("dogs")
        .insert(dogData_insert)
        .select()
        .single();

      if (dogError) {
        console.error("[ERR-1002] Hundfel:", dogError);
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte skapa hund: ${dogError.message}`
        );
      }

      console.log("[DEBUG] Hund skapad:", newDog);

      // Skicka bekräftelsemeddelande
      if (authData.user.email_confirmed_at) {
        // Användaren är redan verifierad (t.ex. i utvecklingsmiljö)
        setSuccess(
          "🎉 Registrering lyckades! Din e-postadress är verifierad. Du omdirigeras till att söka hunddagisar..."
        );
        setTimeout(() => {
          router.push("/kundportal/soka-hunddagis");
        }, 3000);
      } else {
        // Användaren behöver verifiera e-post
        setSuccess(
          "✅ Registrering lyckades! \n\n📧 Vi har skickat en verifieringslänk till " +
            ownerData.email +
            ". \n\nKlicka på länken i e-posten för att aktivera ditt konto. Efter verifiering omdirigeras du till att söka hunddagisar. \n\n💡 Glöm inte att kolla skräppost-mappen!"
        );
        setTimeout(() => {
          router.push(
            "/kundportal/login?message=check_email&next=/kundportal/soka-hunddagis"
          );
        }, 5000);
      }
    } catch (err: any) {
      console.error("[ERR-1000] Registreringsfel:", err);

      // Specifika felmeddelanden baserat på feltyp
      let errorMessage =
        err.message || `${ERROR_CODES.DATABASE} Registreringen misslyckades`;

      if (err.message?.includes("User already registered")) {
        errorMessage = `${ERROR_CODES.AUTH} En användare med denna e-postadress finns redan. Försök logga in istället.`;
      } else if (err.message?.includes("Password")) {
        errorMessage = `${ERROR_CODES.AUTH} Lösenordet måste vara minst 6 tecken långt.`;
      } else if (err.message?.includes("Email")) {
        errorMessage = `${ERROR_CODES.AUTH} Ogiltig e-postadress.`;
      } else if (err.message?.includes("address")) {
        errorMessage = `${ERROR_CODES.DATABASE} Databasfel: Kontrollera att alla nödvändiga kolumner finns i owners-tabellen`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Tillbaka till startsidan
              </Button>
            </Link>
            <div className="flex items-center justify-center mb-4">
              <PawPrint className="h-10 w-10 text-[#2c7a4c] mr-3" />
              <h1 className="text-3xl font-bold text-gray-800">
                Skapa konto som hundägare
              </h1>
            </div>
            <p className="text-gray-600 mb-2">
              Skapa ett gratis konto för att boka hunddagis och hundpensionat
            </p>
            <p className="text-sm text-gray-500">
              Driver du ett hundföretag?{" "}
              <Link
                href="/register"
                className="text-[#2c7a4c] hover:underline font-medium"
              >
                Registrera företag här
              </Link>
            </p>
          </div>

          {/* Progress */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        currentStep > step
                          ? "bg-green-600 text-white"
                          : currentStep === step
                            ? "bg-[#2c7a4c] text-white ring-4 ring-[#2c7a4c]/20 scale-110"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {currentStep > step ? "✓" : step}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium transition-colors ${
                        currentStep >= step ? "text-[#2c7a4c]" : "text-gray-400"
                      }`}
                    >
                      {step === 1 && "Ägaruppgifter"}
                      {step === 2 && "Kontaktperson"}
                      {step === 3 && "Hunduppgifter"}
                    </span>
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-20 h-1 mx-2 rounded transition-colors duration-300 ${
                        currentStep > step ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600">Steg {currentStep} av 3</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {currentStep === 1 && (
                    <>
                      <User className="mr-2" /> Ägaruppgifter
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <Users className="mr-2" /> Kontaktperson
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <PawPrint className="mr-2" /> Hunduppgifter
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Steg 1: Ägaruppgifter */}
                {currentStep === 1 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Förnamn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ownerData.firstName}
                        onChange={(e) =>
                          handleOwnerChange("firstName", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="Anna"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Efternamn <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ownerData.lastName}
                        onChange={(e) =>
                          handleOwnerChange("lastName", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="Andersson"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Personnummer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={ownerData.personalNumber}
                        onChange={(e) =>
                          handleOwnerChange("personalNumber", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="YYYYMMDD-XXXX"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        E-postadress <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={ownerData.email}
                        onChange={(e) =>
                          handleOwnerChange("email", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="anna@exempel.se"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ange en giltig e-postadress (t.ex. namn@example.com)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Telefonnummer <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={ownerData.phone}
                        onChange={(e) =>
                          handleOwnerChange("phone", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="070-123 45 67"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Adress
                      </label>
                      <input
                        type="text"
                        value={ownerData.address}
                        onChange={(e) =>
                          handleOwnerChange("address", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="Exempelgatan 123"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Postnummer
                      </label>
                      <input
                        type="text"
                        value={ownerData.zipCode}
                        onChange={(e) =>
                          handleOwnerChange("zipCode", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="123 45"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Ort
                      </label>
                      <input
                        type="text"
                        value={ownerData.city}
                        onChange={(e) =>
                          handleOwnerChange("city", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="Stockholm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Lösenord <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={ownerData.password}
                        onChange={(e) =>
                          handleOwnerChange("password", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="Minst 6 tecken"
                        minLength={6}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minst 6 tecken långt
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bekräfta lösenord{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={ownerData.confirmPassword}
                        onChange={(e) =>
                          handleOwnerChange("confirmPassword", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent transition-all"
                        placeholder="Samma som ovan"
                        minLength={6}
                        required
                      />
                    </div>

                    {/* GDPR och villkor */}
                    <div className="md:col-span-2 space-y-3 mt-4 pt-4 border-t">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="gdprConsent"
                          checked={ownerData.gdprConsent}
                          onChange={(e) =>
                            handleOwnerChange(
                              "gdprConsent",
                              e.target.checked.toString()
                            )
                          }
                          className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                        />
                        <label
                          htmlFor="gdprConsent"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Jag godkänner att mina personuppgifter behandlas
                          enligt{" "}
                          <Link
                            href="/gdpr"
                            className="text-[#2c7a4c] underline hover:text-[#245a3e]"
                            target="_blank"
                          >
                            GDPR
                          </Link>{" "}
                          och{" "}
                          <Link
                            href="/legal/terms-customer"
                            className="text-[#2c7a4c] underline hover:text-[#245a3e]"
                            target="_blank"
                          >
                            användarvillkoren
                          </Link>
                          . *
                        </label>
                      </div>

                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="marketingConsent"
                          checked={ownerData.marketingConsent}
                          onChange={(e) =>
                            handleOwnerChange(
                              "marketingConsent",
                              e.target.checked.toString()
                            )
                          }
                          className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                        />
                        <label
                          htmlFor="marketingConsent"
                          className="ml-2 text-sm text-gray-700"
                        >
                          Jag vill ta emot nyheter och erbjudanden via e-post
                          (valfritt)
                        </label>
                      </div>

                      <p className="text-xs text-gray-500 italic">
                        * Obligatoriska fält måste fyllas i för att kunna
                        fortsätta
                      </p>
                    </div>
                  </div>
                )}

                {/* Steg 2: Kontaktperson */}
                {currentStep === 2 && (
                  <div>
                    <p className="text-gray-600 mb-4">
                      Valfritt: Lägg till en extra kontaktperson som kan nås vid
                      behov.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Förnamn
                        </label>
                        <input
                          type="text"
                          value={contactData.firstName}
                          onChange={(e) =>
                            handleContactChange("firstName", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          placeholder="Erik"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Efternamn
                        </label>
                        <input
                          type="text"
                          value={contactData.lastName}
                          onChange={(e) =>
                            handleContactChange("lastName", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          placeholder="Andersson"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Telefonnummer
                        </label>
                        <input
                          type="tel"
                          value={contactData.phone}
                          onChange={(e) =>
                            handleContactChange("phone", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          placeholder="070-987 65 43"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Steg 3: Hunduppgifter */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold mb-3">
                        Grunduppgifter
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Hundens namn *
                          </label>
                          <input
                            type="text"
                            value={dogData.name}
                            onChange={(e) =>
                              handleDogChange("name", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            placeholder="Bella"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Ras <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={dogData.breed}
                            onChange={(e) =>
                              handleDogChange("breed", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            required
                          >
                            <option value="">Välj hundras...</option>
                            {DOG_BREEDS.map((breed) => (
                              <option key={breed} value={breed}>
                                {breed}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Födelsedatum <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={dogData.birthDate}
                            onChange={(e) =>
                              handleDogChange("birthDate", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Kön <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={dogData.gender}
                            onChange={(e) =>
                              handleDogChange("gender", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            required
                          >
                            <option value="">Välj kön</option>
                            <option value="hane">Hane</option>
                            <option value="tik">Tik</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Mankhöjd (cm){" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            value={dogData.shoulderHeight}
                            onChange={(e) =>
                              handleDogChange("shoulderHeight", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            placeholder="55"
                            min="1"
                            max="150"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Mankhöjden mäts från marken till ovansidan av
                            skulderbladen
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Hälsa & Beteende - MATCHAR bokningsflödet */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3">
                        Hälsa & Beteende
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dogData.isCastrated}
                            onChange={(e) =>
                              handleDogChange("isCastrated", e.target.checked)
                            }
                            className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Kastrerad/Steriliserad
                          </span>
                        </label>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dogData.escapeTendency}
                            onChange={(e) =>
                              handleDogChange(
                                "escapeTendency",
                                e.target.checked
                              )
                            }
                            className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Rymningsbenägen / Klättrar över staket
                          </span>
                        </label>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dogData.bitesSeparates}
                            onChange={(e) =>
                              handleDogChange(
                                "bitesSeparates",
                                e.target.checked
                              )
                            }
                            className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Biter sönder saker
                          </span>
                        </label>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dogData.notHousebroken}
                            onChange={(e) =>
                              handleDogChange(
                                "notHousebroken",
                                e.target.checked
                              )
                            }
                            className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Ej rumsren
                          </span>
                        </label>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dogData.allergies}
                            onChange={(e) =>
                              handleDogChange("allergies", e.target.checked)
                            }
                            className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Allergier
                          </span>
                        </label>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={dogData.takingMedication}
                            onChange={(e) =>
                              handleDogChange(
                                "takingMedication",
                                e.target.checked
                              )
                            }
                            className="mt-1 h-4 w-4 text-[#2c7a4c] focus:ring-[#2c7a4c] border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            Tar medicin
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Medicinska anteckningar */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Medicinska anteckningar
                      </label>
                      <textarea
                        value={dogData.careNotes || ""}
                        onChange={(e) =>
                          handleDogChange("careNotes", e.target.value)
                        }
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                        placeholder="T.ex. allergier, mediciner, särskilda behov..."
                        rows={3}
                      />
                    </div>

                    {/* Försäkring */}
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Försäkring</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Försäkringsbolag
                          </label>
                          <input
                            type="text"
                            value={dogData.insuranceCompany}
                            onChange={(e) =>
                              handleDogChange(
                                "insuranceCompany",
                                e.target.value
                              )
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            placeholder="Folksam"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Försäkringsnummer
                          </label>
                          <input
                            type="text"
                            value={dogData.insuranceNumber}
                            onChange={(e) =>
                              handleDogChange("insuranceNumber", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            placeholder="123456789"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Vaccination DHP (giltigt till)
                          </label>
                          <input
                            type="date"
                            value={dogData.vaccinationDHP}
                            onChange={(e) =>
                              handleDogChange("vaccinationDHP", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Vaccination Pi (giltigt till)
                          </label>
                          <input
                            type="date"
                            value={dogData.vaccinationPi}
                            onChange={(e) =>
                              handleDogChange("vaccinationPi", e.target.value)
                            }
                            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Specialbehov/Beteende */}
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Vård/Medicin (fritext)
                      </label>
                      <textarea
                        value={dogData.specialNotes || ""}
                        onChange={(e) =>
                          handleDogChange("specialNotes", e.target.value)
                        }
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                        placeholder="Inga mediciner"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg shadow-sm flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">
                        Det gick inte att slutföra registreringen
                      </p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-4 py-3 rounded-lg shadow-sm flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="whitespace-pre-line">{success}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() =>
                      currentStep > 1 && setCurrentStep(currentStep - 1)
                    }
                    disabled={currentStep === 1 || loading}
                    className="px-6"
                  >
                    Föregående
                  </Button>

                  {currentStep < 3 ? (
                    <Button
                      onClick={() => {
                        if (currentStep === 1) {
                          const error = validateStep1();
                          if (error) {
                            setError(error);
                            return;
                          }
                        }
                        setError(null);
                        setCurrentStep(currentStep + 1);
                      }}
                      className="bg-[#2c7a4c] hover:bg-[#245a3e] text-white px-8"
                    >
                      Nästa →
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-[#2c7a4c] hover:bg-[#245a3e] text-white px-8 min-w-[160px]"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Skapar...
                        </span>
                      ) : (
                        "Skapa konto"
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FormErrorBoundary>
  );
}
