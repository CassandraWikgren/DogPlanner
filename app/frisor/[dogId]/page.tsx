"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import {
  ArrowLeft,
  Calendar,
  Scissors,
  Clock,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  customer_number: number | null;
  email: string | null;
};

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  birth: string | null;
  gender?: string | null;
  owner_id: string | null;
  owner?: Owner | null;
  // Additional fields from database (optional)
  org_id?: string | null;
  room_id?: string | null;
  subscription?: string | null;
  days?: string | null;
  price?: number | null;
  is_active?: boolean | null;
  notes?: string | null;
  allergies?: string | null;
  medical_info?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type JournalEntry = {
  id: string;
  appointment_date: string;
  service_type: string;
  clip_length: string | null;
  shampoo_type: string | null;
  special_treatments: string | null;
  final_price: number;
  duration_minutes: number | null;
  notes: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
  next_appointment_recommended: string | null;
  created_at: string;
};

const SERVICE_LABELS: Record<string, string> = {
  bath: "Badning",
  bath_trim: "Bad + Trimning",
  full_groom: "Fullständig klippning",
  nail_trim: "Klotrimning",
  ear_cleaning: "Öronrengöring",
  teeth_cleaning: "Tandrengöring",
  custom: "Anpassad behandling",
};

export default function DogJournalPage() {
  const router = useRouter();
  const params = useParams();
  const dogId = params?.dogId as string;
  const { currentOrgId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dog, setDog] = useState<Dog | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dogId && currentOrgId) {
      loadDogAndJournal();
    }
  }, [dogId, currentOrgId]);

  const loadDogAndJournal = async () => {
    if (!dogId || !currentOrgId) return;

    try {
      // Ladda hund med ägare
      const { data: dogData, error: dogError } = await supabase
        .from("dogs")
        .select(
          `
          *,
          owner:owners(id, full_name, phone, customer_number, email)
        `
        )
        .eq("id", dogId)
        .single();

      if (dogError) throw dogError;

      // Ladda journal
      const { data: journalData, error: journalError } = await supabase
        .from("grooming_journal")
        .select("*")
        .eq("dog_id", dogId)
        .order("appointment_date", { ascending: false });

      if (journalError) throw journalError;

      setDog(dogData);
      setJournals(journalData || []);
    } catch (err: any) {
      console.error("Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeksSinceLastClip = () => {
    if (journals.length === 0) return null;
    const lastDate = new Date(journals[0].appointment_date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  const weeksSinceLastClip = calculateWeeksSinceLastClip();
  const needsReminder = weeksSinceLastClip && weeksSinceLastClip >= 8;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-10 w-10 text-[#2c7a4c] mx-auto mb-3 animate-pulse" />
          <p className="text-gray-600 text-sm">Laddar journal...</p>
        </div>
      </div>
    );
  }

  if (error || !dog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full text-center">
          <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Kunde inte ladda journal
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {error || "Hund hittades inte"}
          </p>
          <Link href="/frisor">
            <button className="h-10 px-4 bg-[#2c7a4c] hover:bg-[#236139] text-white rounded-md transition font-semibold text-[15px]">
              Tillbaka till översikt
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - INGEN HERO enligt Design System V2 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/frisor">
            <button className="mb-3 flex items-center gap-2 text-gray-600 hover:text-[#2c7a4c] transition text-sm">
              <ArrowLeft className="h-4 w-4" />
              Tillbaka till översikt
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Scissors className="h-8 w-8 text-[#2c7a4c]" />
            <div>
              <h1 className="text-[32px] font-bold text-[#2c7a4c]">
                {dog.name}
              </h1>
              <p className="text-base text-gray-600">
                {dog.breed || "Okänd ras"} •{" "}
                {dog.owner?.full_name || "Ingen ägare"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Innehåll - kompaktare */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Vänster: Hundens info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-6">
              <h2 className="text-lg font-semibold text-[#2c7a4c] mb-4">
                Hundens information
              </h2>

              <div className="space-y-2.5 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Namn</p>
                  <p className="text-gray-900 font-medium">{dog.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ras</p>
                  <p className="text-gray-900">{dog.breed || "-"}</p>
                </div>
                {dog.heightcm && (
                  <div>
                    <p className="text-xs text-gray-500">Mankhöjd</p>
                    <p className="text-gray-900">{dog.heightcm} cm</p>
                  </div>
                )}
                {dog.birth && (
                  <div>
                    <p className="text-xs text-gray-500">Född</p>
                    <p className="text-gray-900">
                      {new Date(dog.birth).toLocaleDateString("sv-SE")}
                    </p>
                  </div>
                )}
                {dog.gender && (
                  <div>
                    <p className="text-xs text-gray-500">Kön</p>
                    <p className="text-gray-900">
                      {dog.gender === "hane" ? "Hane" : "Tik"}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-[#2c7a4c] mb-3">
                  Ägare
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-900 font-medium">
                    {dog.owner?.full_name}
                  </p>
                  {dog.owner?.phone && (
                    <p className="text-gray-600">{dog.owner.phone}</p>
                  )}
                  {dog.owner?.email && (
                    <p className="text-gray-600">{dog.owner.email}</p>
                  )}
                  {dog.owner?.customer_number && (
                    <p className="text-gray-500">
                      Kundnr: {dog.owner.customer_number}
                    </p>
                  )}
                </div>
              </div>

              {needsReminder && (
                <div className="mt-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-0.5">
                    ⚠️ Påminnelse
                  </p>
                  <p className="text-xs text-yellow-700">
                    {weeksSinceLastClip} veckor sedan senaste klipp.
                    Rekommenderas kontakt.
                  </p>
                </div>
              )}

              <div className="mt-5">
                <button
                  onClick={() => router.push(`/hunddagis/${dog.id}`)}
                  className="w-full h-10 px-4 bg-[#2c7a4c] hover:bg-[#236139] text-white rounded-md transition text-sm font-semibold"
                >
                  Visa i Hunddagis
                </button>
              </div>
            </div>
          </div>

          {/* Höger: Journalhistorik - kompaktare */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#2c7a4c]">
                  Klipphistorik ({journals.length})
                </h2>
                <button
                  onClick={() => router.push("/frisor/ny-bokning")}
                  className="flex items-center gap-2 h-9 px-3 bg-[#2c7a4c] hover:bg-[#236139] text-white rounded-md transition text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Ny bokning
                </button>
              </div>

              {journals.length === 0 ? (
                <div className="p-12 text-center">
                  <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Ingen klipphistorik ännu</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Första gången denna hund är här
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {journals.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {SERVICE_LABELS[entry.service_type] ||
                              entry.service_type}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(
                              entry.appointment_date
                            ).toLocaleDateString("sv-SE", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="text-base font-semibold text-[#2c7a4c]">
                          {entry.final_price} kr
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        {entry.clip_length && (
                          <div>
                            <p className="text-xs text-gray-500">Klipplängd</p>
                            <p className="text-gray-900 font-medium text-sm">
                              {entry.clip_length}
                            </p>
                          </div>
                        )}
                        {entry.shampoo_type && (
                          <div>
                            <p className="text-xs text-gray-500">Schampo</p>
                            <p className="text-gray-900 text-sm">
                              {entry.shampoo_type}
                            </p>
                          </div>
                        )}
                        {entry.duration_minutes && (
                          <div>
                            <p className="text-xs text-gray-500">Tid</p>
                            <p className="text-gray-900 text-sm">
                              {entry.duration_minutes} min
                            </p>
                          </div>
                        )}
                        {entry.special_treatments && (
                          <div className="col-span-2 md:col-span-4">
                            <p className="text-xs text-gray-500">
                              Specialbehandlingar
                            </p>
                            <p className="text-gray-900 text-sm">
                              {entry.special_treatments}
                            </p>
                          </div>
                        )}
                      </div>

                      {entry.notes && (
                        <div className="mb-3 p-2.5 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{entry.notes}</p>
                        </div>
                      )}

                      {entry.next_appointment_recommended && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Nästa besök:</strong>{" "}
                            {entry.next_appointment_recommended}
                          </p>
                        </div>
                      )}

                      {(entry.before_photos?.length ||
                        entry.after_photos?.length) && (
                        <div className="mt-4 flex gap-2">
                          {entry.before_photos?.map((url, i) => (
                            <img
                              key={`before-${i}`}
                              src={url}
                              alt="Före"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                          {entry.after_photos?.map((url, i) => (
                            <img
                              key={`after-${i}`}
                              src={url}
                              alt="Efter"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
