import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import {
  ApiError,
  errorResponse,
  validateAuth,
  validateRequired,
  validateUUID,
  successResponse,
} from "@/lib/apiErrors";

/**
 * API endpoint för att godkänna pensionatbokningar
 * REFACTORED VERSION - Använder standardiserad error handling
 *
 * @example
 * POST /api/bookings/approve
 * Body: { bookingId, totalPrice, discountAmount?, notes? }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication & get org_id
    const { user, orgId } = await validateAuth();

    // 2. Parse request body
    const body = await request.json();
    const { bookingId, totalPrice, discountAmount, notes } = body;

    // 3. Validate required fields
    validateRequired(body, ["bookingId", "totalPrice"]);
    validateUUID(bookingId, "Booking ID");

    if (typeof totalPrice !== "number" || totalPrice < 0) {
      throw new ApiError(
        400,
        "Validation Error",
        "totalPrice must be a positive number",
        "[ERR-4004]"
      );
    }

    // 4. Create service client (bypasses RLS)
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 5. Verify booking belongs to user's organization
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, org_id, status")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      throw new ApiError(404, "Not Found", "Booking not found", "[ERR-4007]");
    }

    if (booking.org_id !== orgId) {
      throw new ApiError(
        403,
        "Forbidden",
        "Booking belongs to another organization",
        "[ERR-4002]"
      );
    }

    if (booking.status !== "pending") {
      throw new ApiError(
        400,
        "Invalid State",
        `Booking status is '${booking.status}', expected 'pending'`,
        "[ERR-4010]"
      );
    }

    // 6. Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        total_price: totalPrice,
        discount_amount: discountAmount || 0,
        notes: notes || null,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq("id", bookingId)
      .select()
      .single();

    if (updateError) {
      console.error("Database error approving booking:", updateError);
      throw new ApiError(
        500,
        "Database Error",
        updateError.message,
        "[ERR-1001]"
      );
    }

    // 7. Send success response
    return successResponse(updatedBooking, "Booking approved successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
