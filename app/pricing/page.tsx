"use client";
import { useEffect, useState } from "react";
import { PriceList, getDB, setDB } from "../lib/store";

export default function PricingPage() {
  const [plist, setPlist] = useState<PriceList[]>([]);
  const [cur, setCur] = useState<PriceList | null>(null);

  useEffect(() => {
    const db = getDB();
    setPlist(db.prices);
    setCur(db.prices[0]);
  }, []);

  function update(field: keyof PriceList["items"], value: number) {
    if (!cur) return;
    setCur({ ...cur, items: { ...cur.items, [field]: value } });
  }

  function save() {
    if (!cur) return;
    const toSave: PriceList = { ...cur, updatedAt: new Date().toISOString() };
    setDB((db) => {
      db.prices = [
        toSave,
        ...db.prices.filter((p) => p.effectiveFrom !== toSave.effectiveFrom),
      ];
    });
    alert("Priser sparade");
  }

  if (!cur) return <main style={{ padding: 24 }}>Laddar…</main>;

  return (
    <main className="features" style={{ maxWidth: 800 }}>
      <h2>Mina priser</h2>
      <div className="feature" style={{ textAlign: "left" }}>
        <label>Gäller från (YYYY-MM): </label>
        <input
          value={cur.effectiveFrom}
          onChange={(e) => setCur({ ...cur, effectiveFrom: e.target.value })}
        />
        <p style={{ opacity: 0.7 }}>
          Senast uppdaterad: {new Date(cur.updatedAt).toLocaleString()}
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <PriceInput
            label="Dagis – Heltid"
            value={cur.items.dagis_heltid}
            onChange={(v) => update("dagis_heltid", v)}
          />
          <PriceInput
            label="Dagis – Deltid 2"
            value={cur.items.dagis_deltid2}
            onChange={(v) => update("dagis_deltid2", v)}
          />
          <PriceInput
            label="Dagis – Deltid 3"
            value={cur.items.dagis_deltid3}
            onChange={(v) => update("dagis_deltid3", v)}
          />
          <PriceInput
            label="Kloklipp"
            value={cur.items.kloklipp ?? 0}
            onChange={(v) => update("kloklipp", v)}
          />
          <PriceInput
            label="Bad"
            value={cur.items.bad ?? 0}
            onChange={(v) => update("bad", v)}
          />
          <PriceInput
            label="Tasstrim"
            value={cur.items.tasstrim ?? 0}
            onChange={(v) => update("tasstrim", v)}
          />
          <PriceInput
            label="Extradag"
            value={cur.items.extradag ?? 0}
            onChange={(v) => update("extradag", v)}
          />
        </div>

        <button
          className="btn primary"
          onClick={save}
          style={{ marginTop: 12 }}
        >
          Spara
        </button>
      </div>
    </main>
  );
}
function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ minWidth: 180 }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span>kr</span>
    </label>
  );
}
