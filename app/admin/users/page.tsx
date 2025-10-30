"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  AlertCircle,
  CheckCircle,
  Users,
  Key,
} from "lucide-react";
import Link from "next/link";

interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "staff" | "groomer" | "customer";
  full_name?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
}

const ROLE_LABELS = {
  admin: "Administratör",
  staff: "Personal",
  groomer: "Frisör",
  customer: "Hundägare",
};

const ROLE_COLORS = {
  admin: "bg-red-100 text-red-800",
  staff: "bg-blue-100 text-blue-800",
  groomer: "bg-purple-100 text-purple-800",
  customer: "bg-gray-100 text-gray-800",
};

export default function UsersPage() {
  const supabase = createClientComponentClient();
  const { user: currentUser, currentOrgId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"staff" | "groomer" | "admin">(
    "staff"
  );
  const [inviteName, setInviteName] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (currentOrgId) {
      loadUsers();
    }
  }, [currentOrgId]);

  const loadUsers = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      // Hämta alla profiles för denna organisation
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, role, full_name, phone, created_at, last_sign_in_at"
        )
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
    } catch (err: any) {
      console.error("Error loading users:", err);
      setError(err.message || "Kunde inte ladda användare");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !currentOrgId) {
      setError("Fyll i e-postadress");
      return;
    }

    try {
      setInviting(true);
      setError(null);
      setSuccess(null);

      // Anropa Supabase Admin API för att skapa användare
      // OBS: Detta kräver en server-side endpoint i produktion
      // För nu skapar vi bara en profil och förväntar oss att användaren registrerar sig själv

      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", inviteEmail)
        .eq("org_id", currentOrgId)
        .maybeSingle();

      if (existingUser) {
        setError("En användare med denna e-post finns redan");
        return;
      }

      // Skicka inbjudan via e-post (kräver backend implementation)
      // För nu visar vi bara ett meddelande
      setSuccess(
        `📧 Inbjudan skulle skickas till ${inviteEmail} (${ROLE_LABELS[inviteRole]}). ` +
          `I produktion implementeras detta via en API-route som använder Supabase Admin API.`
      );

      // Reset form
      setInviteEmail("");
      setInviteName("");
      setInviteRole("staff");
      setShowInviteForm(false);

      // I en riktig implementation skulle vi:
      // 1. Anropa /api/admin/invite-user med email, role, org_id
      // 2. API-routen använder Supabase Admin SDK för att skapa användare
      // 3. Skicka inbjudningsmail med temporärt lösenord eller magic link
    } catch (err: any) {
      console.error("Error inviting user:", err);
      setError(err.message || "Kunde inte skicka inbjudan");
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna användare?")) {
      return;
    }

    try {
      // I produktion skulle detta kräva en API-route med admin-behörighet
      setError("Borttagning av användare kräver implementation av admin API");

      // const { error } = await supabase.auth.admin.deleteUser(userId)
      // if (error) throw error
      // await loadUsers()
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.message || "Kunde inte ta bort användare");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setSuccess("✅ Roll uppdaterad!");
      setTimeout(() => setSuccess(null), 3000);
      await loadUsers();
    } catch (err: any) {
      console.error("Error changing role:", err);
      setError(err.message || "Kunde inte ändra roll");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar användare...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#2c7a4c] hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🔐</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Användarhantering
                </h1>
                <p className="text-gray-600 mt-1">
                  Hantera personal och behörigheter
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="bg-[#2c7a4c] hover:bg-[#236139]"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Bjud in användare
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <Card className="mb-6 border-[#2c7a4c]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#2c7a4c]" />
                Bjud in ny användare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="email">E-postadress</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="namn@exempel.se"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Namn (valfritt)</Label>
                  <Input
                    id="name"
                    placeholder="För- och efternamn"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Roll</Label>
                  <select
                    id="role"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(
                        e.target.value as "staff" | "groomer" | "admin"
                      )
                    }
                  >
                    <option value="staff">Personal</option>
                    <option value="groomer">Frisör</option>
                    <option value="admin">Administratör</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={handleInviteUser}
                  disabled={inviting}
                  className="bg-[#2c7a4c] hover:bg-[#236139]"
                >
                  {inviting ? "Skickar..." : "Skicka inbjudan"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteForm(false)}
                >
                  Avbryt
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ⚠️ <strong>OBS:</strong> Inbjudningsfunktionen kräver en
                server-side API-route för att fungera i produktion. Detta är en
                placeholder-implementation.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2c7a4c]" />
              Användare ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Inga användare hittades
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-[#2c7a4c] text-white flex items-center justify-center font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {user.full_name || user.email}
                          </span>
                          <Badge className={ROLE_COLORS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-xs">
                              Det är du
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500">
                            {user.phone}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Skapad:{" "}
                          {new Date(user.created_at).toLocaleDateString(
                            "sv-SE"
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.id !== currentUser?.id && (
                        <>
                          <select
                            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                            value={user.role}
                            onChange={(e) =>
                              handleChangeRole(user.id, e.target.value)
                            }
                          >
                            <option value="staff">Personal</option>
                            <option value="groomer">Frisör</option>
                            <option value="admin">Admin</option>
                            <option value="customer">Kund</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Om roller och behörigheter
                </h3>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li>
                    • <strong>Administratör:</strong> Full åtkomst till alla
                    funktioner
                  </li>
                  <li>
                    • <strong>Personal:</strong> Kan hantera hundar, dagis och
                    pensionat
                  </li>
                  <li>
                    • <strong>Frisör:</strong> Kan hantera frisörbokningar och
                    journal
                  </li>
                  <li>
                    • <strong>Hundägare:</strong> Kan endast se sina egna hundar
                    via kundportalen
                  </li>
                </ul>
                <p className="text-xs text-blue-700 mt-3">
                  ⚠️ <strong>Viktigt:</strong> Inbjudningsfunktionen kräver
                  implementation av en server-side API-route med Supabase Admin
                  SDK för att fungera fullt ut i produktion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
