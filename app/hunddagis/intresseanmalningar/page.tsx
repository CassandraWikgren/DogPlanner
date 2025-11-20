"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
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
import {
  sendWelcomeEmail,
  createApplicationReceivedEmail,
  createRejectionEmail,
  sendEmail,
} from "@/lib/emailSender";

interface InterestApplication {
  id: string;
  org_id?: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  owner_city?: string;
  owner_address?: string;
  dog_name: string;
  dog_breed?: string;
  dog_birth?: string;
  dog_age?: number;
  dog_gender?: "hane" | "tik";
  dog_size?: "small" | "medium" | "large";
  dog_height_cm?: number;
  subscription_type?: string;
  preferred_start_date?: string;
  preferred_days?: string[];
  special_needs?: string;
  special_care_needs?: string;
  is_neutered?: boolean;
  is_escape_artist?: boolean;
  destroys_things?: boolean;
  not_house_trained?: boolean;
  previous_daycare_experience?: boolean;
  gdpr_consent?: boolean;
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

      // 📧 Skicka email vid statusuppdatering
      if (newStatus === "declined" && selectedApplication) {
        try {
          console.log("📧 Skickar avslagsmail...");
          const rejectionTemplate = createRejectionEmail(
            selectedApplication.parent_name,
            selectedApplication.dog_name,
            notes || "Tyvärr kan vi inte erbjuda en plats just nu.",
            undefined // orgName hämtas automatiskt
          );

          const emailResult = await sendEmail(rejectionTemplate, {
            to: selectedApplication.parent_email,
            orgId: currentOrgId || undefined,
          });

          if (emailResult.success) {
            console.log("✅ Avslagsmail skickat framgångsrikt");
          } else {
            console.warn(
              "⚠️ Kunde inte skicka avslagsmail:",
              emailResult.error
            );
          }
        } catch (emailError) {
          console.warn("⚠️ Email-fel vid avslag:", emailError);
        }
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

    if (
      !confirm(
        `Överför ${application.dog_name} till hunddagis?\n\nDetta skapar:\n- Ägare: ${application.parent_name}\n- Hund: ${application.dog_name}\n\nFortsätt?`
      )
    ) {
      return;
    }

    setTransferring(true);
    try {
      // 1. Skapa eller hitta ägare
      let ownerId: string | null = null;

      // Försök hitta befintlig ägare via e-post
      const { data: existingOwner } = await supabase
        .from("owners")
        .select("id")
        .eq("org_id", currentOrgId)
        .ilike("email", application.parent_email)
        .maybeSingle();

      if (existingOwner) {
        ownerId = existingOwner.id;
        console.log("Hittade befintlig ägare:", ownerId);
      } else {
        // Skapa ny ägare
        const { data: newOwner, error: ownerError } = await supabase
          .from("owners")
          .insert([
            {
              org_id: currentOrgId,
              full_name: application.parent_name,
              email: application.parent_email,
              phone: application.parent_phone,
              city: application.owner_city || null,
              address: application.owner_address || null,
              gdpr_consent: application.gdpr_consent || false,
              notes: `Från intresseanmälan ${new Date().toLocaleDateString(
                "sv-SE"
              )}`,
            },
          ])
          .select("id")
          .single();

        if (ownerError) throw ownerError;
        ownerId = newOwner.id;
        console.log("Skapade ny ägare:", ownerId);
      }

      // 2. Konvertera preferred_days till string (kommaseparerad)
      const daysString = application.preferred_days?.join(",") || "";

      // 3. Skapa hund
      const { data: newDog, error: dogError } = await supabase
        .from("dogs")
        .insert([
          {
            org_id: currentOrgId,
            owner_id: ownerId,
            name: application.dog_name,
            breed: application.dog_breed || null,
            birth: application.dog_birth || null,
            gender: application.dog_gender || null,
            heightcm: application.dog_height_cm || null,
            subscription: application.subscription_type || null,
            days: daysString,
            startdate: application.preferred_start_date || null,
            special_needs:
              application.special_care_needs ||
              application.special_needs ||
              null,
            is_castrated: application.is_neutered || false,
            is_escape_artist: application.is_escape_artist || false,
            destroys_things: application.destroys_things || false,
            is_house_trained: !application.not_house_trained,
            notes: `Från intresseanmälan: ${
              application.notes || "Ingen kommentar"
            }`,
          },
        ])
        .select("id, name")
        .single();

      if (dogError) throw dogError;

      console.log("Skapade hund:", newDog);

      // 4. Uppdatera ansökan till "accepted" med anteckning
      await updateApplicationStatus(
        application.id,
        "accepted",
        `${
          application.notes || ""
        }\n\n✅ ÖVERFÖRD TILL HUNDDAGIS:\n- Datum: ${new Date().toLocaleString(
          "sv-SE"
        )}\n- Ägare ID: ${ownerId}\n- Hund ID: ${newDog.id}\n- Hund: ${
          newDog.name
        }`
      );

      // 5. Skicka bekräftelse-mejl till ägaren
      try {
        console.log("📧 Skickar välkomstmail...");
        const emailResult = await sendWelcomeEmail(
          application.parent_email,
          application.parent_name,
          application.dog_name,
          application.preferred_start_date,
          currentOrgId
        );

        if (emailResult.success) {
          console.log("✅ Välkomstmail skickat framgångsrikt");
        } else {
          console.warn("⚠️ Kunde inte skicka välkomstmail:", emailResult.error);
          // Fortsätt ändå - email-fel ska inte stoppa överföringen
        }
      } catch (emailError) {
        console.warn("⚠️ Email-fel:", emailError);
        // Fortsätt ändå - email-fel ska inte stoppa överföringen
      }

      alert(
        `✅ Överföringen lyckades!\n\n` +
          `Ägare: ${application.parent_name}\n` +
          `Hund: ${application.dog_name}\n\n` +
          `Hunden finns nu i hunddagis-listan.`
      );

      // Ladda om listan
      await loadApplications();
    } catch (err: any) {
      console.error("Error transferring to hunddagis:", err);
      setError(
        err.message ||
          "[ERR-5002] Kunde inte överföra till hunddagis. Kontrollera att alla obligatoriska fält är ifyllda."
      );
      alert(
        `❌ Fel vid överföring:\n\n${
          err.message || "Okänt fel"
        }\n\nKontrollera att alla obligatoriska fält är ifyllda i ansökan.`
      );
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
                        {selectedApplication.dog_size
                          ? dogSizes[selectedApplication.dog_size]
                          : "Ej angivet"}
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
                      <h4 className="font-semibold mb-2">
                        🎯 Överföring till Hunddagis
                      </h4>

                      {/* Visa varning om hunden redan är överförd */}
                      {selectedApplication.notes?.includes(
                        "ÖVERFÖRD TILL HUNDDAGIS"
                      ) ? (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✅ Denna hund har redan överförts till hunddagis.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Kontrollera obligatoriska fält */}
                          {!selectedApplication.dog_name ||
                          !selectedApplication.parent_name ||
                          !selectedApplication.parent_email ? (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800">
                                ⚠️ Obligatoriska fält saknas. Kontrollera att
                                namn, e-post och hundens namn är ifyllda.
                              </p>
                            </div>
                          ) : (
                            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800 mb-2">
                                <strong>Detta kommer att skapa:</strong>
                              </p>
                              <ul className="text-sm text-blue-700 space-y-1">
                                <li>
                                  • Ägare: {selectedApplication.parent_name}
                                </li>
                                <li>
                                  • Hund: {selectedApplication.dog_name}{" "}
                                  {selectedApplication.dog_breed
                                    ? `(${selectedApplication.dog_breed})`
                                    : ""}
                                </li>
                                {selectedApplication.subscription_type && (
                                  <li>
                                    • Abonnemang:{" "}
                                    {selectedApplication.subscription_type}
                                  </li>
                                )}
                                {selectedApplication.preferred_start_date && (
                                  <li>
                                    • Startdatum:{" "}
                                    {new Date(
                                      selectedApplication.preferred_start_date
                                    ).toLocaleDateString("sv-SE")}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </>
                      )}

                      <Button
                        onClick={() => transferToHunddagis(selectedApplication)}
                        disabled={
                          transferring ||
                          selectedApplication.notes?.includes(
                            "ÖVERFÖRD TILL HUNDDAGIS"
                          ) ||
                          !selectedApplication.dog_name ||
                          !selectedApplication.parent_name ||
                          !selectedApplication.parent_email
                        }
                        className="w-full"
                        variant="default"
                      >
                        {transferring ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Överför...
                          </>
                        ) : selectedApplication.notes?.includes(
                            "ÖVERFÖRD TILL HUNDDAGIS"
                          ) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Redan överförd
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
