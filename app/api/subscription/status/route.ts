import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { get: () => "" } }
    );

    // 🧩 Hämta användaren från token
    const { data: userData, error: userErr } = await supabase.auth.getUser(
      token
    );
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    const user = userData.user;

    // 🧩 Hämta organisation (org_id) från profilen
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (profErr || !profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation kopplad till profilen." },
        { status: 400 }
      );
    }

    // 🧩 Hämta abonnemang kopplat till organisationen
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subErr || !sub) {
      // Om inget abonnemang hittas, ge standardvärden
      return NextResponse.json({
        status: "trialing",
        trial_ends_at: null,
      });
    }

    const now = new Date();
    const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    const expired = !!(trialEnd && trialEnd < now && sub.status !== "active");

    return NextResponse.json({
      status: sub.status,
      trial_ends_at: sub.trial_ends_at,
      expired,
    });
  } catch (e: any) {
    console.error("Fel i /subscription/status:", e);
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
