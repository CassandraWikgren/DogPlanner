"use client";

// Pattern 3: Applications Management Page
// Organisations review and approve/reject hunddagis applications
// ✅ DESIGN STANDARD: max-w-7xl + TABLE LAYOUT + Proper header section
// ✅ TRANSACTION SAFETY: Uses RPC functions with ACID guarantees

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Application {
  id: string;
  org_id: string;
  owner_id: string;
  dog_id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  applied_at: string;
  responded_at: string | null;
  response_notes: string | null;
  owner: {
    full_name: string;
    email: string;
    phone: string;
  };
  dog: {
    name: string;
    breed: string | null;
    birth_date: string | null;
    gender: string | null;
    heightcm: number | null;
  };
}

export default function HunddagisApplicationsPage() {
  const supabase = createClient();
  const { currentOrgId } = useAuth();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<{
    [key: string]: string;
  }>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  useEffect(() => {
    if (!currentOrgId) {
      setLoading(false);
      return;
    }
    fetchApplications();
  }, [currentOrgId]);

  const fetchApplications = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      // @ts-ignore - applications table
      const { data, error: fetchError } = await supabase
        .from("applications")
        .select(
          `
          id,
          org_id,
          owner_id,
          dog_id,
          status,
          applied_at,
          responded_at,
          response_notes,
          owners!inner(full_name, email, phone),
          dogs!inner(name, breed, birth_date, gender, heightcm)
        `
        )
        .eq("org_id", currentOrgId)
        .order("applied_at", { ascending: false });

      if (fetchError) throw fetchError;

      const transformedData =
        data?.map((app: any) => ({
          id: app.id,
          org_id: app.org_id,
          owner_id: app.owner_id,
          dog_id: app.dog_id,
          status: app.status,
          applied_at: app.applied_at,
          responded_at: app.responded_at,
          response_notes: app.response_notes,
          owner: {
            full_name: app.owners.full_name,
            email: app.owners.email,
            phone: app.owners.phone,
          },
          dog: {
            name: app.dogs.name,
            breed: app.dogs.breed,
            birth_date: app.dogs.birth_date,
            gender: app.dogs.gender,
            heightcm: app.dogs.heightcm,
          },
        })) || [];

      setApplications(transformedData);
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      setError(err.message || "Kunde inte ladda ansökningar.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: Application) => {
    try {
      setProcessingId(application.id);
      setError(null);
      setSuccess(null);

      // Use transactional RPC function for ACID guarantees
      const { data, error: rpcError } = await supabase.rpc(
        "approve_application",
        {
          p_application_id: application.id,
          p_org_id: currentOrgId!,
        }
      );

      if (rpcError) throw rpcError;

      setSuccess(
        `✅ Ansökan godkänd! ${application.owner.full_name} och ${application.dog.name} är nu kopplade till er organisation.`
      );

      await fetchApplications();
    } catch (err: any) {
      console.error("Error approving:", err);
      setError(err.message || "Kunde inte godkänna ansökan.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (application: Application) => {
    try {
      setProcessingId(application.id);
      setError(null);
      setSuccess(null);

      const notes = rejectionNotes[application.id] || "";

      // Use transactional RPC function
      const { data, error: rpcError } = await supabase.rpc(
        "reject_application",
        {
          p_application_id: application.id,
          p_org_id: currentOrgId!,
          p_response_notes: notes,
        }
      );

      if (rpcError) throw rpcError;

      setSuccess(`✅ Ansökan avslagen.`);
      setShowRejectForm(null);
      setRejectionNotes((prev) => {
        const updated = { ...prev };
        delete updated[application.id];
        return updated;
      });

      await fetchApplications();
    } catch (err: any) {
      console.error("Error rejecting:", err);
      setError(err.message || "Kunde inte avslå ansökan.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "—";
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    return years === 0 ? "0" : `${years}`;
  };

  const pendingApps = applications.filter((app) => app.status === "pending");
  const approvedApps = applications.filter((app) => app.status === "approved");
  const rejectedApps = applications.filter((app) => app.status === "rejected");

  if (!currentOrgId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Hunddagis-ansökningar
            </h1>
            <p className="mt-1 text-base text-gray-600">
              Hantera inkommande ansökningar från hundägare
            </p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600 text-base">
              Ingen organisation tilldelad.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Hunddagis-ansökningar
            </h1>
            <p className="mt-1 text-base text-gray-600">
              Hantera inkommande ansökningar från hundägare
            </p>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="h-12 w-12 text-[#2c7a4c] animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  const renderApplicationRow = (app: Application) => (
    <tr
      key={app.id}
      className="hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <td className="px-4 py-3 text-sm text-[#333333]">
        {app.owner.full_name}
      </td>
      <td className="px-4 py-3 text-sm text-[#333333]">
        {app.dog.name}
        {app.dog.breed && (
          <span className="text-gray-600"> ({app.dog.breed})</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-[#333333]">
        {app.dog.birth_date ? calculateAge(app.dog.birth_date) : "—"}
      </td>
      <td className="px-4 py-3 text-sm text-[#333333]">
        {formatDate(app.applied_at)}
      </td>
      <td className="px-4 py-3 text-sm">
        {app.status === "pending" && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Väntande
          </span>
        )}
        {app.status === "approved" && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Godkänd
          </span>
        )}
        {app.status === "rejected" && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Avslagen
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-right">
        {app.status === "pending" && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => handleApprove(app)}
              disabled={processingId === app.id}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] disabled:opacity-50 transition-colors"
            >
              {processingId === app.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Godkänn
                </>
              )}
            </button>
            <button
              onClick={() => setShowRejectForm(app.id)}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-semibold text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 transition-colors"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Avslå
            </button>
          </div>
        )}
        {app.status === "approved" && (
          <span className="text-sm text-gray-600">
            Godkänd {formatDate(app.responded_at)}
          </span>
        )}
        {app.status === "rejected" && (
          <span className="text-sm text-gray-600">
            Avslagen {formatDate(app.responded_at)}
          </span>
        )}
      </td>
    </tr>
  );

  const renderRejectForm = (app: Application) => (
    <tr key={`reject-${app.id}`} className="bg-red-50 border-t border-red-200">
      <td colSpan={6} className="px-4 py-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Anledning till avslag (valfritt)
            </label>
            <textarea
              placeholder="Förklara varför ansökan avslogs..."
              value={rejectionNotes[app.id] || ""}
              onChange={(e) =>
                setRejectionNotes((prev) => ({
                  ...prev,
                  [app.id]: e.target.value,
                }))
              }
              className="w-full px-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowRejectForm(null)}
              className="px-4 py-2.5 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={() => handleReject(app)}
              disabled={processingId === app.id}
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {processingId === app.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Bekräfta avslag
            </button>
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER SECTION - White background with border-b */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Hunddagis-ansökningar
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera inkommande ansökningar från hundägare
              </p>
            </div>

            {/* Stats boxes - optional */}
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {pendingApps.length}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Väntande</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {approvedApps.length}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Godkända</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="gap-2 bg-white border-b border-gray-200">
            <TabsTrigger
              value="pending"
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-[#2c7a4c]"
            >
              <Clock className="h-4 w-4" />
              Väntande ({pendingApps.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-[#2c7a4c]"
            >
              <CheckCircle className="h-4 w-4" />
              Godkända ({approvedApps.length})
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-[#2c7a4c]"
            >
              <XCircle className="h-4 w-4" />
              Avslagn ({rejectedApps.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Tab */}
          <TabsContent value="pending">
            {pendingApps.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-base">
                  Inga väntande ansökningar
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-[#2c7a4c]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Hundsägare
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Hund
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Ålder
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Ansökt
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-white">
                        Åtgärd
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {pendingApps.map((app) => (
                      <React.Fragment key={app.id}>
                        {renderApplicationRow(app)}
                        {showRejectForm === app.id && renderRejectForm(app)}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Approved Tab */}
          <TabsContent value="approved">
            {approvedApps.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-base">Inga godkända ännu</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-[#2c7a4c]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Hundsägare
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Hund
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Ålder
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Ansökt
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-white">
                        Godkänd
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedApps.map(renderApplicationRow)}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Rejected Tab */}
          <TabsContent value="rejected">
            {rejectedApps.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-base">Inga avslagn ännu</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-[#2c7a4c]">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Hundsägare
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Hund
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Ålder
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Ansökt
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-white">
                        Avslagen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {rejectedApps.map((app) => (
                      <React.Fragment key={app.id}>
                        <tr className="hover:bg-gray-100 transition-colors">
                          <td className="px-4 py-3 text-sm text-[#333333]">
                            {app.owner.full_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#333333]">
                            {app.dog.name}
                            {app.dog.breed && (
                              <span className="text-gray-600">
                                {" "}
                                ({app.dog.breed})
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#333333]">
                            {app.dog.birth_date
                              ? calculateAge(app.dog.birth_date)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#333333]">
                            {formatDate(app.applied_at)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Avslagen
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">
                            {formatDate(app.responded_at)}
                          </td>
                        </tr>
                        {app.response_notes && (
                          <tr className="bg-red-50 border-t border-red-200">
                            <td colSpan={6} className="px-4 py-3">
                              <p className="text-sm font-semibold text-red-700 mb-1">
                                Anledning:
                              </p>
                              <p className="text-sm text-red-600">
                                {app.response_notes}
                              </p>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
