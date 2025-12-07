import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import streamBuffers from "stream-buffers";

// ==========================
// Typdefinitioner
// ==========================

type OrgInfo = {
  id: string;
  name: string | null;
  org_number: string | null;
  email: string | null;
  phone: string | null;
  swish_number: string | null;
  bankgiro: string | null;
  logo_url: string | null;
};

type OwnerInfo = {
  id: string;
  full_name: string | null;
  customer_number: number | null;
  email: string | null;
  phone: string | null;
};

type InvoiceResult = {
  id: string;
  org_id: string | null;
  owner_id: string | null;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  billed_name: string | null;
  billed_email: string | null;
  billed_address: string | null;
  orgs: OrgInfo | null;
  owners: OwnerInfo | null;
};

// ==========================
// Supabase-konfiguration
// ==========================

// (Moved inside POST function for Next.js 15 async cookies)

// ==========================
// POST – generera faktura-PDF
// ==========================

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // 🔒 SÄKERHETSKONTROLL: Verifiera autentisering
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[ERR-1000] Unauthorized PDF request");
      return NextResponse.json(
        { error: "Du måste vara inloggad för att ladda ner fakturor." },
        { status: 401 }
      );
    }

    const { invoiceId } = await req.json();
    if (!invoiceId) {
      console.error("[ERR-1001] Ingen faktura angiven i POST-body.");
      return NextResponse.json(
        { error: "Ingen faktura angiven." },
        { status: 400 }
      );
    }

    // 🔒 SÄKERHETSKONTROLL: Hämta användarens org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    // ==========================
    // Hämta faktura med relationer
    // ==========================
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        id,
        org_id,
        owner_id,
        invoice_date,
        due_date,
        total_amount,
        status,
        billed_name,
        billed_email,
        billed_address,
        orgs (
          id,
          name,
          org_number,
          email,
          phone,
          swish_number,
          bankgiro,
          logo_url
        ),
        owners (
          id,
          full_name,
          customer_number,
          email,
          phone
        )
      `
      )
      .eq("id", invoiceId)
      .maybeSingle<InvoiceResult>();

    if (error || !invoice) {
      console.error("[ERR-1002] Faktura kunde inte hämtas:", error);
      return NextResponse.json(
        { error: "Kunde inte hämta faktura." },
        { status: 500 }
      );
    }

    // 🔒 SÄKERHETSKONTROLL: Verifiera att fakturan tillhör användarens organisation
    if (profile?.org_id && invoice.org_id !== profile.org_id) {
      console.error(
        `[ERR-1003] Unauthorized: User org ${profile.org_id} tried to access invoice from org ${invoice.org_id}`
      );
      return NextResponse.json(
        { error: "Du har inte behörighet att visa denna faktura." },
        { status: 403 }
      );
    }

    // ==========================
    // Skapa PDF-dokument
    // ==========================
    const doc = new PDFDocument({ margin: 50 });
    const stream = new streamBuffers.WritableStreamBuffer();

    // ==========================
    // Logotyp
    // ==========================
    try {
      if (invoice.orgs?.logo_url) {
        const logoRes = await fetch(invoice.orgs.logo_url);
        if (logoRes.ok) {
          const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
          doc.image(logoBuffer, 50, 40, { width: 100 });
        }
      } else {
        // fallback-logo (DogPlanner standard)
        const defaultLogoPath = "./public/dogplanner-logo.png";
        doc.image(defaultLogoPath, 50, 40, { width: 100 });
      }
    } catch (err) {
      console.error("[WARN-2001] Kunde inte ladda logotyp:", err);
    }

    // ==========================
    // Rubrik & företag
    // ==========================
    doc.fontSize(20).fillColor("#2C7A4C");
    doc
      .text(invoice.orgs?.name || "Hundpensionat", { align: "left" })
      .moveDown(0.5);
    doc.fontSize(12).fillColor("black");
    doc.text(`Organisationsnummer: ${invoice.orgs?.org_number || "-"}`);
    doc.text(`E-post: ${invoice.orgs?.email || "-"}`);
    doc.text(`Telefon: ${invoice.orgs?.phone || "-"}`);
    doc.moveDown(1);

    // ==========================
    // Kundinformation
    // ==========================
    doc.fontSize(12);
    doc.text(`Faktura till: ${invoice.owners?.full_name || "-"}`);
    doc.text(`Kundnummer: ${invoice.owners?.customer_number || "-"}`);
    doc.text(`E-post: ${invoice.owners?.email || "-"}`);
    doc.text(`Telefon: ${invoice.owners?.phone || "-"}`);
    doc.moveDown(1);

    // ==========================
    // Fakturainfo
    // ==========================
    doc.text(`Fakturanummer: ${invoice.id}`);
    doc.text(`Fakturadatum: ${invoice.invoice_date}`);
    doc.text(`Förfallodatum: ${invoice.due_date}`);
    doc.text(`Belopp att betala: ${invoice.total_amount.toFixed(2)} kr`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown(1);

    // ==========================
    // Betalningsinformation
    // ==========================
    const org = invoice.orgs;
    const paymentY = doc.y;
    if (org?.swish_number && org?.bankgiro) {
      doc.text(
        `Swish: ${org.swish_number}  |  Bankgiro: ${org.bankgiro}`,
        50,
        paymentY + 15
      );
    } else if (org?.swish_number) {
      const swishData = `C:${
        org.swish_number
      }\nA:${invoice.total_amount.toFixed(2)}\nM:Faktura ${invoice.id}`;
      const qrDataUrl = await QRCode.toDataURL(swishData, { width: 150 });
      const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
      doc.image(qrBuffer, 400, paymentY, { width: 80 });
      doc.text(`Betala med Swish: ${org.swish_number}`, 50, paymentY + 15);
    } else if (org?.bankgiro) {
      doc.text(`Bankgiro: ${org.bankgiro}`, 50, paymentY + 15);
    } else {
      doc.text(
        "Betalningsinformation saknas – kontakta företaget.",
        50,
        paymentY + 15
      );
    }

    // ==========================
    // Generera PDF
    // ==========================
    doc.end();
    doc.pipe(stream);

    // Vänta tills skrivningen är klar
    await new Promise((resolve) => doc.on("end", resolve));

    const pdfBuffer = stream.getContents();
    if (!pdfBuffer) {
      console.error("[ERR-3001] PDF-buffer saknas.");
      throw new Error("Ingen PDF-data genererades.");
    }

    // ==========================
    // Ladda upp PDF till Supabase Storage
    // ==========================
    const filePath = `invoices/${invoice.org_id}/${invoice.id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[ERR-3002] Misslyckades ladda upp PDF:", uploadError);
      throw uploadError;
    }

    // ==========================
    // Skapa signad länk (24h)
    // ==========================
    const { data: signed, error: signedErr } = await supabase.storage
      .from("invoices")
      .createSignedUrl(filePath, 60 * 60 * 24);

    if (signedErr || !signed) {
      console.error("[ERR-3003] Kunde inte skapa signerad URL:", signedErr);
      throw signedErr;
    }

    // ==========================
    // Returnera länk
    // ==========================
    return NextResponse.json({
      success: true,
      message: "Faktura genererad.",
      url: signed.signedUrl,
    });
  } catch (err: any) {
    console.error("[ERR-9999] Okänt fel i fakturagenerering:", err);
    return NextResponse.json(
      { error: "Fel vid generering av faktura.", details: err.message },
      { status: 500 }
    );
  }
}
