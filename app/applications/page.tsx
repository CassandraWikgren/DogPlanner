"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  PawPrint,
  Calendar,
  User,
} from "lucide-react";

interface Application {
  id: string;
  org_id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  dog_name: string;
  dog_breed?: string | null;
  dog_age?: number | null;
  dog_size?: "small" | "medium" | "large";
  preferred_start_date?: string | null;
  preferred_days?: string[] | null;
  special_needs?: string | null;
  previous_daycare_experience?: boolean | null;
  status: "pending" | "contacted" | "accepted" | "declined";
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export default function ApplicationsPage() {
  const { user, currentOrgId } = useAuth();
  const supabase = createClientComponentClient();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (currentOrgId) {
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const fetchApplications = async () => {
    if (!currentOrgId) return;

    try {
      console.log("🔍 Hämtar intresseanmälningar för org:", currentOrgId);

      const { data, error } = await supabase
        .from("interest_applications")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Error fetching applications:", error);
        throw error;
      }

      console.log(`✅ Hittade ${data?.length || 0} intresseanmälningar:`, data);
      setApplications(data || []);
    } catch (error) {
      console.error("Fel vid hämtning av ansökningar:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    id: string,
    status: Application["status"],
    notes?: string
  ) => {
    try {
      const updateData = {
        status,
        notes: notes || null,
      };
      const { error } = await (supabase as any)
        .from("interest_applications")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      await fetchApplications();
      setSelectedApp(null);
      setNotes("");
    } catch (error) {
      console.error("Fel vid uppdatering av ansökan:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      case "contacted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "accepted":
        return <CheckCircle className="h-4 w-4" />;
      case "declined":
        return <XCircle className="h-4 w-4" />;
      case "contacted":
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Väntande";
      case "accepted":
        return "Godkänd";
      case "declined":
        return "Avslagen";
      case "contacted":
        return "Kontaktad";
      default:
        return "Okänd";
    }
  };

  const filteredApplications = applications.filter(
    (app) => statusFilter === "all" || app.status === statusFilter
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Intresseanmälningar
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
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
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Intresseanmälningar
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera ansökningar från hundägare som vill anmäla sina hundar
                till dagiset
              </p>
            </div>
            {/* Inline stats boxes */}
            <div className="flex gap-4 ml-6">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-yellow-600">
                  {applications.filter((a) => a.status === "pending").length}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">Väntande</div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-2xl font-bold text-[#2c7a4c]">
                  {applications.filter((a) => a.status === "accepted").length}
                </div>
                <div className="text-xs text-gray-600 mt-0.5">Godkända</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - EXAKT som Hunddagis */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistik grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Väntande</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {applications.filter((a) => a.status === "pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Godkända</p>
                <p className="text-2xl font-bold text-green-600">
                  {applications.filter((a) => a.status === "accepted").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avslagna</p>
                <p className="text-2xl font-bold text-red-600">
                  {applications.filter((a) => a.status === "declined").length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt</p>
                <p className="text-2xl font-bold text-gray-900">
                  {applications.length}
                </p>
              </div>
              <PawPrint className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filter</h2>
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] text-sm"
            >
              <option value="pending">Väntande</option>
              <option value="accepted">Godkända</option>
              <option value="declined">Avslagna</option>
              <option value="contacted">Kontaktade</option>
              <option value="all">Alla</option>
            </select>
          </div>
        </div>

        {/* Ansökningslista */}
        <div className="space-y-6">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-[#2c7a4c]" />
                      {app.dog_name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {app.dog_breed} {app.dog_age && `• ${app.dog_age} år`}
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1 ${getStatusColor(app.status)}`}
                  >
                    {getStatusIcon(app.status)}
                    {getStatusText(app.status)}
                  </div>
                </div>

                <div className="space-y-4 text-sm mt-4">
                  {/* Ägarinfo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Ägare
                      </h4>
                      <div className="space-y-1 text-gray-600">
                        <div>{app.parent_name}</div>
                        {app.parent_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <a
                              href={`tel:${app.parent_phone}`}
                              className="text-[#2c7a4c] hover:underline"
                            >
                              {app.parent_phone}
                            </a>
                          </div>
                        )}
                        {app.parent_email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <a
                              href={`mailto:${app.parent_email}`}
                              className="text-[#2c7a4c] hover:underline"
                            >
                              {app.parent_email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Ansökan
                      </h4>
                      <div className="space-y-1 text-gray-600">
                        {app.preferred_start_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Önskad start:{" "}
                            {new Date(
                              app.preferred_start_date
                            ).toLocaleDateString("sv-SE")}
                          </div>
                        )}
                        <div>
                          Ansökt:{" "}
                          {new Date(app.created_at).toLocaleDateString("sv-SE")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Särskilda behov */}
                  {app.special_needs && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Särskilda behov
                      </h4>
                      <p className="text-gray-600">{app.special_needs}</p>
                    </div>
                  )}

                  {/* Anteckningar */}
                  {app.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Anteckningar
                      </h4>
                      <p className="text-gray-600">{app.notes}</p>
                    </div>
                  )}

                  {/* Åtgärder */}
                  {app.status === "pending" && (
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="flex-1 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm"
                      >
                        Hantera ansökan
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tom lista */}
        {filteredApplications.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm text-center py-12">
            <div className="p-6">
              <PawPrint className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Inga ansökningar hittades
              </h3>
              <p className="text-gray-600 text-sm">
                Det finns inga ansökningar som matchar dina filterkriterier.
              </p>
            </div>
          </div>
        )}

        {/* Modal för att hantera ansökan */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">
                  Hantera ansökan - {selectedApp.dog_name}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Anteckningar
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Lägg till anteckningar..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      updateApplicationStatus(selectedApp.id, "accepted", notes)
                    }
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Godkänn
                  </button>
                  <button
                    onClick={() =>
                      updateApplicationStatus(selectedApp.id, "declined", notes)
                    }
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Avslå
                  </button>
                </div>

                <button
                  onClick={() => {
                    setSelectedApp(null);
                    setNotes("");
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
