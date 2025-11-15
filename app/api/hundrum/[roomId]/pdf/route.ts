import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  birth: string | null;
  allergies: string | null;
  photo_url: string | null;
  days: string | null;
  heightcm: number | null;
  owners?: {
    full_name: string | null;
    phone: string | null;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const roomId = params.roomId;

    // Fetch room data
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("name")
      .eq("id", roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json({ error: "Rum ej hittat" }, { status: 404 });
    }

    // Fetch dogs in this room
    const { data: dogs, error: dogsError } = await supabase
      .from("dogs")
      .select(
        `
        id,
        name,
        breed,
        birth,
        allergies,
        photo_url,
        days,
        heightcm,
        owners (
          full_name,
          phone
        )
      `
      )
      .eq("room_id", roomId)
      .order("name");

    if (dogsError) {
      return NextResponse.json(
        { error: "Kunde inte hämta hundar" },
        { status: 500 }
      );
    }

    if (!dogs || dogs.length === 0) {
      return NextResponse.json(
        { error: "Inga hundar i detta rum" },
        { status: 404 }
      );
    }

    // Create PDF
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    // Set response headers
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Generate PDF content
    const dogsData = dogs.map((dog) => ({
      ...dog,
      owners:
        Array.isArray(dog.owners) && dog.owners.length > 0
          ? dog.owners[0]
          : null,
    }));

    await generatePDF(doc, room.name, dogsData as Dog[]);

    doc.end();

    // Wait for PDF to finish
    await new Promise<void>((resolve) => {
      doc.on("end", () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Hundrum_${room.name}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF-generering misslyckades" },
      { status: 500 }
    );
  }
}

async function generatePDF(
  doc: PDFKit.PDFDocument,
  roomName: string,
  dogs: Dog[]
) {
  // Title
  doc
    .fontSize(24)
    .fillColor("#2c7a4c")
    .font("Helvetica-Bold")
    .text(`Hundrum: ${roomName}`, { align: "center" });

  doc.moveDown(0.5);

  // Date
  doc
    .fontSize(10)
    .fillColor("#666666")
    .font("Helvetica")
    .text(`Uppdaterad: ${new Date().toLocaleDateString("sv-SE")}`, {
      align: "center",
    });

  doc.moveDown(1.5);

  // Draw dogs
  const pageWidth = doc.page.width - 100; // Account for margins
  const dogsPerRow = 2;
  const cardWidth = (pageWidth - 20) / dogsPerRow; // 20px gap between cards
  const cardHeight = 200;
  let currentX = 50;
  let currentY = doc.y;

  for (let i = 0; i < dogs.length; i++) {
    const dog = dogs[i];

    // Check if we need a new page
    if (currentY + cardHeight > doc.page.height - 50) {
      doc.addPage();
      currentY = 50;
    }

    // Draw card background
    doc
      .rect(currentX, currentY, cardWidth, cardHeight)
      .strokeColor("#e5e7eb")
      .lineWidth(1)
      .stroke();

    // Dog photo placeholder (if photo_url exists, you'd need to fetch and embed it)
    const photoSize = 60;
    const photoX = currentX + (cardWidth - photoSize) / 2;
    const photoY = currentY + 10;

    doc
      .circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2)
      .fillColor("#f3f4f6")
      .fill()
      .strokeColor("#d1d5db")
      .stroke();

    // Dog emoji in center of circle
    doc
      .fontSize(32)
      .fillColor("#9ca3af")
      .text("🐕", photoX + 8, photoY + 10, {
        width: photoSize,
        align: "center",
      });

    // Dog name
    doc
      .fontSize(14)
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .text(dog.name, currentX + 10, photoY + photoSize + 10, {
        width: cardWidth - 20,
        align: "center",
      });

    // Info section
    let infoY = photoY + photoSize + 35;
    doc.fontSize(9).fillColor("#374151").font("Helvetica");

    // Breed
    if (dog.breed) {
      doc.text(`Ras: ${dog.breed}`, currentX + 10, infoY, {
        width: cardWidth - 20,
      });
      infoY += 12;
    }

    // Birth date
    if (dog.birth) {
      const birthDate = new Date(dog.birth);
      const age = Math.floor(
        (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
      doc.text(
        `Född: ${birthDate.toLocaleDateString("sv-SE")} (${age} år)`,
        currentX + 10,
        infoY,
        { width: cardWidth - 20 }
      );
      infoY += 12;
    }

    // Height
    if (dog.heightcm) {
      doc.text(`Mankhöjd: ${dog.heightcm} cm`, currentX + 10, infoY, {
        width: cardWidth - 20,
      });
      infoY += 12;
    }

    // Days
    if (dog.days) {
      doc.text(`Dagar: ${dog.days}`, currentX + 10, infoY, {
        width: cardWidth - 20,
      });
      infoY += 12;
    }

    // Allergies (highlighted in red)
    if (dog.allergies) {
      doc
        .fontSize(9)
        .fillColor("#dc2626")
        .font("Helvetica-Bold")
        .text(`⚠️ Allergi: ${dog.allergies}`, currentX + 10, infoY, {
          width: cardWidth - 20,
        });
      infoY += 12;
    }

    // Owner
    if (dog.owners?.full_name) {
      doc
        .fontSize(8)
        .fillColor("#6b7280")
        .font("Helvetica")
        .text(`Ägare: ${dog.owners.full_name}`, currentX + 10, infoY, {
          width: cardWidth - 20,
        });
      infoY += 10;
    }

    // Move to next card position
    if ((i + 1) % dogsPerRow === 0) {
      // New row
      currentX = 50;
      currentY += cardHeight + 20;
    } else {
      // Next column
      currentX += cardWidth + 20;
    }
  }

  // Footer with DogPlanner logo
  const footerY = doc.page.height - 40;
  doc
    .fontSize(8)
    .fillColor("#9ca3af")
    .font("Helvetica")
    .text("Skapad med", 50, footerY, { continued: true })
    .fillColor("#2c7a4c")
    .font("Helvetica-Bold")
    .text(" DogPlanner", { link: "https://dogplanner.se" });
}
