"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import {
  ArrowLeft,
  Scissors,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";

interface GroomingPrice {
  id: string;
  org_id: string;
  service_name: string;
  service_type: string;
  description: string | null;
  dog_size: string | null;
  coat_type: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const SERVICE_TYPES = [
  { value: "bath", label: "Badning" },
  { value: "bath_blow", label: "Bad & Fön" },
  { value: "bath_trim", label: "Badning + Trimning" },
  { value: "full_groom", label: "Klippning med bad och fön" },
  { value: "lion_clip", label: "Lejonklipp / Friseringsklipp" },
  { value: "breed_standard", label: "Rasstandard-klipp / Utställningsklipp" },
  { value: "cat_groom", label: "Klippning av katt" },
  { value: "mat_removal", label: "Tilläggskostnad tovor" },
  { value: "paw_details", label: "Tassar, klor & detaljer" },
  { value: "undercoat", label: "Underullsbehandling" },
  { value: "hygiene_clip", label: "Hygienklipp / Sanering" },
  { value: "wire_trim", label: "Trimbart päls – Strävhårstrim" },
  { value: "hand_strip", label: "Handtrimning" },
  { value: "scissor_trim", label: "Saxtrimning" },
  { value: "touch_up", label: "Puts / Toppning" },
  { value: "puppy_intro", label: "Valpintroduktion" },
  { value: "nail_clip", label: "Kloklipp" },
  { value: "paw_trim", label: "Tassklippning" },
  { value: "ear_cleaning", label: "Öronrengöring" },
  { value: "teeth_cleaning", label: "Tandrengöring" },
  { value: "anal_gland", label: "Analsäckstömning" },
  { value: "custom", label: "Anpassad Behandling" },
];

const DOG_SIZES = [
  { value: null, label: "Alla storlekar" },
  { value: "mini", label: "Mini (0-5 kg)" },
  { value: "small", label: "Liten (5-10 kg)" },
  { value: "medium", label: "Medel (10-20 kg)" },
  { value: "large", label: "Stor (20-40 kg)" },
  { value: "xlarge", label: "XL (40+ kg)" },
];

const COAT_TYPES = [
  { value: null, label: "Alla pälstyper" },
  { value: "short", label: "Korthårig" },
  { value: "medium", label: "Mellanlång" },
  { value: "long", label: "Långhårig" },
  { value: "wire", label: "Strävhårig" },
  { value: "curly", label: "Lockig" },
];

export default function GroomingPricesPage() {
  const { currentOrgId, loading: authLoading } = useAuth();

  const [prices, setPrices] = useState<GroomingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<GroomingPrice>>({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrice, setNewPrice] = useState<Partial<GroomingPrice>>({
    service_type: "bath",
    service_name: "Badning",
    dog_size: null,
    coat_type: null,
    price: undefined as any, // Låt användaren skriva in pris själv
    duration_minutes: 60,
    description: "",
    active: true,
  });

  useEffect(() => {
    console.log("🐛 DEBUG - Grooming Prices Page mounted:", {
      currentOrgId,
      authLoading,
      timestamp: new Date().toISOString(),
    });

    if (currentOrgId) {
      loadPrices();
    } else {
      setLoading(false);
      if (!authLoading) {
        console.warn("⚠️  currentOrgId is missing after auth loaded!");
      }
    }
  }, [currentOrgId]);

  const loadPrices = async () => {
    if (!currentOrgId) {
      console.error("❌ loadPrices called without currentOrgId");
      return;
    }

    console.log("🔍 Laddar priser för org:", currentOrgId);

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("grooming_prices")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("service_type", { ascending: true })
        .order("dog_size", { ascending: true, nullsFirst: true })
        .order("coat_type", { ascending: true, nullsFirst: true });

      if (error) {
        console.error("❌ Supabase SELECT error:", {
          error,
          code: error.code,
          message: error.message,
          currentOrgId,
        });
        throw new Error(`Kunde inte hämta priser: ${error.message}`);
      }

      console.log(`✅ Laddade ${data?.length || 0} priser:`, data);
      setPrices(data || []);
    } catch (err: any) {
      console.error("❌ Error loading prices:", err);
      setError(err.message || "Okänt fel vid laddning av priser");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (price: GroomingPrice) => {
    setEditingId(price.id);
    setEditForm({ ...price });
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("grooming_prices")
        .update(editForm)
        .eq("id", editingId);

      if (error) {
        throw new Error(`Kunde inte uppdatera: ${error.message}`);
      }

      await loadPrices();
      setEditingId(null);
      setEditForm({});
      setSuccess("Priset uppdaterades!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving price:", err);
      setError(err.message || "Okänt fel vid sparning");
    } finally {
      setSaving(false);
    }
  };

  const deletePrice = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta pris?")) return;

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("grooming_prices")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`Kunde inte ta bort: ${error.message}`);
      }

