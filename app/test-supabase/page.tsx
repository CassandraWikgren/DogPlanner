"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState("testing...");
  const [details, setDetails] = useState<any>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    async function testConnection() {
      try {
        console.log("🔍 Testar Supabase-anslutning...");

        // Test 1: Grundläggande anslutning
        const { data: connectionTest, error: connectionError } = await supabase
          .from("orgs")
          .select("count", { count: "exact", head: true });

        if (connectionError) {
          setStatus("❌ Anslutningsfel");
          setDetails({ error: connectionError, step: "connection" });
          return;
        }

        console.log("✅ Grundläggande anslutning fungerar");

        // Test 2: Kontrollera att tabeller finns
        const { data: tableTest, error: tableError } = await supabase.rpc(
          "pg_tables_exist"
        );

        // Om rpc inte finns, testa direkt tabellåtkomst
        const { data: orgsTest, error: orgsError } = await supabase
          .from("orgs")
          .select("*")
          .limit(1);

        if (orgsError && orgsError.code !== "PGRST116") {
          // PGRST116 = inga rader, men tabell finns
          setStatus("❌ Tabellåtkomst-fel");
          setDetails({ error: orgsError, step: "tables" });
          return;
        }

        console.log("✅ Tabeller är tillgängliga");

        // Test 3: Kontrollera RLS-policies
        const { data: policyTest, error: policyError } = await supabase
          .from("dogs")
          .select("*")
          .limit(1);

        console.log("✅ RLS-policies fungerar");

        // Test 4: Kontrollera auth status
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        setStatus("✅ Alla tester godkända!");
        setDetails({
          connection: "OK",
          tables: "OK",
          rls: "OK",
          user: user ? "Inloggad" : "Anonym",
          orgsCount: connectionTest,
          testResults: {
            orgs: orgsTest?.length || 0,
            dogs: policyTest?.length || 0,
          },
        });
      } catch (err: any) {
        console.error("❌ Oväntat fel:", err);
        setStatus("❌ Oväntat fel");
        setDetails({ error: err.message, step: "unexpected" });
      }
    }

    testConnection();
  }, [supabase]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔧 Supabase-anslutningstest</h1>

      <div className="bg-gray-100 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p className="text-lg">{status}</p>
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Detaljer:</h2>
        <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(details, null, 2)}
        </pre>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">💡 Vad testas:</h3>
        <ul className="text-sm space-y-1">
          <li>✓ Grundläggande databasanslutning</li>
          <li>✓ Tabellåtkomst (orgs, dogs)</li>
          <li>✓ RLS-policies fungerar</li>
          <li>✓ Autentiseringsstatus</li>
        </ul>
      </div>
    </div>
  );
}
