// lib/emailTemplates.ts
// Email-templates för DogPlanner

export interface ApplicationConfirmationData {
  ownerName: string;
  dogName: string;
  pensionatName: string;
  checkinDate: string;
  checkoutDate: string;
  applicationId: string;
}

export interface ApplicationNotificationData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  dogName: string;
  dogBreed: string;
  checkinDate: string;
  checkoutDate: string;
  specialRequests?: string;
  applicationUrl: string;
}

export interface ApplicationApprovedData {
  ownerName: string;
  dogName: string;
  pensionatName: string;
  checkinDate: string;
  checkoutDate: string;
  totalPrice: number;
  discountAmount?: number;
  kundportalUrl: string;
}

export interface ApplicationRejectedData {
  ownerName: string;
  dogName: string;
  pensionatName: string;
  reason?: string;
}

/**
 * Email till KUND: Bekräftelse att ansökan mottagits
 */
export function getApplicationConfirmationEmail(
  data: ApplicationConfirmationData
): { subject: string; html: string; text: string } {
  const subject = `Ansökan mottagen - ${data.dogName} till ${data.pensionatName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2c7a4c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2c7a4c; }
    .button { display: inline-block; background-color: #2c7a4c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐕 Ansökan mottagen!</h1>
    </div>
    <div class="content">
      <p>Hej ${data.ownerName}!</p>
      
      <p>Tack för din ansökan till <strong>${data.pensionatName}</strong> för ${data.dogName}.</p>
      
      <div class="info-box">
        <strong>📅 Bokningsperiod:</strong><br>
        Incheckning: ${new Date(data.checkinDate).toLocaleDateString("sv-SE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}<br>
        Utcheckning: ${new Date(data.checkoutDate).toLocaleDateString("sv-SE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      
      <p><strong>Vad händer nu?</strong></p>
      <ol>
        <li>Pensionatet granskar din ansökan (vanligtvis inom 24-48 timmar)</li>
        <li>Du får ett nytt mejl när ansökan godkänns eller avslås</li>
        <li>Vid godkännande får du tillgång till kundportalen med mer information</li>
      </ol>
      
      <p><strong>Referensnummer:</strong> ${data.applicationId.slice(0, 8)}</p>
      
      <p>Vi hör av oss så snart pensionatet har granskat din ansökan!</p>
      
      <p>Med vänlig hälsning,<br>
      <strong>${data.pensionatName}</strong><br>
      via DogPlanner</p>
    </div>
    <div class="footer">
      <p>Detta email skickades till dig eftersom du ansökte om hundpensionat via DogPlanner.</p>
      <p>Har du frågor? Kontakta pensionatet direkt.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hej ${data.ownerName}!

Tack för din ansökan till ${data.pensionatName} för ${data.dogName}.

BOKNINGSPERIOD:
Incheckning: ${new Date(data.checkinDate).toLocaleDateString("sv-SE")}
Utcheckning: ${new Date(data.checkoutDate).toLocaleDateString("sv-SE")}

VAD HÄNDER NU?
1. Pensionatet granskar din ansökan (vanligtvis inom 24-48 timmar)
2. Du får ett nytt mejl när ansökan godkänns eller avslås
3. Vid godkännande får du tillgång till kundportalen med mer information

Referensnummer: ${data.applicationId.slice(0, 8)}

Vi hör av oss så snart pensionatet har granskat din ansökan!

Med vänlig hälsning,
${data.pensionatName}
via DogPlanner
  `;

  return { subject, html, text };
}

/**
 * Email till PENSIONAT: Notifiering om ny ansökan
 */
