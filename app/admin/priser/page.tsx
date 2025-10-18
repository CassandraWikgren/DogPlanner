"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

interface PriceData {
  id: string;
  service_type: string;
  service_name: string;
  price: number;
  unit: string;
  description?: string;
  active: boolean;
}

/**
 * Admin Priser - Hantera prislista för alla tjänster
 * [ERR-1001] Databaskoppling, [ERR-4001] Uppdatering, [ERR-5001] Okänt fel
 */
export default function AdminPriserPage() {
  const { currentOrgId } = useAuth();
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PriceData>>({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrice, setNewPrice] = useState<Partial<PriceData>>({
    service_type: "hunddagis",
    service_name: "",
    price: 0,
    unit: "per dag",
    description: "",
    active: true,
  });

  const serviceTypes = [
    { value: "hunddagis", label: "Hunddagis" },
    { value: "hundpensionat", label: "Hundpensionat" },
    { value: "hundfrisor", label: "Hundfrisör" },
    { value: "extra", label: "Tilläggstjänster" },
  ];

  useEffect(() => {
    if (currentOrgId) {
      loadPrices();
    }
  }, [currentOrgId]);

  const loadPrices = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("service_type", { ascending: true })
        .order("service_name", { ascending: true });

      if (error) {
        throw new Error(`[ERR-1001] Databaskoppling: ${error.message}`);
      }

      setPrices(data || []);
    } catch (err: any) {
      console.error("Error loading prices:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid laddning av priser");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (price: PriceData) => {
    setEditingId(price.id);
    setEditForm({ ...price });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("prices")
        .update(editForm)
        .eq("id", editingId);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadPrices();
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      console.error("Error saving price:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid sparning");
    } finally {
      setSaving(false);
    }
  };

  const deletePrice = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta pris?")) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("prices")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadPrices();
    } catch (err: any) {
      console.error("Error deleting price:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid borttagning");
    } finally {
      setSaving(false);
    }
  };

  const addNewPrice = async () => {
    if (!currentOrgId || !newPrice.service_name || !newPrice.price) {
      setError("Alla obligatoriska fält måste fyllas i");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("prices")
        .insert([{ ...newPrice, org_id: currentOrgId }]);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadPrices();
      setShowAddForm(false);
      setNewPrice({
        service_type: "hunddagis",
        service_name: "",
        price: 0,
        unit: "per dag",
        description: "",
        active: true,
      });
    } catch (err: any) {
      console.error("Error adding price:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid tillägg");
    } finally {
      setSaving(false);
    }
  };

  const groupedPrices = prices.reduce((acc, price) => {
    if (!acc[price.service_type]) {
      acc[price.service_type] = [];
    }
    acc[price.service_type].push(price);
    return acc;
  }, {} as Record<string, PriceData[]>);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Laddar priser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">💰 Priser</h1>
                <p className="text-gray-600 mt-1">
                  Hantera prislista för alla tjänster
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till pris
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add New Price Form */}
        {showAddForm && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">
                Lägg till nytt pris
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-service-type">Tjänsttyp</Label>
                  <select
                    id="new-service-type"
                    value={newPrice.service_type || ""}
                    onChange={(e) =>
                      setNewPrice({ ...newPrice, service_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="new-service-name">Tjänst</Label>
                  <Input
                    id="new-service-name"
                    value={newPrice.service_name || ""}
                    onChange={(e) =>
                      setNewPrice({ ...newPrice, service_name: e.target.value })
                    }
                    placeholder="Namn på tjänst"
                  />
                </div>

                <div>
                  <Label htmlFor="new-price">Pris (SEK)</Label>
                  <Input
                    id="new-price"
                    type="number"
                    value={newPrice.price || ""}
                    onChange={(e) =>
                      setNewPrice({
                        ...newPrice,
                        price: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-unit">Enhet</Label>
                  <Input
                    id="new-unit"
                    value={newPrice.unit || ""}
                    onChange={(e) =>
                      setNewPrice({ ...newPrice, unit: e.target.value })
                    }
                    placeholder="per dag, per timme, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="new-description">
                    Beskrivning (valfritt)
                  </Label>
                  <Input
                    id="new-description"
                    value={newPrice.description || ""}
                    onChange={(e) =>
                      setNewPrice({ ...newPrice, description: e.target.value })
                    }
                    placeholder="Beskrivning av tjänsten"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addNewPrice}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? "Sparar..." : "Spara"}
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Lists by Service Type */}
        {serviceTypes.map((serviceType) => {
          const servicePrices = groupedPrices[serviceType.value] || [];

          if (servicePrices.length === 0) return null;

          return (
            <Card key={serviceType.value} className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                  <span>{serviceType.label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Tjänst</th>
                        <th className="text-left py-3 px-4">Pris</th>
                        <th className="text-left py-3 px-4">Enhet</th>
                        <th className="text-left py-3 px-4">Beskrivning</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Åtgärder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {servicePrices.map((price) => (
                        <tr
                          key={price.id}
                          className="border-b hover:bg-gray-50"
                        >
                          {editingId === price.id ? (
                            <>
                              <td className="py-3 px-4">
                                <Input
                                  value={editForm.service_name || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      service_name: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Input
                                  type="number"
                                  value={editForm.price || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      price: Number(e.target.value),
                                    })
                                  }
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Input
                                  value={editForm.unit || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      unit: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="py-3 px-4">
                                <Input
                                  value={editForm.description || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </td>
                              <td className="py-3 px-4">
                                <select
                                  value={editForm.active ? "true" : "false"}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      active: e.target.value === "true",
                                    })
                                  }
                                  className="px-2 py-1 border rounded"
                                >
                                  <option value="true">Aktiv</option>
                                  <option value="false">Inaktiv</option>
                                </select>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    onClick={saveEdit}
                                    disabled={saving}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={cancelEdit}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 font-medium">
                                {price.service_name}
                              </td>
                              <td className="py-3 px-4">
                                {formatPrice(price.price)}
                              </td>
                              <td className="py-3 px-4">{price.unit}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {price.description || "-"}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    price.active
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {price.active ? "Aktiv" : "Inaktiv"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    onClick={() => startEdit(price)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    onClick={() => deletePrice(price.id)}
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
              </CardContent>
            </Card>
          );
        })}

        {prices.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Inga priser har lagts till ännu
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till första priset
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
