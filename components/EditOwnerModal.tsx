"use client";

import { useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface OwnerForm {
  id?: string;
  customer_number?: number | null;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  contact_person_2?: string | null;
  contact_phone_2?: string | null;
}

export default function EditOwnerModal({ owner, open, onClose, refresh }: any) {
  const supabase = useSupabaseClient();
  const [form, setForm] = useState<OwnerForm>(owner || {});

  useEffect(() => {
    setForm(owner || {});
  }, [owner]);

  async function handleSave() {
    try {
      if (!owner?.customer_number && !owner?.id) {
        // Ny ägare (customer_number sätts av trigger)
        const { error } = await supabase.from("owners").insert({
          full_name: form.full_name ?? null,
          phone: form.phone ?? null,
          email: form.email ?? null,
          contact_person_2: form.contact_person_2 ?? null,
          contact_phone_2: form.contact_phone_2 ?? null,
        });
        if (error) throw error;
      } else if (owner?.id) {
        // Uppdatera via id om vi har den
        const { error } = await supabase
          .from("owners")
          .update({
            full_name: form.full_name ?? null,
            phone: form.phone ?? null,
            email: form.email ?? null,
            contact_person_2: form.contact_person_2 ?? null,
            contact_phone_2: form.contact_phone_2 ?? null,
          })
          .eq("id", owner.id);
        if (error) throw error;
      } else {
        // Uppdatera via customer_number
        const { error } = await supabase
          .from("owners")
          .update({
            full_name: form.full_name ?? null,
            phone: form.phone ?? null,
            email: form.email ?? null,
            contact_person_2: form.contact_person_2 ?? null,
            contact_phone_2: form.contact_phone_2 ?? null,
          })
          .eq("customer_number", owner.customer_number);
        if (error) throw error;
      }

      alert("✅ Uppgifter sparade!");
      onClose?.();
      refresh?.();
    } catch (err: any) {
      console.error("Fel vid uppdatering:", err);
      alert(`Ett fel uppstod vid uppdatering: ${err?.message || err}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Redigera ägare</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Namn</Label>
            <Input
              value={form.full_name || ""}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input
              value={form.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <Label>E-post</Label>
            <Input
              type="email"
              value={form.email || ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Kontaktperson 2</Label>
            <Input
              value={form.contact_person_2 || ""}
              onChange={(e) =>
                setForm({ ...form, contact_person_2: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Telefon (Kontakt 2)</Label>
            <Input
              value={form.contact_phone_2 || ""}
              onChange={(e) =>
                setForm({ ...form, contact_phone_2: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Kundnummer</Label>
            <Input
              value={String(
                form.customer_number ?? owner?.customer_number ?? ""
              )}
              disabled
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-700 hover:bg-green-800 text-white"
          >
            Spara
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
