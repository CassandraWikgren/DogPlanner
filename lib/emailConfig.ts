/**
 * Email Configuration och Helper-funktioner
 *
 * Hanterar två nivåer av email:
 * 1. System-nivå (DogPlanner) - för plattforms-meddelanden
 * 2. Organisations-nivå - för kundkommunikation
 */

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { supabase as supabaseClient } from "@/lib/supabase";

// ============================================
// SYSTEM-NIVÅ EMAIL (DogPlanner)
// ============================================

export const SYSTEM_EMAILS = {
  info: "info@dogplanner.se",
  support: "support@dogplanner.se",
  noreply: "noreply@dogplanner.se",
} as const;

export const SYSTEM_EMAIL_NAME = "DogPlanner";

// ============================================
// EMAIL-TYPER
// ============================================

export type EmailType =
  | "system_notification" // Plattforms-meddelanden (använder DogPlanner email)
  | "customer_invoice" // Kundfakturor (använder organisations email)
  | "customer_confirmation" // Kundbekräftelser (använder organisations email)
  | "customer_reminder" // Påminnelser till kund (använder organisations email)
  | "password_reset" // Lösenordsåterställning (använder DogPlanner email)
  | "registration" // Registrering (använder DogPlanner email)
  | "support_ticket"; // Support (använder DogPlanner email)

// ============================================
// ORGANISATIONS EMAIL-INSTÄLLNINGAR
// ============================================

export interface OrgEmailConfig {
  contact_email?: string; // Generell kontakt-email
  invoice_email?: string; // Email för fakturor
  reply_to_email?: string; // Reply-to email
  email_sender_name?: string; // Avsändarnamn (t.ex. "Bella Hunddagis")
}

// ============================================
// HELPER-FUNKTIONER
// ============================================

/**
 * Hämta email-konfiguration för en organisation
 */
export async function getOrgEmailConfig(
  orgId: string
): Promise<OrgEmailConfig> {
  if (!supabaseClient) {
    console.error("Supabase client not available");
    return {};
  }

  const supabase = supabaseClient;

  const { data, error } = await supabase
    .from("orgs")
    .select(
      "email, contact_email, invoice_email, reply_to_email, email_sender_name, name"
    )
    .eq("id", orgId)
    .single();

  if (error) {
    console.error("Error fetching org email config:", error);
    return {};
  }

  if (!data) {
    return {};
  }

  return {
    contact_email:
      (data as any).contact_email || (data as any).email || undefined,
    invoice_email:
      (data as any).invoice_email || (data as any).email || undefined,
    reply_to_email:
      (data as any).reply_to_email || (data as any).email || undefined,
    email_sender_name:
      (data as any).email_sender_name || (data as any).name || undefined,
  };
}

/**
 * Bestäm vilken email och avsändarnamn som ska användas baserat på email-typ
 */
export async function getEmailSender(
  emailType: EmailType,
  orgId?: string
): Promise<{ email: string; name: string; replyTo?: string }> {
  // System-nivå emails (DogPlanner)
  const systemEmailTypes: EmailType[] = [
    "system_notification",
    "password_reset",
    "registration",
    "support_ticket",
  ];

  if (systemEmailTypes.includes(emailType)) {
    return {
      email: SYSTEM_EMAILS.noreply,
      name: SYSTEM_EMAIL_NAME,
      replyTo: SYSTEM_EMAILS.support,
    };
  }

  // Organisations-nivå emails (kund-kommunikation)
  if (!orgId) {
    console.warn(
      `Email type ${emailType} requires orgId but none provided. Using system email.`
    );
    return {
      email: SYSTEM_EMAILS.noreply,
      name: SYSTEM_EMAIL_NAME,
      replyTo: SYSTEM_EMAILS.support,
    };
  }

  const orgConfig = await getOrgEmailConfig(orgId);

  switch (emailType) {
    case "customer_invoice":
      return {
        email: orgConfig.invoice_email || SYSTEM_EMAILS.noreply,
        name: orgConfig.email_sender_name || "Hunddagis",
        replyTo: orgConfig.reply_to_email || orgConfig.contact_email,
      };

    case "customer_confirmation":
    case "customer_reminder":
      return {
        email: orgConfig.contact_email || SYSTEM_EMAILS.noreply,
        name: orgConfig.email_sender_name || "Hunddagis",
        replyTo: orgConfig.reply_to_email || orgConfig.contact_email,
      };

    default:
      return {
        email: SYSTEM_EMAILS.noreply,
        name: SYSTEM_EMAIL_NAME,
        replyTo: SYSTEM_EMAILS.support,
      };
  }
}

/**
 * Uppdatera organisations email-inställningar
 */
export async function updateOrgEmailConfig(
  orgId: string,
  config: Partial<OrgEmailConfig>
): Promise<{ success: boolean; error?: string }> {
  if (!supabaseClient) {
    return { success: false, error: "Supabase client not available" };
  }

  const supabase = supabaseClient;

  const { error } = await (supabase as any)
    .from("orgs")
    .update({
      contact_email: config.contact_email,
      invoice_email: config.invoice_email,
      reply_to_email: config.reply_to_email,
      email_sender_name: config.email_sender_name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  if (error) {
    console.error("Error updating org email config:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ============================================
// EMAIL-MALLAR (placeholder för framtida implementation)
// ============================================

export interface EmailTemplate {
  subject: string;
  body: string;
  isHtml?: boolean;
}

/**
 * Generera email-mall baserat på typ och data
 * TODO: Implementera när email-funktionalitet läggs till
 */
export function generateEmailTemplate(
  emailType: EmailType,
  data: Record<string, any>
): EmailTemplate {
  // Placeholder - implementeras när email-integration läggs till
  switch (emailType) {
    case "customer_invoice":
      return {
        subject: `Faktura från ${data.orgName}`,
        body: `Hej ${data.customerName},\n\nBifogat finner du din faktura.\n\nMed vänliga hälsningar,\n${data.orgName}`,
        isHtml: false,
      };

    case "customer_confirmation":
      return {
        subject: `Bekräftelse från ${data.orgName}`,
        body: `Hej ${data.customerName},\n\n${data.message}\n\nMed vänliga hälsningar,\n${data.orgName}`,
        isHtml: false,
      };

    case "registration":
      return {
        subject: "Välkommen till DogPlanner!",
        body: `Välkommen till DogPlanner!\n\nDitt konto är nu skapat.\n\nMed vänliga hälsningar,\nDogPlanner-teamet`,
        isHtml: false,
      };

    default:
      return {
        subject: "Meddelande",
        body: data.message || "",
        isHtml: false,
      };
  }
}

// ============================================
// EXEMPEL PÅ ANVÄNDNING
// ============================================

/**
 * Exempel: Skicka kundfaktura
 *
 * const sender = await getEmailSender("customer_invoice", orgId);
 * await sendEmail({
 *   from: { email: sender.email, name: sender.name },
 *   replyTo: sender.replyTo,
 *   to: customerEmail,
 *   subject: "Din faktura",
 *   body: "...",
 * });
 */

/**
 * Exempel: Skicka system-notifikation
 *
 * const sender = await getEmailSender("registration");
 * await sendEmail({
 *   from: { email: sender.email, name: sender.name },
 *   replyTo: sender.replyTo,
 *   to: userEmail,
 *   subject: "Välkommen!",
 *   body: "...",
 * });
 */
