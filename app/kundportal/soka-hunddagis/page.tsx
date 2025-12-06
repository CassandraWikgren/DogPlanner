"use client";

// ⚠️ NOTE: This page requires database migrations to be run first:
// - 20251204_pattern3_global_registration.sql (adds applications table)
// - Schema needs: lan, kommun, service_types, is_visible_to_customers columns on orgs table
//
// För tillfället visar denna sida alla organisationer som har enabled_services med "hunddagis"

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Search,
  Phone,
  Mail,
  Heart,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Organisation {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  enabled_services: string[] | null;
}

interface Dog {
  id: string;
  name: string;
  breed: string | null;
}

export default function SokaHunddagisPage() {
  const supabase = createClient();
  const { user, currentOrgId } = useAuth();
  const router = useRouter();

  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organisation[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Redirect if user already has org_id (already booked)
  useEffect(() => {
    if (currentOrgId) {
      router.push("/kundportal/dashboard");
    }
  }, [currentOrgId, router]);

  // Load organisations and dogs
  useEffect(() => {
    if (!user) {
      router.push("/kundportal/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch organisations - endast betalande företag som tar emot ansökningar
        const { data: orgsData, error: orgsError } = await supabase
          .from("orgs")
          .select("id, name, address, phone, email, enabled_services")
          .eq("accepting_applications", true) // 🟢 Endast företag som tar emot nya ansökningar
          .eq("subscription_status", "active"); // 🟢 Endast betalande kunder

        if (orgsError) throw orgsError;

        // Filter for organisations with "hunddagis" in enabled_services
        const hunddagisOrgs =
          orgsData?.filter((org) =>
            org.enabled_services?.includes("hunddagis")
          ) || [];

        setOrganisations(hunddagisOrgs);
        setFilteredOrgs(hunddagisOrgs);

        // Fetch user's dogs
        const { data: dogsData, error: dogsError } = await supabase
          .from("dogs")
          .select("id, name, breed")
          .eq("owner_id", user.id);

        if (dogsError) throw dogsError;

        setDogs(dogsData || []);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(
          err.message || "Kunde inte ladda hunddagisar. Försök igen senare."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, supabase, router]);

  // Filter organisations based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredOrgs(organisations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = organisations.filter(
      (org) =>
        org.name?.toLowerCase().includes(query) ||
        org.address?.toLowerCase().includes(query)
    );
    setFilteredOrgs(filtered);
  }, [searchQuery, organisations]);

  const handleApply = async (orgId: string, orgName: string | null) => {
    if (!user || dogs.length === 0) {
      setError(
        "Du måste vara inloggad och ha minst en registrerad hund för att ansöka."
      );
      return;
    }

    try {
      setApplying(orgId);
      setError(null);

      // ⚠️ NOTE: This requires applications table to exist (run migration first)
      // For now, apply with the first dog
      const selectedDog = dogs[0];

      // Create application
      // @ts-ignore - applications table will exist after migrations are run
      const { data: application, error: appError } = await supabase
        .from("applications")
        // @ts-ignore - applications table schema
        .insert({
          org_id: orgId,
          owner_id: user.id,
          dog_id: selectedDog.id,
          status: "pending",
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (appError) {
        // If applications table doesn't exist yet, show helpful message
        if (
          appError.message.includes("relation") ||
          appError.message.includes("does not exist")
        ) {
          throw new Error(
            "Ansökningssystemet är inte aktiverat än. Databas-migrationer behöver köras först. Kontakta administratören."
          );
        }
        throw appError;
      }

      setSuccess(
        `✅ Ansökan skickad till ${orgName || "hunddagis"}! Du kan se din ansökan i din instrumentpanel.`
      );

      setTimeout(() => {
        router.push("/kundportal/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Error applying:", err);
      setError(err.message || "Kunde inte skicka ansökan. Försök igen senare.");
    } finally {
      setApplying(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-[#2c7a4c] animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Laddar hunddagisar...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Du måste vara inloggad
            </h1>
            <Link href="/kundportal/login">
              <Button className="bg-[#2c7a4c] text-white hover:bg-green-700">
                Gå till inloggning
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/kundportal/dashboard">
            <Button variant="ghost" className="mb-4">
              ← Tillbaka till instrumentpanelen
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sök hunddagisar
          </h1>
          <p className="text-gray-600">
            Bläddra bland tillgängliga hunddagisar och ansök om en plats för din
            hund
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Search Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Sök hunddagis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Sök efter namn eller adress..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {filteredOrgs.length} hunddagis
                {filteredOrgs.length !== 1 ? "ar" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredOrgs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 text-lg">
                Inga hunddagisar hittades.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Försök söka igen eller kontakta support.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org) => (
              <Card
                key={org.id}
                className="hover:shadow-lg transition-shadow overflow-hidden"
              >
                <CardHeader className="bg-gradient-to-r from-[#2c7a4c] to-green-600 text-white pb-4">
                  <CardTitle className="text-xl mb-2">
                    {org.name || "Hunddagis"}
                  </CardTitle>
                  {org.address && (
                    <p className="text-sm text-green-100">{org.address}</p>
                  )}
                </CardHeader>

                <CardContent className="pt-6 pb-4">
                  {/* Contact */}
                  <div className="grid grid-cols-1 gap-3 mb-6 py-4 border-t border-b border-gray-200">
                    {org.phone && (
                      <a
                        href={`tel:${org.phone}`}
                        className="flex items-center gap-2 text-sm text-[#2c7a4c] hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{org.phone}</span>
                      </a>
                    )}
                    {org.email && (
                      <a
                        href={`mailto:${org.email}`}
                        className="flex items-center gap-2 text-sm text-[#2c7a4c] hover:underline"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{org.email}</span>
                      </a>
                    )}
                  </div>

                  {/* Apply Button */}
                  <Button
                    onClick={() => handleApply(org.id, org.name)}
                    disabled={applying === org.id || dogs.length === 0}
                    className="w-full bg-[#2c7a4c] text-white hover:bg-green-700 disabled:bg-gray-300"
                  >
                    {applying === org.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Ansöker...
                      </>
                    ) : (
                      <>
                        <Heart className="h-4 w-4 mr-2" />
                        Ansök om plats
                      </>
                    )}
                  </Button>

                  {dogs.length === 0 && (
                    <p className="text-xs text-red-600 text-center mt-2">
                      Du måste registrera en hund först
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer note */}
        {filteredOrgs.length > 0 && (
          <div className="mt-8 text-center text-gray-600 text-sm">
            <p>
              ⚠️ Ansökningssystemet kräver att databas-migrationer körs först.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