export function getApplicationNotificationEmail(
  data: ApplicationNotificationData
): { subject: string; html: string; text: string } {
  const subject = `🔔 Ny ansökan: ${data.dogName} (${data.ownerName})`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
    .info-item { background-color: white; padding: 10px; border-left: 3px solid #1e40af; }
    .info-label { font-size: 12px; color: #666; }
    .info-value { font-weight: bold; color: #333; }
    .button { display: inline-block; background-color: #2c7a4c; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .urgent { background-color: #fee; border-left-color: #dc2626; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐕 Ny pensionatsansökan</h1>
    </div>
    <div class="content">
      <p><strong>Du har fått en ny ansökan som väntar på granskning!</strong></p>
      
      <h3>📋 Kunduppgifter</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Namn</div>
          <div class="info-value">${data.ownerName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${data.ownerEmail}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Telefon</div>
          <div class="info-value">${data.ownerPhone}</div>
        </div>
      </div>
      
      <h3>🐶 Hunduppgifter</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Namn</div>
          <div class="info-value">${data.dogName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Ras</div>
          <div class="info-value">${data.dogBreed}</div>
        </div>
      </div>
      
      <h3>📅 Bokningsperiod</h3>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Incheckning</div>
          <div class="info-value">${new Date(
            data.checkinDate
          ).toLocaleDateString("sv-SE", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Utcheckning</div>
          <div class="info-value">${new Date(
            data.checkoutDate
          ).toLocaleDateString("sv-SE", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}</div>
        </div>
      </div>
      
      ${
        data.specialRequests
          ? `
      <h3>💬 Särskilda önskemål</h3>
      <div class="info-item" style="grid-column: span 2;">
        <p>${data.specialRequests}</p>
      </div>
      `
          : ""
      }
      
      <div class="urgent">
        <strong>⏰ Snabb hantering viktigt!</strong><br>
        Kunden väntar på svar. Försök granska ansökan inom 24 timmar.
      </div>
      
      <center>
        <a href="${
          data.applicationUrl
        }" class="button">Granska ansökan i DogPlanner →</a>
      </center>
      
      <p><small>Du kan godkänna/avslå ansökan direkt i systemet.</small></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
NY PENSIONATSANSÖKAN

KUNDUPPGIFTER:
Namn: ${data.ownerName}
Email: ${data.ownerEmail}
Telefon: ${data.ownerPhone}

HUNDUPPGIFTER:
Namn: ${data.dogName}
Ras: ${data.dogBreed}

BOKNINGSPERIOD:
Incheckning: ${new Date(data.checkinDate).toLocaleDateString("sv-SE")}
Utcheckning: ${new Date(data.checkoutDate).toLocaleDateString("sv-SE")}

${data.specialRequests ? `SÄRSKILDA ÖNSKEMÅL:\n${data.specialRequests}\n` : ""}

ÅTGÄRD KRÄVS:
Granska ansökan i DogPlanner: ${data.applicationUrl}

Snabb hantering är viktigt - kunden väntar på svar!
  `;

  return { subject, html, text };
}

/**
 * Email till KUND: Ansökan godkänd
 */
export function getApplicationApprovedEmail(data: ApplicationApprovedData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `✅ Din ansökan är godkänd - ${data.dogName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .success-box { background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; }
    .price-box { background-color: white; padding: 20px; margin: 20px 0; border: 2px solid #16a34a; border-radius: 8px; }
    .button { display: inline-block; background-color: #2c7a4c; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Grattis ${data.ownerName}!</h1>
      <p style="font-size: 18px; margin-top: 10px;">Din ansökan är godkänd</p>
    </div>
    <div class="content">
      <div class="success-box">
        <h2 style="margin-top: 0; color: #16a34a;">✅ Bokning bekräftad</h2>
        <p><strong>${data.dogName}</strong> är välkommen till <strong>${
          data.pensionatName
        }</strong>!</p>
      </div>
      
      <h3>📅 Bokningsdetaljer</h3>
      <p>
        <strong>Incheckning:</strong> ${new Date(
          data.checkinDate
        ).toLocaleDateString("sv-SE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}<br>
        <strong>Utcheckning:</strong> ${new Date(
          data.checkoutDate
        ).toLocaleDateString("sv-SE", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
      
      <div class="price-box">
        <h3 style="margin-top: 0;">💰 Pris</h3>
        <p style="font-size: 24px; margin: 10px 0;"><strong>${data.totalPrice.toFixed(
          2
        )} kr</strong></p>
        ${
          data.discountAmount && data.discountAmount > 0
            ? `<p style="color: #16a34a;">🎁 Rabatt: -${data.discountAmount.toFixed(
                2
              )} kr</p>`
            : ""
        }
      </div>
      
      <h3>📱 Nästa steg</h3>
      <ol>
        <li><strong>Logga in på kundportalen</strong> för att se all information</li>
        <li><strong>Betala förskottsfakturan</strong> innan ankomst</li>
        <li><strong>Kontakta pensionatet</strong> om du har frågor</li>
      </ol>
      
      <center>
        <a href="${data.kundportalUrl}" class="button">Gå till kundportalen →</a>
      </center>
      
      <p style="margin-top: 30px;">Vi ser fram emot att ta emot ${
        data.dogName
      }!</p>
      
      <p>Med vänlig hälsning,<br>
      <strong>${data.pensionatName}</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
GRATTIS ${data.ownerName.toUpperCase()}!

Din ansökan är godkänd - ${data.dogName} är välkommen till ${
    data.pensionatName
  }!

BOKNINGSDETALJER:
Incheckning: ${new Date(data.checkinDate).toLocaleDateString("sv-SE")}
Utcheckning: ${new Date(data.checkoutDate).toLocaleDateString("sv-SE")}

PRIS: ${data.totalPrice.toFixed(2)} kr
${
  data.discountAmount && data.discountAmount > 0
    ? `Rabatt: -${data.discountAmount.toFixed(2)} kr`
    : ""
}

NÄSTA STEG:
1. Logga in på kundportalen för att se all information
2. Betala förskottsfakturan innan ankomst
3. Kontakta pensionatet om du har frågor

KUNDPORTAL:
${data.kundportalUrl}

Vi ser fram emot att ta emot ${data.dogName}!

Med vänlig hälsning,
${data.pensionatName}
  `;

  return { subject, html, text };
}

/**
 * Email till KUND: Ansökan avslagen
 */
export function getApplicationRejectedEmail(data: ApplicationRejectedData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Angående din ansökan - ${data.dogName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Angående din ansökan</h1>
    </div>
    <div class="content">
      <p>Hej ${data.ownerName},</p>
      
      <p>Tack för din ansökan till <strong>${
        data.pensionatName
      }</strong> för ${data.dogName}.</p>
      
      <p>Tyvärr kan vi inte acceptera din ansökan just nu${
        data.reason ? ` på grund av: ${data.reason}` : "."
      }</p>
      
      <p>Vi rekommenderar att du kontaktar pensionatet direkt för mer information eller för att diskutera alternativa datum.</p>
      
      <p>Med vänlig hälsning,<br>
      <strong>${data.pensionatName}</strong></p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hej ${data.ownerName},

Tack för din ansökan till ${data.pensionatName} för ${data.dogName}.

Tyvärr kan vi inte acceptera din ansökan just nu${
    data.reason ? ` på grund av: ${data.reason}` : "."
  }

Vi rekommenderar att du kontaktar pensionatet direkt för mer information eller för att diskutera alternativa datum.

Med vänlig hälsning,
${data.pensionatName}
  `;

  return { subject, html, text };
}
