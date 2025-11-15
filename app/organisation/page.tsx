"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
      <div className="p-10 text-center text-gray-500">
        Hämtar organisation...
      </div>
    );

  return (
    <PageContainer maxWidth="4xl">
      <div className="bg-white shadow rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-green-700 mb-6">
          Företagsinställningar
        </h1>

        {org ? (
          <>
            <div className="mb-6">
              <p>
                <strong>Företagsnamn:</strong> {org.name}
              </p>
              <p>
                <strong>Plan:</strong>{" "}
                {org.subscription_plan === "pro"
                  ? "Pro (fullversion)"
                  : "Basic"}
              </p>
              <p>
                <strong>Skapad:</strong>{" "}
                {new Date(org.created_at).toLocaleDateString("sv-SE")}
              </p>
            </div>

            {role === "admin" && (
              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold mb-3">Byt företagsnamn</h2>
                <div className="flex flex-wrap gap-3 items-center">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="border px-3 py-2 rounded-lg flex-1"
                  />
                  <button
                    onClick={handleRename}
                    className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Spara
                  </button>
                </div>
                {message && (
                  <p className="text-sm mt-2 text-green-700">{message}</p>
                )}
              </div>
            )}

            <div className="border-t border-gray-200 mt-8 pt-6">
              <h2 className="text-xl font-semibold mb-4">
                👥 Användare i företaget
              </h2>
              {members.length > 0 ? (
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-green-700 text-white">
                    <tr>
                      <th className="py-2 px-4 text-left">Namn</th>
                      <th className="py-2 px-4 text-left">Roll</th>
                      <th className="py-2 px-4 text-left">Skapad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.full_name} className="even:bg-green-50">
                        <td className="py-2 px-4">{m.full_name || "–"}</td>
                        <td className="py-2 px-4 capitalize">{m.role}</td>
                        <td className="py-2 px-4">
                          {new Date(m.created_at).toLocaleDateString("sv-SE")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-500">Inga användare hittades.</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-red-600">Kunde inte hämta företagsinformation.</p>
        )}
      </div>
    </PageContainer>
  );
}
