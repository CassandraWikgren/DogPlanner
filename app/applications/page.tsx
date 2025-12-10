"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { capitalize } from "@/lib/textUtils";
import ApplicationCard from "@/components/ApplicationCard";
import {
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  PawPrint,
  Calendar,
  User,
  Star,
  Eye,
  MessageCircle,
  Plus,
  Check,
  X,
  Filter,
} from "lucide-react";

interface Application {
  id: string;
  org_id: string | null; // ✅ Fixed: kan vara null från DB
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  dog_name: string;
  dog_breed?: string | null;
  dog_age?: number | null;
  dog_size?: "small" | "medium" | "large" | string | null; // ✅ Fixed: DB kan ha andra värden eller null
  preferred_start_date?: string | null;
  preferred_days?: string[] | null;
  special_needs?: string | null;
  previous_daycare_experience?: boolean | null;
  status: string;
  notes?: string | null;
  created_at: string | null; // ✅ Fixed: kan vara null från DB
  updated_at: string | null; // ✅ Fixed: kan vara null från DB
  // Nya fält från tracking
  first_contact_date?: string | null;
  first_contact_notes?: string | null;
  visit_booked_date?: string | null;
  visit_status?: string | null;
  visit_completed_date?: string | null;
  visit_result?: string | null;
  contact_history?: any; // ✅ Fixed: Json type from Supabase (kan vara array, object, string, null)
  priority?: number | null;
  expected_start_month?: string | null;
}

export default function ApplicationsPage() {
  const supabase = createClient();
  const { user, currentOrgId } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [visitFilter, setVisitFilter] = useState<string>("all");

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
    } catch (error) {
      console.error("Fel vid uppdatering av ansökan:", error);
    }
  };

  // Ny funktion för att uppdatera valfria fält
  const updateApplication = async (
    id: string,
    updates: Partial<Application>
  ) => {
    try {
      const { error } = await supabase
        .from("interest_applications")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      await fetchApplications();
    } catch (error) {
      console.error("Fel vid uppdatering av ansökan:", error);
    }
  };

  const filteredApplications = applications.filter((app) => {
    // Status filter
    if (statusFilter !== "all" && app.status !== statusFilter) return false;

    // Priority filter
    if (priorityFilter !== "all") {
      const priority = app.priority || 0;
      if (priorityFilter === "high" && priority !== 1) return false;
      if (priorityFilter === "normal" && priority !== 0) return false;
      if (priorityFilter === "low" && priority !== -1) return false;
    }

    // Visit status filter
    if (visitFilter !== "all") {
      if (visitFilter === "none" && app.visit_status) return false;
      if (visitFilter !== "none" && app.visit_status !== visitFilter)
        return false;
    }

    return true;
  });

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
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Filter</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] text-sm"
              >
                <option value="pending">Väntande</option>
                <option value="contacted">Kontaktade</option>
                <option value="accepted">Godkända</option>
                <option value="declined">Avslagna</option>
                <option value="all">Alla statusar</option>
              </select>
            </div>

            {/* Priority filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioritet
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] text-sm"
              >
                <option value="all">Alla prioriteter</option>
                <option value="high">Hög prioritet</option>
                <option value="normal">Normal prioritet</option>
                <option value="low">Låg prioritet</option>
              </select>
            </div>

            {/* Visit status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Besöksstatus
              </label>
              <select
                value={visitFilter}
                onChange={(e) => setVisitFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] text-sm"
              >
                <option value="all">Alla besök</option>
                <option value="none">Inget besök</option>
                <option value="booked">Bokat besök</option>
                <option value="completed">Genomfört besök</option>
                <option value="cancelled">Inställt besök</option>
                <option value="no_show">Uteblev</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ansökningslista - NY MODERN VY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onUpdate={updateApplication}
            />
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
      </div>
    </div>
  );
}
