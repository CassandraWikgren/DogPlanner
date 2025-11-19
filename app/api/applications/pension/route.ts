// API route for pension applications - uses service_role to bypass RLS
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const { orgId, owner, dog, booking } = data;

    // 1. Check if owner exists
    const { data: existingOwner } = await supabaseAdmin
      .from("owners")
      .select("id")
      .eq("email", owner.email.toLowerCase())
      .eq("org_id", orgId)
      .maybeSingle();

    let owner_id: string;

    if (existingOwner) {
      owner_id = existingOwner.id;
    } else {
      // Create new owner
      const { data: newOwner, error: ownerError } = await supabaseAdmin
        .from("owners")
        .insert([
          {
            org_id: orgId,
            full_name: owner.full_name,
            email: owner.email.toLowerCase(),
            phone: owner.phone,
            address: owner.address || null,
            city: owner.city,
            postal_code: owner.postal_code || null,
            gdpr_consent: true,
          },
        ])
        .select("id")
        .single();

      if (ownerError) throw ownerError;
      if (!newOwner) throw new Error("Failed to create owner");
      owner_id = newOwner.id;
    }

    // 2. Create dog
    const { data: newDog, error: dogError } = await supabaseAdmin
      .from("dogs")
      .insert([
        {
          org_id: orgId,
          owner_id,
          name: dog.name,
          breed: dog.breed,
          birth: dog.birth,
          gender: dog.gender,
          heightcm: dog.heightcm,
          is_castrated: dog.is_castrated,
          is_escape_artist: dog.is_escape_artist,
          destroys_things: dog.destroys_things,
          is_house_trained: dog.is_house_trained,
          notes: dog.notes || null,
        },
      ])
      .select("id")
      .single();

    if (dogError) throw dogError;
    if (!newDog) throw new Error("Failed to create dog");

    // Create booking with special_requests (TypeScript types now updated)
    const { data: newBooking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .insert([
        {
          org_id: orgId,
          dog_id: newDog.id,
          owner_id,
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: "pending",
          special_requests: booking.special_requests || null,
          base_price: 0,
          total_price: 0,
        },
      ])
      .select("id")
      .single();

    if (bookingError) throw bookingError;
    if (!newBooking) throw new Error("Failed to create booking");

    // 4. Create GDPR log
    await supabaseAdmin.from("consent_logs").insert([
      {
        org_id: orgId,
        owner_id,
        consent_type: "booking_application",
        consent_given: true,
        consent_text:
          "Godkänt vid pensionatsansökan - accepterat regler, villkor och integritetspolicy",
        given_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      booking_id: newBooking.id,
      owner_id,
      dog_id: newDog.id,
    });
  } catch (error: any) {
    console.error("Pension application error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit application" },
      { status: 500 }
    );
  }
}
