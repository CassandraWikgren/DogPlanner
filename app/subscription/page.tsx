"use client";
import { useEffect, useState } from "react";
import { getDB, setDB } from "../lib/store";

export default function SubscriptionPage() {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    setLocked(!!getDB().locked);
  }, []);
  function toggleLock(on: boolean) {
    setLocked(on);
    setDB((db) => {
      db.locked = on;
    });
    alert(
      on
        ? "Kontot är låst (läs-läge) tills betalning/återstart."
        : "Kontot är upplåst."
    );
  }
  return (
    <main className="features" style={{ maxWidth: 800 }}>
      <h2>Mitt abonnemang</h2>
      <div className="feature">
        <p>Kundnummer: DP-{new Date().getFullYear()}-00123</p>
        <p>
          Status: <b>{locked ? "Låst" : "Aktivt"}</b>
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn primary" onClick={() => toggleLock(false)}>
            Aktivera
          </button>
          <button className="btn primary" onClick={() => toggleLock(true)}>
            Lås (obetalda fakturor)
          </button>
          <a className="btn primary" href="/(app)/cancel-subscription">
            Avsluta abonnemang
          </a>
        </div>
      </div>
    </main>
  );
}
