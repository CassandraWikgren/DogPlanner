"use client";
import React, { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const { user } = useAuth();
  const supabase = createBrowserClient<import("@/types/database").Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      // Optionally, use user info for filtering if needed
      const { data, error } = await supabase
        .from("interest_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <PawPrint className="h-8 w-8 text-blue-600" />
            Intresseanmälningar
          </h1>
          <p className="text-gray-600">
            Hantera ansökningar från hundägare som vill anmäla sina hundar till
            dagiset.
          </p>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Väntande</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {applications.filter((a) => a.status === "pending").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Godkända</p>
                  <p className="text-2xl font-bold text-green-600">
                    {applications.filter((a) => a.status === "accepted").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avslagna</p>
                  <p className="text-2xl font-bold text-red-600">
                    {applications.filter((a) => a.status === "declined").length}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Totalt</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {applications.length}
                  </p>
                </div>
                <PawPrint className="h-8 w-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Väntande</option>
                <option value="accepted">Godkända</option>
                <option value="declined">Avslagna</option>
                <option value="contacted">Kontaktade</option>
                <option value="all">Alla</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Ansökningslista */}
        <div className="space-y-6">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-2">
                      <PawPrint className="h-5 w-5 text-blue-600" />
                      {app.dog_name}
                    </CardTitle>
                    <p className="text-gray-600">
                      {app.dog_breed} {app.dog_age && `• ${app.dog_age} år`}
                    </p>
                  </div>
                  <Badge className={getStatusColor(app.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(app.status)}
                      {getStatusText(app.status)}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ägarinfo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Ägare
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>{app.parent_name}</div>
                      {app.parent_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <a
                            href={`tel:${app.parent_phone}`}
                            className="text-blue-600 hover:underline"
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
                            className="text-blue-600 hover:underline"
                          >
                            {app.parent_email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ansökan</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {/* Ingen abonnemangstyp i interest_applications */}
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
                    <h4 className="font-medium text-gray-900 mb-2">
                      Särskilda behov
                    </h4>
                    <p className="text-sm text-gray-600">{app.special_needs}</p>
                  </div>
                )}

                {/* Anteckningar */}
                {app.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Anteckningar
                    </h4>
                    <p className="text-sm text-gray-600">{app.notes}</p>
                  </div>
                )}

                {/* Åtgärder */}
                {app.status === "pending" && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={() => setSelectedApp(app)}
                      variant="outline"
                      className="flex-1"
                    >
                      Hantera ansökan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tom lista */}
        {filteredApplications.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <PawPrint className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga ansökningar hittades
              </h3>
              <p className="text-gray-600">
                Det finns inga ansökningar som matchar dina filterkriterier.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Modal för att hantera ansökan */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Hantera ansökan - {selectedApp.dog_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anteckningar
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Lägg till anteckningar..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() =>
                      updateApplicationStatus(selectedApp.id, "accepted", notes)
                    }
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Godkänn
                  </Button>
                  <Button
                    onClick={() =>
                      updateApplicationStatus(selectedApp.id, "declined", notes)
                    }
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Avslå
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setSelectedApp(null);
                    setNotes("");
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Avbryt
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
