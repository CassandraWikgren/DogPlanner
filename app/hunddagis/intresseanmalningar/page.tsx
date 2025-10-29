"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Mail,
  Phone,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";

interface InterestApplication {
  id: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  dog_name: string;
  dog_breed?: string;
  dog_age?: number;
  dog_size: "small" | "medium" | "large";
  preferred_start_date?: string;
  preferred_days?: string[];
  special_needs?: string;
  previous_daycare_experience?: boolean;
  status: "pending" | "contacted" | "accepted" | "declined";
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hunddagis Intresseanmälningar - Hantera ansökningar om hunddagisplats
 * [ERR-1001] Databaskoppling, [ERR-4001] Uppdatering, [ERR-5001] Okänt fel
 */
export default function HunddagisIntresseanmalningarPage() {
  const { currentOrgId } = useAuth();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [applications, setApplications] = useState<InterestApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] =
    useState<InterestApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const statusOptions = [
    {
      value: "all",
      label: "Alla ansökningar",
      color: "bg-gray-100 text-gray-800",
    },
    {
      value: "pending",
      label: "Väntande",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "contacted",
      label: "Kontaktad",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "accepted",
      label: "Accepterad",
      color: "bg-green-100 text-green-800",
    },
    { value: "declined", label: "Avböjd", color: "bg-red-100 text-red-800" },
  ];

  const dogSizes = {
    small: "Liten (under 15kg)",
    medium: "Medium (15-30kg)",
    large: "Stor (över 30kg)",
  };

  useEffect(() => {
    if (currentOrgId) {
      loadApplications();
    }
  }, [currentOrgId]);

