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

    // FIX: Fakturera FÖREGÅENDE månad (inte aktuell månad)
    // Om body.month anges, använd den, annars beräkna föregående månad
    const monthId =
      body.month ??
      (() => {
        const now = new Date();
        // Gå tillbaka en månad
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${prevMonth.getFullYear()}-${String(
          prevMonth.getMonth() + 1
        ).padStart(2, "0")}`;
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
      id, name, subscription, owner_id, org_id,
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

    // FIX: Använd monthId för att beräkna rätt period (föregående månad)
    const [year, month] = monthId.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // === Gruppera hundar per ägare & org ===
    const owners = {};
    for (const d of dogs) {
      const ownerName = d.owner?.full_name ?? "Okänd ägare";
      const orgId = d.org_id ?? null;
      const ownerId = d.owner_id ?? null; // Hämta owner_id direkt från dogs-tabellen
      if (!owners[ownerName])
        owners[ownerName] = { dogs: [], org_id: orgId, owner_id: ownerId };
      owners[ownerName].dogs.push(d);
    }

    console.log(`👥 Grouped into ${Object.keys(owners).length} owners.`);

    // === Skapa fakturor ===
    let totalAmount = 0;
    let dogCount = 0;

    for (const [ownerName, info] of Object.entries(owners)) {
      const dogsList = info.dogs;
      const orgId = info.org_id ?? null;
      const ownerEmail = dogsList[0]?.owner?.email ?? "";

      // Hämta owner_id från grupperade data (mer robust än att ta från första hunden)
      const ownerId = info.owner_id ?? null;

      dogCount += dogsList.length;
      const lines = [];
      let total = 0;
      
      // === RABATTER: Hämta daycare_pricing för syskonrabatt ===
      let siblingDiscountPercent = 0;
      if (orgId) {
        const { data: pricingData } = await supabase
          .from("daycare_pricing")
          .select("sibling_discount_percent")
          .eq("org_id", orgId)
          .maybeSingle();
        
        if (pricingData) {
          siblingDiscountPercent = pricingData.sibling_discount_percent || 0;
        }
      }
      
      console.log(`👨‍👩‍👧 ${dogsList.length} hundar för ${ownerName}, syskonrabatt: ${siblingDiscountPercent}%`);

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

        // === Extra services för HUNDDAGIS (återkommande månadstillägg) ===
        // Viktigt: För hunddagis måste vi läsa extra_service baserat på is_active och date-range
        const { data: daycareExtras, error: daycareExtErr } = await supabase
          .from("extra_service")
          .select("*")
          .eq("dogs_id", d.id)
          .eq("org_id", orgId)
          .eq("is_active", true)
          .lte("start_date", endOfMonth.toISOString().split("T")[0]) // Startat före/under månaden
          .or(`end_date.is.null,end_date.gte.${startOfMonth.toISOString().split("T")[0]}`); // Inget slutdatum ELLER slutar efter/under månadens start

        if (daycareExtErr) {
          console.warn(
            `⚠️ Daycare extra fetch error for dog ${d.id}: ${daycareExtErr.message}`
          );
        } else if (daycareExtras && daycareExtras.length > 0) {
          console.log(
            `🔧 Found ${daycareExtras.length} active extra services for ${d.name} (daycare)`
          );

          for (const extra of daycareExtras) {
            let quantity = 1;

            // Beräkna antal baserat på frequency
            if (extra.frequency === "daily") {
              // Om hunden har "days" fält, beräkna faktiska dagar i månaden
              // Annars approximera baserat på subscription
              const daysInCurrentMonth =
                new Date(year, month, 0).getDate() - 1; // Approximate working days
              quantity = Math.ceil(daysInCurrentMonth * 0.8); // ~80% av dagarna (approximation)
            } else if (extra.frequency === "weekly") {
              quantity = 4; // 4 veckor per månad
            } else if (extra.frequency === "monthly") {
              quantity = 1;
            }

            const serviceTotal = quantity * (extra.price || 0);

            lines.push({
              description: `${d.name} – ${extra.service_type} (${extra.frequency}, ${quantity}x)`,
              quantity: quantity,
              unit_price: extra.price || 0,
              total: serviceTotal,
            });
            total += serviceTotal;

            console.log(
              `  ✅ Added ${extra.service_type}: ${quantity}x ${extra.price} kr = ${serviceTotal} kr`
            );
          }
        }

        // === Extra services för PENSIONAT (från performed_at i period) ===
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
          .eq("dog_id", d.id)
          .gte("check_in", startOfMonth.toISOString())
          .lte("check_out", endOfMonth.toISOString());

        if (staysErr) {
          console.warn(
            `⚠️ Stay fetch error for dog ${d.id}: ${staysErr.message}`
          );
          // Fortsätt ändå - det är okej om inga stays finns
        }
        console.log(
          `🏨 Found ${stays?.length ?? 0} active stays for ${d.name}`
        );

        // FIX: Lägg till extra services i fakturan
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

        // FIX: Lägg till pensionatsbokningar i fakturan
        for (const stay of stays || []) {
          const checkIn = new Date(stay.check_in);
          const checkOut = new Date(stay.check_out);
          const nights = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
          );
          const stayTotal =
            stay.total_price || nights * (stay.price_per_night || 0);

          lines.push({
            description: `${d.name} – Pensionat (${nights} ${nights === 1 ? "natt" : "nätter"}, ${checkIn.toLocaleDateString("sv-SE")} - ${checkOut.toLocaleDateString("sv-SE")})`,
            quantity: nights,
            unit_price: stay.price_per_night || 0,
            total: stayTotal,
          });
          total += stayTotal;
        }
      }
      
      // === RABATTER: Applicera syskonrabatt om flera hundar ===
      if (dogsList.length > 1 && siblingDiscountPercent > 0) {
        const discountAmount = total * (siblingDiscountPercent / 100);
        lines.push({
          description: `Syskonrabatt (${dogsList.length} hundar, -${siblingDiscountPercent}%)`,
          quantity: 1,
          unit_price: -discountAmount,
          total: -discountAmount,
        });
        total -= discountAmount;
        
        console.log(
          `💰 Syskonrabatt applicerad: -${discountAmount.toFixed(2)} kr (${siblingDiscountPercent}%)`
        );
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

      // FIX: totalAmount och dogCount redan beräknat ovan, ta bort duplicering
      let invoiceCount = 0;

      for (const inv of invoices) {
        const lines = inv.lines; // Spara lines separat
        delete inv.lines; // Ta bort lines från invoice-objektet

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

        // ✅ FAKTURAUNDERLAG - Status förblir 'draft'
        // Ingen email skickas automatiskt - företaget hanterar detta manuellt i systemet
        
        console.log(
          `✅ Fakturaunderlag skapat: ${insertedInvoice.invoice_number} (${inv.billed_name})`
        );

        invoiceCount++;
      }

      console.log(
        `✅ Successfully inserted ${invoiceCount} invoices with items.`
      );

      // Beräkna totalsummor för metadata
      const totalInvoiceAmount = invoices.reduce(
        (sum, inv) => sum + inv.total_amount,
        0
      );

      // 3. Logga i invoice_runs tabell
      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "success",
          invoices_created: invoiceCount,
          metadata: {
            total_amount: totalInvoiceAmount,
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
