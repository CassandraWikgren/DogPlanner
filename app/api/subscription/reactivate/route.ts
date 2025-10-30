import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    await cookies(); // Next.js 15 compatibility
    const supabase = createRouteHandlerClient({ cookies });

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser(
      token
    );

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Uppdatera subscription status till active
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "active",
        canceled_at: null,
        reactivated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Uppdatera organisation status
    const { error: orgError } = await supabase
      .from("organisations")
      .update({
        subscription_status: "active",
      })
      .eq("id", userId);

    if (orgError) console.error("Org update error:", orgError);

    return NextResponse.json({
      success: true,
      message: "Abonnemang återaktiverat",
    });
  } catch (error: any) {
    console.error("Reactivate subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Kunde inte återaktivera abonnemang" },
      { status: 500 }
    );
  }
}