  const loadApplications = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("interest_applications")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(`[ERR-1001] Databaskoppling: ${error.message}`);
      }

      setApplications(data || []);
    } catch (err: any) {
      console.error("Error loading applications:", err);
      setError(
        err.message || "[ERR-5001] Okänt fel vid laddning av ansökningar"
      );
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string,
    newStatus: string,
    notes?: string
  ) => {
    setSaving(true);
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { error } = await supabase
        .from("interest_applications")
        .update(updateData)
        .eq("id", applicationId);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadApplications();
      if (selectedApplication?.id === applicationId) {
        setSelectedApplication((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus as
                  | "pending"
                  | "contacted"
                  | "accepted"
                  | "declined",
                notes: notes || prev.notes,
              }
            : null
        );
      }
    } catch (err: any) {
      console.error("Error updating application:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid uppdatering");
    } finally {
      setSaving(false);
    }
  };

  const transferToHunddagis = async (application: InterestApplication) => {
    if (!currentOrgId) return;

    setTransferring(true);
    try {
      // TODO: Implementera när databastabellerna är korrekt konfigurerade
      console.log("Skulle överföra ansökan:", application);

      // Simulera överföring
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Uppdatera ansökan med anteckning om överföring
      await updateApplicationStatus(
        application.id,
        "accepted",
        `${
          application.notes || ""
        }\n\n✅ MARKERAD FÖR ÖVERFÖRING TILL HUNDDAGIS:\n- Överförd: ${new Date().toLocaleString(
          "sv-SE"
        )}\n- Status: Väntar på implementation`
      );

      alert(
        `✅ Ansökan markerad för överföring!\n\nÄgare: ${application.parent_name}\nHund: ${application.dog_name}\n\nFunktionaliteten implementeras snart.`
      );

      // Uppdatera listan
      await loadApplications();
    } catch (err: any) {
      console.error("Error transferring to hunddagis:", err);
      setError(err.message || "[ERR-5002] Kunde inte överföra till hunddagis");
    } finally {
      setTransferring(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return (
      statusOptions.find((option) => option.value === status) ||
      statusOptions[0]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE");
  };

  const formatDays = (days?: string[]) => {
    if (!days || days.length === 0) return "Ej angivet";

    const dayNames: Record<string, string> = {
      monday: "Måndag",
      tuesday: "Tisdag",
      wednesday: "Onsdag",
      thursday: "Torsdag",
      friday: "Fredag",
      saturday: "Lördag",
      sunday: "Söndag",
    };

    return days.map((day) => dayNames[day] || day).join(", ");
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p>Laddar intresseanmälningar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadApplications}>Försök igen</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/hunddagis">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till Hunddagis
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Heart className="h-8 w-8 text-red-500" />
                Intresseanmälningar
              </h1>
              <p className="text-gray-600">
                Hantera ansökningar om hunddagisplats
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {applications.length}
            </div>
            <div className="text-sm text-gray-600">Totalt ansökningar</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="status-filter">Filtrera efter status:</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista och detaljer */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ansökningslista */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ansökningar</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Inga ansökningar ännu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications
                    .filter(
                      (app) =>
                        statusFilter === "all" || app.status === statusFilter
                    )
                    .map((application) => (
                      <div
                        key={application.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedApplication?.id === application.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">
                              {application.parent_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Hund: {application.dog_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(
                                application.created_at
                              ).toLocaleDateString("sv-SE")}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusOptions.find(
                                (s) => s.value === application.status
                              )?.color || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusOptions.find(
                              (s) => s.value === application.status
                            )?.label || application.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detaljer */}
        <div>
          {selectedApplication ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ansökan från {selectedApplication.parent_name}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getStatusInfo(selectedApplication.status).color
                    }`}
                  >
                    {getStatusInfo(selectedApplication.status).label}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Dog Information */}
                  <div>
                    <h4 className="font-semibold mb-2">🐕 Hundinformation</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Namn:</strong> {selectedApplication.dog_name}
                      </div>
                      {selectedApplication.dog_breed && (
                        <div>
                          <strong>Ras:</strong> {selectedApplication.dog_breed}
                        </div>
                      )}
                      {selectedApplication.dog_age && (
                        <div>
                          <strong>Ålder:</strong> {selectedApplication.dog_age}{" "}
                          år
                        </div>
                      )}
                      <div>
                        <strong>Storlek:</strong>{" "}
                        {dogSizes[selectedApplication.dog_size]}
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">
                      📞 Kontaktinformation
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <a
                          href={`mailto:${selectedApplication.parent_email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedApplication.parent_email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <a
                          href={`tel:${selectedApplication.parent_phone}`}
                          className="text-blue-600 hover:underline"
                        >
                          {selectedApplication.parent_phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">📅 Önskemål</h4>
                    <div className="space-y-2 text-sm">
                      {selectedApplication.preferred_start_date && (
                        <div>
                          <strong>Önskad startdatum:</strong>{" "}
                          {formatDate(selectedApplication.preferred_start_date)}
                        </div>
                      )}
                      <div>
                        <strong>Önskade dagar:</strong>{" "}
                        {formatDays(selectedApplication.preferred_days)}
                      </div>
                      <div>
                        <strong>Tidigare dagiserfarenhet:</strong>{" "}
                        {selectedApplication.previous_daycare_experience
                          ? "Ja"
                          : "Nej"}
                      </div>
                    </div>
                  </div>

                  {/* Special Needs */}
                  {selectedApplication.special_needs && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">⚠️ Särskilda behov</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.special_needs}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">📝 Anteckningar</h4>
                    <Textarea
                      placeholder="Lägg till anteckningar..."
                      value={selectedApplication.notes || ""}
                      onChange={(e) =>
                        setSelectedApplication((prev) =>
                          prev ? { ...prev, notes: e.target.value } : null
                        )
                      }
                      className="min-h-[100px]"
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        updateApplicationStatus(
                          selectedApplication.id,
                          selectedApplication.status,
                          selectedApplication.notes
                        )
                      }
                      disabled={saving}
                      className="mt-2"
                    >
                      {saving ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Sparar...
                        </>
                      ) : (
                        "Spara anteckningar"
                      )}
                    </Button>
                  </div>

                  {/* Status Actions */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">🔄 Ändra status</h4>
                    <div className="space-y-2">
                      <Select
                        value={selectedApplication.status}
                        onValueChange={(newStatus) =>
                          updateApplicationStatus(
                            selectedApplication.id,
                            newStatus,
                            selectedApplication.notes
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.slice(1).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Transfer to Hunddagis */}
                  {selectedApplication.status === "accepted" && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">🎯 Överföring</h4>
                      <Button
                        onClick={() => transferToHunddagis(selectedApplication)}
                        disabled={transferring}
                        className="w-full"
                        variant="default"
                      >
                        {transferring ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Överför...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            Överför till Hunddagis
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Skapar automatiskt ägare och hund i systemet
                      </p>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="border-t pt-4 text-xs text-gray-500 space-y-1">
                    <div>
                      <strong>Ansökan mottagen:</strong>{" "}
                      {formatDate(selectedApplication.created_at)}
                    </div>
                    <div>
                      <strong>Senast uppdaterad:</strong>{" "}
                      {formatDate(selectedApplication.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Välj en ansökan för att se detaljer
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
