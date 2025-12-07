import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verifiera användare
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const dogId = formData.get("dogId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Ingen fil skickad" }, { status: 400 });
    }

    // Validera filtyp
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Endast JPEG, PNG, WebP och GIF tillåtna" },
        { status: 400 }
      );
    }

    // Max 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Filen får max vara 5MB" },
        { status: 400 }
      );
    }

    // Skapa unikt filnamn
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${user.id}/${dogId || "temp"}_${Date.now()}.${fileExt}`;

    // Konvertera File till ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Ladda upp till Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("dog-photos")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload] Storage error:", uploadError);
      return NextResponse.json(
        { error: `Uppladdning misslyckades: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Hämta publik URL
    const { data: urlData } = supabase.storage
      .from("dog-photos")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: uploadData.path,
    });
  } catch (err: any) {
    console.error("[Upload] Error:", err);
    return NextResponse.json(
      { error: err.message || "Okänt fel" },
      { status: 500 }
    );
  }
}
