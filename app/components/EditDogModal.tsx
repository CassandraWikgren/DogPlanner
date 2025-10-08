"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import type { Dog } from "@/lib/store";

type EditDogModalProps = {
  dog: Dog;
  onClose: () => void;
  onSave: (dog: Dog) => void;
};

export default function EditDogModal({
  dog,
  onClose,
  onSave,
}: EditDogModalProps) {
  const [activeTab, setActiveTab] = useState<string>("Ägare");
  const [formData, setFormData] = useState<Dog>(dog);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setFormData(dog);
  }, [dog]);

  // === Fältändringar ===
  const handleChange = (field: keyof Dog, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // === Spara till Supabase ===
  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("dogs")
        .update(formData)
        .eq("id", formData.id);

      if (error) throw error;
      onSave(formData);
      onClose();
    } catch (err) {
      console.error("⚠️ Fel vid sparande:", err);
      alert("Ett fel uppstod när hundens uppgifter skulle sparas.");
    } finally {
      setSaving(false);
    }
  };

  // === Flikar ===
  const tabs = [
    "Ägare",
    "Hundens uppgifter",
    "Ansökan",
    "Kommentarer",
    "Händelser",
    "Abonnemang",
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-lg relative p-6 max-h-[90vh] overflow-y-auto">
        {/* Stängknapp */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-2xl font-bold"
        >
          ×
        </button>

        <h2 className="text-2xl font-bold text-[#2c7a4c] mb-4">
          Redigera {formData.name}
        </h2>

        {/* Flikar */}
        <div className="flex flex-wrap border-b border-gray-200 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 text-sm font-medium transition-all ${
                activeTab === tab
                  ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c]"
                  : "text-gray-600 hover:text-[#2c7a4c]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* === Flik-innehåll === */}
        <div className="space-y-4">
          {/* Ägare */}
          {activeTab === "Ägare" && (
            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                placeholder="Förnamn"
                value={formData.owner?.firstName ?? ""}
                onChange={(e) =>
                  handleChange("owner", {
                    ...formData.owner,
                    firstName: e.target.value,
                  })
                }
              />
              <input
                className="border p-2 rounded"
                placeholder="Efternamn"
                value={formData.owner?.lastName ?? ""}
                onChange={(e) =>
                  handleChange("owner", {
                    ...formData.owner,
                    lastName: e.target.value,
                  })
                }
              />
              <input
                className="border p-2 rounded"
                placeholder="Telefon"
                value={formData.owner?.phone ?? ""}
                onChange={(e) =>
                  handleChange("owner", {
                    ...formData.owner,
                    phone: e.target.value,
                  })
                }
              />
              <input
                className="border p-2 rounded"
                placeholder="E-post"
                value={formData.owner?.email ?? ""}
                onChange={(e) =>
                  handleChange("owner", {
                    ...formData.owner,
                    email: e.target.value,
                  })
                }
              />
            </div>
          )}

          {/* Hundens uppgifter */}
          {activeTab === "Hundens uppgifter" && (
            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                placeholder="Hundens namn"
                value={formData.name ?? ""}
                onChange={(e) => handleChange("name", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Ras"
                value={formData.breed ?? ""}
                onChange={(e) => handleChange("breed", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                type="date"
                value={formData.birth ?? ""}
                onChange={(e) => handleChange("birth", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Mankhöjd (cm)"
                value={formData.heightCm ?? ""}
                onChange={(e) =>
                  handleChange("heightCm", Number(e.target.value))
                }
              />
            </div>
          )}

          {/* Ansökan */}
          {activeTab === "Ansökan" && (
            <div>
              <p className="text-gray-600 mb-2">Välj dagar:</p>
              <div className="flex gap-2 flex-wrap">
                {["Mån", "Tis", "Ons", "Tor", "Fre"].map((day) => (
                  <label key={day} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={formData.days?.includes(day) ?? false}
                      onChange={(e) => {
                        const updatedDays = e.target.checked
                          ? [...(formData.days ?? []), day]
                          : (formData.days ?? []).filter((d) => d !== day);
                        handleChange("days", updatedDays);
                      }}
                    />
                    {day}
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-600">Startdatum:</label>
                <input
                  type="date"
                  className="border p-2 rounded w-full"
                  value={formData.startDate ?? ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Kommentarer */}
          {activeTab === "Kommentarer" && (
            <textarea
              className="border p-2 rounded w-full"
              rows={5}
              placeholder="Anteckningar om hunden..."
              value={formData.notes ?? ""}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          )}

          {/* Händelser */}
          {activeTab === "Händelser" && (
            <ul className="list-disc ml-6 space-y-1">
              {formData.events?.length ? (
                formData.events.map((ev, i) => <li key={i}>{ev}</li>)
              ) : (
                <p className="text-gray-500">Inga händelser registrerade.</p>
              )}
            </ul>
          )}

          {/* Abonnemang */}
          {activeTab === "Abonnemang" && (
            <div className="grid grid-cols-2 gap-4">
              <input
                className="border p-2 rounded"
                placeholder="Typ av abonnemang"
                value={formData.subscription ?? ""}
                onChange={(e) => handleChange("subscription", e.target.value)}
              />
              <input
                className="border p-2 rounded"
                placeholder="Pris (kr/mån)"
                type="number"
                value={formData.price ?? ""}
                onChange={(e) => handleChange("price", Number(e.target.value))}
              />
            </div>
          )}
        </div>

        {/* Knappar */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 rounded text-white ${
              saving ? "bg-gray-400" : "bg-[#2c7a4c] hover:bg-[#25663f]"
            }`}
          >
            {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
