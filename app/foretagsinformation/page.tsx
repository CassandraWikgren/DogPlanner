"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

interface OrgSettings {
  id: string;
  name: string | null;
  org_number?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_email?: string | null;
  invoice_email?: string | null;
  reply_to_email?: string | null;
  email_sender_name?: string | null;
  vat_included?: boolean | null;
  vat_rate?: number | null;
  pricing_currency?: string | null;
  // Betalningsinformation (fakturor)
  bankgiro?: string | null;
  plusgiro?: string | null;
  swish_number?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  bic_swift?: string | null;
  payment_terms_days?: number | null;
  late_fee_amount?: number | null;
  interest_rate?: number | null;
  invoice_prefix?: string | null;
}

export default function ForetagsInfoPage() {
  const supabase = createClient();
  const { currentOrgId, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<OrgSettings | null>(null);

  useEffect(() => {
    if (authLoading) return; // Vänta tills auth är klart

    if (currentOrgId) {
      loadSettings();
    } else {
      // ✅ FIX: Stoppa loading spinner även om currentOrgId saknas
      setLoading(false);
      setError(
        "Du måste vara inloggad som företag för att se företagsinformation"
      );
    }
  }, [currentOrgId, authLoading]);

  const loadSettings = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("orgs")
        .select("*")
        .eq("id", currentOrgId)
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (err: any) {
      console.error("Error loading settings:", err);
      setError(err.message || "Kunde inte ladda företagsinformation");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentOrgId || !settings) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from("orgs")
        .update({
          name: settings.name,
          org_number: settings.org_number,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          contact_email: settings.contact_email,
          invoice_email: settings.invoice_email,
          reply_to_email: settings.reply_to_email,
          email_sender_name: settings.email_sender_name,
          vat_included: settings.vat_included,
          vat_rate: settings.vat_rate,
          pricing_currency: settings.pricing_currency,
          // Betalningsinformation
          bankgiro: settings.bankgiro,
          plusgiro: settings.plusgiro,
          swish_number: settings.swish_number,
          bank_name: settings.bank_name,
          iban: settings.iban,
          bic_swift: settings.bic_swift,
          payment_terms_days: settings.payment_terms_days,
          late_fee_amount: settings.late_fee_amount,
          interest_rate: settings.interest_rate,
          invoice_prefix: settings.invoice_prefix,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentOrgId);

      if (error) throw error;

      setSuccess("✅ Inställningar sparade!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Kunde inte spara inställningar");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof OrgSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Företagsinformation
            </h1>
            <p className="mt-1 text-base text-gray-600">
              Hantera företagsuppgifter och kontaktinformation
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm text-center">
            <p className="text-sm text-gray-600">Laddar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Företagsinformation
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-sm text-red-600">
              Kunde inte ladda företagsinformation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - EXAKT som Hunddagis */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Företagsinformation
          </h1>
          <p className="mt-1 text-base text-gray-600">
            Hantera företagsuppgifter, kontaktinformation och
            fakturainställningar
          </p>
        </div>
      </div>

      {/* Main Content - EXAKT som Hunddagis */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-800">{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">Allmänt</TabsTrigger>
            <TabsTrigger value="email">Email-inställningar</TabsTrigger>
            <TabsTrigger value="billing">Fakturering</TabsTrigger>
            <TabsTrigger value="links">Länkar</TabsTrigger>
          </TabsList>

          {/* Allmän Information */}
          <TabsContent value="general">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-[#333333] flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5" />
                Företagsuppgifter
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">
                    Företagsnamn *
                  </Label>
                  <Input
                    id="name"
                    value={settings.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Bella Hunddagis AB"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="org_number" className="text-sm">
                    Organisationsnummer
                  </Label>
                  <Input
                    id="org_number"
                    value={settings.org_number || ""}
                    onChange={(e) => updateField("org_number", e.target.value)}
                    placeholder="556789-1234"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Primär Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="info@belladagis.se"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Generell kontakt-email för företaget
                  </p>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="08-123 456 78"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Adress
                  </Label>
                  <Input
                    id="address"
                    value={settings.address || ""}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Hundgatan 123, 123 45 Stockholm"
                    className="text-sm"
                  />
                </div>

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm disabled:opacity-50"
                >
                  {saving ? (
                    "Sparar..."
                  ) : (
                    <>
                      <Save className="inline h-4 w-4 mr-2" />
                      Spara ändringar
                    </>
                  )}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Email-inställningar */}
          <TabsContent value="email">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-[#333333] flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5" />
                Email-inställningar
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">
                    📧 Om email-inställningar
                  </h4>
                  <p className="text-xs text-blue-800">
                    Dessa email-adresser används när systemet skickar email till
                    dina kunder (fakturor, bekräftelser, påminnelser).
                  </p>
                  <p className="text-xs text-blue-800 mt-2">
                    <strong>System-email (info@dogplanner.se)</strong> används
                    för plattforms-meddelanden som lösenordsåterställning och
                    support.
                  </p>
                </div>

                <div>
                  <Label htmlFor="email_sender_name" className="text-sm">
                    Avsändarnamn
                  </Label>
                  <Input
                    id="email_sender_name"
                    value={settings.email_sender_name || ""}
                    onChange={(e) =>
                      updateField("email_sender_name", e.target.value)
                    }
                    placeholder="Bella Hunddagis"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Namnet som visas som avsändare i email till kunder
                  </p>
                </div>

                <div>
                  <Label htmlFor="contact_email" className="text-sm">
                    Kontakt-email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ""}
                    onChange={(e) =>
                      updateField("contact_email", e.target.value)
                    }
                    placeholder="kontakt@belladagis.se"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email som visas för kundkontakt och bekräftelser
                  </p>
                </div>

                <div>
                  <Label htmlFor="invoice_email" className="text-sm">
                    Faktura-email
                  </Label>
                  <Input
                    id="invoice_email"
                    type="email"
                    value={settings.invoice_email || ""}
                    onChange={(e) =>
                      updateField("invoice_email", e.target.value)
                    }
                    placeholder="faktura@belladagis.se"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email som används som avsändare på kundfakturor
                  </p>
                </div>

                <div>
                  <Label htmlFor="reply_to_email" className="text-sm">
                    Reply-To email
                  </Label>
                  <Input
                    id="reply_to_email"
                    type="email"
                    value={settings.reply_to_email || ""}
                    onChange={(e) =>
                      updateField("reply_to_email", e.target.value)
                    }
                    placeholder="info@belladagis.se"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email som kunder ska svara till när de besvarar emails
                  </p>
                </div>

                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm disabled:opacity-50"
                >
                  {saving ? (
                    "Sparar..."
                  ) : (
                    <>
                      <Save className="inline h-4 w-4 mr-2" />
                      Spara email-inställningar
                    </>
                  )}
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Fakturering */}
          <TabsContent value="billing">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm space-y-6">
              {/* Momsinställningar */}
              <div>
                <h2 className="text-lg font-semibold text-[#333333] mb-4">
                  Moms och valuta
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pricing_currency" className="text-sm">
                      Valuta
                    </Label>
                    <Input
                      id="pricing_currency"
                      value={settings.pricing_currency || "SEK"}
                      onChange={(e) =>
                        updateField("pricing_currency", e.target.value)
                      }
                      placeholder="SEK"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <Label htmlFor="vat_rate" className="text-sm">
                      Momssats (%)
                    </Label>
                    <Input
                      id="vat_rate"
                      type="number"
                      value={settings.vat_rate || 25}
                      onChange={(e) =>
                        updateField("vat_rate", parseFloat(e.target.value))
                      }
                      placeholder="25"
                      className="text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="vat_included"
                      checked={settings.vat_included || false}
                      onChange={(e) =>
                        updateField("vat_included", e.target.checked)
                      }
                      className="h-4 w-4"
                    />
                    <Label htmlFor="vat_included" className="text-sm">
                      Priser inkluderar moms
                    </Label>
                  </div>
                </div>
              </div>

              {/* Betalningsinformation */}
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-lg font-semibold text-[#333333] mb-2">
                  Betalningsinformation för fakturor
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Denna information visas på kundfakturor (PDF) och används för
                  betalningar
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bankgiro" className="text-sm">
                        Bankgiro
                      </Label>
                      <Input
                        id="bankgiro"
                        value={settings.bankgiro || ""}
                        onChange={(e) =>
                          updateField("bankgiro", e.target.value)
                        }
                        placeholder="123-4567"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="plusgiro" className="text-sm">
                        Plusgiro
                      </Label>
                      <Input
                        id="plusgiro"
                        value={settings.plusgiro || ""}
                        onChange={(e) =>
                          updateField("plusgiro", e.target.value)
                        }
                        placeholder="12 34 56-7"
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="swish_number" className="text-sm">
                        Swish-nummer
                      </Label>
                      <Input
                        id="swish_number"
                        value={settings.swish_number || ""}
                        onChange={(e) =>
                          updateField("swish_number", e.target.value)
                        }
                        placeholder="123 456 78 90"
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="bank_name" className="text-sm">
                        Bank
                      </Label>
                      <Input
                        id="bank_name"
                        value={settings.bank_name || ""}
                        onChange={(e) =>
                          updateField("bank_name", e.target.value)
                        }
                        placeholder="SEB, Swedbank, Nordea..."
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-[#333333] mb-3">
                      Internationella betalningar (valfritt)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="iban" className="text-sm">
                          IBAN
                        </Label>
                        <Input
                          id="iban"
                          value={settings.iban || ""}
                          onChange={(e) => updateField("iban", e.target.value)}
                          placeholder="SE45 5000 0000 0583 9825 7466"
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <Label htmlFor="bic_swift" className="text-sm">
                          BIC/SWIFT
                        </Label>
                        <Input
                          id="bic_swift"
                          value={settings.bic_swift || ""}
                          onChange={(e) =>
                            updateField("bic_swift", e.target.value)
                          }
                          placeholder="ESSESESS"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-[#333333] mb-3">
                      Faktureringsvillkor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payment_terms_days" className="text-sm">
                          Betalningsvillkor (dagar)
                        </Label>
                        <Input
                          id="payment_terms_days"
                          type="number"
                          value={settings.payment_terms_days || 14}
                          onChange={(e) =>
                            updateField(
                              "payment_terms_days",
                              parseInt(e.target.value)
                            )
                          }
                          placeholder="14"
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Antal dagar kund har på sig att betala (standard: 14)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="invoice_prefix" className="text-sm">
                          Fakturanummer-prefix
                        </Label>
                        <Input
                          id="invoice_prefix"
                          value={settings.invoice_prefix || "INV"}
                          onChange={(e) =>
                            updateField("invoice_prefix", e.target.value)
                          }
                          placeholder="INV"
                          className="text-sm"
                          maxLength={10}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Ex: INV → INV-2025-00001
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="late_fee_amount" className="text-sm">
                          Påminnelseavgift (kr)
                        </Label>
                        <Input
                          id="late_fee_amount"
                          type="number"
                          step="0.01"
                          value={settings.late_fee_amount || 60}
                          onChange={(e) =>
                            updateField(
                              "late_fee_amount",
                              parseFloat(e.target.value)
                            )
                          }
                          placeholder="60.00"
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Lagstadgad påminnelseavgift (standard: 60 kr)
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="interest_rate" className="text-sm">
                          Dröjsmålsränta (% per år)
                        </Label>
                        <Input
                          id="interest_rate"
                          type="number"
                          step="0.01"
                          value={settings.interest_rate || 8.0}
                          onChange={(e) =>
                            updateField(
                              "interest_rate",
                              parseFloat(e.target.value)
                            )
                          }
                          placeholder="8.00"
                          className="text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Dröjsmålsränta vid försenad betalning (standard: 8%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm disabled:opacity-50"
              >
                {saving ? (
                  "Sparar..."
                ) : (
                  <>
                    <Save className="inline h-4 w-4 mr-2" />
                    Spara faktureringsinställningar
                  </>
                )}
              </button>
            </div>
          </TabsContent>

          {/* Länkar */}
          <TabsContent value="links">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-[#333333] mb-4">
                Snabblänkar
              </h2>
              <div className="space-y-3">
                <Link href="/subscription">
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-[#333333]">
                    Mitt abonnemang
                  </div>
                </Link>
                <Link href="/terms">
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-[#333333]">
                    Användarvillkor
                  </div>
                </Link>
                <Link href="/faktura">
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-[#333333]">
                    Fakturor
                  </div>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