      await loadPrices();
      setSuccess("Priset togs bort!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting price:", err);
      setError(err.message || "Okänt fel vid borttagning");
    } finally {
      setSaving(false);
    }
  };

  const addNewPrice = async () => {
    // Validering
    if (!currentOrgId) {
      setError("Ingen organisation tilldelad. Kontakta admin.");
      console.error("❌ currentOrgId saknas:", currentOrgId);
      return;
    }

    if (!newPrice.service_name || !newPrice.service_type || !newPrice.price) {
      setError("Tjänstnamn, tjänstetyp och pris måste fyllas i");
      return;
    }

    const insertData = {
      org_id: currentOrgId,
      service_name: newPrice.service_name,
      service_type: newPrice.service_type,
      description: newPrice.description || null,
      dog_size: newPrice.dog_size || null,
      coat_type: newPrice.coat_type || null,
      price: Number(newPrice.price),
      duration_minutes: Number(newPrice.duration_minutes) || 60,
      active: newPrice.active !== undefined ? newPrice.active : true,
    };

    console.log("🐛 DEBUG - Försöker lägga till pris:", {
      currentOrgId,
      newPrice,
      insertData,
      timestamp: new Date().toISOString(),
    });

    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("grooming_prices")
        .insert([insertData])
        .select(); // Returnera den skapade raden

      if (error) {
        console.error("❌ Supabase INSERT error:", {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Ge mer specifika felmeddelanden
        if (error.message.includes("row-level security")) {
          throw new Error(
            "Behörighetsproblem: Du saknar rättigheter att lägga till priser. " +
              "Kontakta admin eller se konsolen (F12) för detaljer."
          );
        } else if (error.message.includes("duplicate key")) {
          throw new Error(
            "Ett pris med denna kombination finns redan. " +
              "Ändra hundstorlek, pälstyp eller tjänstetyp."
          );
        } else {
          throw new Error(`Kunde inte lägga till: ${error.message}`);
        }
      }

      console.log("✅ Pris tillagt framgångsrikt:", data);

      await loadPrices();
      setShowAddForm(false);
      setNewPrice({
        service_type: "bath",
        service_name: "Badning",
        dog_size: null,
        coat_type: null,
        price: undefined as any,
        duration_minutes: 60,
        description: "",
        active: true,
      });
      setSuccess("Nytt pris tillagt!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("❌ Error adding price:", err);
      setError(err.message || "Okänt fel vid tillägg");
    } finally {
      setSaving(false);
    }
  };

  const formatSizeLabel = (size: string | null | undefined) => {
    if (!size) return "Alla storlekar";
    const found = DOG_SIZES.find((s) => s.value === size);
    return found ? found.label : "Alla storlekar";
  };

  const formatCoatLabel = (coat: string | null | undefined) => {
    if (!coat) return "Alla pälstyper";
    const found = COAT_TYPES.find((c) => c.value === coat);
    return found ? found.label : "Alla pälstyper";
  };

  const formatServiceType = (type: string) => {
    const found = SERVICE_TYPES.find((s) => s.value === type);
    return found ? found.label : type;
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar priser...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!currentOrgId) {
    return (
      <PageContainer>
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">
              Ingen organisation tilldelad. Kontakta admin.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#2c7a4c] hover:text-[#236139] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#2c7a4c] flex items-center gap-3">
                <Scissors className="h-8 w-8" />
                Priser - Hundfrisör
              </h1>
              <p className="text-gray-600 mt-1">
                Hantera priser för klippning, bad och pälsvård med stöd för
                olika hundstorlekar
              </p>
            </div>
            <Button
              onClick={() => {
                setShowAddForm(true);
                setError(null);
                setSuccess(null);
              }}
              className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till pris
            </Button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-orange-700 text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Price Form */}
        {showAddForm && (
          <Card className="mb-6 border-[#2c7a4c]">
            <CardHeader className="bg-[#e6f4ea]">
              <CardTitle className="text-lg text-[#2c7a4c]">
                Lägg till nytt pris
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tjänstetyp *</Label>
                  <Select
                    value={newPrice.service_type}
                    onValueChange={(value) => {
                      const found = SERVICE_TYPES.find(
                        (s) => s.value === value
                      );
                      setNewPrice((prev) => ({
                        ...prev,
                        service_type: value,
                        service_name: found ? found.label : value,
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900 z-[100] shadow-xl border-2 border-gray-200">
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tjänstnamn *</Label>
                  <Input
                    value={newPrice.service_name}
                    onChange={(e) =>
                      setNewPrice((prev) => ({
                        ...prev,
                        service_name: e.target.value,
                      }))
                    }
                    placeholder="t.ex. Badning"
                  />
                </div>

                <div>
                  <Label>Hundstorlek</Label>
                  <Select
                    value={newPrice.dog_size || "null"}
                    onValueChange={(value) =>
                      setNewPrice((prev) => ({
                        ...prev,
                        dog_size: value === "null" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900 z-[100] shadow-xl border-2 border-gray-200">
                      {DOG_SIZES.map((size) => (
                        <SelectItem
                          key={size.value || "null"}
                          value={size.value || "null"}
                        >
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pälstyp</Label>
                  <Select
                    value={newPrice.coat_type || "null"}
                    onValueChange={(value) =>
                      setNewPrice((prev) => ({
                        ...prev,
                        coat_type: value === "null" ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900 z-[100] shadow-xl border-2 border-gray-200">
                      {COAT_TYPES.map((coat) => (
                        <SelectItem
                          key={coat.value || "null"}
                          value={coat.value || "null"}
                        >
                          {coat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Pris (kr) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="50"
                    value={newPrice.price || ""}
                    onChange={(e) =>
                      setNewPrice((prev) => ({
                        ...prev,
                        price:
                          e.target.value === ""
                            ? (undefined as any)
                            : Number(e.target.value),
                      }))
                    }
                    placeholder="t.ex. 300"
                  />
                </div>

                <div>
                  <Label>Beräknad tid (minuter) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="15"
                    value={newPrice.duration_minutes}
                    onChange={(e) =>
                      setNewPrice((prev) => ({
                        ...prev,
                        duration_minutes: Number(e.target.value),
                      }))
                    }
                    placeholder="60"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Beskrivning (valfritt)</Label>
                  <Input
                    value={newPrice.description || ""}
                    onChange={(e) =>
                      setNewPrice((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="t.ex. Grundläggande badning med hundschampo"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  onClick={addNewPrice}
                  disabled={saving}
                  className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Sparar..." : "Spara"}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prices Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frisörtjänster</CardTitle>
          </CardHeader>
          <CardContent>
            {prices.length === 0 ? (
              <div className="text-center py-12">
                <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Inga priser har lagts till än
                </p>
                <p className="text-sm text-gray-500">
                  Klicka på "Lägg till pris" för att komma igång
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#2c7a4c] text-white">
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Tjänst
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Storlek
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Pälstyp
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Pris
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Tid
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold">
                        Åtgärder
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {prices.map((price, index) => (
                      <tr
                        key={price.id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        {editingId === price.id ? (
                          <>
                            <td className="px-4 py-3" colSpan={7}>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-xs">Tjänstnamn</Label>
                                  <Input
                                    value={editForm.service_name}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        service_name: e.target.value,
                                      }))
                                    }
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Pris (kr)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        price: Number(e.target.value),
                                      }))
                                    }
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Tid (min)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editForm.duration_minutes}
                                    onChange={(e) =>
                                      setEditForm((prev) => ({
                                        ...prev,
                                        duration_minutes: Number(
                                          e.target.value
                                        ),
                                      }))
                                    }
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="flex gap-2 items-end">
                                  <Button
                                    onClick={saveEdit}
                                    disabled={saving}
                                    size="sm"
                                    className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Spara
                                  </Button>
                                  <Button
                                    onClick={cancelEdit}
                                    disabled={saving}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Avbryt
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {price.service_name}
                                </p>
                                {price.description && (
                                  <p className="text-xs text-gray-500">
                                    {price.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatSizeLabel(price.dog_size)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatCoatLabel(price.coat_type)}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                              {price.price} kr
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {price.duration_minutes} min
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                  price.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {price.active ? "Aktiv" : "Inaktiv"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  onClick={() => startEdit(price)}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => deletePrice(price.id)}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>
                    Lägg till olika priser för samma tjänst med olika
                    hundstorlekar
                  </li>
                  <li>Använd "Alla storlekar" för standardpriser</li>
                  <li>
                    Beräknad tid används för att planera bokningar i kalendern
                  </li>
                  <li>
                    Inaktiva priser visas inte i bokningsflödet för kunder
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
