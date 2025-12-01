import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";

/**
 * API endpoint för att godkänna pensionatbokningar
 * Använder service role key för att bypassa RLS-begränsningar
 */
export async function POST(request: NextRequest) {
  try {
    // Skapa Supabase client
    const supabase = await createClient();

    // Verifiera autentisering
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("❌ Auth error:", authError);
      return NextResponse.json(
        {
          error: "Unauthorized",
          details: authError?.message || "No authentication token found",
        },
        { status: 401 }
      );
    }

    // Hämta användarens org_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("❌ Profile error:", profileError);
      return NextResponse.json(
        {
          error: "User not associated with organization",
          details: profileError?.message,
        },
        { status: 403 }
      );
    }

    const userOrgId = (profile as any).org_id as string;

    if (!userOrgId) {
      console.error("❌ No org_id for user:", user.id);
      return NextResponse.json(
        { error: "User not associated with organization" },
        { status: 403 }
      );
    }

    console.log("✅ User authenticated:", user.id, "org:", userOrgId);

    // Läs request body
    const body = await request.json();
    const {
      bookingId,
      totalPrice,
      discountAmount,
      notes,
    }: {
      bookingId: string;
      totalPrice: number;
      discountAmount: number;
      notes?: string;
    } = body;

    if (!bookingId || totalPrice === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: bookingId, totalPrice" },
        { status: 400 }
      );
    }

    // Skapa admin client med service role key (bypassa RLS)
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

    // Verifiera att bokningen tillhör användarens organisation
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("id, org_id, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.org_id !== userOrgId) {
      return NextResponse.json(
        { error: "Booking does not belong to your organization" },
        { status: 403 }
      );
    }

    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "Booking is not in pending status" },
        { status: 400 }
      );
    }

    // Uppdatera bokning till confirmed (triggern skapar faktura automatiskt)
    const updateData: any = {
      status: "confirmed",
      total_price: totalPrice,
      discount_amount: discountAmount,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error approving booking:", updateError);
      return NextResponse.json(
        {
          error: "Failed to approve booking",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("❌ Unexpected error in approve booking API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
