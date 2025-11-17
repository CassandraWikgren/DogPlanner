/**
 * 📧 Email-sändning med Resend
 * Integrerat med DogPlanner's två-nivåers email-system
 *
 * Använder:
 * - Resend API för faktisk email-sändning
 * - emailConfig.ts för routing (system vs organisation)
 * - HTML-templates för snygga emails
 */

import { Resend } from "resend";
import { getEmailSender, getOrgEmailConfig } from "./emailConfig";
import {
  getApplicationConfirmationEmail,
  getApplicationNotificationEmail,
  getApplicationApprovedEmail,
  getApplicationRejectedEmail,
  ApplicationConfirmationData,
  ApplicationNotificationData,
  ApplicationApprovedData,
  ApplicationRejectedData,
} from "./emailTemplates";

// Initialize Resend client (only if API key is available)
let resend: Resend | null = null;

try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (error) {
  console.warn("Resend initialization failed:", error);
}

// Email templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  orgId?: string; // För att använda org-specifik avsändare
}

/**
 * Huvudfunktion för att skicka email
 */
export async function sendEmail(
  template: EmailTemplate,
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Kontrollera att Resend API-nyckel finns och klienten är initialiserad
    if (!resend) {
      console.error("Resend client not initialized or RESEND_API_KEY missing");
      return {
        success: false,
        error:
          "Email service not configured. Please add RESEND_API_KEY to environment variables.",
      };
    }

    // Hämta avsändarinformation
    // Default till customer_communication för hunddagis-emails
    const emailType = options.orgId
      ? "customer_communication"
      : "system_notification";
    const senderInfo = await getEmailSender(emailType as any, options.orgId);

    // Skicka email via Resend
    const result = await resend.emails.send({
      from: `${senderInfo.name} <${senderInfo.email}>`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo || senderInfo.replyTo,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return {
        success: false,
        error: `Email sending failed: ${result.error.message}`,
      };
    }

    console.log("✅ Email sent successfully:", result.data?.id);
    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error("Email sending error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred while sending email",
    };
  }
}

// ===========================================
// FÖRKONFIGURERADE EMAIL-TEMPLATES
// ===========================================

/**
 * Email när intresseanmälan överförs till hunddagis
 */
export function createWelcomeToHunddagisEmail(
  ownerName: string,
  dogName: string,
  startDate?: string,
  orgName?: string
): EmailTemplate {
  const formattedStartDate = startDate
    ? new Date(startDate).toLocaleDateString("sv-SE")
    : "kommer att meddelas";

  return {
    subject: `🎉 Välkommen till ${orgName || "vår hunddagis"}!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Välkommen till hunddagis</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2c7a4c, #34d15a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🐕 Välkommen till ${
              orgName || "hunddagis"
            }!</h1>
          </div>

          <!-- Content -->
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hej <strong>${ownerName}</strong>!</p>
            
            <p style="margin-bottom: 20px;">
              Vi är glada att meddela att <strong>${dogName}</strong> har fått en plats hos oss! 🎉
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2c7a4c; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #2c7a4c;">📅 Startdatum</h3>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">${formattedStartDate}</p>
            </div>

            <h3 style="color: #2c7a4c; margin-top: 30px;">🎒 Nästa steg:</h3>
            <ul style="margin-bottom: 20px;">
              <li>Vi kontaktar dig inom kort för att boka ett första besök</li>
              <li>Ta med hundpass och vaccinationsbevis</li>
              <li>Packa ${dogName}s favoritleksak för första dagen</li>
            </ul>

            <p style="margin-bottom: 20px;">
              Har du frågor eller funderingar? Tveka inte att höra av dig!
            </p>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <p style="margin: 0; font-style: italic; color: #2c7a4c;">
                Vi ser fram emot att träffa ${dogName}! 🐾
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p style="margin: 0;">Med vänliga hälsningar,<br>
            <strong>${orgName || "Hunddagis-teamet"}</strong></p>
          </div>

        </div>
      </body>
      </html>
    `,
    text: `
Hej ${ownerName}!

Vi är glada att meddela att ${dogName} har fått en plats hos oss!

Startdatum: ${formattedStartDate}

Nästa steg:
- Vi kontaktar dig inom kort för att boka ett första besök
- Ta med hundpass och vaccinationsbevis  
- Packa ${dogName}s favoritleksak för första dagen

Har du frågor eller funderingar? Tveka inte att höra av dig!

Vi ser fram emot att träffa ${dogName}!

Med vänliga hälsningar,
${orgName || "Hunddagis-teamet"}
    `,
  };
}

/**
 * Email för avslag på intresseanmälan
 */
