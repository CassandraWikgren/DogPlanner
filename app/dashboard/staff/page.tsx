"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import PageContainer from "@/components/PageContainer";

import Link from "next/link";

type Member = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: "admin" | "staff" | string;
  created_at: string;
};

export default function StaffAdminPage() {
  const { user } = useAuth(); // du använder redan detta globalt:contentReference[oaicite:3]{index=3}
  const [orgId, setOrgId] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"staff" | "admin">("staff");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string>("");

  // Hämta adminens org + roll + medlemmar
  useEffect(() => {
    if (!user || !supabase) return;
    (async () => {
      setLoading(true);
      // 1) Hämta org och roll för den inloggade (du gör samma mönster här)
      const { data: me } = (await supabase
        .from("profiles")
        .select("org_id, role")
        .eq("id", user.id)
        .single()) as { data: { org_id: string; role: string } | null };

      setOrgId(me?.org_id || "");
      setRole(me?.role || "");

      if (me?.org_id && supabase) {
        const { data: list } = await supabase
          .from("profiles")
          .select("id, full_name, role, created_at, email")
          .eq("org_id", me.org_id)
          .order("created_at", { ascending: true });
        setMembers((list || []) as Member[]);
      }

      setLoading(false);
    })();
  }, [user]);

  const canManage = useMemo(() => role === "admin", [role]);

  async function inviteMember() {
    setError("");
    if (!canManage) {
      setError("Endast administratörer kan bjuda in personal.");
      return;
    }
    if (!newEmail.trim()) {
      setError("Fyll i e-post.");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch("/api/staff/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail.trim(),
          full_name: newName.trim() || null,
          role: newRole,
          org_id: orgId,
        }),
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json?.error || "Kunde inte bjuda in användaren.");

      // Uppdatera listan
      if (supabase) {
        const { data: list } = await supabase
          .from("profiles")
          .select("id, full_name, role, created_at, email")
          .eq("org_id", orgId)
          .order("created_at", { ascending: true });
        setMembers((list || []) as Member[]);
      }

      setNewEmail("");
      setNewName("");
      setNewRole("staff");
      alert("Inbjudan skickad! Användaren får ett mail för att slutföra.");
    } catch (e: any) {
      setError(e?.message || "Ett fel uppstod.");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(member: Member) {
    if (!canManage) return;
    if (member.id === user?.id) {
      return alert("Du kan inte ta bort dig själv.");
    }
    if (!confirm(`Ta bort ${member.full_name || member.email || "användare"}?`))
      return;

    const res = await fetch("/api/staff/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: member.id }),
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json?.error || "Kunde inte ta bort användaren.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  }

  return (
    <PageContainer maxWidth="5xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2c7a4c]">
          👥 Personal (admin)
        </h1>
        <Link
          href="/dashboard"
          className="text-sm text-[#2c7a4c] hover:underline"
        >
          ← Till dashboard
        </Link>
      </div>

      {!canManage && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Endast administratörer ser och kan använda denna sida. Din roll:{" "}
          <b>{role || "okänd"}</b>.
        </div>
      )}

      {/* Lägg till personal */}
      <section className="bg-white rounded-2xl shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-3">Bjud in ny personal</h2>
        <div className="grid gap-3 md:grid-cols-[2fr_2fr_1fr_auto]">
          <input
            placeholder="Fullständigt namn (valfritt)"
            className="border rounded px-3 py-2"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={!canManage}
          />
          <input
            type="email"
            placeholder="E-post"
            className="border rounded px-3 py-2"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={!canManage}
          />
          <select
            className="border rounded px-3 py-2 bg-white"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "staff" | "admin")}
            disabled={!canManage}
          >
            <option value="staff">Personal</option>
            <option value="admin">Administratör</option>
          </select>
          <button
            onClick={inviteMember}
            disabled={!canManage || inviting}
            className="bg-[#2c7a4c] hover:bg-green-800 text-white rounded px-4 py-2 font-semibold"
          >
            {inviting ? "Skickar…" : "Bjud in"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <p className="text-xs text-gray-500 mt-2">
          Användaren får ett e-postmeddelande för att slutföra sitt konto.
        </p>
      </section>

      {/* Lista personal */}
      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Medlemmar i företaget</h2>
        {loading ? (
          <p className="text-gray-500">Hämtar…</p>
        ) : members.length === 0 ? (
          <p className="text-gray-500">Inga medlemmar ännu.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="py-2 px-3 text-left">Namn</th>
                  <th className="py-2 px-3 text-left">E-post</th>
                  <th className="py-2 px-3 text-left">Roll</th>
                  <th className="py-2 px-3 text-left">Skapad</th>
                  <th className="py-2 px-3 text-left">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="even:bg-green-50">
                    <td className="py-2 px-3">{m.full_name || "–"}</td>
                    <td className="py-2 px-3">{m.email || "–"}</td>
                    <td className="py-2 px-3 capitalize">{m.role}</td>
                    <td className="py-2 px-3">
                      {new Date(m.created_at).toLocaleDateString("sv-SE")}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => removeMember(m)}
                        disabled={
                          !canManage || m.id === user?.id || m.role === "admin"
                        }
                        className={`px-3 py-1.5 rounded text-sm font-semibold border ${
                          !canManage || m.id === user?.id || m.role === "admin"
                            ? "bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed"
                            : "text-red-600 border-gray-300 hover:bg-red-50 hover:border-red-500"
                        }`}
                      >
                        Ta bort
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
