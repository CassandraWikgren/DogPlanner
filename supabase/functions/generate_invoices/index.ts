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
      const ownerId = dogsList[0]?.user_id ?? null; // Hämta owner_id från första hunden
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
    id, dog_id, org_id, 
    check_in, check_out, 
    room_id, price_per_night, 
    season, total_price
  `
          )
          .gte("check_in", startOfMonth.toISOString())
          .lte("check_out", endOfMonth.toISOString());

        if (staysErr) {
          console.warn(
            `⚠️ Stay fetch error for dog ${d.id}: ${staysErr.message}`
          );
          // Fortsätt ändå - det är okej om inga stays finns
        }
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
        owner_id: ownerId,
        billed_name: ownerName,
        billed_email: ownerEmail,
        invoice_date: startOfMonth.toISOString().split("T")[0], // YYYY-MM-DD format
        due_date: endOfMonth.toISOString().split("T")[0],
        lines,
        total_amount: total,
        status: "draft",
        invoice_type: "full", // Månadsfaktura är 'full' (inte förskott/efterskott)
      });
    }

    // === Spara fakturor ===
    if (invoices.length > 0) {
      console.log(`💾 Inserting ${invoices.length} invoices...`);

      let totalAmount = 0;
      let dogCount = 0;

      for (const inv of invoices) {
        const lines = inv.lines; // Spara lines separat
        delete inv.lines; // Ta bort lines från invoice-objektet

        totalAmount += inv.total_amount;
        dogCount += info.dogs?.length || 0;

        // Insert invoice först
        const { data: insertedInvoice, error: insertErr } = await supabase
          .from("invoices")
          .insert([inv])
          .select()
          .single();

        if (insertErr) {
          console.error(
            `❌ Failed to insert invoice for ${inv.billed_name}:`,
            insertErr.message
          );
          throw new Error(`Insert invoice error: ${insertErr.message}`);
        }

        console.log(
          `✅ Invoice created: ${insertedInvoice.invoice_number} (ID: ${insertedInvoice.id}) for ${inv.billed_name}`
        );

        // Insert invoice_items
        if (lines && lines.length > 0) {
          const items = lines.map((line) => ({
            invoice_id: insertedInvoice.id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unit_price,
            total_amount: line.total,
          }));

          const { error: itemsErr } = await supabase
            .from("invoice_items")
            .insert(items);

          if (itemsErr) {
            console.error(
              `❌ Failed to insert invoice items for invoice ${insertedInvoice.id}:`,
              itemsErr.message
            );
            throw new Error(`Insert invoice_items error: ${itemsErr.message}`);
          }

          console.log(
            `✅ Added ${items.length} items to invoice ${insertedInvoice.id}`
          );
        }

        // 🔥 NYA FÖRBÄTTRINGAR:

        // 1. Sätt status till 'sent' istället för 'draft'
        const { error: updateErr } = await supabase
          .from("invoices")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", insertedInvoice.id);

        if (updateErr) {
          console.warn(
            `⚠️ Failed to update invoice status: ${updateErr.message}`
          );
        } else {
          console.log(
            `✅ Invoice ${insertedInvoice.invoice_number} marked as sent`
          );
        }

        // 2. Skicka email till kund (via RPC function)
        try {
          const { data: emailResult, error: emailErr } = await supabase.rpc(
            "send_invoice_email",
            { p_invoice_id: insertedInvoice.id }
          );

          if (emailErr) {
            console.warn(
              `⚠️ Email send failed for invoice ${insertedInvoice.invoice_number}: ${emailErr.message}`
            );
          } else {
            console.log(
              `✅ Email sent for invoice ${insertedInvoice.invoice_number} to ${inv.billed_email}`
            );
          }
        } catch (emailException) {
          console.warn(`⚠️ Email send exception: ${emailException.message}`);
          // Fortsätt trots email-fel
        }
      }

      console.log(
        `✅ Successfully inserted ${invoices.length} invoices with items.`
      );

      // 3. Logga i invoice_runs tabell
      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "success",
          invoices_created: invoices.length,
          metadata: {
            total_amount: totalAmount,
            dog_count: dogCount,
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      await supabase.from("function_logs").insert([
        {
          function_name: "generate_invoices",
          status: "success",
          message: `✅ ${invoices.length} invoices created for ${monthId} (Total: ${totalAmount} kr)`,
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

      // Logga även i invoice_runs
      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "success",
          invoices_created: 0,
          metadata: {
            message: "No dogs/subscriptions found requiring invoicing",
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    }

    return new Response(`Invoices generated for ${monthId}`, { status: 200 });
  } catch (err) {
    console.error("❌ Invoice generation failed:", err.message);

    // Logga i function_logs
    await supabase.from("function_logs").insert([
      {
        function_name: "generate_invoices",
        status: "error",
        message: `❌ ${err.message}`,
      },
    ]);

    // Logga i invoice_runs med failure status
    try {
      const body = await req.json().catch(() => ({}));
      const monthId = body.month ?? new Date().toISOString().slice(0, 7);

      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "failed",
          invoices_created: 0,
          error_message: err.message,
          metadata: {
            error: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    } catch (logErr) {
      console.warn("⚠️ Failed to log error to invoice_runs:", logErr.message);
    }

    return new Response(`Error: ${err.message}`, { status: 500 });
  }
});
