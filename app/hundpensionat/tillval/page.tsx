"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Plus, Edit, Trash2, X, Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
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
  const supabase = createClient();
  const router = useRouter();
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
    } else {
      // ✅ FIX: Stoppa loading spinner om currentOrgId saknas
      setLoading(false);
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
            className={`px-6 py-4 rounded-lg shadow-lg border-2 text-sm ${
              notification.type === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header - Hunddagis template */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Tillvalstjänster
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera extra tjänster för pensionat och dagis
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-500">Antal tjänster</div>
                <div className="text-xl font-bold text-gray-900">
                  {services.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <button
          onClick={() => router.push("/hundpensionat")}
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold text-sm"
        >
          <ArrowLeft size={16} />
          Tillbaka
        </button>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 mb-6">
          <p className="text-sm text-blue-800">
            <strong>💡 Tips:</strong> Vanliga tillvalstjänster inkluderar
            kloklipp, bad, trimning, tasstrim, hämtning/lämning, valptillägg
            m.m.
          </p>
        </div>

        {/* Add New Button */}
        {!isAddingNew && !editingService && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={handleAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Lägg till tjänst
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAddingNew || editingService) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isAddingNew ? "Lägg till ny tjänst" : "Redigera tjänst"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-sm"
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
                <div className="flex gap-4 text-sm">
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
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={!formData.label || formData.price <= 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Spara
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold text-sm"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Inga tillvalstjänster ännu
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Lägg till din första tillvalstjänst
                </p>
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors font-semibold text-sm"
                >
                  Lägg till tjänst
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
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
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Redigera"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(service.id, service.label)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Ta bort"
                        >
                          <Trash2 className="w-4 h-4" />
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
