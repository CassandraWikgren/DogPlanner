"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import PageContainer from "@/components/PageContainer";

interface Profile {
  org_id: string;
  role: string;
  full_name?: string;
  created_at: string;
}

interface Organisation {
  id: string;
  name: string;
  subscription_plan?: string;
  created_at: string;
}

export default function OrganisationSettingsPage() {
  const supabase = createClient();
  const { user, role } = useAuth();
  const [org, setOrg] = useState<Organisation | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) fetchOrganisation();
  }, [user]);

  async function fetchOrganisation() {
    if (!supabase) return;

    setLoading(true);

    try {
      // Hämta användarens profil för att veta vilket företag de tillhör
      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id, role")
        .eq("id", user.id)
        .single();

      const typedProfile = profile as { org_id: string; role: string } | null;

      if (!typedProfile || !typedProfile.org_id) {
        setMessage("Kunde inte hitta användarprofil eller organisation");
        setLoading(false);
        return;
      }

      // Hämta företagets info
      const { data: orgData } = await supabase
        .from("orgs")
        .select("*")
        .eq("id", typedProfile.org_id)
        .single();

      // Hämta alla medlemmar i organisationen
      const { data: membersData } = await supabase
        .from("profiles")
        .select("full_name, role, created_at")
        .eq("org_id", typedProfile.org_id);

      setOrg(orgData as Organisation | null);
      setMembers((membersData as Profile[]) || []);
      setNewName((orgData as any)?.name || "");
    } catch (error) {
      console.error("Error fetching organisation:", error);
      setMessage("Ett fel uppstod vid hämtning av organisationsdata");
    } finally {
      setLoading(false);
    }
  }

  async function handleRename() {
    if (!newName.trim() || !org) return;
    const { error } = await (supabase as any)
      .from("orgs")
      .update({ name: newName })
      .eq("id", org.id);
    if (error) {
      setMessage("Fel: " + error.message);
    } else {
      setMessage("✅ Företagsnamnet har uppdaterats!");
      fetchOrganisation();
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Hämtar organisation...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-[#2C7A4C] transition-colors"
            >
              ← Tillbaka
            </a>
            <h1 className="text-4xl font-bold text-[#2C7A4C] leading-tight">
              Företagsinställningar
            </h1>
          </div>
        </div>
      </div>

      {/* Main content - narrow form layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          {org ? (
            <div className="space-y-6">
              {/* Företagsinformation */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Företagsinformation
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">
                      Företagsnamn:
                    </span>
                    <span className="text-gray-900">{org.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">Plan:</span>
                    <span className="text-gray-900">
                      {org.subscription_plan === "pro"
                        ? "Pro (fullversion)"
                        : "Basic"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold text-gray-700">Skapad:</span>
                    <span className="text-gray-900">
                      {new Date(org.created_at).toLocaleDateString("sv-SE")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Byt företagsnamn (endast admin) */}
              {role === "admin" && (
                <div className="border-t pt-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Byt företagsnamn
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-[#2C7A4C] mb-2">
                        Nytt företagsnamn
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C7A4C] focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleRename}
                      className="w-full px-6 py-2.5 h-10 bg-[#2C7A4C] text-white rounded-md hover:bg-[#236139] transition-colors font-semibold"
                    >
                      Spara ändringar
                    </button>
                    {message && (
                      <p className="text-sm text-green-600 font-medium">
                        {message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Användare i företaget */}
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  👥 Användare i företaget
                </h2>
                {members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#2C7A4C] text-white">
                        <tr>
                          <th className="py-2 px-4 text-left">Namn</th>
                          <th className="py-2 px-4 text-left">Roll</th>
                          <th className="py-2 px-4 text-left">Skapad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map((m, idx) => (
                          <tr
                            key={m.full_name || idx}
                            className={
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="py-2 px-4 border-b">
                              {m.full_name || "–"}
                            </td>
                            <td className="py-2 px-4 border-b capitalize">
                              {m.role}
                            </td>
                            <td className="py-2 px-4 border-b">
                              {new Date(m.created_at).toLocaleDateString(
                                "sv-SE"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Inga användare hittades.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-red-600">
              Kunde inte hämta företagsinformation.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
