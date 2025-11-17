"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function ProfileCheckPage() {
  const { user, profile, currentOrgId, role } = useAuth();
  const supabase = createClientComponentClient();
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [dbOrg, setDbOrg] = useState<any>(null);
  const [healing, setHealing] = useState(false);
  const [healResult, setHealResult] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      checkDatabase();
    }
  }, [user]);

  async function checkDatabase() {
    try {
      setDbError(null); // Reset error

      // Hämta profil direkt från databas
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        setDbError(
          `Profile error: ${profileError.message} (Code: ${profileError.code})`
        );
      } else {
        setDbProfile(profileData);

        // Om profil har org_id, hämta org-info
        if (profileData?.org_id) {
          const { data: orgData, error: orgError } = await supabase
            .from("orgs")
            .select("*")
            .eq("id", profileData.org_id)
            .single();

          if (orgError) {
            setDbError(`Org error: ${orgError.message}`);
          } else {
            setDbOrg(orgData);
          }
        }
      }
    } catch (err: any) {
      console.error("Error checking database:", err);
      setDbError(`Exception: ${err.message || err}`);
    }
  }

  async function healUser() {
    setHealing(true);
    try {
      const { data, error } = await supabase.rpc("heal_user_missing_org", {
        user_id: user?.id,
      });

      if (error) {
        setHealResult({ success: false, error: error.message });
      } else {
        setHealResult(data);
        // Ladda om profil
        await checkDatabase();
      }
    } catch (err: any) {
      setHealResult({ success: false, error: err.message });
    } finally {
      setHealing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            🔍 Profil-diagnostik
          </h1>

          {/* Auth Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h2 className="font-bold text-lg mb-2">
              Auth Status (från AuthContext)
            </h2>
            <div className="space-y-1 text-sm">
              <p>
                <strong>User ID:</strong> {user?.id || "❌ Ingen användare"}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || "N/A"}
              </p>
              <p>
                <strong>Current Org ID:</strong>{" "}
                {currentOrgId || "❌ INGEN ORGANISATION"}
              </p>
              <p>
                <strong>Role:</strong> {role || "N/A"}
              </p>
              <p>
                <strong>Profile loaded:</strong> {profile ? "✅ Ja" : "❌ Nej"}
              </p>
            </div>
          </div>

          {/* Database Profile */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="font-bold text-lg mb-2">
              Databas-profil (direkt från Supabase)
            </h2>

            {dbError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                <strong>❌ Databasfel:</strong> {dbError}
              </div>
            )}

            {dbProfile ? (
              <div className="space-y-1 text-sm">
                <p>
                  <strong>ID:</strong> {dbProfile.id}
                </p>
                <p>
                  <strong>Email:</strong> {dbProfile.email || "N/A"}
                </p>
                <p>
                  <strong>Org ID:</strong>{" "}
                  {dbProfile.org_id || "❌ NULL (DETTA ÄR PROBLEMET!)"}
                </p>
                <p>
                  <strong>Role:</strong> {dbProfile.role || "N/A"}
                </p>
                <p>
                  <strong>Full Name:</strong> {dbProfile.full_name || "N/A"}
                </p>
              </div>
            ) : (
              <p className="text-red-600">
                ❌ Ingen profil hittades i databasen
              </p>
            )}
          </div>

          {/* Organisation Info */}
          {dbOrg && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded">
              <h2 className="font-bold text-lg mb-2">Organisation</h2>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>ID:</strong> {dbOrg.id}
                </p>
                <p>
                  <strong>Namn:</strong> {dbOrg.name}
                </p>
                <p>
                  <strong>Org-nummer:</strong> {dbOrg.org_number || "N/A"}
                </p>
                <p>
                  <strong>Modules:</strong>{" "}
                  {dbOrg.modules_enabled?.join(", ") || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* User Metadata */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <h2 className="font-bold text-lg mb-2">User Metadata</h2>
            <pre className="text-xs bg-white p-2 rounded overflow-auto">
              {JSON.stringify(user?.user_metadata, null, 2)}
            </pre>
          </div>

          {/* Healing */}
          {dbProfile && !dbProfile.org_id && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
              <h2 className="font-bold text-lg mb-2 text-red-800">
                🚨 PROBLEM: Ingen organisation tilldelad
              </h2>
              <p className="text-sm mb-4">
                Din profil har ingen org_id. Detta kan fixas automatiskt med
                healing-funktionen.
              </p>
              <button
                onClick={healUser}
                disabled={healing}
                className="bg-red-600 text-white px-6 py-2 rounded font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {healing ? "Fixar..." : "🔧 Fixa automatiskt (Heal User)"}
              </button>

              {healResult && (
                <div className="mt-4 p-3 bg-white rounded">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(healResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700"
            >
              Tillbaka till Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-6 py-2 rounded font-semibold hover:bg-gray-700"
            >
              🔄 Ladda om sidan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
