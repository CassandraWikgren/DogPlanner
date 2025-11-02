import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export async function GET(req: Request) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    // Server-side Supabase-klient (service role) för stabila serverfrågor
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // Validera token → hämta användaren
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const user = userData.user;

    // Hämta profil/org_id (typsäker nu när typer finns)
    const { data: profileRow, error: profErr } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    const profile = profileRow as { org_id: string | null } | null;
    if (profErr || !profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation kopplad till profilen." },
        { status: 400 }
      );
    }

    // Läs organisationens abonnemang från org_subscriptions (inte hundabonnemang)
    const { data: orgSubRow, error: orgSubErr } = await supabase
      .from("org_subscriptions")
      .select("status, trial_ends_at")
      .eq("org_id", profile.org_id)
      .eq("is_active", true)
      .maybeSingle();
    if (orgSubErr) {
      console.warn("/subscription/status: orgSubErr", orgSubErr);
    }

    const orgSub = orgSubRow as {
      status?: string;
      trial_ends_at?: string | null;
    } | null;
    const status = orgSub?.status || "trialing";
    return NextResponse.json({
      status,
      trial_ends_at: orgSub?.trial_ends_at ?? null,
      expired: status === "canceled" || status === "past_due" ? true : false,
    });
  } catch (e: any) {
    console.error("Fel i /subscription/status:", e);
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
