import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import PDFDocument from "pdfkit";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
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
          city,
          postal_code
        ),
        org:orgs!invoices_org_id_fkey(
          name,
          org_number,
          address,
          postal_code,
          city,
          phone,
          email,
          website
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
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
      return NextResponse.json(
        { error: "Kunde inte hämta fakturarader" },
        { status: 500 }
      );
    }

    // Skapa PDF
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

    doc.text(
      `${invoice.org?.postal_code || ""} ${invoice.org?.city || ""}`,
      350,
      orgY + 27,
      { align: "right", width: 200 }
    );

    if (invoice.org?.org_number) {
      doc.text(`Org.nr: ${invoice.org.org_number}`, 350, orgY + 39, {
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

    if (invoice.owner?.postal_code && invoice.owner?.city) {
      doc.text(
        `${invoice.owner.postal_code} ${invoice.owner.city}`,
        330,
        customerBoxY + 54
      );
    }

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
      const itemTotal = item.total_amount || item.quantity * item.unit_price;
      subtotal += itemTotal;

      // Beskrivning (kan wrappa)
      doc.text(item.description, 60, currentY, { width: 250 });

      // Antal
      doc.text(item.quantity.toString(), 320, currentY, {
        width: 50,
        align: "right",
      });

      // Enhetspris
      doc.text(`${item.unit_price.toLocaleString("sv-SE")} kr`, 380, currentY, {
        width: 70,
        align: "right",
      });

      // Totalt
      doc.text(`${itemTotal.toLocaleString("sv-SE")} kr`, 460, currentY, {
        width: 80,
        align: "right",
      });

      currentY += 25;

      // Lägg till linje mellan rader
      if (index < items.length - 1) {
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
    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .fillColor("#000")
      .text("Betalningsinformation", 50, paymentY);

    doc.fontSize(9).font("Helvetica").fillColor("#666");
    doc.text(
      `Fakturan förfaller: ${new Date(invoice.due_date).toLocaleDateString("sv-SE")}`,
      50,
      paymentY + 20
    );
    doc.text("Betalningsvillkor: 30 dagar netto", 50, paymentY + 35);

    if (invoice.org?.email) {
      doc.text(`Vid frågor, kontakta: ${invoice.org.email}`, 50, paymentY + 50);
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
