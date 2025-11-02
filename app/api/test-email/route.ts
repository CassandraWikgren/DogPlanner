/**
 * 📧 Test Email API Route
 * Används för att testa email-funktionaliteten
 */

// Tvinga dynamisk hantering så Next inte försöker för-rendera under build
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import {
  sendWelcomeEmail,
  createApplicationReceivedEmail,
  createRejectionEmail,
  sendEmail,
} from "@/lib/emailSender";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, email, ownerName, dogName, startDate, orgId, reason } = body;

    if (!type || !email) {
      return NextResponse.json(
        { error: "Missing required fields: type, email" },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail(
          email,
          ownerName || "Test Ägare",
          dogName || "Test Hund",
          startDate,
          orgId
        );
        break;

      case "received":
        const receivedTemplate = createApplicationReceivedEmail(
          ownerName || "Test Ägare",
          dogName || "Test Hund",
          "Test Hunddagis"
        );
        result = await sendEmail(receivedTemplate, { to: email, orgId });
        break;

      case "rejection":
        const rejectionTemplate = createRejectionEmail(
          ownerName || "Test Ägare",
          dogName || "Test Hund",
          reason || "Test-anledning för avslag",
          "Test Hunddagis"
        );
        result = await sendEmail(rejectionTemplate, { to: email, orgId });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type. Use: welcome, received, rejection" },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email sent successfully",
        messageId: "messageId" in result ? result.messageId : undefined,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Test email error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email Test API",
    usage: {
      method: "POST",
      body: {
        type: '"welcome" | "received" | "rejection"',
        email: "recipient@example.com",
        ownerName: "Ägare Namn (optional)",
        dogName: "Hund Namn (optional)",
        startDate: "2024-01-15 (optional, for welcome)",
        orgId: "organization-id (optional)",
        reason: "Avslag anledning (optional, for rejection)",
      },
    },
    examples: [
      {
        description: "Test welcome email",
        body: {
          type: "welcome",
          email: "test@example.com",
          ownerName: "Anna Andersson",
          dogName: "Bella",
          startDate: "2024-02-01",
        },
      },
      {
        description: "Test rejection email",
        body: {
          type: "rejection",
          email: "test@example.com",
          ownerName: "Erik Eriksson",
          dogName: "Max",
          reason: "Vi har tyvärr fullt just nu",
        },
      },
    ],
  });
}
