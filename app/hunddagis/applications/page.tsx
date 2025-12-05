"use client";

// Pattern 3: Applications Management Page
// Organisations review and approve/reject hunddagis applications

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Dog as DogIcon,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

      // 1. Update application status
      // @ts-ignore - applications table
      const { error: appError } = await supabase
        .from("applications")
        // @ts-ignore
        .update({
          status: "approved",
          responded_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (appError) throw appError;

      // 2. Update owner org_id
      const { error: ownerError } = await supabase
        .from("owners")
        .update({ org_id: currentOrgId! })
        .eq("id", application.owner_id);

      if (ownerError) throw ownerError;

      // 3. Update dog org_id
      const { error: dogError } = await supabase
        .from("dogs")
        .update({ org_id: currentOrgId! })
        .eq("id", application.dog_id);

      if (dogError) throw dogError;

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

      // @ts-ignore - applications table
      const { error: appError } = await supabase
        .from("applications")
        // @ts-ignore
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
          response_notes: notes,
        })
        .eq("id", application.id);

      if (appError) throw appError;

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
    if (!dateString) return "Okänt";
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "Okänd ålder";
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    return years === 0 ? "Under 1 år" : `${years} år`;
  };

  const pendingApps = applications.filter((app) => app.status === "pending");
  const approvedApps = applications.filter((app) => app.status === "approved");
  const rejectedApps = applications.filter((app) => app.status === "rejected");

  if (!currentOrgId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Ingen organisation tilldelad.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-12 w-12 text-[#2c7a4c] animate-spin" />
        </div>
      </div>
    );
  }

  const renderCard = (app: Application) => (
    <Card key={app.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-[#2c7a4c]" />
              {app.owner.full_name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DogIcon className="h-4 w-4" />
              <span className="font-medium">{app.dog.name}</span>
              {app.dog.breed && (
                <span className="text-gray-500">• {app.dog.breed}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{formatDate(app.applied_at)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Kontakt</h3>
          <div className="space-y-2">
            <a
              href={`mailto:${app.owner.email}`}
              className="flex items-center gap-2 text-sm text-[#2c7a4c] hover:underline"
            >
              <Mail className="h-4 w-4" />
              {app.owner.email}
            </a>
            <a
              href={`tel:${app.owner.phone}`}
              className="flex items-center gap-2 text-sm text-[#2c7a4c] hover:underline"
            >
              <Phone className="h-4 w-4" />
              {app.owner.phone}
            </a>
          </div>
        </div>

        {/* Dog Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Hund</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {app.dog.birth_date && (
              <div>
                <span className="text-gray-600">Ålder:</span>
                <span className="ml-2 font-medium">
                  {calculateAge(app.dog.birth_date)}
                </span>
              </div>
            )}
            {app.dog.gender && (
              <div>
                <span className="text-gray-600">Kön:</span>
                <span className="ml-2 font-medium capitalize">
                  {app.dog.gender}
                </span>
              </div>
            )}
            {app.dog.heightcm && (
              <div>
                <span className="text-gray-600">Mankhöjd:</span>
                <span className="ml-2 font-medium">{app.dog.heightcm} cm</span>
              </div>
            )}
          </div>
        </div>

        {/* Status-specific info */}
        {app.status === "rejected" && app.response_notes && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm font-semibold text-red-700 mb-1">
              Anledning:
            </p>
            <p className="text-sm text-red-600">{app.response_notes}</p>
          </div>
        )}

        {app.status === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Godkänd {app.responded_at && formatDate(app.responded_at)}
            </p>
          </div>
        )}

        {/* Actions */}
        {app.status === "pending" && (
          <div className="pt-4 border-t space-y-3">
            {showRejectForm === app.id ? (
              <div className="space-y-3">
                <textarea
                  placeholder="Anledning till avslag (valfritt)"
                  value={rejectionNotes[app.id] || ""}
                  onChange={(e) =>
                    setRejectionNotes((prev) => ({
                      ...prev,
                      [app.id]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-[#2c7a4c] text-sm"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReject(app)}
                    disabled={processingId === app.id}
                    className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  >
                    {processingId === app.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Bekräfta avslag"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(null)}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(app)}
                  disabled={processingId === app.id}
                  className="flex-1 bg-[#2c7a4c] text-white hover:bg-green-700"
                >
                  {processingId === app.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Godkänn
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(app.id)}
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Avslå
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/hundpensionat">
          <Button variant="ghost" className="mb-4">
            ← Tillbaka
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Hunddagis-ansökningar
        </h1>
        <p className="text-gray-600">
          Hantera inkommande ansökningar från hundägare
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="gap-2">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Väntande ({pendingApps.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Godkända ({approvedApps.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Avslagn ({rejectedApps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  Inga väntande ansökningar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingApps.map(renderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {approvedApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Inga godkända ännu</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {approvedApps.map(renderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {rejectedApps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Inga avslagn ännu</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rejectedApps.map(renderCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