export function createRejectionEmail(
  ownerName: string,
  dogName: string,
  reason?: string,
  orgName?: string
): EmailTemplate {
  return {
    subject: `Angående ${dogName}s ansökan till ${orgName || "hunddagis"}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Angående hunddagisansökan</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: #f8f9fa; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-bottom: 3px solid #2c7a4c;">
            <h1 style="margin: 0; font-size: 24px;">Angående ${dogName}s ansökan</h1>
          </div>

          <!-- Content -->
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hej <strong>${ownerName}</strong>,</p>
            
            <p style="margin-bottom: 20px;">
              Tack för din intresseanmälan för <strong>${dogName}</strong>. 
              Tyvärr kan vi just nu inte erbjuda en plats.
            </p>

            ${
              reason
                ? `
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ffa500; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #d67e00;">📝 Anledning</h3>
              <p style="margin: 0;">${reason}</p>
            </div>
            `
                : ""
            }

            <p style="margin-bottom: 20px;">
              Vi rekommenderar att du ansöker igen om några månader, då situationen kan ha förändrats.
            </p>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-top: 30px;">
              <p style="margin: 0; font-style: italic; color: #2c7a4c;">
                Tack för ditt intresse och lycka till med ${dogName}! 🐾
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p style="margin: 0;">Med vänliga hälsningar,<br>
            <strong>${orgName || "Hunddagis-teamet"}</strong></p>
          </div>

        </div>
      </body>
      </html>
    `,
    text: `
Hej ${ownerName},

Tack för din intresseanmälan för ${dogName}. Tyvärr kan vi just nu inte erbjuda en plats.

${reason ? `Anledning: ${reason}` : ""}

Vi rekommenderar att du ansöker igen om några månader, då situationen kan ha förändrats.

Tack för ditt intresse och lycka till med ${dogName}!

Med vänliga hälsningar,
${orgName || "Hunddagis-teamet"}
    `,
  };
}

/**
 * Email för att bekräfta mottagning av intresseanmälan
 */
export function createApplicationReceivedEmail(
  ownerName: string,
  dogName: string,
  orgName?: string
): EmailTemplate {
  return {
    subject: `✅ Din ansökan för ${dogName} är mottagen`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ansökan mottagen</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2c7a4c, #34d15a); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">✅ Ansökan mottagen!</h1>
          </div>

          <!-- Content -->
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hej <strong>${ownerName}</strong>!</p>
            
            <p style="margin-bottom: 20px;">
              Vi har mottagit din intresseanmälan för <strong>${dogName}</strong> och tackar för ditt intresse! 
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2c7a4c; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #2c7a4c;">⏰ Vad händer nu?</h3>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Vi går igenom din ansökan inom 1-3 arbetsdagar</li>
                <li>Du får svar via email så snart vi har beslutat</li>
                <li>Vid godkännande kontaktar vi dig för introduktionsbesök</li>
              </ul>
            </div>

            <p style="margin-bottom: 20px;">
              Har du några frågor under tiden? Tveka inte att höra av dig!
            </p>

            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; text-align: center; margin-top: 30px;">
              <p style="margin: 0; font-style: italic; color: #2c7a4c;">
                Tack för ditt tålamod! 🐾
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px; color: #666; font-size: 14px;">
            <p style="margin: 0;">Med vänliga hälsningar,<br>
            <strong>${orgName || "Hunddagis-teamet"}</strong></p>
          </div>

        </div>
      </body>
      </html>
    `,
    text: `
Hej ${ownerName}!

Vi har mottagit din intresseanmälan för ${dogName} och tackar för ditt intresse!

Vad händer nu?
- Vi går igenom din ansökan inom 1-3 arbetsdagar
- Du får svar via email så snart vi har beslutat  
- Vid godkännande kontaktar vi dig för introduktionsbesök

Har du några frågor under tiden? Tveka inte att höra av dig!

Tack för ditt tålamod!

Med vänliga hälsningar,
${orgName || "Hunddagis-teamet"}
    `,
  };
}

/**
 * Enkel hjälpfunktion för att skicka välkomstmail
 */
export async function sendWelcomeEmail(
  ownerEmail: string,
  ownerName: string,
  dogName: string,
  startDate?: string,
  orgId?: string
): Promise<{ success: boolean; error?: string }> {
  // Hämta organisation info för att få orgName
  let orgName = "vår hunddagis";
  if (orgId) {
    try {
      const orgConfig = await getOrgEmailConfig(orgId);
      // Vi behöver hämta org-namnet separat - detta är en förenkling
      orgName = "hunddagis"; // TODO: Hämta från org-tabellen
    } catch (e) {
      console.warn("Could not fetch org name:", e);
    }
  }

  const template = createWelcomeToHunddagisEmail(
    ownerName,
    dogName,
    startDate,
    orgName
  );

  return sendEmail(template, { to: ownerEmail, orgId });
}

// ===========================================
// PENSIONAT ANSÖKNINGS-EMAILS
// ===========================================

/**
 * Skicka bekräftelse till KUND när ansökan mottagits
 */
export async function sendApplicationConfirmationEmail(
  data: ApplicationConfirmationData,
  customerEmail: string,
  orgId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getApplicationConfirmationEmail(data);

  return sendEmail(template, {
    to: customerEmail,
    orgId,
    replyTo: undefined, // Use org's default reply-to from emailConfig
  });
}

/**
 * Skicka notifiering till PENSIONAT om ny ansökan
 */
export async function sendApplicationNotificationEmail(
  data: ApplicationNotificationData,
  pensionatEmail: string,
  orgId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getApplicationNotificationEmail(data);

  return sendEmail(template, {
    to: pensionatEmail,
    orgId,
    replyTo: data.ownerEmail, // Business can reply directly to customer
  });
}

/**
 * Skicka godkännande-email till KUND
 */
export async function sendApplicationApprovedEmail(
  data: ApplicationApprovedData,
  customerEmail: string,
  orgId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getApplicationApprovedEmail(data);

  return sendEmail(template, {
    to: customerEmail,
    orgId,
  });
}

/**
 * Skicka avslagsmail till KUND
 */
export async function sendApplicationRejectedEmail(
  data: ApplicationRejectedData,
  customerEmail: string,
  orgId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const template = getApplicationRejectedEmail(data);

  return sendEmail(template, {
    to: customerEmail,
    orgId,
  });
}
