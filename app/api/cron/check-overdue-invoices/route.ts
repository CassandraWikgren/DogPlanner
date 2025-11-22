import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * CRON-JOBB: Övervaka förfallna fakturor
 * 
 * Detta jobb SKICKAR INTE automatiska påminnelser.
 * Det MARKERAR endast fakturor som förfallna och räknar ut avgifter.
 * 
 * Företaget får själv välja när/om de vill skicka påminnelser.
 * DogPlanner tar INGET ansvar för inkasso eller betalningskrav.
 */

export async function GET(request: NextRequest) {
  try {
    // Verifiera att det är Vercel Cron som anropar
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Använd service role för server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    // Hämta alla obetalda fakturor som är förfallna
    const { data: overdueInvoices, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        org:orgs!invoices_org_id_fkey(
          id,
          name,
          interest_rate,
          late_fee_amount
        )
      `
      )
      .in("status", ["sent", "overdue", "reminder_1", "reminder_2"])
      .lt("due_date", todayStr)
      .is("paid_at", null);

    if (error) {
      console.error("Error fetching overdue invoices:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const results = {
      checked: overdueInvoices?.length || 0,
      newly_overdue: 0,
      interest_calculated: 0,
      errors: [] as string[],
    };

    // Gå igenom varje förfallen faktura
    for (const invoice of overdueInvoices || []) {
      try {
        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Beräkna dröjsmålsränta
        const interestRate = invoice.org?.interest_rate || 8.0;
        const baseAmount =
          invoice.total_amount -
          (invoice.reminder_1_fee || 0) -
          (invoice.reminder_2_fee || 0) -
          (invoice.late_interest || 0);

        const lateInterest =
          baseAmount * (interestRate / 100) * (daysOverdue / 365);
        const roundedInterest = Math.round(lateInterest * 100) / 100;

        // Uppdatera endast om status är 'sent' → 'overdue'
        // Vi MARKERAR inte automatiskt som reminder_1 eller reminder_2
        // Det gör företaget manuellt i gränssnittet
        if (invoice.status === "sent") {
          await supabase
            .from("invoices")
            .update({
              status: "overdue",
              late_interest: roundedInterest,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id);

          results.newly_overdue++;
        } else {
          // Uppdatera bara räntan för redan förfallna
          await supabase
            .from("invoices")
            .update({
              late_interest: roundedInterest,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invoice.id);
        }

        results.interest_calculated++;
      } catch (err: any) {
        console.error(`Error processing invoice ${invoice.id}:`, err);
        results.errors.push(`${invoice.id}: ${err.message}`);
      }
    }

    console.log("Overdue check completed:", results);

    return NextResponse.json({
      success: true,
      date: todayStr,
      ...results,
    });
  } catch (error: any) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * ANMÄRKNING FÖR FÖRETAGSKUND:
 * 
 * Detta system MARKERAR endast fakturor som förfallna och beräknar ränta.
 * 
 * För att SKICKA påminnelser:
 * 1. Gå till Ekonomi → Fakturor
 * 2. Filtrera på "Förfallna"
 * 3. Välj faktura → "Skicka påminnelse"
 * 
 * För inkasso:
 * - Exportera fakturor till ditt bokföringssystem
 * - Kontakta inkassobolag (t.ex. Intrum, Collectors)
 * - Använd fakturans OCR-nummer för spårning
 * 
 * DogPlanner tar INGET ansvar för:
 * - Att kräva in betalningar
 * - Inkassoärenden
 * - Juridiska processer
 * 
 * Vi tillhandahåller endast:
 * ✅ Faktureringsunderlag
 * ✅ Beräkning av avgifter och ränta
 * ✅ Exportformat för bokföring
 * ✅ Mallar för påminnelsebrev
 */
