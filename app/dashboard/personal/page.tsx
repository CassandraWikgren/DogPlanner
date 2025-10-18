"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // se till att du har en supabase client i lib/
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PersonalPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  // Hämta alla personal i adminens organisation
  async function loadStaff() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Hämta personal baserat på adminens org_id
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, org_id, email")
      .eq("org_id", await getOrgId(user.id))
      .order("full_name", { ascending: true });

    if (error) console.error(error);
    setStaff(profiles || []);
    setLoading(false);
  }

  // Hämta adminens org_id
  async function getOrgId(userId: string): Promise<string> {
    const { data, error } = await (supabase.from("profiles") as any)
      .select("org_id")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data.org_id;
  }

  // Lägg till personal (via RPC)
  async function addStaff() {
    try {
      setAdding(true);
      const { error } = await (supabase.rpc as any)("add_staff_member", {
        staff_email: email,
        staff_name: name,
      });
      if (error) throw error;
      setEmail("");
      setName("");
      await loadStaff();
      alert("Ny personal har lagts till!");
    } catch (error) {
      console.error(error);
      alert("Kunde inte lägga till personal.");
    } finally {
      setAdding(false);
    }
  }

  // Ta bort personal (via RPC)
  async function removeStaff(staffId: string) {
    if (!confirm("Är du säker på att du vill ta bort den här personen?"))
      return;

    const { error } = await (supabase.rpc as any)("remove_staff_member", {
      staff_id: staffId,
    });

    if (error) {
      console.error(error);
      alert("Kunde inte ta bort personalen.");
    } else {
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      alert("Personalen har tagits bort.");
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">👥 Personal</h1>

      {/* Lägg till personal */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <h2 className="font-semibold mb-2">Lägg till ny personal</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Namn"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={addStaff}
            disabled={adding || !email || !name}
            className="bg-[#2c7a4c] hover:bg-[#25643e]"
          >
            {adding ? "Lägger till..." : "Lägg till"}
          </Button>
        </div>
      </div>

      {/* Lista personal */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="font-semibold mb-3">Nuvarande personal</h2>

        {loading ? (
          <p>Laddar...</p>
        ) : staff.length === 0 ? (
          <p>Ingen personal registrerad ännu.</p>
        ) : (
          <ul className="divide-y">
            {staff.map((person) => (
              <li
                key={person.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="font-medium">{person.full_name}</p>
                  <p className="text-sm text-gray-500">{person.role}</p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => removeStaff(person.id)}
                >
                  Ta bort
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
