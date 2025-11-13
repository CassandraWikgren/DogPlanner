"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Plus,
  Trash2,
  Scissors,
} from "lucide-react";
import Link from "next/link";

interface GroomingService {
  id?: string;
  org_id: string;
  service_name: string;
  base_price: number;
  size_multiplier_enabled: boolean; // Om priset varierar med storlek
  description?: string;
}

const DEFAULT_SERVICES = [
  {
    service_name: "Helklippning",
    base_price: 500,
    size_multiplier_enabled: true,
    description: "Komplett klippning med bad",
  },
  {
    service_name: "Trimning",
    base_price: 450,
    size_multiplier_enabled: true,
    description: "Trimning av päls",
  },
  {
    service_name: "Bad & borst",
    base_price: 300,
    size_multiplier_enabled: true,
    description: "Endast bad och borstning",
  },
  {
    service_name: "Klotrimning",
    base_price: 150,
    size_multiplier_enabled: false,
    description: "Klipp av klor",
  },
  {
    service_name: "Tandborstning",
    base_price: 200,
    size_multiplier_enabled: false,
    description: "Tandvård",
  },
  {
    service_name: "Päls-entangling",
    base_price: 400,
    size_multiplier_enabled: true,
    description: "Borttagning av tovigt hår",
  },
];

export default function FrisorPriserPage() {
  const supabase = createClientComponentClient();
  const { currentOrgId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [services, setServices] = useState<GroomingService[]>([]);
  const [newService, setNewService] = useState<GroomingService>({
    org_id: currentOrgId || "",
    service_name: "",
    base_price: 0,
    size_multiplier_enabled: true,
    description: "",
  });

  useEffect(() => {
    if (currentOrgId) {
      loadServices();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const loadServices = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("grooming_services")
        .select("*")
        .eq("org_id", currentOrgId);

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data && data.length > 0) {
        setServices(data);
      } else {
        // Om inga tjänster finns, ladda defaults
        setServices(
          DEFAULT_SERVICES.map((s) => ({
            ...s,
            org_id: currentOrgId,
          }))
        );
      }
    } catch (err: any) {
      console.error("Error loading services:", err);
      setError(err.message || "Kunde inte ladda tjänster");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!currentOrgId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Ta bort alla befintliga och lägg till nya
      await supabase
        .from("grooming_services")
        .delete()
        .eq("org_id", currentOrgId);

      const { error: insertError } = await supabase
        .from("grooming_services")
        .insert(
          services.map((s) => ({
            org_id: currentOrgId,
            service_name: s.service_name,
            base_price: s.base_price,
            size_multiplier_enabled: s.size_multiplier_enabled,
            description: s.description,
          }))
        );

      if (insertError) throw insertError;

      setSuccess("✅ Alla priser har sparats!");
      setTimeout(() => setSuccess(null), 3000);
      await loadServices();
    } catch (err: any) {
      console.error("Error saving services:", err);
      setError(err.message || "Kunde inte spara priser");
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    if (!newService.service_name || newService.base_price <= 0) {
      setError("Fyll i tjänstens namn och pris");
      return;
    }

    setServices([
      ...services,
      {
        ...newService,
        org_id: currentOrgId || "",
      },
    ]);

    setNewService({
      org_id: currentOrgId || "",
      service_name: "",
      base_price: 0,
      size_multiplier_enabled: true,
      description: "",
    });

    setSuccess("✅ Tjänst tillagd! Glöm inte att spara.");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleDeleteService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
    setSuccess("✅ Tjänst borttagen! Glöm inte att spara.");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUpdateService = (
    index: number,
    field: keyof GroomingService,
    value: string | number | boolean
  ) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar priser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#2c7a4c] hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-4xl">✂️</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Priser - Hundfrisör
              </h1>
              <p className="text-gray-600 mt-1">
                Hantera priser för klippning, bad och pälsvård
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Tjänster */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#2c7a4c]" />
              Frisörtjänster
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Tjänst</Label>
                        <Input
                          value={service.service_name}
                          onChange={(e) =>
                            handleUpdateService(
                              index,
                              "service_name",
                              e.target.value
                            )
                          }
                          placeholder="t.ex. Helklippning"
                        />
                      </div>
                      <div>
                        <Label>Grundpris</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={service.base_price}
                            onChange={(e) =>
                              handleUpdateService(
                                index,
                                "base_price",
                                parseFloat(e.target.value)
                              )
                            }
                            placeholder="0"
                          />
                          <span className="text-gray-600 text-sm">kr</span>
                        </div>
                      </div>
                      <div>
                        <Label>Storleksberoende</Label>
                        <select
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
                          value={service.size_multiplier_enabled ? "yes" : "no"}
                          onChange={(e) =>
                            handleUpdateService(
                              index,
                              "size_multiplier_enabled",
                              e.target.value === "yes"
                            )
                          }
                        >
                          <option value="yes">Ja, varierar med storlek</option>
                          <option value="no">Nej, fast pris</option>
                        </select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(index)}
                      className="ml-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div>
                    <Label>Beskrivning (valfritt)</Label>
                    <Input
                      value={service.description || ""}
                      onChange={(e) =>
                        handleUpdateService(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Kort beskrivning av tjänsten"
                    />
                  </div>

                  {service.size_multiplier_enabled && (
                    <div className="bg-gray-50 p-3 rounded-md text-xs text-gray-700">
                      <strong>Prisexempel:</strong> Mini (1.0x) ={" "}
                      {service.base_price} kr, Liten (1.2x) ={" "}
                      {Math.round(service.base_price * 1.2)} kr, Medel (1.4x) ={" "}
                      {Math.round(service.base_price * 1.4)} kr, Stor (1.6x) ={" "}
                      {Math.round(service.base_price * 1.6)} kr
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lägg till ny tjänst */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2c7a4c]" />
              Lägg till ny tjänst
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="newName">Tjänst</Label>
                <Input
                  id="newName"
                  placeholder="t.ex. Specialklippning"
                  value={newService.service_name}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      service_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="newPrice">Grundpris</Label>
                <Input
                  id="newPrice"
                  type="number"
                  placeholder="0"
                  value={newService.base_price || ""}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      base_price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="newSize">Storleksberoende</Label>
                <select
                  id="newSize"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  value={newService.size_multiplier_enabled ? "yes" : "no"}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      size_multiplier_enabled: e.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Ja, varierar med storlek</option>
                  <option value="no">Nej, fast pris</option>
                </select>
              </div>
            </div>
            <div className="mt-3">
              <Label htmlFor="newDesc">Beskrivning (valfritt)</Label>
              <Input
                id="newDesc"
                placeholder="Kort beskrivning"
                value={newService.description || ""}
                onChange={(e) =>
                  setNewService({ ...newService, description: e.target.value })
                }
              />
            </div>
            <Button
              onClick={handleAddService}
              className="mt-4 bg-[#2c7a4c] hover:bg-[#236139]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till tjänst
            </Button>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Scissors className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Tips för prissättning
                </h3>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li>
                    • Storleksberoende priser justeras automatiskt (mini 1.0x →
                    stor 1.6x)
                  </li>
                  <li>
                    • Fast pris passar för tilläggstjänster som klotrimning
                  </li>
                  <li>• Helklippning brukar kosta mer än trimning eller bad</li>
                  <li>
                    • Lägg till beskrivningar så kunderna förstår vad som ingår
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-[#2c7a4c] hover:bg-[#236139] text-white px-8 py-3"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sparar..." : "Spara alla priser"}
          </Button>
        </div>
      </main>
    </div>
  );
}
