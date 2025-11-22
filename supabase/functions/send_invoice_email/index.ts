// @ts-nocheck
// ================================================================
// DogPlanner - Send Invoice Email
// ================================================================
// Skickar faktura via email till hundägare
// Inkluderar PDF som bilaga
// Uppdaterar faktura till status='sent'
// ================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

// SMTP2GO för email-utskick (1000 gratis emails/månad, ingen domänverifiering behövs)
const SMTP2GO_API_KEY = Deno.env.get("SMTP2GO_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { invoice_id } = await req.json();

    if (!invoice_id) {
      return new Response(
        JSON.stringify({ error: "invoice_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📧 Sending invoice email for invoice_id: ${invoice_id}`);

    // Skapa Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Hämta faktura med all data
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        *,
        owners (
          id,
          full_name,
          email,
          phone,
          address,
          postal_code,
          city
        ),
        orgs (
          id,
          name,
          email,
          phone,
          org_number,
          address,
          postal_code,
          city,
          bankgiro,
          plusgiro,
          swish_number,
          iban,
          bic,
          payment_terms_days,
          logo_url
        )
      `)
      .eq("id", invoice_id)
      .single();

    if (fetchError || !invoice) {
      console.error("Failed to fetch invoice:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validera att ägaren har email
    if (!invoice.owners?.email) {
      console.error("Owner has no email address");
      return new Response(
        JSON.stringify({ error: "Owner has no email address" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validera att fakturan är i rätt status
    if (invoice.status !== "draft") {
      console.error(`Invoice status is ${invoice.status}, expected 'draft'`);
      return new Response(
        JSON.stringify({ 
          error: `Cannot send invoice with status '${invoice.status}'. Only draft invoices can be sent.` 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Invoice data fetched: ${invoice.invoice_number}`);
    console.log(`📬 Sending to: ${invoice.owners.email}`);

    // Generera PDF URL
    const pdfUrl = `${SUPABASE_URL}/api/pdf?id=${invoice_id}`;

    // Bygg betalningsinformation
    let paymentInfo = "";
    if (invoice.orgs.bankgiro) {
      paymentInfo += `<li><strong>Bankgiro:</strong> ${invoice.orgs.bankgiro}</li>`;
    }
    if (invoice.orgs.plusgiro) {
      paymentInfo += `<li><strong>Plusgiro:</strong> ${invoice.orgs.plusgiro}</li>`;
    }
    if (invoice.orgs.swish_number) {
      paymentInfo += `<li><strong>Swish:</strong> ${invoice.orgs.swish_number}</li>`;
    }
    if (invoice.orgs.iban) {
      paymentInfo += `<li><strong>IBAN:</strong> ${invoice.orgs.iban}`;
      if (invoice.orgs.bic) {
        paymentInfo += ` (BIC: ${invoice.orgs.bic})`;
      }
      paymentInfo += `</li>`;
    }

    if (!paymentInfo) {
      paymentInfo = "<li><em>Kontakta oss för betalningsinformation</em></li>";
    }

    // OCR eller fakturanummer
    const paymentReference = invoice.ocr_number 
      ? `<p><strong>OCR-nummer:</strong> ${invoice.ocr_number}</p>`
      : `<p><strong>Fakturanummer:</strong> ${invoice.invoice_number}</p>`;

    // Formatera datum
    const formatDate = (dateStr) => {
      if (!dateStr) return "Ej angivet";
      const date = new Date(dateStr);
      return date.toLocaleDateString("sv-SE");
    };

    // Email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 3px solid #2c7a4c;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #2c7a4c;
      margin: 0;
    }
    .invoice-title {
      font-size: 20px;
      font-weight: bold;
      color: #2c7a4c;
      margin: 20px 0 10px;
    }
    .amount-box {
      background-color: #e8f5e9;
      border: 2px solid #2c7a4c;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #2c7a4c;
      margin: 0;
    }
    .amount-label {
      font-size: 14px;
      color: #666;
      margin: 5px 0 0;
    }
    .info-section {
      margin: 20px 0;
    }
    .info-section h3 {
      color: #2c7a4c;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .info-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .info-section li {
      padding: 5px 0;
    }
    .due-date {
      background-color: #fff3e0;
      border-left: 4px solid #ff9800;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 14px;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #2c7a4c;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 4px;
      margin: 10px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="logo">${invoice.orgs.name}</p>
      <p style="margin: 5px 0 0; color: #666;">
        ${invoice.orgs.address || ""}${invoice.orgs.postal_code ? ", " + invoice.orgs.postal_code : ""}${invoice.orgs.city ? " " + invoice.orgs.city : ""}
      </p>
    </div>

    <h2 class="invoice-title">Faktura ${invoice.invoice_number}</h2>
    
    <p>Hej ${invoice.owners.full_name}!</p>
    
    <p>Här kommer din faktura från ${invoice.orgs.name}. Se bifogad PDF för fullständiga detaljer.</p>

    <div class="amount-box">
      <p class="amount">${invoice.total_amount.toLocaleString("sv-SE")} kr</p>
      <p class="amount-label">Totalt att betala</p>
    </div>

    <div class="due-date">
      <strong>⏰ Förfallodatum:</strong> ${formatDate(invoice.due_date)}
      <br>
      <em>Var vänlig betala senast detta datum.</em>
    </div>

    ${paymentReference}

    <div class="info-section">
      <h3>💳 Betala via:</h3>
      <ul>
        ${paymentInfo}
      </ul>
    </div>

    <div class="info-section">
      <h3>📄 Fakturadetaljer</h3>
      <ul>
        <li><strong>Fakturanummer:</strong> ${invoice.invoice_number}</li>
        <li><strong>Fakturadatum:</strong> ${formatDate(invoice.invoice_date)}</li>
        <li><strong>Förfallodatum:</strong> ${formatDate(invoice.due_date)}</li>
        ${invoice.invoice_type !== "full" ? `<li><strong>Typ:</strong> ${invoice.invoice_type === "prepayment" ? "Förskott" : "Slutbetalning"}</li>` : ""}
      </ul>
    </div>

    <div class="footer">
      <p><strong>Frågor?</strong></p>
      <p>
        Kontakta oss på:<br>
        📧 ${invoice.orgs.email || "Ingen email angiven"}<br>
        📞 ${invoice.orgs.phone || "Inget telefonnummer angivet"}
      </p>
      <p style="margin-top: 20px;">
        Med vänliga hälsningar,<br>
        <strong>${invoice.orgs.name}</strong>
      </p>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">
        Detta är en automatiskt genererad faktura från DogPlanner.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Skicka email via SMTP2GO (1000 gratis emails/månad, ingen domänverifiering behövs)
    console.log("📤 Sending email via SMTP2GO...");
    
    const SMTP2GO_API_KEY = Deno.env.get("SMTP2GO_API_KEY");
    if (!SMTP2GO_API_KEY) {
      throw new Error("SMTP2GO_API_KEY saknas i Supabase secrets");
    }
    
    const emailResponse = await fetch("https://api.smtp2go.com/v3/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: SMTP2GO_API_KEY,
        to: [invoice.owners.email],
        sender: `${invoice.orgs.name} <noreply@smtp2go.com>`, // SMTP2GO's domän fungerar direkt
        subject: `Faktura ${invoice.invoice_number} från ${invoice.orgs.name}`,
        html_body: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("SMTP2GO API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("✅ Email sent successfully:", emailResult);

    // Uppdatera faktura till 'sent'
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoice_id);

    if (updateError) {
      console.error("Failed to update invoice status:", updateError);
      // Email är skickad, men status-uppdatering misslyckades
      // Vi returnerar success ändå eftersom emailet gick iväg
    } else {
      console.log("✅ Invoice status updated to 'sent'");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invoice email sent successfully",
        email_id: emailResult.id,
        sent_to: invoice.owners.email,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error sending invoice email:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to send invoice email",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
