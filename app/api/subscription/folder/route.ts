// app/api/subscription/status/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
      return NextResponse.json(
        { error: "Ingen token angiven." },
        { status: 401 }
      );
    }

    // Hämta användaren från token
    const { data: userData, error: userErr } =
      await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { error: "Ogiltig användare." },
        { status: 401 }
      );
    }

    // Hämta org_id via profil
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", userData.user.id)
      .single();

    if (profErr || !profile?.org_id) {
      return NextResponse.json(
        { error: "Ingen organisation kopplad." },
        { status: 400 }
      );
    }

    // Senaste abonnemang för org
    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at")
      .eq("org_id", profile.org_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (subErr || !sub) {
      // Om inget hittades: behandla som aktiv trial (säker default)
      return NextResponse.json({ status: "trialing", expired: false });
    }

    const now = new Date();
    const ends = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
    const expired = !!(ends && ends < now && sub.status !== "active");

    return NextResponse.json({
      status: sub.status,
      trial_ends_at: sub.trial_ends_at,
      expired,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Serverfel" },
      { status: 500 }
    );
  }
}
