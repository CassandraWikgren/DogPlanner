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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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
  const supabase = createClientComponentClient();
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
    small: "Liten (under 35cm mankhöjd)",
    medium: "Medium (35-54cm mankhöjd)",
    large: "Stor (över 55cm mankhöjd)",
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

  const filteredApplications = applications.filter((app) => {
    if (statusFilter === "all") return true;
    return app.status === statusFilter;
  });

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Laddar intresseanmälningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  ❤️ Intresseanmälningar
                </h1>
                <p className="text-gray-600 mt-1">
                  Hantera ansökningar om hunddagisplats
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {
                      applications.filter((app) => app.status === "pending")
                        .length
                    }
                  </p>
                  <p className="text-gray-600">Väntande</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {
                      applications.filter((app) => app.status === "contacted")
                        .length
                    }
                  </p>
                  <p className="text-gray-600">Kontaktade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {
                      applications.filter((app) => app.status === "accepted")
                        .length
                    }
                  </p>
                  <p className="text-gray-600">Accepterade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{applications.length}</p>
                  <p className="text-gray-600">Totalt</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Applications List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Ansökningar ({filteredApplications.length})
            </h2>

            {filteredApplications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {statusFilter === "all"
                      ? "Inga intresseanmälningar ännu"
                      : `Inga ansökningar med status "${
                          getStatusInfo(statusFilter).label
                        }"`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredApplications.map((application) => {
                const statusInfo = getStatusInfo(application.status);

                return (
                  <Card
                    key={application.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedApplication?.id === application.id
                        ? "ring-2 ring-emerald-500"
                        : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div onClick={() => setSelectedApplication(application)}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {application.dog_name}
                            </h3>
                            <p className="text-gray-600">
                              {application.parent_name}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div>📧 {application.parent_email}</div>
                          <div>📞 {application.parent_phone}</div>
                          <div>🐕 {dogSizes[application.dog_size]}</div>
                          <div>📅 {formatDate(application.created_at)}</div>
                        </div>

                        {application.preferred_start_date && (
                          <div className="text-sm text-gray-600">
                            <strong>Önskad start:</strong>{" "}
                            {formatDate(application.preferred_start_date)}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-gray-500">
                            Uppdaterad: {formatDate(application.updated_at)}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApplication(application);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Visa detaljer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Application Details */}
          <div className="sticky top-6">
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
                <CardContent className="space-y-4">
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
                  <div>
                    <h4 className="font-semibold mb-2">👤 Kontaktuppgifter</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>Namn:</strong> {selectedApplication.parent_name}
                      </div>
                      <div>
                        <strong>E-post:</strong>{" "}
                        {selectedApplication.parent_email}
                      </div>
                      <div>
                        <strong>Telefon:</strong>{" "}
                        {selectedApplication.parent_phone}
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <h4 className="font-semibold mb-2">📅 Önskemål</h4>
                    <div className="space-y-2 text-sm">
                      {selectedApplication.preferred_start_date && (
                        <div>
                          <strong>Önskad startdatum:</strong>{" "}
                          {formatDate(selectedApplication.preferred_start_date)}
                        </div>
                      )}
                      {selectedApplication.preferred_days && (
                        <div>
                          <strong>Önskade dagar:</strong>{" "}
                          {formatDays(selectedApplication.preferred_days)}
                        </div>
                      )}
                      {selectedApplication.previous_daycare_experience !==
                        undefined && (
                        <div>
                          <strong>Tidigare dagiserfarenhet:</strong>{" "}
                          {selectedApplication.previous_daycare_experience
                            ? "Ja"
                            : "Nej"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Special Needs */}
                  {selectedApplication.special_needs && (
                    <div>
                      <h4 className="font-semibold mb-2">⚠️ Särskilda behov</h4>
                      <p className="text-sm bg-yellow-50 p-3 rounded-lg">
                        {selectedApplication.special_needs}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">📝 Anteckningar</Label>
                    <Textarea
                      id="notes"
                      value={selectedApplication.notes || ""}
                      onChange={(e) => {
                        setSelectedApplication((prev) =>
                          prev ? { ...prev, notes: e.target.value } : null
                        );
                      }}
                      placeholder="Lägg till anteckningar..."
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4">
                    {selectedApplication.status === "pending" && (
                      <>
                        <Button
                          onClick={() =>
                            updateApplicationStatus(
                              selectedApplication.id,
                              "contacted",
                              selectedApplication.notes
                            )
                          }
                          disabled={saving}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Markera som kontaktad
                        </Button>
                        <Button
                          onClick={() =>
                            updateApplicationStatus(
                              selectedApplication.id,
                              "accepted",
                              selectedApplication.notes
                            )
                          }
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acceptera
                        </Button>
                      </>
                    )}

                    {selectedApplication.status === "contacted" && (
                      <>
                        <Button
                          onClick={() =>
                            updateApplicationStatus(
                              selectedApplication.id,
                              "accepted",
                              selectedApplication.notes
                            )
                          }
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Acceptera
                        </Button>
                        <Button
                          onClick={() =>
                            updateApplicationStatus(
                              selectedApplication.id,
                              "declined",
                              selectedApplication.notes
                            )
                          }
                          disabled={saving}
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                        >
                          Avböj
                        </Button>
                      </>
                    )}

                    {selectedApplication.status === "accepted" && (
                      <Button
                        onClick={() => transferToHunddagis(selectedApplication)}
                        disabled={transferring}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {transferring ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Överför...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Överför till hunddagis
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      onClick={() =>
                        updateApplicationStatus(
                          selectedApplication.id,
                          selectedApplication.status,
                          selectedApplication.notes
                        )
                      }
                      disabled={saving}
                      variant="outline"
                    >
                      {saving ? "Sparar..." : "Spara anteckningar"}
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <div>
                      Ansökan skapad:{" "}
                      {formatDate(selectedApplication.created_at)}
                    </div>
                    <div>
                      Senast uppdaterad:{" "}
                      {formatDate(selectedApplication.updated_at)}
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
    </div>
  );
}
