import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { generateOCR } from "@/lib/ocrGenerator";

/**
 * EXPORT API FÖR FAKTUROR
 *
 * Exporterar fakturor i olika format för bokföringssystem.
 * Företaget kan sedan importera till Fortnox, Bokio, Visma, etc.
 *
 * Supported formats:
 * - CSV (Excel-kompatibelt)
 * - JSON (för API-integrationer)
 * - SIE (Svensk bokföringsstandard)
 */

interface InvoiceExportItem {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_number: number | null;
  customer_name: string;
  customer_email: string;
  customer_org_number: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: string;
  paid_date: string | null;
  ocr_number: string;
  reminder_1_date: string | null;
  reminder_2_date: string | null;
  reminder_1_fee: number;
  reminder_2_fee: number;
  late_interest: number;
  payment_method: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Autentisera användare
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hämta användarens organisation
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", session.user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation hittades" },
        { status: 404 }
      );
    }

    // Hämta query-parametrar
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv"; // csv, json, sie
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const status = searchParams.get("status"); // all, paid, unpaid, overdue

    // Bygg query för fakturor
    let query = supabase
      .from("invoices")
      .select(
        `
        id,
        invoice_number,
        invoice_date,
        due_date,
        total_amount,
        status,
        paid_date,
        payment_method,
        reminder_1_date,
        reminder_2_date,
        reminder_1_fee,
        reminder_2_fee,
        late_interest,
        owner:owners!invoices_owner_id_fkey(
          customer_number,
          full_name,
          email,
          org_number
        )
      `
      )
      .eq("org_id", profile.org_id)
      .order("invoice_date", { ascending: false });

    // Filtrera på datum
    if (startDate) {
      query = query.gte("invoice_date", startDate);
    }
    if (endDate) {
      query = query.lte("invoice_date", endDate);
    }

    // Filtrera på status
    if (status && status !== "all") {
      if (status === "paid") {
        query = query.eq("status", "paid");
      } else if (status === "unpaid") {
        query = query.in("status", [
          "sent",
          "overdue",
          "reminder_1",
          "reminder_2",
        ]);
      } else if (status === "overdue") {
        query = query.in("status", ["overdue", "reminder_1", "reminder_2"]);
      }
    }

    const { data: invoices, error: invoicesError } = await query;

    if (invoicesError) {
      return NextResponse.json(
        { error: invoicesError.message },
        { status: 500 }
      );
    }

    // Hämta fakturarader för alla fakturor
    const invoiceIds = invoices?.map((inv) => inv.id) || [];
    const { data: items } = await supabase
      .from("invoice_items")
      .select("*")
      .in("invoice_id", invoiceIds);

    // Bygg export-data
    const exportData: InvoiceExportItem[] = [];

    for (const invoice of invoices || []) {
      const invoiceItems =
        items?.filter((item) => item.invoice_id === invoice.id) || [];

      // Supabase returnerar owner som object, inte array
      const owner = Array.isArray(invoice.owner)
        ? invoice.owner[0]
        : invoice.owner;
      const ocrNumber = generateOCR(
        owner?.customer_number,
        invoice.invoice_number
      );

      for (const item of invoiceItems) {
        exportData.push({
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number || invoice.id.slice(0, 8),
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date,
          customer_number: owner?.customer_number || null,
          customer_name: owner?.full_name || "",
          customer_email: owner?.email || "",
          customer_org_number: owner?.org_number || null,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: 0, // Hundtjänster är momsfria
          vat_amount: 0,
          total_amount: item.total_amount,
          status: invoice.status,
          paid_date: invoice.paid_date,
          ocr_number: ocrNumber,
          reminder_1_date: invoice.reminder_1_date,
          reminder_2_date: invoice.reminder_2_date,
          reminder_1_fee: invoice.reminder_1_fee || 0,
          reminder_2_fee: invoice.reminder_2_fee || 0,
          late_interest: invoice.late_interest || 0,
          payment_method: invoice.payment_method,
        });
      }
    }

    // Generera output baserat på format
    if (format === "csv") {
      return generateCSV(exportData);
    } else if (format === "json") {
      return generateJSON(exportData, invoices || []);
    } else if (format === "sie") {
      return generateSIE(exportData, profile.org_id, supabase);
    } else {
      return NextResponse.json({ error: "Ogiltigt format" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export misslyckades", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generera CSV-export
 */
function generateCSV(data: InvoiceExportItem[]): NextResponse {
  const headers = [
    "Fakturanummer",
    "Fakturadatum",
    "Förfallodatum",
    "Kundnummer",
    "Kundnamn",
    "Kundepost",
    "Orgnr Kund",
    "Beskrivning",
    "Antal",
    "Á-pris",
    "Momssats",
    "Momsbelopp",
    "Totalt",
    "Status",
    "Betaldatum",
    "OCR-nummer",
    "Påminnelse 1",
    "Påminnelse 2",
    "Påminnelseavgift",
    "Dröjsmålsränta",
    "Betalningsmetod",
  ];

  const rows = data.map((item) => [
    item.invoice_number,
    item.invoice_date,
    item.due_date,
    item.customer_number || "",
    item.customer_name,
    item.customer_email,
    item.customer_org_number || "",
    `"${item.description.replace(/"/g, '""')}"`, // Escape quotes
    item.quantity,
    item.unit_price.toFixed(2),
    item.vat_rate + "%",
    item.vat_amount.toFixed(2),
    item.total_amount.toFixed(2),
    item.status,
    item.paid_date || "",
    item.ocr_number,
    item.reminder_1_date || "",
    item.reminder_2_date || "",
    (item.reminder_1_fee + item.reminder_2_fee).toFixed(2),
    item.late_interest.toFixed(2),
    item.payment_method || "",
  ]);

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fakturor-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}

/**
 * Generera JSON-export
 */
function generateJSON(
  data: InvoiceExportItem[],
  invoices: any[]
): NextResponse {
  const summary = {
    export_date: new Date().toISOString(),
    total_invoices: new Set(data.map((d) => d.invoice_id)).size,
    total_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    paid_amount: invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.total_amount, 0),
    unpaid_amount: invoices
      .filter((inv) => inv.status !== "paid")
      .reduce((sum, inv) => sum + inv.total_amount, 0),
  };

  const json = JSON.stringify(
    {
      summary,
      invoices: data,
    },
    null,
    2
  );

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="fakturor-export-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}

/**
 * Generera SIE-export (förenklad version)
 * För fullständig SIE4-export behövs mer komplett bokföringsinformation
 */
async function generateSIE(
  data: InvoiceExportItem[],
  orgId: string,
  supabase: any
): Promise<NextResponse> {
  // Hämta organisationsdata
  const { data: org } = await supabase
    .from("orgs")
    .select("name, org_number")
    .eq("id", orgId)
    .single();

  const lines: string[] = [];

  // SIE Header
  lines.push("#FLAGGA 0");
  lines.push('#PROGRAM "DogPlanner" 1.0');
  lines.push("#FORMAT PC8");
  lines.push(
    `#GEN ${new Date().toISOString().split("T")[0].replace(/-/g, "")}`
  );
  lines.push("#SIETYP 4");
  lines.push(`#ORGNR ${org?.org_number || ""}`);
  lines.push(`#FNAMN "${org?.name || ""}"`);
  lines.push("");

  // Gruppera per faktura
  const invoiceGroups = new Map<string, InvoiceExportItem[]>();
  for (const item of data) {
    if (!invoiceGroups.has(item.invoice_id)) {
      invoiceGroups.set(item.invoice_id, []);
    }
    invoiceGroups.get(item.invoice_id)!.push(item);
  }

  // Skapa verifikationer
  let verNr = 1;
  for (const [invoiceId, items] of invoiceGroups) {
    const firstItem = items[0];
    const totalAmount = items.reduce((sum, item) => sum + item.total_amount, 0);

    lines.push(
      `#VER A ${verNr} ${firstItem.invoice_date.replace(/-/g, "")} "${firstItem.invoice_number}"`
    );
    lines.push("{");
    lines.push(
      `  #TRANS 1510 {} ${totalAmount.toFixed(2)} ${firstItem.invoice_date.replace(/-/g, "")} "${firstItem.customer_name}"`
    );

    for (const item of items) {
      lines.push(
        `  #TRANS 3000 {} -${item.total_amount.toFixed(2)} ${firstItem.invoice_date.replace(/-/g, "")} "${item.description}"`
      );
    }

    lines.push("}");
    verNr++;
  }

  const sie = lines.join("\n");

  return new NextResponse(sie, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="fakturor-export-${new Date().toISOString().split("T")[0]}.se"`,
    },
  });
}
