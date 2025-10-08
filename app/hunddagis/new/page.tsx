"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase"; // viktig import

type Owner = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
};

export default function NewDogPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [breed, setBreed] = React.useState("");
  const [birth, setBirth] = React.useState<string>("");
  const [heightcm, setHeightcm] = React.useState<string>("");
  const [subscription, setSubscription] = React.useState("");
  const [days, setDays] = React.useState<string[]>([]);
  const [owner, setOwner] = React.useState<Owner>({});
  const [notes, setNotes] = React.useState("");

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const dayOptions = ["Mån", "Tis", "Ons", "Tors", "Fre"];

  function toggleDay(d: string) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function validate(): string | null {
    if (!name.trim()) return "Namn är obligatoriskt.";
    if (owner.email && !/^\S+@\S+\.\S+$/.test(owner.email))
      return "Ogiltig e-postadress.";
    if (heightcm && isNaN(Number(heightcm)))
      return "Höjd måste vara ett heltal (cm).";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    const v = validate();
    if (v) return setErrorMsg(v);

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        breed: breed.trim() || null,
        birth: birth || null,
        heightcm: heightcm ? Number(heightcm) : null,
        subscription: subscription || null,
        days: days.join(","),
        owner: {
          firstName: owner.firstName?.trim() || "",
          lastName: owner.lastName?.trim() || "",
          phone: owner.phone?.trim() || "",
          email: owner.email?.trim() || "",
        },
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from("dogs")
        .insert([payload])
        .select("id, name")
        .single();

      if (error) throw error;
      setSuccessMsg(`Hund "${data.name}" skapad!`);
      setTimeout(() => router.push("/hunddagis"), 700);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Ett oväntat fel inträffade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Lägg till hund</h1>
          <p className="text-sm text-gray-500">
            Fyll i så mycket du vill nu – du kan alltid komplettera senare.
          </p>
        </div>
        <Link
          href="/hunddagis"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Tillbaka
        </Link>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          {successMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Ägare */}
        <section className="rounded-2xl border bg-white/70 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Ägare</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              placeholder="Förnamn"
              className="w-full rounded-lg border px-3 py-2"
              value={owner.firstName || ""}
              onChange={(e) =>
                setOwner((o) => ({ ...o, firstName: e.target.value }))
              }
            />
            <input
              placeholder="Efternamn"
              className="w-full rounded-lg border px-3 py-2"
              value={owner.lastName || ""}
              onChange={(e) =>
                setOwner((o) => ({ ...o, lastName: e.target.value }))
              }
            />
            <input
              placeholder="Telefon"
              className="w-full rounded-lg border px-3 py-2"
              value={owner.phone || ""}
              onChange={(e) =>
                setOwner((o) => ({ ...o, phone: e.target.value }))
              }
            />
            <input
              placeholder="E-post"
              type="email"
              className="w-full rounded-lg border px-3 py-2"
              value={owner.email || ""}
              onChange={(e) =>
                setOwner((o) => ({ ...o, email: e.target.value }))
              }
            />
          </div>
        </section>

        {/* Hund */}
        <section className="rounded-2xl border bg-white/70 p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Hund</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              required
              placeholder="Namn*"
              className="w-full rounded-lg border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              placeholder="Ras"
              className="w-full rounded-lg border px-3 py-2"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
            />
            <input
              type="date"
              className="w-full rounded-lg border px-3 py-2"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
            />
            <input
              placeholder="Höjd (cm)"
              className="w-full rounded-lg border px-3 py-2"
              value={heightcm}
              onChange={(e) => setHeightcm(e.target.value)}
            />
            <select
              className="w-full rounded-lg border px-3 py-2 bg-white"
              value={subscription}
              onChange={(e) => setSubscription(e.target.value)}
            >
              <option value="">Välj abonnemang…</option>
              <option value="heltid">Heltid</option>
              <option value="deltid">Deltid</option>
              <option value="flex">Flex</option>
            </select>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Veckodagar
              </label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`rounded-full border px-3 py-1 text-sm transition ${
                      days.includes(d)
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Anteckningar"
              className="min-h-[100px] w-full rounded-lg border px-3 py-2 md:col-span-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link
            href="/hunddagis"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Sparar..." : "Spara hund"}
          </button>
        </div>
      </form>
    </div>
  );
}
