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
import {
  PawPrint,
  User,
  Users,
  AlertCircle,
  CheckCircle,
  Home,
  Sun,
  Plus,
  X,
  ArrowRight,
} from "lucide-react";
import { DOG_BREEDS } from "@/lib/dogBreeds";
import { FormErrorBoundary } from "@/components/ErrorBoundaries";

// Typdefinitioner för hundar
interface DogFormData {
  id: string; // Unik identifierare för formuläret
  name: string;
  breed: string;
  shoulderHeight: string;
  birthDate: string;
  gender: string;
  insuranceNumber: string;
  insuranceCompany: string;
  vaccinationDHP: string;
  vaccinationPi: string;
  careNotes: string;
  specialNotes: string;
  isCastrated: boolean;
  escapeTendency: boolean;
  bitesSeparates: boolean;
  notHousebroken: boolean;
  allergies: boolean;
  takingMedication: boolean;
}

// Skapa tom hundprofil
const createEmptyDog = (): DogFormData => ({
  id: crypto.randomUUID(),
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
  isCastrated: false,
  escapeTendency: false,
  bitesSeparates: false,
  notHousebroken: false,
  allergies: false,
  takingMedication: false,
});

// Registreringstyper
type RegistrationType = "boarding" | "daycare" | null;

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE: "[ERR-1001]",
  VALIDATION: "[ERR-4001]",
  AUTH: "[ERR-5001]",
} as const;

