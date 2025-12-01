import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(req: Request) {
  try {
    const supabase = await createClient();

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

    // Hämta användarens profil för att få org_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userId)
      .single();

    // Uppdatera organisation status om org_id finns
    if (profile?.org_id) {
      const { error: orgError } = await supabase
        .from("orgs")
        .update({
          subscription_status: "active",
        })
        .eq("id", profile.org_id);

      if (orgError) console.error("Org update error:", orgError);
    }

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
