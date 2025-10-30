"use client";

import * as React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/** Props */
type Props = {
  initialDog?: any; // Flexibel type för att hantera olika hundstrukturer från olika sidor
  open: boolean;
  onCloseAction: () => void;
  onSavedAction: () => Promise<void> | void;
};

/** Typer */
type Room = { id: string; name: string | null };
type OwnerRow = {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  postal_code?: string | null;
  city?: string | null;
  contact_person_2?: string | null;
  contact_phone_2?: string | null;
  customer_number?: number | null;
  personnummer?: string | null;
};

/** Liten sektionstitel */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#2c7a4c] mb-3">
      {children}
    </h3>
  );
}

/** Flik-knapp */
function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
        active
          ? "bg-[#2c7a4c] text-white border-[#2c7a4c]"
          : "bg-white text-[#2c7a4c] border-[#2c7a4c] hover:bg-[#e6f4ea]"
      }`}
    >
      {children}
    </button>
  );
}

export default function EditDogModal({
  initialDog = null,
  open,
  onCloseAction,
  onSavedAction,
}: Props) {
  const supabase = createClientComponentClient(); // Korrekt klient för client components

  // UI
  const [activeTab, setActiveTab] = React.useState<
    "ägare" | "hund" | "hälsa" | "kommentarer" | "abonnemang" | "tillägg"
  >("ägare");
  const [saving, setSaving] = React.useState(false);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);

  // === INIT ===
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // Hämta rum
        const { data: roomsData, error: roomsErr } = await supabase
          .from("rooms")
          .select("id, name")
          .order("name");
        if (roomsErr) console.warn("⚠️ rooms error", roomsErr);
        setRooms(roomsData ?? []);

        // Hämta roll (admin-låsningar)
        const { data: me } = await supabase.auth.getUser();
        const userId = me.user?.id;
        if (userId) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
          setIsAdmin(prof?.role === "admin");
        }
      } catch (e) {
        console.error("Init modal error:", e);
      }
    })();
  }, [open, supabase]);

  /* ===========================
   *   FORM STATE
   * =========================== */

  // --- ÄGARE ---
  const [ownerFirst, setOwnerFirst] = React.useState("");
  const [ownerLast, setOwnerLast] = React.useState("");
  const [ownerPersonnummer, setOwnerPersonnummer] = React.useState(""); // admin-only → owners.personnummer
  const [ownerCustomerNo, setOwnerCustomerNo] = React.useState<string>(""); // admin-only input → går till owners.customer_number
  const [ownerEmail, setOwnerEmail] = React.useState("");
  const [ownerPhone, setOwnerPhone] = React.useState("");
  const [ownerAddress, setOwnerAddress] = React.useState(""); // → dogs.events.owner_address
  const [ownerZip, setOwnerZip] = React.useState("");
  const [ownerCity, setOwnerCity] = React.useState("");

  // Kontaktperson 2
  const [kp2First, setKp2First] = React.useState("");
  const [kp2Last, setKp2Last] = React.useState("");
  const [kp2Phone, setKp2Phone] = React.useState("");

  // --- HUND ---
  const [name, setName] = React.useState("");
  const [breed, setBreed] = React.useState("");
  const [heightcm, setHeightcm] = React.useState<string>("");
  const [birth, setBirth] = React.useState<string>("");
  const [gender, setGender] = React.useState<"Tik" | "Hane" | "">("");
  const [insuranceNo, setInsuranceNo] = React.useState("");
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  // --- HÄLSA ---
  const [insuranceCompany, setInsuranceCompany] = React.useState("");
  const [vaccDhp, setVaccDhp] = React.useState<string>("");
  const [vaccPi, setVaccPi] = React.useState<string>("");
  const [careNotes, setCareNotes] = React.useState("");

  // Övrigt hund (bocklista) → events.flags
  const [flagCast, setFlagCast] = React.useState(false);
  const [flagBiter, setFlagBiter] = React.useState(false);
  const [flagKiss, setFlagKiss] = React.useState(false);
  const [flagSkallig, setFlagSkallig] = React.useState(false);
  const [flagPersonal, setFlagPersonal] = React.useState(false);
  const [flagPensionat, setFlagPensionat] = React.useState(false);

  // --- KOMMENTARER ---
  const [journalText, setJournalText] = React.useState(""); // → dog_journal
  const [ownerComment, setOwnerComment] = React.useState(""); // → events.owner_comment
  const [foodInfo, setFoodInfo] = React.useState(""); // → events.food

  // --- ABONNEMANG ---
  const [subscription, setSubscription] = React.useState("");
  const [subStart, setSubStart] = React.useState<string>("");
  const [subEnd, setSubEnd] = React.useState<string>("");
  const [roomId, setRoomId] = React.useState<string>("");
  const [days, setDays] = React.useState<string[]>([]);
  const dayOptions = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
  const toggleDay = (d: string) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  // --- TILLÄGG & EKONOMI ---
  const [addonName, setAddonName] = React.useState("");
  const [addonQty, setAddonQty] = React.useState("1"); // kan vara tomt → undvik ledande nollor
  const [addonStart, setAddonStart] = React.useState<string>("");
  const [addonEnd, setAddonEnd] = React.useState<string>("");
  const [financeNote, setFinanceNote] = React.useState("");

  /* ===========================
   *   VALIDERING
   * =========================== */
  function validate(): string | null {
    if (!name.trim()) return "Hundens namn är obligatoriskt.";
    if (
      !ownerFirst.trim() &&
      !ownerLast.trim() &&
      !ownerEmail.trim() &&
      !ownerPhone.trim()
    ) {
      return "Minst ett av fälten för ägare behövs (t.ex. namn/telefon).";
    }
    if (ownerEmail && !/^\S+@\S+\.\S+$/.test(ownerEmail))
      return "Ogiltig e-postadress.";
    if (heightcm && isNaN(Number(heightcm)))
      return "Mankhöjd måste vara ett heltal (cm).";
    if (addonQty && isNaN(Number(addonQty)))
      return "Antal i tilläggsabonnemang måste vara en siffra.";
    // Endast tillåt kända abonnemangstyper
    if (
      subscription &&
      !["Heltid", "Deltid 3", "Deltid 2", "Dagshund"].includes(subscription)
    ) {
      return "Ogiltig abonnemangstyp.";
    }
    return null;
  }

  /* ===========================
   *   POPULATE FORM FROM initialDog
   * =========================== */
  React.useEffect(() => {
    if (!open || !initialDog) return;

    // Ägare
    const ownerName = initialDog.owners?.full_name || "";
    const [first = "", last = ""] = ownerName.split(" ");
    setOwnerFirst(first);
    setOwnerLast(last);
    setOwnerEmail(initialDog.owners?.email || "");
    setOwnerPhone(initialDog.owners?.phone || "");
    setOwnerZip(initialDog.owners?.postal_code || "");
    setOwnerCity(initialDog.owners?.city || "");
    setOwnerPersonnummer(initialDog.owners?.personnummer || "");
    setOwnerCustomerNo(initialDog.owners?.customer_number?.toString() || "");

    // Kontaktperson 2
    const kp2Name = initialDog.owners?.contact_person_2 || "";
    const [kp2f = "", kp2l = ""] = kp2Name.split(" ");
    setKp2First(kp2f);
    setKp2Last(kp2l);
    setKp2Phone(initialDog.owners?.contact_phone_2 || "");

    // Hund
    setName(initialDog.name || "");
    setBreed(initialDog.breed || "");
    setHeightcm(initialDog.heightcm?.toString() || "");
    setBirth(initialDog.birthdate || "");
    setGender((initialDog.gender as "Tik" | "Hane" | "") || "");
    setInsuranceNo(initialDog.insurance_number || "");
    setPhotoUrl(initialDog.photo_url || null);

    // Hälsa
    setInsuranceCompany(initialDog.insurance_company || "");
    setVaccDhp(initialDog.vaccination_dhppi || "");
    setVaccPi(initialDog.vaccination_pi || "");
    setCareNotes(initialDog.care_notes || "");

    // Abonnemang
    setSubscription(initialDog.subscription || "");
    setSubStart(initialDog.startdate || "");
    setSubEnd(initialDog.enddate || "");
    setRoomId(initialDog.room_id || "");
    if (initialDog.days) {
      setDays(initialDog.days.split(",").map((d: string) => d.trim()));
    }

    // Ändra till första fliken när man redigerar
    setActiveTab("ägare");
  }, [open, initialDog]);

  /* ===========================
   *   BILDUPPLADDNING
   * =========================== */
  async function handleUploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return alert("Endast bildfiler!");

    try {
      setUploading(true);
      const ext = file.name.split(".").pop();
      const filePath = `new-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("dog_photos")
        .upload(filePath, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage
        .from("dog_photos")
        .getPublicUrl(filePath);
      setPhotoUrl(data.publicUrl);
    } catch (err: any) {
      console.error("❌ Bilduppladdning fel:", err);
      setError(err?.message ?? "Kunde inte ladda upp bild.");
    } finally {
      setUploading(false);
    }
  }

  /* ===========================
   *   SPARA
   * =========================== */
  async function handleSave() {
    setError(null);
    setOk(null);

    // Säkerställ aktiv session (för RLS triggers)
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user?.id) {
      setError("Du är inte inloggad – kunde inte spara.");
      return;
    }

    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);

    try {
      // 1) Upsert ägare (owners)
      const full_name =
        [ownerFirst.trim(), ownerLast.trim()]
          .filter(Boolean)
          .join(" ")
          .trim() || null;

      let ownerId: string | null = null;

      if (ownerEmail) {
        const { data: hit } = await supabase
          .from("owners")
          .select("id")
          .ilike("email", ownerEmail)
          .maybeSingle();
        if (hit?.id) ownerId = hit.id;
      }
      if (!ownerId && full_name && ownerPhone) {
        const { data: hit2 } = await supabase
          .from("owners")
          .select("id")
          .ilike("full_name", full_name)
          .ilike("phone", ownerPhone)
          .maybeSingle();
        if (hit2?.id) ownerId = hit2.id;
      }

      const baseOwner: OwnerRow = {
        full_name,
        email: ownerEmail || null,
        phone: ownerPhone || null,
        postal_code: ownerZip || null,
        city: ownerCity || null,
        contact_person_2:
          [kp2First.trim(), kp2Last.trim()].filter(Boolean).join(" ") || null,
        contact_phone_2: kp2Phone || null,
      };

      if (isAdmin) {
        baseOwner.customer_number = ownerCustomerNo
          ? Number(ownerCustomerNo)
          : null;
        baseOwner.personnummer = ownerPersonnummer || null;
      }

      if (!ownerId) {
        const { data: created } = await supabase
          .from("owners")
          .insert([baseOwner])
          .select("id")
          .single()
          .throwOnError();
        ownerId = created.id;
      } else {
        await supabase
          .from("owners")
          .update(baseOwner)
          .eq("id", ownerId)
          .throwOnError();
      }

      // 2) events-json (fält utan egna kolumner i dogs)
      const events: any = {
        owner_address: ownerAddress || null,
        gender: gender || null,
        care_notes: careNotes || null,
        owner_comment: ownerComment || null,
        food: foodInfo || null,
        flags: {
          kastrerad: flagCast,
          biter_saker: flagBiter,
          kissar_inne: flagKiss,
          hund_skallig: flagSkallig,
          personalhund: flagPersonal,
          pensionatshund: flagPensionat,
        },
      };

      // 3) Insert eller Update hund (dogs) — små bokstäver + rätt relationer
      const dogPayload = {
        name: name.trim(),
        breed: breed.trim() || null,
        heightcm: heightcm ? Number(heightcm) : null,
        birthdate: birth || null,
        subscription: subscription || null,
        startdate: subStart || null,
        enddate: subEnd || null,
        room_id: roomId || null,
        days: days.join(",") || null,
        vaccination_dhppi: vaccDhp || null,
        vaccination_pi: vaccPi || null,
        insurance_company: insuranceCompany || null,
        insurance_number: insuranceNo || null,
        photo_url: photoUrl || null,
        notes: null,
        owner_id: ownerId, // ✅ dogs.owner_id → owners.id
        events, // JSONB
      };

      let dogId: string;

      if (initialDog?.id) {
        // UPDATE befintlig hund
        await supabase
          .from("dogs")
          .update(dogPayload)
          .eq("id", initialDog.id)
          .throwOnError();
        dogId = initialDog.id;
      } else {
        // INSERT ny hund
        const { data: dogRow } = await supabase
          .from("dogs")
          .insert([dogPayload])
          .select("id")
          .single()
          .throwOnError();
        dogId = dogRow.id as string;
      }

      // 4) Journal (dog_journal)
      if (journalText.trim()) {
        await supabase
          .from("dog_journal")
          .insert([{ dog_id: dogId, text: journalText.trim() }])
          .throwOnError();
      }

      // 5) Tilläggsabonnemang (extra_service)
      if (addonName.trim()) {
        const qty =
          addonQty.trim() === "" ? null : Number(addonQty.replace(/^0+/, "")); // ta bort ledande nollor
        await supabase
          .from("extra_service")
          .insert([
            {
              dogs_id: dogId, // ✅ relation mot dogs.id
              service_type: addonName.trim(),
              quantity: qty ?? 1,
              price: null,
              performed_at: addonStart || null,
              notes: addonEnd ? `Gäller t.o.m. ${addonEnd}` : null,
            },
          ])
          .throwOnError();
      }

      // 6) Ekonomi-anteckning → extra_service (typ = finance_note)
      if (financeNote.trim()) {
        await supabase
          .from("extra_service")
          .insert([
            {
              dogs_id: dogId,
              service_type: "finance_note",
              quantity: 1,
              price: null,
              notes: financeNote.trim(),
              performed_at: new Date().toISOString().slice(0, 10),
            },
          ])
          .throwOnError();
      }

      setOk("Hunden är sparad ✅");
      await Promise.resolve(onSavedAction?.()); // Hundlistan laddar om i din sida
      onCloseAction();
    } catch (e: any) {
      console.error("❌ Save error:", {
        message: e?.message,
        code: e?.code,
        details: e?.details,
        hint: e?.hint,
      });
      setError(e?.message ?? "Ett oväntat fel inträffade.");
    } finally {
      setSaving(false);
    }
  }

  /* ===========================
   *   RENSA FORMULÄR NÄR STÄNGS
   * =========================== */
  React.useEffect(() => {
    if (!open) {
      // Rensa alla fält när modalen stängs
      setOwnerFirst("");
      setOwnerLast("");
      setOwnerPersonnummer("");
      setOwnerCustomerNo("");
      setOwnerEmail("");
      setOwnerPhone("");
      setOwnerAddress("");
      setOwnerZip("");
      setOwnerCity("");
      setKp2First("");
      setKp2Last("");
      setKp2Phone("");
      setName("");
      setBreed("");
      setHeightcm("");
      setBirth("");
      setGender("");
      setInsuranceNo("");
      setPhotoUrl(null);
      setInsuranceCompany("");
      setVaccDhp("");
      setVaccPi("");
      setCareNotes("");
      setFlagCast(false);
      setFlagBiter(false);
      setFlagKiss(false);
      setFlagSkallig(false);
      setFlagPersonal(false);
      setFlagPensionat(false);
      setJournalText("");
      setOwnerComment("");
      setFoodInfo("");
      setSubscription("");
      setSubStart("");
      setSubEnd("");
      setRoomId("");
      setDays([]);
      setAddonName("");
      setAddonQty("1");
      setAddonStart("");
      setAddonEnd("");
      setFinanceNote("");
      setError(null);
      setOk(null);
      setActiveTab("ägare");
    }
  }, [open]);

  if (!open) return null;

  /* ===========================
   *   UI (med flikar)
```
   * =========================== */
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 p-2 md:p-6">
      <div className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#2c7a4c] text-white grid place-content-center">
              🐶
            </div>
            <div>
              <div className="text-lg font-semibold">
                {initialDog ? "Redigera hund" : "Lägg till hund"}
              </div>
              <div className="text-xs text-gray-500">
                Fyll i hundens uppgifter, ägarinformation och eventuella
                tillägg. Vaccination: DHP gäller 3 år, PI gäller 1 år.
              </div>
            </div>
          </div>
          <button
            onClick={onCloseAction}
            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Stäng
          </button>
        </div>

        {/* Flikar */}
        <div className="px-5 pt-4 flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "ägare"}
            onClick={() => setActiveTab("ägare")}
          >
            Ägare
          </TabButton>
          <TabButton
            active={activeTab === "hund"}
            onClick={() => setActiveTab("hund")}
          >
            Hundens uppgifter
          </TabButton>
          <TabButton
            active={activeTab === "hälsa"}
            onClick={() => setActiveTab("hälsa")}
          >
            Hälsa
          </TabButton>
          <TabButton
            active={activeTab === "kommentarer"}
            onClick={() => setActiveTab("kommentarer")}
          >
            Kommentarer
          </TabButton>
          <TabButton
            active={activeTab === "abonnemang"}
            onClick={() => setActiveTab("abonnemang")}
          >
            Abonnemang
          </TabButton>
          <TabButton
            active={activeTab === "tillägg"}
            onClick={() => setActiveTab("tillägg")}
          >
            Tillägg/Extra
          </TabButton>
        </div>

        {/* Feedback */}
        {(error || ok) && (
          <div className="px-5 pt-3">
            {error && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                {error}
              </div>
            )}
            {ok && (
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                {ok}
              </div>
            )}
          </div>
        )}

        {/* Body per flik */}
        <div className="p-5">
          {activeTab === "ägare" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Ägare</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Förnamn</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={ownerFirst}
                    onChange={(e) => setOwnerFirst(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Efternamn</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={ownerLast}
                    onChange={(e) => setOwnerLast(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-[#2c7a4c]">Personnummer</label>
                  <input
                    disabled={!isAdmin}
                    placeholder="ååååmmdd-xxxx"
                    className={`w-full border rounded-lg px-3 py-2 ${
                      !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    value={ownerPersonnummer}
                    onChange={(e) => setOwnerPersonnummer(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Kundnummer</label>
                  <input
                    disabled={!isAdmin}
                    className={`w-full border rounded-lg px-3 py-2 ${
                      !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    value={ownerCustomerNo}
                    onChange={(e) =>
                      setOwnerCustomerNo(e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">E-postadress</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Telefonnummer
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Adress</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={ownerAddress}
                    onChange={(e) => setOwnerAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Postnummer</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={ownerZip}
                    onChange={(e) => setOwnerZip(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Ort</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={ownerCity}
                    onChange={(e) => setOwnerCity(e.target.value)}
                  />
                </div>
              </div>

              {/* Kontaktperson 2 */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-4">
                  <SectionTitle>Kontaktperson 2</SectionTitle>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Förnamn</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={kp2First}
                    onChange={(e) => setKp2First(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Efternamn</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={kp2Last}
                    onChange={(e) => setKp2Last(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Telefonnummer
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={kp2Phone}
                    onChange={(e) => setKp2Phone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "hund" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Hund</SectionTitle>

              {/* Foto */}
              <div className="mb-4 flex items-center gap-4">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Hundfoto"
                    className="w-24 h-24 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border flex items-center justify-center text-gray-400 text-sm">
                    Ingen bild
                  </div>
                )}
                <label className="text-xs text-[#2c7a4c] bg-[#2c7a4c]/10 px-3 py-1 rounded cursor-pointer hover:bg-[#2c7a4c]/20">
                  {uploading ? "Laddar..." : "Ladda upp bild"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadImage}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Hundens namn</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Ras</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Mankhöjd (cm)
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={heightcm}
                    onChange={(e) =>
                      setHeightcm(e.target.value.replace(/[^\d]/g, ""))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Födelsedatum</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={birth}
                    onChange={(e) => setBirth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Kön</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                  >
                    <option value="">Välj...</option>
                    <option value="Tik">Tik</option>
                    <option value="Hane">Hane</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Försäkringsnummer
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={insuranceNo}
                    onChange={(e) => setInsuranceNo(e.target.value)}
                  />
                </div>
              </div>

              <SectionTitle>Övrigt hund</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagCast}
                    onChange={(e) => setFlagCast(e.target.checked)}
                  />
                  Kastrerad / Steriliserad
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagBiter}
                    onChange={(e) => setFlagBiter(e.target.checked)}
                  />
                  Hund biter på saker
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagKiss}
                    onChange={(e) => setFlagKiss(e.target.checked)}
                  />
                  Kissar inne
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagSkallig}
                    onChange={(e) => setFlagSkallig(e.target.checked)}
                  />
                  Hund skällig
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagPersonal}
                    onChange={(e) => setFlagPersonal(e.target.checked)}
                  />
                  Personalhund
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagPensionat}
                    onChange={(e) => setFlagPensionat(e.target.checked)}
                  />
                  Pensionatshund
                </label>
              </div>
            </div>
          )}

          {activeTab === "hälsa" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Hälsa</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Försäkringsbolag
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Försäkringsnummer
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={insuranceNo}
                    onChange={(e) => setInsuranceNo(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Vaccination DHP (3 år)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={vaccDhp}
                    onChange={(e) => setVaccDhp(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Vaccination PI (1 år)
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={vaccPi}
                    onChange={(e) => setVaccPi(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Vård / Medicin
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
                    value={careNotes}
                    onChange={(e) => setCareNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "kommentarer" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Kommentarer</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Journalanteckning
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Kommentarer ägare
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                    value={ownerComment}
                    onChange={(e) => setOwnerComment(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Foder</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                    value={foodInfo}
                    onChange={(e) => setFoodInfo(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "abonnemang" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Abonnemang</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-[#2c7a4c]">Typ</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    value={subscription}
                    onChange={(e) => setSubscription(e.target.value)}
                  >
                    <option value="">Välj...</option>
                    <option value="Heltid">Heltid</option>
                    <option value="Deltid 3">Deltid 3</option>
                    <option value="Deltid 2">Deltid 2</option>
                    <option value="Dagshund">Dagshund</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Startdatum</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={subStart}
                    onChange={(e) => setSubStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Slutdatum</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={subEnd}
                    onChange={(e) => setSubEnd(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Rumsnummer</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                  >
                    <option value="">Välj rum…</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name ?? r.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Veckodagar */}
              <div className="mt-3">
                <label className="block text-xs text-[#2c7a4c] mb-2">
                  Veckodagar
                </label>
                <div className="flex flex-wrap gap-2">
                  {dayOptions.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`rounded-full border px-3 py-1 text-sm ${
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
            </div>
          )}

          {activeTab === "tillägg" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Tilläggsabonnemang & Merförsäljning</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Tilläggsabonnemang
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="t.ex. Kloklipp"
                    value={addonName}
                    onChange={(e) => setAddonName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Gånger/månad</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={addonQty}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setAddonQty(v); // tillåter tom sträng (undviker 099-problemet)
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Start</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={addonStart}
                    onChange={(e) => setAddonStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Slut</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={addonEnd}
                    onChange={(e) => setAddonEnd(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Anvisningar till ekonomi
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="t.ex. ändring D3 → Heltid fr.o.m. 1/11"
                    value={financeNote}
                    onChange={(e) => setFinanceNote(e.target.value)}
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Allt i denna sektion kopplas till fakturaunderlag via{" "}
                <code>dogs</code> och <code>extra_service</code>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t">
          <button
            onClick={onCloseAction}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#2c7a4c] px-6 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
          >
            {saving ? "Sparar..." : "Spara"}
          </button>
        </div>
      </div>
    </div>
  );
}
