"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PawPrint, User, Users } from "lucide-react";

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
  });

  // Steg 2: Kontaktperson
  const [contactData, setContactData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Steg 3: Hunduppgifter
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
    specialNotes: "", // Nytt fält för specialbehov/beteende
    // Checkboxes (behålls för bakåtkompatibilitet men används inte i UI)
    isCastrated: false,
    bites: false,
    peesInside: false,
    barks: false,
    isStaffDog: false,
    isBoardingDog: false,
    allowsPlayWithOthers: false,
    allowsPhotos: false,
  });

  const handleOwnerChange = (field: string, value: string) => {
    setOwnerData((prev) => ({ ...prev, [field]: value }));
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
    if (!ownerData.phone) return "Telefonnummer krävs";
    if (!ownerData.password) return "Lösenord krävs";
    if (ownerData.password !== ownerData.confirmPassword)
      return "Lösenorden matchar inte";
    if (ownerData.password.length < 6)
      return "Lösenordet måste vara minst 6 tecken";
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
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Validera sista steget
      const stepError = validateStep3();
      if (stepError) {
        throw new Error(`${ERROR_CODES.VALIDATION} ${stepError}`);
      }

      console.log("[DEBUG] Startar Supabase Auth registrering...");

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

      console.log("[DEBUG] Auth-användare skapad:", authData.user.id);

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
      ownerData_insert.gdpr_consent = true;
      ownerData_insert.marketing_consent = false;
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

      console.log("[DEBUG] Ägarprofil skapad:", newOwner); // 2. Skapa hunden kopplad till ägaren (dogs.owner_id → owners.id)
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

      // Personlighetsdrag som array baserat på checkboxes (för bakåtkompatibilitet)
      const personality = [];
      if (dogData.bites) personality.push("Biter på saker");
      if (dogData.peesInside) personality.push("Kissar inne");
      if (dogData.isStaffDog) personality.push("Personalhund");
      if (dogData.allowsPhotos)
        personality.push("Tillåter fotos på sociala medier");
      if (dogData.allowsPlayWithOthers) personality.push("Hund sköter");
      if (dogData.isBoardingDog) personality.push("Pensionatshund");
      if (dogData.barks) personality.push("Skäller mycket");

      // Om specialNotes finns, lägg till det i personality_traits också
      if (dogData.specialNotes && personality.length === 0) {
        personality.push(dogData.specialNotes);
      }

      if (personality.length > 0)
        dogData_insert.personality_traits = personality;

      console.log("[DEBUG] Försöker skapa hund med data:", dogData_insert);

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
          "🎉 Registrering lyckades! Din e-postadress är verifierad. Du omdirigeras till inloggningen..."
        );
        setTimeout(() => {
          router.push("/kundportal/login?message=registration_complete");
        }, 3000);
      } else {
        // Användaren behöver verifiera e-post
        setSuccess(
          "✅ Registrering lyckades! \n\n📧 Vi har skickat en verifieringslänk till " +
            ownerData.email +
            ". \n\nKlicka på länken i e-posten för att aktivera ditt konto. \n\n💡 Glöm inte att kolla skräppost-mappen!"
        );
        setTimeout(() => {
          router.push("/kundportal/login?message=check_email");
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/kundportal">
            <Button variant="ghost" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <PawPrint className="h-8 w-8 text-[#2c7a4c] mr-3" />
          <h1 className="text-3xl font-bold text-gray-800">Skapa konto</h1>
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-[#2c7a4c] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    currentStep >= step
                      ? "text-[#2c7a4c] font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {step === 1 && "Ägaruppgifter"}
                  {step === 2 && "Kontaktperson"}
                  {step === 3 && "Hunduppgifter"}
                </span>
                {step < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step ? "bg-[#2c7a4c]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
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
                      Förnamn *
                    </label>
                    <input
                      type="text"
                      value={ownerData.firstName}
                      onChange={(e) =>
                        handleOwnerChange("firstName", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="Anna"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Efternamn *
                    </label>
                    <input
                      type="text"
                      value={ownerData.lastName}
                      onChange={(e) =>
                        handleOwnerChange("lastName", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="Andersson"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Personnummer *
                    </label>
                    <input
                      type="text"
                      value={ownerData.personalNumber}
                      onChange={(e) =>
                        handleOwnerChange("personalNumber", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="YYYYMMDD-XXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      E-postadress *
                    </label>
                    <input
                      type="email"
                      value={ownerData.email}
                      onChange={(e) =>
                        handleOwnerChange("email", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="anna@exempel.se"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telefonnummer *
                    </label>
                    <input
                      type="tel"
                      value={ownerData.phone}
                      onChange={(e) =>
                        handleOwnerChange("phone", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="070-123 45 67"
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
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
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
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="Stockholm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Lösenord *
                    </label>
                    <input
                      type="password"
                      value={ownerData.password}
                      onChange={(e) =>
                        handleOwnerChange("password", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="Minst 6 tecken"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Bekräfta lösenord *
                    </label>
                    <input
                      type="password"
                      value={ownerData.confirmPassword}
                      onChange={(e) =>
                        handleOwnerChange("confirmPassword", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                      placeholder="Samma som ovan"
                    />
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
                          Ras *
                        </label>
                        <input
                          type="text"
                          value={dogData.breed}
                          onChange={(e) =>
                            handleDogChange("breed", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          placeholder="Golden Retriever"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Mankhöjd (cm)
                        </label>
                        <input
                          type="number"
                          value={dogData.shoulderHeight}
                          onChange={(e) =>
                            handleDogChange("shoulderHeight", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          placeholder="55"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Födelsedatum *
                        </label>
                        <input
                          type="date"
                          value={dogData.birthDate}
                          onChange={(e) =>
                            handleDogChange("birthDate", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Kön *
                        </label>
                        <select
                          value={dogData.gender}
                          onChange={(e) =>
                            handleDogChange("gender", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                        >
                          <option value="">Välj kön</option>
                          <option value="hane">Hane</option>
                          <option value="tik">Tik</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Försäkringsbolag
                        </label>
                        <input
                          type="text"
                          value={dogData.insuranceCompany}
                          onChange={(e) =>
                            handleDogChange("insuranceCompany", e.target.value)
                          }
                          className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                          placeholder="Agria"
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
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Specialbehov/Beteende
                    </label>
                    <textarea
                      value={dogData.specialNotes || ""}
                      onChange={(e) =>
                        handleDogChange("specialNotes", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] h-20"
                      placeholder="Beskriv hundens beteende, specialbehov eller andra viktiga upplysningar (t.ex. kastrerad, kissar inne, biter på saker, personalhund, pensionatshund, får leka med andra, etc.)"
                    />
                  </div>{" "}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Vård/Medicin (fritext)
                    </label>
                    <textarea
                      value={dogData.careNotes}
                      onChange={(e) =>
                        handleDogChange("careNotes", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] h-24"
                      placeholder="Eventuella mediciner, allergier eller andra hälsouppgifter..."
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={() =>
                    currentStep > 1 && setCurrentStep(currentStep - 1)
                  }
                  disabled={currentStep === 1}
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
                    className="bg-[#2c7a4c] hover:bg-[#245a3e]"
                  >
                    Nästa
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#2c7a4c] hover:bg-[#245a3e]"
                  >
                    {loading ? "Skapar konto..." : "Skapa konto"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
