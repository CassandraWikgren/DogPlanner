// @ts-nocheck
// === DogPlanner3 – Monthly Invoice Generator ===
// Körs manuellt eller via cron-schedule (GitHub Actions).
// Skapar fakturaunderlag baserat på dogs, subscriptions och extra_service.
// Skickar även e-postnotifiering via Supabase.
// ===============================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

serve(async (req) => {
  console.log("➡️ Starting invoice generation...");

  // === Supabase-klient ===
  const SUPABASE_URL =
    Deno.env.get("SUPABASE_URL") ?? "https://fhdkkkujnhteetllxypg.supabase.co";
  const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("✅ Supabase client initialized");

  try {
    const body = await req.json().catch(() => ({}));
    const monthId =
      body.month ??
      (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      })();

    console.log("🧾 Generating invoices for:", monthId);

    // === Hämta senaste prislista ===
    const { data: price, error: priceErr } = await supabase
      .from("price_lists")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (priceErr)
      throw new Error(`Price list fetch error: ${priceErr.message}`);
    const prices = price?.items || {};
    console.log("✅ Price list loaded:", Object.keys(prices).length, "items");

    // === Hämta alla hundar med ägare + organisation ===
    const { data: dogs, error: dogsErr } = await supabase.from("dogs").select(`
      id, name, subscription, user_id, org_id,
      owner:owners (full_name, email)
    `);
    if (dogsErr) throw new Error(`Dogs fetch error: ${dogsErr.message}`);

    if (!dogs?.length) {
      console.log("⚠️ No dogs found – exiting.");
      await supabase.from("function_logs").insert([
        {
          function_name: "generate_invoices",
          status: "warning",
          message: "No dogs found – no invoices generated.",
        },
      ]);
      return new Response("No dogs found", { status: 200 });
    }

    console.log(`🐶 Found ${dogs.length} dogs.`);
    const invoices = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // === Gruppera hundar per ägare & org ===
    const owners = {};
    for (const d of dogs) {
      const ownerName = d.owner?.full_name ?? "Okänd ägare";
      const orgId = d.org_id ?? d.user_id ?? null;
      if (!owners[ownerName]) owners[ownerName] = { dogs: [], org_id: orgId };
      owners[ownerName].dogs.push(d);
    }

    console.log(`👥 Grouped into ${Object.keys(owners).length} owners.`);

    // === Skapa fakturor ===
    for (const [ownerName, info] of Object.entries(owners)) {
      const dogsList = info.dogs;
      const orgId = info.org_id ?? null;
      const ownerEmail = dogsList[0]?.owner?.email ?? "";
      const lines = [];
      let total = 0;

      for (const d of dogsList) {
        const sub = d.subscription?.toLowerCase();
        const priceVal = prices[sub] ?? 0;

        // Basprenumeration
        if (priceVal > 0) {
          lines.push({
            description: `${d.name} – ${d.subscription}`,
            quantity: 1,
            unit_price: priceVal,
            total: priceVal,
          });
          total += priceVal;
        }

        // === Extra services ===
        const { data: extras, error: extraErr } = await supabase
          .from("extra_service")
          .select("*")
          .eq("dogs_id", d.id)
          .gte("performed_at", startOfMonth.toISOString())
          .lte("performed_at", endOfMonth.toISOString());

        if (extraErr) {
          console.warn(
            `⚠️ Extra fetch error for dog ${d.id}: ${extraErr.message}`
          );
          continue;
        }
        // === Hämta aktiva pensionatsbokningar ===
        const { data: stays, error: staysErr } = await supabase
          .from("pension_stays")
          .select(
            `
    id, dog_id, org_id, owner_id, 
    check_in, check_out, 
    room_id, price_per_night, 
    season, total_price
  `
          )
          .gte("check_in", startOfMonth.toISOString())
          .lte("check_out", endOfMonth.toISOString());

        if (staysErr) throw new Error(`Stay fetch error: ${staysErr.message}`);
        console.log(`🏨 Found ${stays?.length ?? 0} active stays`);

        for (const x of extras || []) {
          const qty = x.quantity ?? 1;
          const unit = x.price ?? 0;
          lines.push({
            description: `${d.name} – ${x.service_type}`,
            quantity: qty,
            unit_price: unit,
            total: qty * unit,
          });
          total += qty * unit;
        }
      }

      invoices.push({
        org_id: orgId,
        owner_name: ownerName,
        owner_email: ownerEmail,
        month_id: monthId,
        lines,
        total_amount: total,
        created_at: new Date().toISOString(),
      });
    }

    // === Spara fakturor ===
    if (invoices.length > 0) {
      const { error: insertErr } = await supabase
        .from("invoices")
        .insert(invoices);
      if (insertErr) throw new Error(`Insert error: ${insertErr.message}`);

      console.log(`✅ Inserted ${invoices.length} invoices.`);

      await supabase.from("function_logs").insert([
        {
          function_name: "generate_invoices",
          status: "success",
          message: `✅ ${invoices.length} invoices created for ${monthId}`,
        },
      ]);

      // === Skicka e-post via Supabase SMTP ===
      await supabase.functions.invoke("send_email", {
        body: {
          to: "din-adress@icloud.com",
          subject: `DogPlanner – Fakturagenerering klar (${monthId})`,
          text: `✅ Fakturagenereringen är färdig!\n${invoices.length} fakturor skapades för ${monthId}.`,
        },
      });
    } else {
      console.log("⚠️ No invoices to insert");
      await supabase.from("function_logs").insert([
        {
          function_name: "generate_invoices",
          status: "warning",
          message: `No invoices generated for ${monthId}`,
        },
      ]);
    }

    return new Response(`Invoices generated for ${monthId}`, { status: 200 });
  } catch (err) {
    console.error("❌ Invoice generation failed:", err.message);
    await supabase.from("function_logs").insert([
      {
        function_name: "generate_invoices",
        status: "error",
        message: `❌ ${err.message}`,
      },
    ]);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
