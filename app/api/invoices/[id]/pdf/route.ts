import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { generateOCR, formatOCR, generateSwishURL } from "@/lib/ocrGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ⚠️ CRITICAL: Använd service_role key för att bypass RLS
    // Normala createClient() använder anon_key som blockeras av RLS-policyer
    const { createClient: createServiceClient } =
      await import("@supabase/supabase-js");
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    const invoiceId = params.id;

    // Hämta faktura med alla relationer
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        owner:owners!invoices_owner_id_fkey(
          full_name,
          email,
          phone,
          address,
          customer_number
        ),
        org:orgs!invoices_org_id_fkey(
          name,
          org_number,
          address,
          phone,
          email,
          website,
          bankgiro,
          plusgiro,
          swish_number,
          payment_terms_days,
          late_fee_amount,
          interest_rate
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError) {
      console.error("Invoice fetch error:", invoiceError);
      return NextResponse.json(
        { error: "Faktura hittades inte", details: invoiceError.message },
        { status: 404 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Faktura hittades inte" },
        { status: 404 }
      );
    }

    // Hämta fakturarader
    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId);

    if (itemsError) {
      console.error("Invoice items fetch error:", itemsError);
      return NextResponse.json(
        { error: "Kunde inte hämta fakturarader", details: itemsError.message },
        { status: 500 }
      );
    } // Skapa PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // --- HEADER ---
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .fillColor("#2c7a4c")
      .text("FAKTURA", 50, 50);

    // Organisationsinfo (höger)
    const orgY = 50;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text(invoice.org?.name || "DogPlanner", 350, orgY, {
        align: "right",
        width: 200,
      });

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666")
      .text(invoice.org?.address || "", 350, orgY + 15, {
        align: "right",
        width: 200,
      });

    // Note: postal_code and city not available in orgs table

    if (invoice.org?.org_number) {
      doc.text(`Org.nr: ${invoice.org.org_number}`, 350, orgY + 27, {
        align: "right",
        width: 200,
      });
    }

    if (invoice.org?.phone) {
      doc.text(`Tel: ${invoice.org.phone}`, 350, orgY + 51, {
        align: "right",
        width: 200,
      });
    }

    if (invoice.org?.email) {
      doc
        .fillColor("#2c7a4c")
        .text(invoice.org.email, 350, orgY + 63, {
          align: "right",
          width: 200,
          link: `mailto:${invoice.org.email}`,
        })
        .fillColor("#666");
    }

    // --- FAKTURAINFORMATION ---
    const infoY = 150;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("Fakturainformation", 50, infoY);

    const infoStartY = infoY + 20;
    doc.fontSize(9).font("Helvetica").fillColor("#666");

    doc
      .text("Fakturanummer:", 50, infoStartY)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text(invoice.invoice_number || invoice.id.slice(0, 8), 150, infoStartY);

    doc
      .font("Helvetica")
      .fillColor("#666")
      .text("Fakturadatum:", 50, infoStartY + 15)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text(
        new Date(invoice.invoice_date).toLocaleDateString("sv-SE"),
        150,
        infoStartY + 15
      );

    doc
      .font("Helvetica")
      .fillColor("#666")
      .text("Förfallodatum:", 50, infoStartY + 30)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text(
        new Date(invoice.due_date).toLocaleDateString("sv-SE"),
        150,
        infoStartY + 30
      );

    // Kundinfo (höger box)
    const customerBoxY = infoY;
    doc
      .rect(320, customerBoxY, 230, 80)
      .fillOpacity(0.05)
      .fillAndStroke("#2c7a4c", "#2c7a4c")
      .fillOpacity(1);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("Fakturaadress", 330, customerBoxY + 10);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#333")
      .text(
        invoice.billed_name || invoice.owner?.full_name,
        330,
        customerBoxY + 30
      );

    if (invoice.owner?.address) {
      doc.text(invoice.owner.address, 330, customerBoxY + 42);
    }

    // Note: postal_code and city not available in owners table

    // --- FAKTURARADER ---
    const tableTop = 280;
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("Specifikation", 50, tableTop);

    // Tabellhuvud
    const headerY = tableTop + 25;
    doc
      .rect(50, headerY, 500, 25)
      .fillOpacity(0.1)
      .fillAndStroke("#2c7a4c", "#2c7a4c")
      .fillOpacity(1);

    doc.fontSize(9).font("Helvetica-Bold").fillColor("#000");
    doc.text("Beskrivning", 60, headerY + 8, { width: 250 });
    doc.text("Antal", 320, headerY + 8, { width: 50, align: "right" });
    doc.text("Pris", 380, headerY + 8, { width: 70, align: "right" });
    doc.text("Summa", 460, headerY + 8, { width: 80, align: "right" });

    // Fakturarader
    let currentY = headerY + 35;
    let subtotal = 0;

    doc.fontSize(9).font("Helvetica").fillColor("#333");

    (items || []).forEach((item, index) => {
      const itemTotal = item.amount || (item.qty || 0) * (item.unit_price || 0);
      subtotal += itemTotal;

      // Beskrivning (kan wrappa)
      doc.text(item.description || "", 60, currentY, { width: 250 });

      // Antal
      doc.text((item.qty || 0).toString(), 320, currentY, {
        width: 50,
        align: "right",
      });

      // Enhetspris
      doc.text(
        `${(item.unit_price || 0).toLocaleString("sv-SE")} kr`,
        380,
        currentY,
        {
          width: 70,
          align: "right",
        }
      );

      // Totalt
      doc.text(`${itemTotal.toLocaleString("sv-SE")} kr`, 460, currentY, {
        width: 80,
        align: "right",
      });

      currentY += 25;

      // Lägg till linje mellan rader
      if (index < (items?.length || 0) - 1) {
        doc
          .strokeColor("#e5e7eb")
          .lineWidth(0.5)
          .moveTo(60, currentY - 5)
          .lineTo(540, currentY - 5)
          .stroke();
      }
    });

    // --- TOTALER ---
    const totalsY = currentY + 20;

    // Subtotal
    doc
      .strokeColor("#2c7a4c")
      .lineWidth(1)
      .moveTo(380, totalsY - 5)
      .lineTo(540, totalsY - 5)
      .stroke();

    doc.fontSize(10).font("Helvetica").fillColor("#000");
    doc.text("Delsumma:", 380, totalsY, { width: 80, align: "left" });
    doc
      .font("Helvetica-Bold")
      .text(`${subtotal.toLocaleString("sv-SE")} kr`, 460, totalsY, {
        width: 80,
        align: "right",
      });

    // Moms (0% för hundtjänster enligt svensk lag)
    doc
      .font("Helvetica")
      .text("Moms (0%):", 380, totalsY + 20, { width: 80, align: "left" });
    doc
      .font("Helvetica-Bold")
      .text("0 kr", 460, totalsY + 20, { width: 80, align: "right" });

    // Total
    doc
      .strokeColor("#2c7a4c")
      .lineWidth(2)
      .moveTo(380, totalsY + 45)
      .lineTo(540, totalsY + 45)
      .stroke();

    doc.fontSize(12).font("Helvetica-Bold").fillColor("#2c7a4c");
    doc.text("ATT BETALA:", 380, totalsY + 55, { width: 80, align: "left" });
    doc
      .fontSize(14)
      .text(
        `${invoice.total_amount.toLocaleString("sv-SE")} kr`,
        460,
        totalsY + 55,
        {
          width: 80,
          align: "right",
        }
      );

    // --- BETALNINGSINFORMATION ---
    const paymentY = totalsY + 100;

    // Box för betalningsinformation
    doc
      .rect(50, paymentY - 10, 250, 160)
      .fillOpacity(0.05)
      .fillAndStroke("#2c7a4c", "#2c7a4c")
      .fillOpacity(1);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#2c7a4c")
      .text("Betalningsinformation", 60, paymentY);

    let currentPaymentY = paymentY + 25;
    doc.fontSize(9).font("Helvetica").fillColor("#333");

    // Bankgiro + OCR
    if (invoice.org?.bankgiro) {
      doc.font("Helvetica-Bold").text("Bankgiro:", 60, currentPaymentY);
      doc.font("Helvetica").text(invoice.org.bankgiro, 140, currentPaymentY);
      currentPaymentY += 15;

      // Generera OCR-nummer
      const ocrNumber = generateOCR(
        invoice.owner?.customer_number,
        invoice.invoice_number
      );
      const formattedOCR = formatOCR(ocrNumber);

      doc.font("Helvetica-Bold").text("OCR-nummer:", 60, currentPaymentY);
      doc
        .font("Helvetica-Bold")
        .fillColor("#2c7a4c")
        .text(formattedOCR, 140, currentPaymentY);
      currentPaymentY += 20;
      doc.fillColor("#333");
    }

    // Plusgiro (om det finns)
    if (invoice.org?.plusgiro) {
      doc.font("Helvetica-Bold").text("Plusgiro:", 60, currentPaymentY);
      doc.font("Helvetica").text(invoice.org.plusgiro, 140, currentPaymentY);
      currentPaymentY += 15;
    }

    // Swish
    if (invoice.org?.swish_number) {
      doc.font("Helvetica-Bold").text("Swish:", 60, currentPaymentY);
      doc
        .font("Helvetica")
        .text(invoice.org.swish_number, 140, currentPaymentY);
      currentPaymentY += 20;
    }

    // Betalningsvillkor
    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666")
      .text("Betalningsvillkor:", 60, currentPaymentY);
    doc
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text(
        `${invoice.org?.payment_terms_days || 14} dagar netto`,
        140,
        currentPaymentY
      );
    currentPaymentY += 15;

    // Förfallodatum
    doc
      .font("Helvetica")
      .fillColor("#666")
      .text("Förfallodatum:", 60, currentPaymentY);
    doc
      .font("Helvetica-Bold")
      .fillColor("#d32f2f")
      .text(
        new Date(invoice.due_date).toLocaleDateString("sv-SE"),
        140,
        currentPaymentY
      );
    currentPaymentY += 10;

    // Swish QR-kod (höger sida)
    if (invoice.org?.swish_number) {
      try {
        const swishURL = generateSwishURL(
          invoice.org.swish_number,
          invoice.total_amount,
          invoice.invoice_number || invoice.id.slice(0, 8)
        );
        const qrDataURL = await QRCode.toDataURL(swishURL, {
          width: 120,
          margin: 1,
        });

        // Konvertera Data URL till Buffer
        const qrBuffer = Buffer.from(qrDataURL.split(",")[1], "base64");

        doc.image(qrBuffer, 330, paymentY + 10, { width: 100 });

        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor("#666")
          .text("Scanna för Swish", 330, paymentY + 115, {
            width: 100,
            align: "center",
          });
      } catch (qrError) {
        console.error("QR code generation error:", qrError);
      }
    }

    // Dröjsmålsränta och avgifter
    const feeY = paymentY + 165;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#999")
      .text(
        `Vid försenad betalning tillkommer påminnelseavgift (${
          invoice.org?.late_fee_amount || 60
        } kr) samt dröjsmålsränta (${invoice.org?.interest_rate || 8}% per år).`,
        50,
        feeY,
        { width: 500 }
      );

    // Påminnelsenotis (om fakturan är en påminnelse)
    if (invoice.status === "reminder_1" || invoice.status === "reminder_2") {
      const reminderY = feeY + 30;
      doc
        .rect(50, reminderY - 10, 500, 60)
        .fillOpacity(0.1)
        .fillAndStroke("#d32f2f", "#d32f2f")
        .fillOpacity(1);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#d32f2f")
        .text(
          invoice.status === "reminder_1"
            ? "BETALNINGSPÅMINNELSE"
            : "ANDRA BETALNINGSPÅMINNELSE",
          60,
          reminderY
        );

      doc.fontSize(9).font("Helvetica").fillColor("#333");

      if (invoice.status === "reminder_1") {
        doc.text(
          "Vi har inte mottagit betalning för denna faktura. Vänligen betala snarast för att undvika påminnelseavgift.",
          60,
          reminderY + 20,
          { width: 480 }
        );
      } else {
        doc.text(
          `Påminnelseavgift (${invoice.reminder_2_fee || 60} kr) och dröjsmålsränta har lagts till. Vid utebliven betalning överlämnas ärendet till inkasso.`,
          60,
          reminderY + 20,
          { width: 480 }
        );
      }
    }

    // Kontaktinformation
    if (invoice.org?.email) {
      const contactY =
        invoice.status === "reminder_1" || invoice.status === "reminder_2"
          ? feeY + 100
          : feeY + 30;
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666")
        .text(`Vid frågor, kontakta: `, 50, contactY);
      doc.fillColor("#2c7a4c").text(invoice.org.email, 140, contactY, {
        link: `mailto:${invoice.org.email}`,
      });
    }

    // --- FOOTER ---
    const pageHeight = doc.page.height;
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#999")
      .text("Denna faktura är genererad via DogPlanner", 50, pageHeight - 50, {
        align: "center",
        width: 500,
      });

    // Slutför PDF
    doc.end();

    // Vänta på att PDF:en ska färdigställas
    await new Promise<void>((resolve) => {
      doc.on("end", () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    // Returnera PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Faktura-${invoice.invoice_number || invoice.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Kunde inte generera PDF", details: error.message },
      { status: 500 }
    );
  }
}
