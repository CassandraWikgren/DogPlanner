import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

    // Uppdatera subscription status till canceled
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Uppdatera organisation status
    const { error: orgError } = await supabase
      .from("organisations")
      .update({
        subscription_status: "canceled",
      })
      .eq("id", userId);

    if (orgError) console.error("Org update error:", orgError);

    return NextResponse.json({
      success: true,
      message: "Abonnemang avslutat",
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Kunde inte avsluta abonnemang" },
      { status: 500 }
    );
  }
}
