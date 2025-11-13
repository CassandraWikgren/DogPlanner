"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { Plus, Edit, Trash2, X, Save } from "lucide-react";
import type { Database } from "@/types/database";

type ExtraService = Database["public"]["Tables"]["extra_services"]["Row"];

interface ServiceFormData {
  label: string;
  price: number;
  unit: string;
  service_type: "boarding" | "daycare" | "both" | "grooming" | "all";
}

const INITIAL_FORM: ServiceFormData = {
  label: "",
  price: 0,
  unit: "per gång",
  service_type: "both",
};

const UNIT_OPTIONS = [
  { value: "per gång", label: "Per gång" },
  { value: "per dag", label: "Per dag" },
  { value: "fast pris", label: "Fast pris" },
];

export default function TillvalstjansterPage() {
  const { user, currentOrgId, loading: authLoading } = useAuth();
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState<ServiceFormData>(INITIAL_FORM);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (currentOrgId) {
      loadServices();
    }
  }, [currentOrgId]);

  async function loadServices() {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await (supabase as any)
        .from("extra_services")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("label");

      if (dbError) throw dbError;

      setServices(data || []);
    } catch (err: any) {
      console.error("[Tillval] Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function showNotification(message: string, type: "success" | "error") {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }

  function handleEdit(service: ExtraService) {
    setEditingService(service.id);
    setFormData({
      label: service.label,
      price: service.price,
      unit: service.unit,
      service_type: (service.service_type ||
        "all") as ServiceFormData["service_type"],
    });
    setIsAddingNew(false);
  }

  function handleAddNew() {
    setIsAddingNew(true);
    setEditingService(null);
    setFormData(INITIAL_FORM);
  }

  function handleCancel() {
    setIsAddingNew(false);
    setEditingService(null);
    setFormData(INITIAL_FORM);
  }

  async function handleSave() {
    if (!currentOrgId) {
      showNotification("⚠️ Organisation saknas", "error");
      return;
    }

    try {
      if (isAddingNew) {
        const { error: insertError } = await (supabase as any)
          .from("extra_services")
          .insert({
            org_id: currentOrgId,
            label: formData.label,
            price: formData.price,
            unit: formData.unit,
            service_type: formData.service_type,
          });

        if (insertError) throw insertError;

        showNotification("✅ Tjänst tillagd!", "success");
      } else if (editingService) {
        const { error: updateError } = await (supabase as any)
          .from("extra_services")
          .update({
            label: formData.label,
            price: formData.price,
            unit: formData.unit,
            service_type: formData.service_type,
          })
          .eq("id", editingService);

        if (updateError) throw updateError;

        showNotification("✅ Tjänst uppdaterad!", "success");
      }

      handleCancel();
      loadServices();
    } catch (err: any) {
      console.error("[Tillval] Fel vid sparande:", err);
      showNotification(`❌ Kunde inte spara: ${err.message}`, "error");
    }
  }

  async function handleDelete(serviceId: string, serviceLabel: string) {
    if (
      !confirm(
        `Är du säker på att du vill ta bort "${serviceLabel}"? Detta går inte att ångra.`
      )
    ) {
      return;
    }

    try {
      const { error: deleteError } = await (supabase as any)
        .from("extra_services")
        .delete()
        .eq("id", serviceId);

      if (deleteError) throw deleteError;

      showNotification("✅ Tjänst borttagen", "success");
      loadServices();
    } catch (err: any) {
      console.error("[Tillval] Fel vid borttagning:", err);
      showNotification(`❌ Kunde inte ta bort: ${err.message}`, "error");
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg border-2 ${
              notification.type === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Hero Section - FIXAD */}
      <div
        className="relative bg-gradient-to-br from-[#2c7a4c] to-[#1e5a36] py-12 overflow-hidden"
        style={{
          background: "linear-gradient(to bottom right, #2c7a4c, #1e5a36)",
        }}
      >
        {/* Bakgrundsmönster */}
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        />
        <div className="relative z-10 max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            🛎️ Tillvalstjänster
          </h1>
          <p className="text-lg text-white/90">
            Hantera extra tjänster för pensionat och dagis
          </p>
        </div>
      </div>

      {/* Main Content - FIXAD STRUKTUR */}
      <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info Box - KOMPAKT */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Tips:</strong> Vanliga tillvalstjänster inkluderar
            kloklipp, bad, trimning, tasstrim, hämtning/lämning, valptillägg
            m.m.
          </p>
        </div>

        {/* Add New Button - SYMMETRISK */}
        {!isAddingNew && !editingService && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Lägg till tjänst
            </button>
          </div>
        )}

        {/* Add/Edit Form - KOMPAKT */}
        {(isAddingNew || editingService) && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isAddingNew ? "Lägg till ny tjänst" : "Redigera tjänst"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Namn */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tjänstnamn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="T.ex. Kloklippning"
                  required
                />
              </div>

              {/* Pris */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pris (kr) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  placeholder="T.ex. 150"
                  required
                />
              </div>

              {/* Enhet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enhet <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Typ */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tillgänglig för <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="boarding"
                      checked={formData.service_type === "boarding"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          service_type: e.target.value as any,
                        })
                      }
                      className="mr-2"
                    />
                    Endast pensionat
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="daycare"
                      checked={formData.service_type === "daycare"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          service_type: e.target.value as any,
                        })
                      }
                      className="mr-2"
                    />
                    Endast dagis
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="both"
                      checked={formData.service_type === "both"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          service_type: e.target.value as any,
                        })
                      }
                      className="mr-2"
                    />
                    Både pensionat och dagis
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSave}
                disabled={!formData.label || formData.price <= 0}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                Spara
              </button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Avbryt
              </button>
            </div>
          </div>
        )}

        {/* Services List */}
        {!isAddingNew && !editingService && (
          <div className="space-y-4">
            {services.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Inga tillvalstjänster ännu
                </h3>
                <p className="text-gray-600 mb-6">
                  Lägg till din första tillvalstjänst
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium"
                >
                  Lägg till tjänst
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {service.label}
                        </h3>
                        <p className="text-2xl font-bold text-[#2c7a4c] mb-1">
                          {service.price} kr
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {service.unit}
                        </p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            service.service_type === "boarding"
                              ? "bg-purple-100 text-purple-800"
                              : service.service_type === "daycare"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {service.service_type === "boarding"
                            ? "Pensionat"
                            : service.service_type === "daycare"
                              ? "Dagis"
                              : "Både dagis & pensionat"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Redigera"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(service.id, service.label)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
