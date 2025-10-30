"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";

interface OrgSettings {
  id: string;
  name: string;
  org_number?: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_email?: string;
  invoice_email?: string;
  reply_to_email?: string;
  email_sender_name?: string;
  vat_included?: boolean;
  vat_rate?: number;
  pricing_currency?: string;
}

export default function ForetagsInfoPage() {
  const { currentOrgId } = useAuth();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<OrgSettings | null>(null);

  useEffect(() => {
    if (currentOrgId) {
      loadSettings();
    }
  }, [currentOrgId]);

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
      <div className="max-w-5xl mx-auto my-10 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Företagsinformation</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p>Laddar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-5xl mx-auto my-10 px-4">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">Kunde inte ladda företagsinformation</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Företagsinformation</h1>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Företagsuppgifter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Företagsnamn *</Label>
                <Input
                  id="name"
                  value={settings.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Bella Hunddagis AB"
                />
              </div>

              <div>
                <Label htmlFor="org_number">Organisationsnummer</Label>
                <Input
                  id="org_number"
                  value={settings.org_number || ""}
                  onChange={(e) => updateField("org_number", e.target.value)}
                  placeholder="556789-1234"
                />
              </div>

              <div>
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Primär Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="info@belladagis.se"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generell kontakt-email för företaget
                </p>
              </div>

              <div>
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={settings.phone || ""}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="08-123 456 78"
                />
              </div>

              <div>
                <Label htmlFor="address">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Adress
                </Label>
                <Input
                  id="address"
                  value={settings.address || ""}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Hundgatan 123, 123 45 Stockholm"
                />
              </div>

              <Button
                onClick={saveSettings}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  "Sparar..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara ändringar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email-inställningar */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email-inställningar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  📧 Om email-inställningar
                </h4>
                <p className="text-sm text-blue-800">
                  Dessa email-adresser används när systemet skickar email till
                  dina kunder (fakturor, bekräftelser, påminnelser).
                </p>
                <p className="text-sm text-blue-800 mt-2">
                  <strong>System-email (info@dogplanner.se)</strong> används för
                  plattforms-meddelanden som lösenordsåterställning och support.
                </p>
              </div>

              <div>
                <Label htmlFor="email_sender_name">Avsändarnamn</Label>
                <Input
                  id="email_sender_name"
                  value={settings.email_sender_name || ""}
                  onChange={(e) =>
                    updateField("email_sender_name", e.target.value)
                  }
                  placeholder="Bella Hunddagis"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Namnet som visas som avsändare i email till kunder
                </p>
              </div>

              <div>
                <Label htmlFor="contact_email">Kontakt-email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email || ""}
                  onChange={(e) => updateField("contact_email", e.target.value)}
                  placeholder="kontakt@belladagis.se"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email som visas för kundkontakt och bekräftelser
                </p>
              </div>

              <div>
                <Label htmlFor="invoice_email">Faktura-email</Label>
                <Input
                  id="invoice_email"
                  type="email"
                  value={settings.invoice_email || ""}
                  onChange={(e) => updateField("invoice_email", e.target.value)}
                  placeholder="faktura@belladagis.se"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email som används som avsändare på kundfakturor
                </p>
              </div>

              <div>
                <Label htmlFor="reply_to_email">Reply-To email</Label>
                <Input
                  id="reply_to_email"
                  type="email"
                  value={settings.reply_to_email || ""}
                  onChange={(e) =>
                    updateField("reply_to_email", e.target.value)
                  }
                  placeholder="info@belladagis.se"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email som kunder ska svara till när de besvarar emails
                </p>
              </div>

              <Button
                onClick={saveSettings}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  "Sparar..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara email-inställningar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fakturering */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Faktureringsinställningar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pricing_currency">Valuta</Label>
                <Input
                  id="pricing_currency"
                  value={settings.pricing_currency || "SEK"}
                  onChange={(e) =>
                    updateField("pricing_currency", e.target.value)
                  }
                  placeholder="SEK"
                />
              </div>

              <div>
                <Label htmlFor="vat_rate">Momssats (%)</Label>
                <Input
                  id="vat_rate"
                  type="number"
                  value={settings.vat_rate || 25}
                  onChange={(e) =>
                    updateField("vat_rate", parseFloat(e.target.value))
                  }
                  placeholder="25"
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
                <Label htmlFor="vat_included">Priser inkluderar moms</Label>
              </div>

              <Button
                onClick={saveSettings}
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  "Sparar..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Spara faktureringsinställningar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Länkar */}
        <TabsContent value="links">
          <Card>
            <CardHeader>
              <CardTitle>Snabblänkar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/subscription">
                <Button variant="outline" className="w-full justify-start">
                  Mitt abonnemang
                </Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline" className="w-full justify-start">
                  Användarvillkor
                </Button>
              </Link>
              <Link href="/faktura">
                <Button variant="outline" className="w-full justify-start">
                  Fakturor
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
