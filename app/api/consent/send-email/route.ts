import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/lib/emailSender";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback-secret-CHANGE-IN-PRODUCTION";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// GDPR-konform svenskt samtyckes-email
const createConsentEmail = (name: string, verificationUrl: string) => {
  return {
    subject: "Bekräfta ditt konto - DogPlanner",
    html: `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bekräfta ditt konto</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2c7a4c 0%, #1a5c35 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 28px;">🐾 Välkommen till DogPlanner!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Hej <strong>${name}</strong>,</p>
    
    <p>Personal på vårt hundpensionat har skapat ett konto åt dig för att underlätta bokningar. För att aktivera ditt konto behöver vi ditt samtycke enligt GDPR.</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #2c7a4c; font-size: 18px; margin-top: 0;">📋 Vad vi sparar om dig</h2>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Namn, telefon och email</li>
        <li>Adress (om du valt att ange det)</li>
        <li>Bokningshistorik och hunduppgifter</li>
        <li>Fakturainformation</li>
      </ul>
    </div>
    
    <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h3 style="color: #1e40af; font-size: 16px; margin-top: 0;">🔒 Dina GDPR-rättigheter</h3>
      <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
        <li><strong>Rätt till tillgång (Art. 15):</strong> Du kan när som helst begära utdrag av dina lagrade uppgifter</li>
        <li><strong>Rätt till rättelse (Art. 16):</strong> Du kan uppdatera felaktiga uppgifter</li>
        <li><strong>Rätt till radering (Art. 17):</strong> Du kan begära att vi raderar dina uppgifter</li>
        <li><strong>Rätt att återkalla samtycke (Art. 7.3):</strong> Du kan när som helst återkalla ditt samtycke</li>
        <li><strong>Rätt till dataportabilitet (Art. 20):</strong> Du kan exportera dina uppgifter i maskinläsbart format</li>
      </ul>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Viktigt om personnummer:</strong> Vi kommer ALDRIG kräva ditt personnummer. Det är helt frivilligt och behövs endast om du vill underlätta fakturering.
      </p>
    </div>
    
    <h3 style="color: #2c7a4c; font-size: 16px;">Varför vi sparar dina uppgifter</h3>
    <p style="font-size: 14px; color: #6b7280;">
      Vi behöver dina uppgifter för att kunna hantera bokningar, ta emot betalningar och kontakta dig vid behov (GDPR Art. 6.1.b - fullgöra avtal). Data sparas så länge du är aktiv kund, därefter i 24 månader enligt bokföringslagen. Du kan när som helst begära radering genom att kontakta oss.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: #2c7a4c; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ✓ Bekräfta och skapa lösenord
      </a>
    </div>
    
    <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px;">
      Länken är giltig i 7 dagar. Om du inte bekräftar inom denna tid raderas dina uppgifter automatiskt.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center;">
      Om du inte gjort denna begäran kan du ignorera detta email. Inga uppgifter kommer sparas permanent förrän du bekräftar.
    </p>
    
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 10px;">
      Frågor? Kontakta oss på <a href="mailto:support@dogplanner.se" style="color: #2c7a4c;">support@dogplanner.se</a>
    </p>
  </div>
</body>
</html>
    `,
    text: `
Hej ${name},

Personal på vårt hundpensionat har skapat ett konto åt dig för att underlätta bokningar. För att aktivera ditt konto behöver vi ditt samtycke enligt GDPR.

VAD VI SPARAR OM DIG:
- Namn, telefon och email
- Adress (om du valt att ange det)
- Bokningshistorik och hunduppgifter
- Fakturainformation

DINA GDPR-RÄTTIGHETER:
✓ Rätt till tillgång (Art. 15) - Du kan begära utdrag av dina uppgifter
✓ Rätt till rättelse (Art. 16) - Du kan uppdatera felaktiga uppgifter
✓ Rätt till radering (Art. 17) - Du kan begära radering
✓ Rätt att återkalla samtycke (Art. 7.3) - Du kan när som helst återkalla
✓ Rätt till dataportabilitet (Art. 20) - Du kan exportera dina uppgifter

VIKTIGT: Vi kommer ALDRIG kräva ditt personnummer. Det är helt frivilligt.

Bekräfta ditt konto: ${verificationUrl}

Länken är giltig i 7 dagar. Om du inte bekräftar raderas dina uppgifter automatiskt.

Frågor? Kontakta oss på support@dogplanner.se
    `,
  };
};

export async function POST(request: Request) {
  try {
    const { ownerId, email, name, orgId } = await request.json();

    if (!ownerId || !email || !name || !orgId) {
      return NextResponse.json(
        { error: "[ERR-6005] Saknade parametrar för email" },
        { status: 400 }
      );
    }

    // Skapa JWT-token med 7 dagars giltighetstid
    const token = jwt.sign(
      {
        ownerId,
        orgId,
        email,
        type: "consent_verification",
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Bygg verifierings-URL
    const verificationUrl = `${SITE_URL}/consent/verify?token=${token}`;

    // Skapa email-innehåll
    const emailContent = createConsentEmail(name, verificationUrl);

    // ✅ Skicka email med Resend via befintlig emailSender
    const emailResult = await sendEmail(
      {
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      },
      {
        to: email,
        orgId, // Använd org-specifik avsändare om konfigurerat
      }
    );

    if (!emailResult.success) {
      console.error("[ERR-6005] Email send failed:", emailResult.error);
      return NextResponse.json(
        {
          error: `[ERR-6005] Kunde inte skicka email: ${emailResult.error}`,
        },
        { status: 500 }
      );
    }

    console.log("✅ Consent verification email sent successfully");
    console.log(`   To: ${email}`);
    console.log(`   Message ID: ${emailResult.messageId}`);

    return NextResponse.json({
      success: true,
      message: "Bekräftelse-email skickat",
      messageId: emailResult.messageId,
    });
  } catch (error: any) {
    console.error("[ERR-6005] Email send error:", error);
    return NextResponse.json(
      { error: `[ERR-6005] ${error.message}` },
      { status: 500 }
    );
  }
}
