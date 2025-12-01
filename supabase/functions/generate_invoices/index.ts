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

    // === FIX: Beräkna rätt period (föregående månad) ===
    const [year, month] = monthId.split("-").map(Number);
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // === FIX: Hämta hundar med aktiva abonnemang (EXKLUDERA Dagshund) ===
    const { data: dogs, error: dogsErr } = await supabase
      .from("dogs")
      .select(
        `
      id, name, subscription, owner_id, org_id, startdate, enddate,
      owner:owners (full_name, email)
    `
      )
      .not("subscription", "is", null)
      .not("subscription", "eq", "")
      .not("subscription", "eq", "Dagshund") // Dagshundar faktureras INTE månadsvis
      .lte("startdate", endOfMonth.toISOString().split("T")[0])
      .or(
        `enddate.is.null,enddate.gte.${startOfMonth.toISOString().split("T")[0]}`
      );

    if (dogsErr) throw new Error(`Dogs fetch error: ${dogsErr.message}`);

    if (!dogs?.length) {
      console.log("⚠️ No active subscription dogs found.");
      await supabase.from("function_logs").insert([
        {
          function_name: "generate_invoices",
          status: "warning",
          message: `No active subscription dogs for ${monthId}`,
        },
      ]);

      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "success",
          invoices_created: 0,
          metadata: {
            message: "No active subscription dogs found",
            timestamp: new Date().toISOString(),
          },
        },
      ]);

      return new Response("No active subscriptions", { status: 200 });
    }

    console.log(`🐶 Found ${dogs.length} dogs with active subscriptions.`);
    const invoices = [];

    // === Gruppera hundar per ägare & org ===
    const owners = {};
    for (const d of dogs) {
      const ownerName = d.owner?.full_name ?? "Okänd ägare";
      const orgId = d.org_id ?? null;
      const ownerId = d.owner_id ?? null;
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
      const ownerId = info.owner_id ?? null;

      if (!orgId) {
        console.warn(`⚠️ No org_id for owner ${ownerName}, skipping`);
        continue;
      }

      dogCount += dogsList.length;
      const lines = [];
      let total = 0;

      // === FIX: Hämta daycare_pricing för denna organisation ===
      const { data: pricingData, error: pricingErr } = await supabase
        .from("daycare_pricing")
        .select("*")
        .eq("org_id", orgId)
        .maybeSingle();

      if (pricingErr || !pricingData) {
        console.error(
          `❌ No daycare_pricing for org ${orgId}:`,
          pricingErr?.message
        );
        console.log(`⚠️ Skipping owner ${ownerName} - no pricing configured`);
        continue;
      }

      console.log(`💰 Loaded pricing for org ${orgId}:`, {
        subscription_5days: pricingData.subscription_5days,
        subscription_3days: pricingData.subscription_3days,
        subscription_2days: pricingData.subscription_2days,
        sibling_discount: pricingData.sibling_discount_percent,
      });

      // === FIX: Korrekt subscription-mappning ===
      const subscriptionMap = {
        Heltid: pricingData.subscription_5days || 0,
        "Deltid 4": pricingData.subscription_4days || 0,
        "Deltid 3": pricingData.subscription_3days || 0,
        "Deltid 2": pricingData.subscription_2days || 0,
        "Deltid 1": pricingData.subscription_1day || 0,
      };

      for (const d of dogsList) {
        const sub = d.subscription?.trim();
        const priceVal = subscriptionMap[sub];

        if (priceVal === undefined) {
          console.warn(
            `⚠️ Unknown subscription type "${sub}" for dog ${d.name}`
          );
          continue;
        }

        if (priceVal === 0) {
          console.warn(
            `⚠️ Zero price for subscription "${sub}" (dog: ${d.name})`
          );
        }

        // Basprenumeration
        if (priceVal > 0) {
          lines.push({
            description: `${d.name} – ${sub}`,
            quantity: 1,
            unit_price: priceVal,
            total: priceVal,
          });
          total += priceVal;
          console.log(`  ✅ ${d.name}: ${sub} = ${priceVal} kr`);
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
          .or(
            `end_date.is.null,end_date.gte.${startOfMonth.toISOString().split("T")[0]}`
          ); // Inget slutdatum ELLER slutar efter/under månadens start

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
              const daysInCurrentMonth = new Date(year, month, 0).getDate() - 1; // Approximate working days
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
      const siblingDiscountPercent = pricingData.sibling_discount_percent || 0;
      if (dogsList.length > 1 && siblingDiscountPercent > 0 && total > 0) {
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

      // === Skapa faktura om det finns rader ===
      if (lines.length > 0 && total > 0) {
        invoices.push({
          org_id: orgId,
          owner_id: ownerId,
          billed_name: ownerName,
          billed_email: ownerEmail,
          invoice_date: startOfMonth.toISOString().split("T")[0],
          due_date: endOfMonth.toISOString().split("T")[0],
          lines,
          total_amount: total,
          status: "draft",
          invoice_type: "full",
        });
        totalAmount += total;
      } else {
        console.log(`⚠️ No billable items for ${ownerName}, skipping invoice`);
      }
    }

    // === Spara fakturor ===
    if (invoices.length > 0) {
      console.log(`💾 Inserting ${invoices.length} invoices...`);

      let invoiceCount = 0;

      for (const inv of invoices) {
        const lines = inv.lines;
        delete inv.lines;

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
          `✅ Invoice created: ${insertedInvoice.invoice_number} (ID: ${insertedInvoice.id}) for ${inv.billed_name}, Amount: ${inv.total_amount} kr`
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

        console.log(
          `✅ Fakturaunderlag skapat: ${insertedInvoice.invoice_number} (${inv.billed_name})`
        );

        invoiceCount++;
      }

      console.log(
        `✅ Successfully inserted ${invoiceCount} invoices with total amount: ${totalAmount.toFixed(2)} kr`
      );

      // Logga i invoice_runs tabell
      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "success",
          invoices_created: invoiceCount,
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
          message: `✅ ${invoiceCount} invoices created for ${monthId} (Total: ${totalAmount.toFixed(2)} kr, ${dogCount} dogs)`,
        },
      ]);

      // === Skicka e-post via Supabase SMTP ===
      try {
        await supabase.functions.invoke("send_email", {
          body: {
            to: "cassandrawikgren@icloud.com",
            subject: `DogPlanner – Fakturagenerering klar (${monthId})`,
            text: `✅ Fakturagenereringen är färdig!\n\n${invoiceCount} fakturor skapades för ${monthId}.\nTotalt belopp: ${totalAmount.toFixed(2)} kr\nAntal hundar: ${dogCount}`,
          },
        });
      } catch (emailErr) {
        console.warn("⚠️ Email notification failed:", emailErr.message);
      }
    } else {
      console.log("⚠️ No invoices to insert");
      await supabase.from("function_logs").insert([
        {
          function_name: "generate_invoices",
          status: "warning",
          message: `No billable invoices generated for ${monthId}`,
        },
      ]);

      await supabase.from("invoice_runs").insert([
        {
          month_id: monthId,
          status: "success",
          invoices_created: 0,
          metadata: {
            message: "No billable subscriptions found",
            timestamp: new Date().toISOString(),
          },
        },
      ]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        month: monthId,
        invoices_created: invoices.length,
        total_amount: totalAmount,
        dog_count: dogCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