export default function CustomerRegisterPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Registreringstyp (pensionat eller dagis)
  const [registrationType, setRegistrationType] =
    useState<RegistrationType>(null);

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

  // Steg 3: Hunduppgifter - Nu med stöd för FLERA hundar
  const [dogs, setDogs] = useState<DogFormData[]>([createEmptyDog()]);
  const [activeDogIndex, setActiveDogIndex] = useState(0);

  // Lägg till ny hund
  const addDog = () => {
    setDogs((prev) => [...prev, createEmptyDog()]);
    setActiveDogIndex(dogs.length);
  };

  // Ta bort hund
  const removeDog = (index: number) => {
    if (dogs.length <= 1) return; // Måste ha minst en hund
    setDogs((prev) => prev.filter((_, i) => i !== index));
    if (activeDogIndex >= dogs.length - 1) {
      setActiveDogIndex(Math.max(0, dogs.length - 2));
    }
  };

  // Uppdatera hund
  const updateDog = (index: number, field: string, value: string | boolean) => {
    setDogs((prev) =>
      prev.map((dog, i) => (i === index ? { ...dog, [field]: value } : dog))
    );
  };

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

  // handleDogChange - använder nu updateDog med activeDogIndex
  const handleDogChange = (field: string, value: string | boolean) => {
    updateDog(activeDogIndex, field, value);
  };

  // Hämta aktuell hund för formuläret
  const dogData = dogs[activeDogIndex] || createEmptyDog();

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
    // Validera alla hundar
    for (let i = 0; i < dogs.length; i++) {
      const dog = dogs[i];
      if (!dog.name) return `Hund ${i + 1}: Namn krävs`;
      if (!dog.breed) return `Hund ${i + 1}: Ras krävs`;
      if (!dog.birthDate) return `Hund ${i + 1}: Födelsedatum krävs`;
      if (!dog.gender) return `Hund ${i + 1}: Kön måste väljas`;
    }
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

      // Insert owner - use the auth user id directly, don't need to select back
      const { error: ownerError } = await supabase
        .from("owners")
        .insert(ownerData_insert);

      if (ownerError) {
        console.error("[ERR-1001] Ägarfel:", ownerError);
        // Rensa upp auth-användare om databasfel
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte skapa ägarprofil: ${ownerError.message}`
        );
      }

      // Use the auth user id as the owner id (we set id = authData.user.id in insert)
      const newOwner = { id: authData.user.id };

      // 2. Skapa ALLA hundar kopplade till ägaren
      for (const dog of dogs) {
        const dogData_insert: any = {
          name: dog.name,
          breed: dog.breed,
          owner_id: newOwner.id,
        };

        // Lägg till valfria fält om de finns
        if (dog.birthDate) dogData_insert.birth_date = dog.birthDate;
        if (dog.gender) dogData_insert.gender = dog.gender;
        if (dog.shoulderHeight)
          dogData_insert.heightcm = parseFloat(dog.shoulderHeight);
        if (dog.isCastrated !== undefined)
          dogData_insert.is_sterilized = dog.isCastrated;
        if (dog.careNotes) dogData_insert.medical_notes = dog.careNotes;
        if (dog.specialNotes) dogData_insert.special_needs = dog.specialNotes;
        if (dog.insuranceNumber)
          dogData_insert.insurance_number = dog.insuranceNumber;
        if (dog.insuranceCompany)
          dogData_insert.insurance_company = dog.insuranceCompany;
        if (dog.vaccinationDHP)
          dogData_insert.vaccination_dhp = dog.vaccinationDHP;
        if (dog.vaccinationPi)
          dogData_insert.vaccination_pi = dog.vaccinationPi;

        // Personlighetsdrag baserat på checkboxes
        const personality = [];
        if (dog.bitesSeparates) personality.push("Biter/sliter sönder saker");
        if (dog.notHousebroken) personality.push("Ej rumsren");
        if (dog.escapeTendency) personality.push("Rymningsbenägen");
        if (dog.isCastrated) personality.push("Kastrerad");
        if (dog.allergies) personality.push("Allergier");
        if (dog.takingMedication) personality.push("Tar medicin");

        if (personality.length > 0)
          dogData_insert.personality_traits = personality;

        // Insert dog
        const { error: dogError } = await supabase
          .from("dogs")
          .insert(dogData_insert);

        if (dogError) {
          console.error("[ERR-1002] Hundfel:", dogError);
          throw new Error(
            `${ERROR_CODES.DATABASE} Kunde inte skapa hund "${dog.name}": ${dogError.message}`
          );
        }

        console.log("[DEBUG] Hund skapad:", dog.name);
      }

      console.log("[DEBUG] Alla hundar skapade för ägare:", newOwner.id);

      // Bestäm vilken sida att gå till baserat på registreringstyp
      const redirectUrl =
        registrationType === "boarding"
          ? "/kundportal/boka-pensionat"
          : "/kundportal/soka-hunddagis";

      const redirectMessage =
        registrationType === "boarding"
          ? "boka hundpensionat"
          : "söka hunddagisar";

      // Antal hundar för bekräftelsemeddelande
      const dogCountText =
        dogs.length === 1
          ? `Din hund ${dogs[0].name}`
          : `Dina ${dogs.length} hundar (${dogs.map((d) => d.name).join(", ")})`;

      // Skicka bekräftelsemeddelande
      if (authData.user.email_confirmed_at) {
        // Användaren är redan verifierad (t.ex. i utvecklingsmiljö)
        setSuccess(
          `Registrering lyckades! ${dogCountText} har registrerats. Du omdirigeras till att ${redirectMessage}...`
        );
        setTimeout(() => {
          router.push(redirectUrl);
        }, 3000);
      } else {
        // Användaren behöver verifiera e-post
        setSuccess(
          `Registrering lyckades! ${dogCountText} har registrerats.\n\nVi har skickat en verifieringslänk till ${ownerData.email}.\n\nKlicka på länken i e-posten för att aktivera ditt konto. Efter verifiering omdirigeras du till att ${redirectMessage}.\n\nGlöm inte att kolla skräppost-mappen!`
        );
        setTimeout(() => {
          router.push(
            `/kundportal/login?message=check_email&next=${redirectUrl}`
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

          {/* Val av registreringstyp - visas INNAN formuläret */}
          {!registrationType ? (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">
                    Vad vill du göra?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setRegistrationType("boarding")}
                      className="group p-6 border-2 border-gray-200 rounded-xl hover:border-[#2c7a4c] hover:bg-green-50 transition-all duration-200 text-left"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                          <Home className="h-8 w-8 text-[#2c7a4c]" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Hundpensionat
                        </h3>
                        <p className="text-sm text-gray-500">
                          Boka tillfällig vård för din hund när du är på resa
                          eller behöver hjälp
                        </p>
                        <div className="mt-4 flex items-center text-[#2c7a4c] font-medium text-sm">
                          Välj detta <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => router.push("/ansokan/hunddagis")}
                      className="group p-6 border-2 border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all duration-200 text-left"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                          <Sun className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          Hunddagis
                        </h3>
                        <p className="text-sm text-gray-500">
                          Ansök om dagisplats för din hund med löpande
                          abonnemang
                        </p>
                        <div className="mt-4 flex items-center text-amber-600 font-medium text-sm">
                          Skicka intresseanmälan{" "}
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </div>
                      </div>
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center mt-6">
                    Hunddagis kräver intresseanmälan till specifikt dagis.
                    Hundpensionat kan bokas direkt efter registrering.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
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
                          {currentStep > step ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            step
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs font-medium transition-colors ${
                            currentStep >= step
                              ? "text-[#2c7a4c]"
                              : "text-gray-400"
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
                  <p className="text-sm text-gray-600">
                    Steg {currentStep} av 3 — Hundpensionat
                  </p>
                  <button
                    onClick={() => setRegistrationType(null)}
                    className="text-xs text-[#2c7a4c] hover:underline mt-1"
                  >
                    ← Byt registreringstyp
                  </button>
                </div>
              </div>

              <div className="max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center">
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
                      </span>
                      <span className="text-sm font-normal text-[#2c7a4c] bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        Pensionat
                      </span>
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
                              handleOwnerChange(
                                "personalNumber",
                                e.target.value
                              )
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
                            Telefonnummer{" "}
                            <span className="text-red-500">*</span>
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
                              handleOwnerChange(
                                "confirmPassword",
                                e.target.value
                              )
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
                              Jag vill ta emot nyheter och erbjudanden via
                              e-post (valfritt)
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
                          Valfritt: Lägg till en extra kontaktperson som kan nås
                          vid behov.
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
                              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                              className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                              placeholder="070-987 65 43"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Steg 3: Hunduppgifter */}
                    {currentStep === 3 && (
                      <div className="space-y-6">
                        {/* Hundflikar - visa om flera hundar */}
                        {dogs.length > 1 && (
                          <div className="flex flex-wrap gap-2 pb-4 border-b">
                            {dogs.map((dog, index) => (
                              <button
                                key={dog.id}
                                onClick={() => setActiveDogIndex(index)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  activeDogIndex === index
                                    ? "bg-[#2c7a4c] text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                              >
                                <PawPrint className="h-4 w-4" />
                                {dog.name || `Hund ${index + 1}`}
                                {dogs.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeDog(index);
                                    }}
                                    className="ml-1 p-0.5 hover:bg-white/20 rounded"
                                    title="Ta bort hund"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </button>
                            ))}
                            <button
                              onClick={addDog}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-[#2c7a4c] hover:bg-green-200 transition-all"
                            >
                              <Plus className="h-4 w-4" />
                              Lägg till hund
                            </button>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold">
                              {dogs.length === 1
                                ? "Hunduppgifter"
                                : `Hund ${activeDogIndex + 1}: ${dogData.name || "Ny hund"}`}
                            </h4>
                            {dogs.length === 1 && (
                              <button
                                onClick={addDog}
                                className="flex items-center gap-1 text-sm text-[#2c7a4c] hover:underline"
                              >
                                <Plus className="h-4 w-4" />
                                Lägg till fler hundar
                              </button>
                            )}
                          </div>
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
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                Födelsedatum{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={dogData.birthDate}
                                onChange={(e) =>
                                  handleDogChange("birthDate", e.target.value)
                                }
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                  handleDogChange(
                                    "shoulderHeight",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                  handleDogChange(
                                    "isCastrated",
                                    e.target.checked
                                  )
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
                            className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                            placeholder="T.ex. allergier, mediciner, särskilda behov..."
                            rows={3}
                          />
                        </div>

                        {/* Försäkring */}
                        <div>
                          <h4 className="text-lg font-semibold mb-3">
                            Försäkring
                          </h4>
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
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                  handleDogChange(
                                    "insuranceNumber",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                  handleDogChange(
                                    "vaccinationDHP",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                                  handleDogChange(
                                    "vaccinationPi",
                                    e.target.value
                                  )
                                }
                                className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                            className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
            </>
          )}
        </div>
      </div>
    </FormErrorBoundary>
  );
}
