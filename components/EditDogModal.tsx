"use client";

import * as React from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";

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
  const { user, currentOrgId } = useAuth(); // Hämta user och org_id från AuthContext

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

        // Hämta journalhistorik om vi redigerar befintlig hund
        if (initialDog?.id) {
          const { data: journalData } = await supabase
            .from("dog_journal")
            .select("*")
            .eq("dog_id", initialDog.id)
            .order("created_at", { ascending: false });
          setJournalHistory(journalData || []);

          // Hämta befintliga tilläggsabonnemang
          const { data: addonsData } = await supabase
            .from("extra_service")
            .select("*")
            .eq("dogs_id", initialDog.id)
            .neq("service_type", "finance_note")
            .order("created_at", { ascending: false });

          if (addonsData && addonsData.length > 0) {
            const loadedAddons: Addon[] = addonsData.map((es) => ({
              id: es.id || Date.now().toString(),
              name: es.service_type || "",
              qty: es.quantity?.toString() || "1",
              start: es.performed_at || "",
              end: es.notes?.includes("t.o.m.")
                ? es.notes.split("t.o.m. ")[1] || ""
                : "",
            }));
            setAddons(loadedAddons);
          }
        } else {
          setJournalHistory([]);
          setAddons([]);
        }
      } catch (e) {
        console.error("Init modal error:", e);
      }
    })();
  }, [open, supabase, initialDog]);

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
  const [allergies, setAllergies] = React.useState("");
  const [medications, setMedications] = React.useState("");
  const [specialNeeds, setSpecialNeeds] = React.useState("");
  const [behaviorNotes, setBehaviorNotes] = React.useState("");

  // Övrigt hund (bocklista) → events.flags
  const [flagCast, setFlagCast] = React.useState(false);
  const [flagBiter, setFlagBiter] = React.useState(false);
  const [flagKiss, setFlagKiss] = React.useState(false);
  const [flagSkallig, setFlagSkallig] = React.useState(false);
  const [flagPersonal, setFlagPersonal] = React.useState(false);
  const [flagPensionat, setFlagPensionat] = React.useState(false);
  const [flagEscapeArtist, setFlagEscapeArtist] = React.useState(false);
  const [flagCanBeWithOtherDogs, setFlagCanBeWithOtherDogs] =
    React.useState(false);

  // --- KOMMENTARER ---
  const [journalText, setJournalText] = React.useState(""); // → dog_journal
  const [ownerComment, setOwnerComment] = React.useState(""); // → events.owner_comment
  const [foodInfo, setFoodInfo] = React.useState(""); // → events.food
  const [journalHistory, setJournalHistory] = React.useState<any[]>([]); // Tidigare journalanteckningar

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
  type Addon = {
    id: string;
    name: string;
    qty: string;
    start: string;
    end: string;
  };
  const [addons, setAddons] = React.useState<Addon[]>([]);
  const [currentAddonName, setCurrentAddonName] = React.useState("");
  const [currentAddonQty, setCurrentAddonQty] = React.useState("1");
  const [currentAddonStart, setCurrentAddonStart] = React.useState<string>("");
  const [currentAddonEnd, setCurrentAddonEnd] = React.useState<string>("");
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
    if (currentAddonQty && isNaN(Number(currentAddonQty)))
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
    setBirth(initialDog.birth || initialDog.birthdate || "");
    setGender((initialDog.gender as "Tik" | "Hane" | "") || "");
    setInsuranceNo(initialDog.insurance_number || "");
    setPhotoUrl(initialDog.photo_url || null);

    // Hälsa - läs från både separata kolumner OCH events
    setInsuranceCompany(initialDog.insurance_company || "");
    setVaccDhp(initialDog.vaccdhp || initialDog.vaccination_dhppi || "");
    setVaccPi(initialDog.vaccpi || initialDog.vaccination_pi || "");
    setCareNotes(initialDog.care_notes || "");

    // Läs från events JSONB eller separata kolumner (prioritera separata kolumner)
    const evts = initialDog.events || {};
    setAllergies(initialDog.allergies || evts.allergies || "");
    setMedications(initialDog.medications || evts.medications || "");
    setSpecialNeeds(initialDog.special_needs || evts.special_needs || "");
    setBehaviorNotes(initialDog.behavior_notes || evts.behavior_notes || "");
    setFoodInfo(initialDog.food_info || evts.food || "");
    setOwnerAddress(evts.owner_address || "");
    setOwnerComment(evts.owner_comment || "");

    // Flags från både separata kolumner OCH events.flags
    const flags = evts.flags || {};
    setFlagCast(initialDog.is_castrated ?? flags.kastrerad ?? false);
    setFlagBiter(initialDog.destroys_things ?? flags.biter_saker ?? false);
    setFlagKiss(
      initialDog.is_house_trained === false || flags.kissar_inne || false
    );
    setFlagSkallig(flags.hund_skallig || false);
    setFlagPersonal(flags.personalhund || false);
    setFlagPensionat(flags.pensionatshund || false);
    setFlagEscapeArtist(
      initialDog.is_escape_artist ?? flags.is_escape_artist ?? false
    );
    setFlagCanBeWithOtherDogs(
      initialDog.can_be_with_other_dogs ?? flags.can_be_with_other_dogs ?? true
    );

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

    // Säkerställ aktiv session och organisation
    if (!user || !currentOrgId) {
      setError(
        "Du är inte inloggad eller saknar organisation – kunde inte spara."
      );
      console.error("EditDogModal: No user or org_id", { user, currentOrgId });
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
      let existingCustomerNumber: number | null = null;

      // 1. Försök matcha på e-post (mest tillförlitlig)
      if (ownerEmail?.trim()) {
        const { data: hit } = await supabase
          .from("owners")
          .select("id, customer_number, full_name")
          .eq("org_id", currentOrgId)
          .ilike("email", ownerEmail.trim())
          .maybeSingle();
        if (hit?.id) {
          ownerId = hit.id;
          existingCustomerNumber = hit.customer_number;
          console.log(
            `✅ Återanvänder befintlig ägare: ${hit.full_name} (Kundnr: ${hit.customer_number}) - matchad på e-post`
          );
        }
      }

      // 2. Om ingen match på e-post, försök telefon (normaliserat)
      if (!ownerId && ownerPhone?.trim()) {
        const cleanPhone = ownerPhone.replace(/[\s\-\(\)]/g, ""); // Ta bort mellanslag, bindestreck, parenteser
        const { data: hit2 } = await supabase
          .from("owners")
          .select("id, customer_number, full_name, phone")
          .eq("org_id", currentOrgId)
          .maybeSingle();

        // Manuell sökning i client (eftersom SQL LIKE inte normaliserar)
        const allOwners = await supabase
          .from("owners")
          .select("id, customer_number, full_name, phone")
          .eq("org_id", currentOrgId);

        const match = allOwners.data?.find((owner) => {
          if (!owner.phone) return false;
          const ownerCleanPhone = owner.phone.replace(/[\s\-\(\)]/g, "");
          return ownerCleanPhone === cleanPhone;
        });

        if (match?.id) {
          ownerId = match.id;
          existingCustomerNumber = match.customer_number;
          console.log(
            `✅ Återanvänder befintlig ägare: ${match.full_name} (Kundnr: ${match.customer_number}) - matchad på telefon`
          );
        }
      }

      // 3. Om fortfarande ingen match på e-post eller telefon, försök namn + telefon
      if (!ownerId && full_name && ownerPhone) {
        const { data: hit3 } = await supabase
          .from("owners")
          .select("id, customer_number, full_name")
          .eq("org_id", currentOrgId)
          .ilike("full_name", full_name)
          .ilike("phone", ownerPhone)
          .maybeSingle();
        if (hit3?.id) {
          ownerId = hit3.id;
          existingCustomerNumber = hit3.customer_number;
          console.log(
            `✅ Återanvänder befintlig ägare: ${hit3.full_name} (Kundnr: ${hit3.customer_number}) - matchad på namn + telefon`
          );
        }
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

      // Lägg alltid till org_id (viktigt när triggers är disabled)
      (baseOwner as any).org_id = currentOrgId;

      // Auto-generera customer_number OM det inte redan finns
      if (!ownerId && !baseOwner.customer_number) {
        const { data: maxData } = await supabase
          .from("owners")
          .select("customer_number")
          .eq("org_id", currentOrgId)
          .order("customer_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        const maxNum = maxData?.customer_number || 0;
        baseOwner.customer_number = maxNum + 1;
        console.log(
          `🆕 Skapar ny ägare: ${full_name} med auto-genererat kundnummer: ${baseOwner.customer_number}`
        );
      }

      if (isAdmin) {
        // Admin kan manuellt sätta kundnummer (skriver över auto-genererat)
        if (ownerCustomerNo) {
          baseOwner.customer_number = Number(ownerCustomerNo);
          console.log(
            `👤 Admin satte manuellt kundnummer: ${baseOwner.customer_number}`
          );
        }
        baseOwner.personnummer = ownerPersonnummer || null;
      }

      if (!ownerId) {
        const { data: created } = await supabase
          .from("owners")
          .insert([baseOwner])
          .select("id, customer_number")
          .single()
          .throwOnError();
        ownerId = created.id;
        console.log(
          `✅ Ägare skapad i databasen med ID: ${created.id}, Kundnr: ${created.customer_number}`
        );
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
        allergies: allergies || null,
        medications: medications || null,
        special_needs: specialNeeds || null,
        behavior_notes: behaviorNotes || null,
        flags: {
          kastrerad: flagCast,
          biter_saker: flagBiter,
          kissar_inne: flagKiss,
          hund_skallig: flagSkallig,
          personalhund: flagPersonal,
          pensionatshund: flagPensionat,
          is_escape_artist: flagEscapeArtist,
          can_be_with_other_dogs: flagCanBeWithOtherDogs,
        },
      };

      // 3) Insert eller Update hund (dogs) — små bokstäver + rätt relationer
      const dogPayload: any = {
        name: name.trim(),
        breed: breed.trim() || null,
        heightcm: heightcm ? Number(heightcm) : null,
        birth: birth || null,
        gender: gender || null,
        subscription: subscription || null,
        startdate: subStart || null,
        enddate: subEnd || null,
        room_id: roomId || null,
        days: days.join(",") || null,
        vaccdhp: vaccDhp || null,
        vaccpi: vaccPi || null,
        insurance_company: insuranceCompany || null,
        insurance_number: insuranceNo || null,
        photo_url: photoUrl || null,
        notes: null,
        owner_id: ownerId, // ✅ dogs.owner_id → owners.id
        org_id: currentOrgId, // ✅ Lägg alltid till org_id (viktigt när triggers är disabled)
        // Hälsofält i separata kolumner
        allergies: allergies || null,
        medications: medications || null,
        special_needs: specialNeeds || null,
        behavior_notes: behaviorNotes || null,
        food_info: foodInfo || null,
        // Boolean flags i separata kolumner
        is_castrated: flagCast,
        destroys_things: flagBiter,
        is_house_trained: !flagKiss, // kissar_inne är inverterad
        is_escape_artist: flagEscapeArtist,
        can_be_with_other_dogs: flagCanBeWithOtherDogs,
        events, // JSONB för övrigt
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
          .insert([
            {
              dog_id: dogId,
              content: journalText.trim(),
              entry_type: "note",
            },
          ])
          .throwOnError();

        // Ladda om journalhistorik efter sparning
        const { data: updatedJournal } = await supabase
          .from("dog_journal")
          .select("*")
          .eq("dog_id", dogId)
          .order("created_at", { ascending: false });
        setJournalHistory(updatedJournal || []);
        setJournalText(""); // Rensa textfältet efter sparning
      }

      // 5) Tilläggsabonnemang (extra_service) - spara alla addons
      if (addons.length > 0) {
        const addonInserts = addons.map((addon) => ({
          dogs_id: dogId,
          service_type: addon.name.trim(),
          quantity:
            addon.qty.trim() === "" ? 1 : Number(addon.qty.replace(/^0+/, "")),
          price: null,
          performed_at: addon.start || null,
          notes: addon.end ? `Gäller t.o.m. ${addon.end}` : null,
        }));

        await supabase
          .from("extra_service")
          .insert(addonInserts)
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
      setAllergies("");
      setMedications("");
      setSpecialNeeds("");
      setBehaviorNotes("");
      setFlagCast(false);
      setFlagBiter(false);
      setFlagKiss(false);
      setFlagSkallig(false);
      setFlagPersonal(false);
      setFlagPensionat(false);
      setFlagEscapeArtist(false);
      setFlagCanBeWithOtherDogs(false);
      setJournalText("");
      setOwnerComment("");
      setFoodInfo("");
      setSubscription("");
      setSubStart("");
      setSubEnd("");
      setRoomId("");
      setDays([]);
      setAddons([]);
      setCurrentAddonName("");
      setCurrentAddonQty("1");
      setCurrentAddonStart("");
      setCurrentAddonEnd("");
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
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Allergier</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[60px]"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="T.ex. kyckling, nöt, gräs..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Mediciner</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[60px]"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="Ange medicin och dosering..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">Specialbehov</label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[60px]"
                    value={specialNeeds}
                    onChange={(e) => setSpecialNeeds(e.target.value)}
                    placeholder="Specialkost, tillgänglighet..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Beteendeanteckningar
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[60px]"
                    value={behaviorNotes}
                    onChange={(e) => setBehaviorNotes(e.target.value)}
                    placeholder="Viktiga beteendenoteringar..."
                  />
                </div>
              </div>

              <div className="mt-6">
                <SectionTitle>Status & Flaggor</SectionTitle>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagEscapeArtist}
                    onChange={(e) => setFlagEscapeArtist(e.target.checked)}
                  />
                  Rymmare (Escape Artist)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={flagCanBeWithOtherDogs}
                    onChange={(e) =>
                      setFlagCanBeWithOtherDogs(e.target.checked)
                    }
                  />
                  Kan vara med andra hundar
                </label>
              </div>
            </div>
          )}

          {activeTab === "kommentarer" && (
            <div className="rounded-xl border p-4">
              <SectionTitle>Kommentarer</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#2c7a4c]">
                    Journalanteckning (ny)
                  </label>
                  <textarea
                    className="w-full border rounded-lg px-3 py-2 min-h-[120px]"
                    value={journalText}
                    onChange={(e) => setJournalText(e.target.value)}
                    placeholder="Skriv ny journalanteckning här..."
                  />

                  {/* Journalhistorik */}
                  {journalHistory.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-[#2c7a4c] mb-2">
                        Tidigare journalanteckningar
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {journalHistory.map((entry) => (
                          <div
                            key={entry.id}
                            className="border rounded-lg p-2 bg-gray-50 text-xs"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-gray-700">
                                {new Date(entry.created_at).toLocaleString(
                                  "sv-SE",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              {entry.entry_type &&
                                entry.entry_type !== "note" && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">
                                    {entry.entry_type}
                                  </span>
                                )}
                            </div>
                            <p className="text-gray-600 whitespace-pre-wrap">
                              {entry.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
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

              {/* Lista över tillagda addons */}
              {addons.length > 0 && (
                <div className="mb-4 space-y-2">
                  <label className="text-xs text-[#2c7a4c] font-semibold">
                    Tillagda tilläggsabonnemang:
                  </label>
                  {addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border"
                    >
                      <div className="flex-1">
                        <span className="font-medium">{addon.name}</span>
                        <span className="text-gray-600 ml-2">
                          ({addon.qty} ggr/mån)
                        </span>
                        {addon.start && (
                          <span className="text-gray-500 text-sm ml-2">
                            Start: {addon.start}
                          </span>
                        )}
                        {addon.end && (
                          <span className="text-gray-500 text-sm ml-2">
                            Slut: {addon.end}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAddons(addons.filter((a) => a.id !== addon.id));
                        }}
                        className="text-red-600 hover:text-red-800 text-sm px-2"
                      >
                        Ta bort
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulär för att lägga till nytt addon */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-[#2c7a4c]">
                    Tilläggsabonnemang
                  </label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="t.ex. Kloklipp"
                    value={currentAddonName}
                    onChange={(e) => setCurrentAddonName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Gånger/månad</label>
                  <input
                    className="w-full border rounded-lg px-3 py-2"
                    value={currentAddonQty}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      setCurrentAddonQty(v);
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Start</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={currentAddonStart}
                    onChange={(e) => setCurrentAddonStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-[#2c7a4c]">Slut</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                    value={currentAddonEnd}
                    onChange={(e) => setCurrentAddonEnd(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentAddonName.trim()) {
                        alert("Ange namn på tilläggsabonnemang");
                        return;
                      }
                      const newAddon: Addon = {
                        id: Date.now().toString(),
                        name: currentAddonName.trim(),
                        qty: currentAddonQty || "1",
                        start: currentAddonStart,
                        end: currentAddonEnd,
                      };
                      setAddons([...addons, newAddon]);
                      // Reset form
                      setCurrentAddonName("");
                      setCurrentAddonQty("1");
                      setCurrentAddonStart("");
                      setCurrentAddonEnd("");
                    }}
                    className="w-full bg-[#2c7a4c] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-700"
                  >
                    + Lägg till
                  </button>
                </div>
              </div>

              <div className="mt-4 md:col-span-6">
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
