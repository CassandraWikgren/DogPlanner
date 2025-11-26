import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * API endpoint för att hämta Supabase system health
 * GET /api/monitoring/supabase
 */
export async function GET(request: NextRequest) {
  try {
    // Verifiera autentisering
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({
      cookies: () => cookieStore,
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Skapa admin client med service role key
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Hämta trigger health summary
    const { data: triggerHealth, error: triggerError } = await supabaseAdmin
      .from("trigger_health_summary" as any)
      .select("*");

    // Hämta recent failures
    const { data: recentFailures, error: failuresError } = await supabaseAdmin
      .from("recent_trigger_failures" as any)
      .select("*")
      .limit(20);

    // Kör custom queries för system status
    const { data: rlsStatus } = await supabaseAdmin.rpc(
      "get_rls_status" as any
    );

    const { data: orphanedRecords } = await supabaseAdmin.rpc(
      "check_orphaned_records" as any
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        triggerHealth: triggerHealth || [],
        recentFailures: recentFailures || [],
        rlsStatus: rlsStatus || [],
        orphanedRecords: orphanedRecords || [],
      },
      errors: {
        triggerError: triggerError?.message,
        failuresError: failuresError?.message,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching Supabase health:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
