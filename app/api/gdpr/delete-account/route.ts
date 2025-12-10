import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GDPR DELETE ACCOUNT ENDPOINT
 *
 * Raderar ALL användardata enligt GDPR "rätten att bli glömd"
 *
 * POST /api/gdpr/delete-account
 * Body: { confirm: true }
 *
 * Kräver: Authenticated user
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verifiera autentisering
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Du måste vara inloggad." },
        { status: 401 }
      );
    }

    // Verifiera confirmation från frontend
    const body = await request.json();
    if (body.confirm !== true) {
      return NextResponse.json(
        { error: "Bekräftelse krävs för att radera kontot." },
        { status: 400 }
      );
    }

    console.log(
      `[GDPR] User ${user.id} (${user.email}) begär radering av sitt konto`
    );

    // Anropa GDPR-raderingsfunktionen
    const { data, error } = await supabase.rpc("gdpr_delete_user_data", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("[GDPR] Fel vid radering:", error);
      return NextResponse.json(
        { error: `Kunde inte radera kontot: ${error.message}` },
        { status: 500 }
      );
    }

    // ✅ Type cast RPC response from Json to expected structure
    const result = data as { success: boolean; error?: string } | null;

    if (!result || !result.success) {
      console.error("[GDPR] Radering misslyckades:", result);
      return NextResponse.json(
        { error: result?.error || "Okänt fel vid radering" },
        { status: 500 }
      );
    }

    console.log(`[GDPR] ✅ User ${user.id} raderad framgångsrikt`);

    // Logga ut användaren
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Ditt konto och all din data har raderats.",
      deleted: (result as any)?.deleted || {}, // ✅ Safe access to deleted property
    });
  } catch (error: any) {
    console.error("[GDPR] Exception:", error);
    return NextResponse.json(
      { error: "Ett oväntat fel inträffade." },
      { status: 500 }
    );
  }
}

// Disable för andra HTTP-metoder
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
