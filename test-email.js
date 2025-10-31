const { sendEmail } = require("./lib/emailSender");

// Test av email-systemet med din Resend API-nyckel
async function testEmail() {
  try {
    console.log("🔄 Testar email-systemet...");

    // Test välkomstmail
    const welcomeResult = await sendEmail(
      "welcome",
      "cassandrawikgren@icloud.com",
      "Tessan",
      "Cassandra"
    );

    console.log("✅ Välkomstmail skickat:", welcomeResult);

    // Test avslagsmail
    const rejectionResult = await sendEmail(
      "rejection",
      "cassandrawikgren@icloud.com",
      "Tessan",
      "Cassandra",
      "Vi har tyvärr fullt för tillfället"
    );

    console.log("✅ Avslagsmail skickat:", rejectionResult);
  } catch (error) {
    console.error("❌ Email-test misslyckades:", error);
  }
}

testEmail();
