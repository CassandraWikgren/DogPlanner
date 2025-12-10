"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Database } from "@/types/database";
import { X, Save, CheckCircle, UserPlus } from "lucide-react";
import { capitalize } from "@/lib/textUtils";

type InterestApplication =
  Database["public"]["Tables"]["interest_applications"]["Row"];

interface InterestApplicationModalProps {
  application: InterestApplication | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function InterestApplicationModal({
  application,
  open,
  onClose,
  onSaved,
}: InterestApplicationModalProps) {
  const { currentOrgId } = useAuth();

  // Form states
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [dogName, setDogName] = useState("");
  const [dogBreed, setDogBreed] = useState("");
  const [dogAge, setDogAge] = useState<number | null>(null);
  const [dogBirth, setDogBirth] = useState(""); // ✅ NY: Födelsedatum
  const [dogSize, setDogSize] = useState<"small" | "medium" | "large">(
    "medium"
  );
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [preferredDays, setPreferredDays] = useState<string[]>([]);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  // Tracking states
  const [firstContactDate, setFirstContactDate] = useState("");
  const [firstContactNotes, setFirstContactNotes] = useState("");
  const [visitBookedDate, setVisitBookedDate] = useState("");
  const [visitBookedTime, setVisitBookedTime] = useState(""); // ✅ NY: Tid för besök
  const [visitStatus, setVisitStatus] = useState("");
  const [visitCompletedDate, setVisitCompletedDate] = useState("");
  const [visitResult, setVisitResult] = useState("");
  const [priority, setPriority] = useState<number>(0);
  const [expectedStartMonth, setExpectedStartMonth] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (application && open) {
      // Load data
      setParentName(application.parent_name || "");
      setParentEmail(application.parent_email || "");
      setParentPhone(application.parent_phone || "");
      setDogName(application.dog_name || "");
      setDogBreed(application.dog_breed || "");
      setDogAge(application.dog_age);
      setDogBirth(application.dog_birth || ""); // ✅ Ladda födelsedatum
      // ✅ Fixed: Robust typkontroll för dog_size
      const size = application.dog_size;
      setDogSize(
        size === "small" || size === "medium" || size === "large"
          ? size
          : "medium"
      );
      setPreferredStartDate(application.preferred_start_date || "");
      setPreferredDays(application.preferred_days || []);
      setSpecialNeeds(application.special_needs || "");
      setStatus(application.status);
      setNotes(application.notes || "");

      // Tracking
      setFirstContactDate(application.first_contact_date || "");
      setFirstContactNotes(application.first_contact_notes || "");
      setVisitBookedDate(application.visit_booked_date || "");
      setVisitBookedTime(application.visit_booked_time || ""); // ✅ Ladda tid
      setVisitStatus(application.visit_status || "");
      setVisitCompletedDate(application.visit_completed_date || "");
      setVisitResult(application.visit_result || "");
      setPriority(application.priority || 0);
      setExpectedStartMonth(application.expected_start_month || "");
    }
  }, [application, open]);

  const handleSave = async () => {
    if (!application) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from("interest_applications")
        .update({
          parent_name: parentName,
          parent_email: parentEmail,
          parent_phone: parentPhone,
          dog_name: dogName,
          dog_breed: dogBreed || null,
          dog_age: dogAge,
          dog_birth: dogBirth || null, // ✅ Spara födelsedatum
          dog_size: dogSize,
          preferred_start_date: preferredStartDate || null,
          preferred_days: preferredDays.length > 0 ? preferredDays : null,
          special_needs: specialNeeds || null,
          status,
          notes: notes || null,
          first_contact_date: firstContactDate || null,
          first_contact_notes: firstContactNotes || null,
          visit_booked_date: visitBookedDate || null,
          visit_booked_time: visitBookedTime || null, // ✅ Spara tid
          visit_status: visitStatus || null,
          visit_completed_date: visitCompletedDate || null,
          visit_result: visitResult || null,
          priority,
          expected_start_month: expectedStartMonth || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Error saving application:", err);
      setError(err.message || "Kunde inte spara ändringar");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!application || !currentOrgId) return;

    // Validera att obligatoriska fält är ifyllda
    if (!parentName || !parentEmail || !dogName) {
      setError("Namn, email och hundnamn måste vara ifyllda");
      return;
    }

    const confirmApprove = window.confirm(
      `Godkänn ${dogName} och skapa som hund i systemet?\n\nDetta kommer att:\n1. Skapa ägare: ${parentName}\n2. Skapa hund: ${dogName}\n3. Markera ansökan som godkänd`
    );

    if (!confirmApprove) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // 🔒 RACE CONDITION CHECK: Verifiera att ansökan inte redan är godkänd
      const { data: currentApp } = await supabase
        .from("interest_applications")
        .select("status")
        .eq("id", application.id)
        .single();

      if (currentApp?.status === "accepted") {
        setError("Denna ansökan är redan godkänd!");
        setSaving(false);
        return;
      }

      // 🔒 DUPLICATE CHECK: Kolla om ägare med samma email redan finns i denna org
      const { data: existingOwner } = await supabase
        .from("owners")
        .select("id, full_name")
        .eq("org_id", currentOrgId)
        .eq("email", parentEmail)
        .maybeSingle();

      let ownerId: string;

      if (existingOwner) {
        // Använd befintlig ägare istället för att skapa ny
        console.log("🔄 Ägare finns redan:", existingOwner.full_name);
        ownerId = existingOwner.id;
      } else {
        // 1. Skapa ägare
        const { data: ownerData, error: ownerError } = await supabase
          .from("owners")
          .insert({
            org_id: currentOrgId,
            full_name: parentName,
            email: parentEmail,
            phone: parentPhone,
            city: application.owner_city || null,
            address: application.owner_address || null,
          })
          .select()
          .single();

        if (ownerError) throw ownerError;
        ownerId = ownerData.id;
      }

      // 2. Beräkna waitlist baserat på preferred_start_date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let calculatedWaitlist = true; // Default: väntelista

      if (preferredStartDate) {
        const startDate = new Date(preferredStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (today >= startDate) {
          calculatedWaitlist = false; // Kan börja direkt
        }
      }

      // 3. Skapa hund
      const { error: dogError } = await supabase.from("dogs").insert({
        org_id: currentOrgId,
        owner_id: ownerId,
        name: dogName,
        breed: dogBreed || null,
        birth: dogBirth || application.dog_birth || null, // ✅ Använd uppdaterat födelsedatum
        heightcm: application.dog_height_cm || null,
        gender: application.dog_gender || null,
        subscription: application.subscription_type || null,
        startdate: preferredStartDate || null,
        days: preferredDays.length > 0 ? preferredDays.join(",") : null,
        notes: specialNeeds || null,
        waitlist: calculatedWaitlist,
      });

      if (dogError) throw dogError;

      // 4. Uppdatera intresseanmälan till "accepted"
      const { error: updateError } = await supabase
        .from("interest_applications")
        .update({
          status: "accepted",
          visit_result: "approved",
          updated_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (updateError) throw updateError;

      // 5. Success
      alert(
        `✅ ${dogName} är nu godkänd och skapad som hund!\n\nÄgare: ${parentName}\nStatus: ${calculatedWaitlist ? "Väntelista" : "Antagen"}`
      );
      onSaved();
      onClose();
    } catch (err: any) {
      console.error("Error approving application:", err);
      setError(err.message || "Kunde inte godkänna ansökan");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !application) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {capitalize(application.dog_name)}
              </h2>
              <p className="text-sm text-gray-500">
                Ansökan från{" "}
                {application.created_at
                  ? new Date(application.created_at).toLocaleDateString("sv-SE")
                  : "Okänt datum"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Ägaruppgifter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ägaruppgifter
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Namn
                  </label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Hunduppgifter */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Hunduppgifter
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hundnamn
                  </label>
                  <input
                    type="text"
                    value={dogName}
                    onChange={(e) => setDogName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ras
                  </label>
                  <input
                    type="text"
                    value={dogBreed}
                    onChange={(e) => setDogBreed(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ålder
                  </label>
                  <input
                    type="number"
                    value={dogAge || ""}
                    onChange={(e) =>
                      setDogAge(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Födelsedatum
                  </label>
                  <input
                    type="date"
                    value={dogBirth}
                    onChange={(e) => setDogBirth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Storlek
                  </label>
                  <select
                    value={dogSize}
                    onChange={(e) => setDogSize(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  >
                    <option value="small">Liten (under 35cm mankhöjd)</option>
                    <option value="medium">Medium (35-54cm mankhöjd)</option>
                    <option value="large">Stor (över 55cm mankhöjd)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Kontakthistorik */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Kontakthistorik
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Första kontakt (datum)
                  </label>
                  <input
                    type="date"
                    value={firstContactDate}
                    onChange={(e) => setFirstContactDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritet
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  >
                    <option value="-1">Låg</option>
                    <option value="0">Normal</option>
                    <option value="1">Hög</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anteckningar från första kontakt
                  </label>
                  <textarea
                    value={firstContactNotes}
                    onChange={(e) => setFirstContactNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="T.ex. 'Ringde och pratade med ägaren...'"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Besök bokat (datum)
                  </label>
                  <input
                    type="date"
                    value={visitBookedDate}
                    onChange={(e) => setVisitBookedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tid för besök
                  </label>
                  <input
                    type="time"
                    value={visitBookedTime}
                    onChange={(e) => setVisitBookedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    placeholder="13:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Besöksstatus
                  </label>
                  <select
                    value={visitStatus}
                    onChange={(e) => setVisitStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                  >
                    <option value="">Ej bokat</option>
                    <option value="booked">Bokat</option>
                    <option value="completed">Genomfört</option>
                    <option value="cancelled">Inställt</option>
                    <option value="no_show">Uteblev</option>
                  </select>
                </div>
                {visitStatus === "completed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Besök genomfört (datum)
                      </label>
                      <input
                        type="date"
                        value={visitCompletedDate}
                        onChange={(e) => setVisitCompletedDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resultat
                      </label>
                      <select
                        value={visitResult}
                        onChange={(e) => setVisitResult(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                      >
                        <option value="">Välj resultat</option>
                        <option value="approved">Godkänd ✅</option>
                        <option value="declined">Avböjd</option>
                        <option value="waiting">Väntar</option>
                        <option value="not_suitable">Ej lämplig</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Övriga anteckningar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Övriga anteckningar
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                placeholder="Övrig information..."
              />
            </div>

            {specialNeeds && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-semibold text-yellow-800 mb-1">
                  Särskilda behov (från ansökan):
                </p>
                <p className="text-sm text-yellow-700">{specialNeeds}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              disabled={saving}
            >
              Avbryt
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Sparar..." : "Spara ändringar"}
              </button>
              {visitResult === "approved" && (
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Godkänn och skapa hund
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
