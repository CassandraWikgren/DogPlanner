"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { X, Mail, Phone, User, FileText, Upload } from "lucide-react";

// Error codes
const ERROR_CODES = {
  EMAIL_INVALID: "[ERR-6001] Ogiltig email-adress",
  PHONE_INVALID: "[ERR-6002] Ogiltigt telefonnummer",
  UPLOAD_FAILED: "[ERR-6003] Uppladdning av blankett misslyckades",
  DATABASE_ERROR: "[ERR-6004] Databasfel vid registrering",
  EMAIL_SEND_FAILED: "[ERR-6005] Kunde inte skicka bekräftelse-email",
} as const;

interface AssistedRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ownerId: string) => void;
  orgId: string;
}

type RegistrationType = "email" | "physical" | null;

export default function AssistedRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
  orgId,
}: AssistedRegistrationModalProps) {
  const supabase = createClientComponentClient();
  const [step, setStep] = useState<RegistrationType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email-baserad registrering
  const [emailFormData, setEmailFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });

  // Fysisk blankett-registrering
  const [physicalFormData, setPhysicalFormData] = useState({
    full_name: "",
    phone: "",
    email: "", // Frivilligt
    address: "",
    notes: "",
  });
  const [formFile, setFormFile] = useState<File | null>(null);

  if (!isOpen) return null;

  // ============================================
  // ALTERNATIV 1: EMAIL-BASERAD REGISTRERING
  // ============================================
  const handleEmailRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validera email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailFormData.email)) {
        throw new Error(ERROR_CODES.EMAIL_INVALID);
      }

      // Validera telefon (svenskt format)
      const phoneRegex = /^(\+46|0)[1-9]\d{8,9}$/;
      if (!phoneRegex.test(emailFormData.phone.replace(/[\s-]/g, ""))) {
        throw new Error(ERROR_CODES.PHONE_INVALID);
      }

      // 1. Skapa owner med status 'pending'
      const { data: owner, error: ownerError } = await supabase
        .from("owners")
        .insert({
          org_id: orgId,
          full_name: emailFormData.full_name,
          email: emailFormData.email,
          phone: emailFormData.phone,
          address: emailFormData.address,
          city: emailFormData.city,
          postal_code: emailFormData.postal_code,
          consent_status: "pending",
          consent_verified_at: null,
        })
        .select()
        .single();

      if (ownerError)
        throw new Error(`${ERROR_CODES.DATABASE_ERROR}: ${ownerError.message}`);

      // 2. Skapa initial consent_log (pending)
      const { error: consentError } = await supabase
        .from("consent_logs")
        .insert({
          owner_id: owner.id,
          org_id: orgId,
          consent_type: "digital_email",
          consent_given: false, // Väntar på bekräftelse
          consent_text: `Assisterad registrering påbörjad av personal. Email skickat till ${emailFormData.email} för bekräftelse.`,
          consent_version: "1.0",
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (consentError) console.error("Consent log error:", consentError);

      // 3. Skicka bekräftelse-email via API
      const { error: emailError } = await fetch("/api/consent/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: owner.id,
          email: emailFormData.email,
          name: emailFormData.full_name,
          orgId,
        }),
      }).then((res) => res.json());

      if (emailError) {
        console.error(ERROR_CODES.EMAIL_SEND_FAILED, emailError);
        // Fortsätt ändå - personal kan skicka manuellt
      }

      // Framgång!
      onSuccess(owner.id);
      onClose();
    } catch (err: any) {
      console.error("Email registration error:", err);
      setError(err.message || ERROR_CODES.DATABASE_ERROR);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ALTERNATIV 3: FYSISK BLANKETT-REGISTRERING
  // ============================================
  const handlePhysicalRegistration = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formFile) {
        throw new Error(
          "Du måste ladda upp en foto/scan av den signerade blanketten"
        );
      }

      // Validera telefon
      const phoneRegex = /^(\+46|0)[1-9]\d{8,9}$/;
      if (!phoneRegex.test(physicalFormData.phone.replace(/[\s-]/g, ""))) {
        throw new Error(ERROR_CODES.PHONE_INVALID);
      }

      // 1. Ladda upp blankett till Supabase Storage
      const fileExt = formFile.name.split(".").pop();
      const fileName = `consent-forms/${orgId}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, formFile);

      if (uploadError)
        throw new Error(`${ERROR_CODES.UPLOAD_FAILED}: ${uploadError.message}`);

      // Hämta publik URL
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // 2. Skapa owner med status 'verified' (blankett är redan signerad)
      const { data: owner, error: ownerError } = await supabase
        .from("owners")
        .insert({
          org_id: orgId,
          full_name: physicalFormData.full_name,
          email: physicalFormData.email || null, // Frivilligt
          phone: physicalFormData.phone,
          address: physicalFormData.address || null,
          consent_status: "verified", // Redan godkänd via fysisk blankett
          consent_verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (ownerError)
        throw new Error(`${ERROR_CODES.DATABASE_ERROR}: ${ownerError.message}`);

      // 3. Skapa consent_log med referens till uppladdad blankett
      const { error: consentError } = await supabase
        .from("consent_logs")
        .insert({
          owner_id: owner.id,
          org_id: orgId,
          consent_type: "physical_form",
          consent_given: true,
          consent_text: `Fysisk blankett signerad av kund. Dokumentation uppladdad.`,
          consent_version: "1.0",
          signed_document_url: urlData.publicUrl,
          witness_staff_id: (await supabase.auth.getUser()).data.user?.id,
          witness_notes: physicalFormData.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (consentError) console.error("Consent log error:", consentError);

      // Framgång!
      onSuccess(owner.id);
      onClose();
    } catch (err: any) {
      console.error("Physical registration error:", err);
      setError(err.message || ERROR_CODES.UPLOAD_FAILED);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-[#2c7a4c]">
              Ny kund - Assisterad registrering
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              GDPR-säker registrering för kunder som behöver hjälp
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!step ? (
            // Välj registrerings-typ
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Hur vill du registrera kunden?
              </h3>

              {/* Alternativ 1: Email */}
              <button
                onClick={() => setStep("email")}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg transition-colors flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      📧 Email-baserad registrering
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Kunden får ett email med länk för att bekräfta sina
                      uppgifter och skapa konto. Rekommenderas för kunder med
                      email.
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        ✓ GDPR-säker
                      </span>
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        ✓ Automatisk dokumentation
                      </span>
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        ✓ Kunden har kontroll
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Alternativ 3: Fysisk blankett */}
              <button
                onClick={() => setStep("physical")}
                className="w-full p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all text-left group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg transition-colors flex-shrink-0">
                    <FileText className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1 text-sm">
                      📄 Fysisk blankett (signerad)
                    </h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Ladda upp foto/scan av signerad GDPR-blankett. Använd för
                      kunder utan email eller som föredrar papper.
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-500">
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        ✓ Fungerar utan email
                      </span>
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        ✓ Fysisk dokumentation
                      </span>
                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs">
                        ✓ Juridiskt giltigt
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* GDPR-info */}
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <h5 className="font-semibold text-xs text-gray-900 mb-2 flex items-center gap-2">
                  🔒 GDPR-information
                </h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Samtycke dokumenteras med tidsstämpel och ursprung</li>
                  <li>• Kunden kan när som helst återkalla samtycke</li>
                  <li>• Personnummer är frivilligt och får ej krävas</li>
                </ul>
              </div>
            </div>
          ) : step === "email" ? (
            // Email-baserad registrering-formulär
            <div className="space-y-3">
              <button
                onClick={() => setStep(null)}
                className="text-xs text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Tillbaka
              </button>

              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Fyll i kundens uppgifter
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Namn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={emailFormData.full_name}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Anna Andersson"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailFormData.email}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="anna@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={emailFormData.phone}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="070-123 45 67"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Adress (frivilligt)
                  </label>
                  <input
                    type="text"
                    value={emailFormData.address}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Storgatan 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Stad (frivilligt)
                  </label>
                  <input
                    type="text"
                    value={emailFormData.city}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        city: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Stockholm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Postnummer (frivilligt)
                  </label>
                  <input
                    type="text"
                    value={emailFormData.postal_code}
                    onChange={(e) =>
                      setEmailFormData({
                        ...emailFormData,
                        postal_code: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="123 45"
                  />
                </div>
              </div>

              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Nästa steg:</strong> Ett email skickas till kunden med
                  länk för att bekräfta uppgifterna och skapa lösenord.
                  Personnummer kan anges frivilligt vid bekräftelsen.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-3">
                <button
                  onClick={() => setStep(null)}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleEmailRegistration}
                  disabled={
                    loading ||
                    !emailFormData.full_name ||
                    !emailFormData.email ||
                    !emailFormData.phone
                  }
                  className="px-4 py-2 text-sm bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Skickar..." : "Skicka bekräftelse-email"}
                </button>
              </div>
            </div>
          ) : (
            // Fysisk blankett-formulär
            <div className="space-y-4">
              <button
                onClick={() => setStep(null)}
                className="text-sm text-gray-600 hover:text-gray-900 mb-4"
              >
                ← Tillbaka
              </button>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Fysisk blankett-registrering
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Namn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={physicalFormData.full_name}
                    onChange={(e) =>
                      setPhysicalFormData({
                        ...physicalFormData,
                        full_name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Anna Andersson"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={physicalFormData.phone}
                    onChange={(e) =>
                      setPhysicalFormData({
                        ...physicalFormData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="070-123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (frivilligt)
                  </label>
                  <input
                    type="email"
                    value={physicalFormData.email}
                    onChange={(e) =>
                      setPhysicalFormData({
                        ...physicalFormData,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="anna@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adress (frivilligt)
                  </label>
                  <input
                    type="text"
                    value={physicalFormData.address}
                    onChange={(e) =>
                      setPhysicalFormData({
                        ...physicalFormData,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="Storgatan 1, 123 45 Stockholm"
                  />
                </div>

                {/* Uppladdning av blankett */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signerad blankett <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2c7a4c] transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Ta ett foto eller scanna den signerade blanketten
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="form-upload"
                    />
                    <label
                      htmlFor="form-upload"
                      className="inline-block px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] cursor-pointer"
                    >
                      Välj fil
                    </label>
                    {formFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {formFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anteckningar (frivilligt)
                  </label>
                  <textarea
                    value={physicalFormData.notes}
                    onChange={(e) =>
                      setPhysicalFormData({
                        ...physicalFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. särskilda önskemål eller omständigheter kring signeringen"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setStep(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handlePhysicalRegistration}
                  disabled={
                    loading ||
                    !physicalFormData.full_name ||
                    !physicalFormData.phone ||
                    !formFile
                  }
                  className="px-6 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Sparar..." : "Skapa konto"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
