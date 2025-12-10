"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Database } from "@/types/database";
import {
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Mail,
  User,
  PawPrint,
  Edit,
  Trash2,
} from "lucide-react";
import { capitalize } from "@/lib/textUtils";
import InterestApplicationModal from "./InterestApplicationModal";

type InterestApplication =
  Database["public"]["Tables"]["interest_applications"]["Row"];

interface WaitlistViewProps {
  onApplicationClick?: (application: InterestApplication) => void;
}

export default function WaitlistView({
  onApplicationClick,
}: WaitlistViewProps) {
  const supabase = createClient();
  const { currentOrgId } = useAuth();
  const [applications, setApplications] = useState<InterestApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<InterestApplication | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (currentOrgId) {
      loadApplications();
    }
  }, [currentOrgId]);

  const loadApplications = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await supabase
        .from("interest_applications")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (app: InterestApplication) => {
    if (app.visit_completed_date) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Besök genomfört
        </span>
      );
    }
    if (app.visit_booked_date) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Calendar className="h-3 w-3 mr-1" />
          Besök bokat{" "}
          {new Date(app.visit_booked_date).toLocaleDateString("sv-SE")}
        </span>
      );
    }
    if (app.first_contact_date) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Phone className="h-3 w-3 mr-1" />
          Kontaktad{" "}
          {new Date(app.first_contact_date).toLocaleDateString("sv-SE")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        Väntar på kontakt
      </span>
    );
  };

  const getPriorityBadge = (priority: number | null) => {
    if (priority === 1) {
      return <span className="text-red-500 font-bold">⚠️ HÖG</span>;
    }
    if (priority === -1) {
      return <span className="text-gray-400">LÅG</span>;
    }
    return null;
  };

  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    return (
      app.parent_name.toLowerCase().includes(query) ||
      app.dog_name.toLowerCase().includes(query) ||
      app.parent_email.toLowerCase().includes(query) ||
      app.parent_phone.includes(query)
    );
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
          <p className="mt-2 text-gray-600">Laddar väntelista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <input
          type="text"
          placeholder="Sök på namn, e-post eller telefon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
        />
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
          <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Inga intresseanmälningar
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? "Inga resultat matchar din sökning"
              : "Nya ansökningar från /ansokan-sidan visas här"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedApplication(app);
                setShowModal(true);
              }}
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {capitalize(app.dog_name)}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {app.dog_breed ? capitalize(app.dog_breed) : "—"}
                      </span>
                      {getPriorityBadge(app.priority)}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="inline-flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {capitalize(app.parent_name)}
                      </span>
                      <span className="inline-flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        {app.parent_phone}
                      </span>
                      <span className="inline-flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {app.parent_email}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(app)}
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-5 gap-4 text-sm border-t pt-3">
                  <div>
                    <span className="text-gray-500 font-medium">Storlek:</span>
                    <p className="text-gray-900 mt-1">
                      {app.dog_size === "small"
                        ? "Liten"
                        : app.dog_size === "medium"
                          ? "Medium"
                          : "Stor"}
                      {app.dog_age && ` • ${app.dog_age} år`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">
                      Önskar börja:
                    </span>
                    <p className="text-gray-900 mt-1">
                      {app.preferred_start_date
                        ? new Date(app.preferred_start_date).toLocaleDateString(
                            "sv-SE"
                          )
                        : app.expected_start_month || "Ej angivet"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">
                      Besök bokat:
                    </span>
                    <p className="text-gray-900 mt-1 font-medium">
                      {app.visit_booked_date ? (
                        <span className="text-blue-600">
                          📅{" "}
                          {new Date(app.visit_booked_date).toLocaleDateString(
                            "sv-SE"
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">Ej bokat</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Dagar:</span>
                    <p className="text-gray-900 mt-1">
                      {app.preferred_days && app.preferred_days.length > 0
                        ? app.preferred_days.join(", ")
                        : "Flexibel"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Ansökte:</span>
                    <p className="text-gray-900 mt-1">
                      {app.created_at
                        ? new Date(app.created_at).toLocaleDateString("sv-SE")
                        : "Okänt"}
                    </p>
                  </div>
                </div>

                {/* Special Needs */}
                {app.special_needs && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <div className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Särskilda behov:
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {app.special_needs}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact History Timeline */}
                {(app.first_contact_notes ||
                  app.visit_status ||
                  app.visit_result) && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Kontakthistorik
                    </p>
                    <div className="space-y-2 text-sm">
                      {app.first_contact_notes && (
                        <div className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                          <p className="text-gray-700">
                            {app.first_contact_notes}
                          </p>
                        </div>
                      )}
                      {app.visit_status && (
                        <div className="flex items-start">
                          <Calendar className="h-4 w-4 text-blue-500 mr-2 mt-0.5" />
                          <p className="text-gray-700">
                            Besök: {app.visit_status}
                            {app.visit_result && ` → ${app.visit_result}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for editing application */}
      {selectedApplication && (
        <InterestApplicationModal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onSaved={() => {
            loadApplications(); // Refresh the list
            setShowModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
}
