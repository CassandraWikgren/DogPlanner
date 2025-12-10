"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Printer, Dog as DogIcon, X } from "lucide-react";
import type { Database } from "@/types/database";

interface BookingService {
  id: string;
  service_name: string;
  price: number;
}

interface DogData {
  id: string;
  name: string;
  breed: string | null;
  birth_date: string | null;
  photo_url: string | null;
  allergies: string | null;
  medications: string | null;
  special_needs: string | null;
  behavior_notes: string | null;
  food_type: string | null;
  food_amount: string | null;
  food_times: string | null;
  food_brand: string | null;
  can_share_room: boolean | null;
  heightcm: number | null;
  gender: string | null;
  owners?: {
    full_name: string | null;
    phone: string | null;
    email: string | null;
    contact_person2_name: string | null;
    contact_person2_phone: string | null;
  } | null;
}

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  rooms?: {
    name: string | null;
  } | null;
  dogs?: DogData | null;
}

interface DogRoomCardProps {
  booking: BookingData;
  onClose: () => void;
}

// Calculate age from birth date
function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "Okänd ålder";

  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0) {
    return `${months} mån`;
  } else if (years < 2) {
    return `${years} år${months > 0 ? ` ${months} mån` : ""}`;
  } else {
    return `${years} år`;
  }
}

// Format date to Swedish
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DogRoomCard({ booking, onClose }: DogRoomCardProps) {
  const supabase = createClient();
  const printRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<BookingService[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch booking services
  useEffect(() => {
    async function fetchServices() {
      try {
        // ✅ Fixed: booking_services har id, quantity, price, service_id
        // Hämta även service_name från services-tabellen via JOIN
        const { data, error } = await supabase
          .from("booking_services")
          .select("id, quantity, price, service_id, services(name)")
          .eq("booking_id", booking.id);

        if (error) {
          console.warn("Could not fetch booking services:", error);
        } else {
          // Map services till rätt format
          const mappedServices = (data || []).map((item: any) => ({
            id: item.id,
            service_name: item.services?.name || "Tilläggstjänst",
            price: item.price || 0,
          }));
          setServices(mappedServices);
        }
      } catch (err) {
        console.warn("Error fetching services:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
  }, [booking.id, supabase]);

  const dog = booking.dogs;
  const age = calculateAge(dog?.birth_date || null);

  // Print handler
  function handlePrint() {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Kunde inte öppna utskriftsfönster. Kontrollera popup-blockerare.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rumskort - ${dog?.name || "Hund"}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              color: #1a1a1a;
              background: white;
              padding: 20px;
            }
            
            .card {
              border: 3px solid #2c7a4c;
              border-radius: 16px;
              padding: 24px;
              max-width: 100%;
            }
            
            .header {
              display: flex;
              gap: 24px;
              margin-bottom: 24px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e5e5;
            }
            
            .photo-container {
              flex-shrink: 0;
              width: 140px;
              height: 140px;
              border-radius: 12px;
              overflow: hidden;
              background: #f3f4f6;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #e5e5e5;
            }
            
            .photo-container img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            
            .photo-placeholder {
              font-size: 48px;
              color: #9ca3af;
            }
            
            .dog-info {
              flex: 1;
            }
            
            .dog-name {
              font-size: 32px;
              font-weight: 700;
              color: #2c7a4c;
              margin-bottom: 4px;
            }
            
            .dog-details {
              font-size: 16px;
              color: #4b5563;
              margin-bottom: 12px;
            }
            
            .dates-box {
              background: #f0fdf4;
              border: 2px solid #2c7a4c;
              border-radius: 8px;
              padding: 12px 16px;
              display: inline-block;
            }
            
            .dates-box strong {
              color: #2c7a4c;
            }
            
            .section {
              margin-bottom: 20px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #6b7280;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            .section-content {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px 16px;
              font-size: 15px;
              line-height: 1.5;
            }
            
            .section-content.warning {
              background: #fef3c7;
              border-color: #fbbf24;
            }
            
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            
            .contact-info {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              border-radius: 8px;
              padding: 12px 16px;
            }
            
            .contact-name {
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 4px;
            }
            
            .contact-phone {
              font-size: 18px;
              font-weight: 700;
              color: #1e40af;
            }
            
            .share-room {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 8px 16px;
              border-radius: 9999px;
              font-weight: 600;
              font-size: 14px;
            }
            
            .share-room.yes {
              background: #dcfce7;
              color: #166534;
            }
            
            .share-room.no {
              background: #fee2e2;
              color: #991b1b;
            }
            
            .services-title {
              font-size: 16px;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #2c7a4c;
            }
            
            .service-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .service-item:last-child {
              border-bottom: none;
            }
            
            .checkbox {
              width: 24px;
              height: 24px;
              border: 2px solid #9ca3af;
              border-radius: 4px;
              flex-shrink: 0;
            }
            
            .service-name {
              flex: 1;
              font-size: 15px;
            }
            
            .no-services {
              color: #9ca3af;
              font-style: italic;
              padding: 8px 0;
            }
            
            .room-badge {
              position: absolute;
              top: -12px;
              right: 24px;
              background: #2c7a4c;
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              font-weight: 700;
              font-size: 16px;
            }
            
            .card-wrapper {
              position: relative;
              margin-top: 12px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Wait for images to load before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar utskriftsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2c7a4c] to-[#3d9960] px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <DogIcon className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Rumskort för utskrift</h2>
              <p className="text-sm text-white/80">
                A4-format för dörrplacering
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-white text-[#2c7a4c] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Skriv ut
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-6">
          <div ref={printRef}>
            <div className="card-wrapper">
              {booking.rooms?.name && (
                <div className="room-badge">{booking.rooms.name}</div>
              )}

              <div className="card">
                {/* Header with photo and basic info */}
                <div className="header">
                  <div className="photo-container">
                    {dog?.photo_url ? (
                      <img src={dog.photo_url} alt={dog.name} />
                    ) : (
                      <div className="photo-placeholder">🐕</div>
                    )}
                  </div>
                  <div className="dog-info">
                    <div className="dog-name">{dog?.name || "Okänd hund"}</div>
                    <div className="dog-details">
                      {dog?.breed || "Okänd ras"} • {age}
                      {dog?.gender &&
                        ` • ${dog.gender === "male" ? "Hane" : dog.gender === "female" ? "Tik" : dog.gender}`}
                      {dog?.heightcm && ` • ${dog.heightcm} cm`}
                    </div>
                    <div className="dates-box">
                      <strong>📅 In:</strong> {formatDate(booking.start_date)}
                      <br />
                      <strong>📅 Ut:</strong> {formatDate(booking.end_date)}
                    </div>
                  </div>
                </div>

                {/* Share room indicator */}
                <div className="section">
                  <div
                    className={`share-room ${dog?.can_share_room ? "yes" : "no"}`}
                  >
                    {dog?.can_share_room
                      ? "✓ Kan dela rum"
                      : "✗ Kan EJ dela rum"}
                  </div>
                </div>

                {/* Allergies and Special Needs */}
                <div className="grid-2">
                  <div className="section">
                    <div className="section-title">⚠️ Allergier</div>
                    <div
                      className={`section-content ${dog?.allergies ? "warning" : ""}`}
                    >
                      {dog?.allergies || "Inga kända allergier"}
                    </div>
                  </div>
                  <div className="section">
                    <div className="section-title">💊 Mediciner</div>
                    <div
                      className={`section-content ${dog?.medications ? "warning" : ""}`}
                    >
                      {dog?.medications || "Inga mediciner"}
                    </div>
                  </div>
                </div>

                {/* Special needs */}
                {dog?.special_needs && (
                  <div className="section">
                    <div className="section-title">⭐ Särskilda behov</div>
                    <div className="section-content warning">
                      {dog.special_needs}
                    </div>
                  </div>
                )}

                {/* Behavior notes */}
                {dog?.behavior_notes && (
                  <div className="section">
                    <div className="section-title">
                      🐕 Beteende att känna till
                    </div>
                    <div className="section-content">{dog.behavior_notes}</div>
                  </div>
                )}

                {/* Food information */}
                <div className="section">
                  <div className="section-title">🍖 Matinformation</div>
                  <div className="section-content">
                    {dog?.food_type ||
                    dog?.food_brand ||
                    dog?.food_amount ||
                    dog?.food_times ? (
                      <div>
                        {dog.food_type && (
                          <div>
                            <strong>Typ:</strong>{" "}
                            {dog.food_type === "own"
                              ? "Eget foder"
                              : dog.food_type === "pensionat"
                                ? "Pensionatets foder"
                                : dog.food_type}
                          </div>
                        )}
                        {dog.food_brand && (
                          <div>
                            <strong>Märke:</strong> {dog.food_brand}
                          </div>
                        )}
                        {dog.food_amount && (
                          <div>
                            <strong>Mängd:</strong> {dog.food_amount}
                          </div>
                        )}
                        {dog.food_times && (
                          <div>
                            <strong>Antal mål:</strong> {dog.food_times}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                        Ingen matinformation angiven
                      </span>
                    )}
                  </div>
                </div>

                {/* Owner contact info */}
                <div className="section">
                  <div className="section-title">
                    📞 Ägarens kontaktuppgifter
                  </div>
                  <div className="grid-2">
                    <div className="contact-info">
                      <div className="contact-name">
                        {dog?.owners?.full_name || "Okänd ägare"}
                      </div>
                      <div className="contact-phone">
                        {dog?.owners?.phone || "Inget telefonnr"}
                      </div>
                      {dog?.owners?.email && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#6b7280",
                            marginTop: "4px",
                          }}
                        >
                          {dog.owners.email}
                        </div>
                      )}
                    </div>
                    {dog?.owners?.contact_person2_name && (
                      <div className="contact-info">
                        <div className="contact-name">
                          {dog.owners.contact_person2_name} (Kontaktperson 2)
                        </div>
                        <div className="contact-phone">
                          {dog?.owners?.contact_person2_phone ||
                            "Inget telefonnr"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services checklist */}
                <div className="section">
                  <div className="services-title">
                    ✅ Beställda tilläggstjänster
                  </div>
                  {services.length > 0 ? (
                    <div>
                      {services.map((service) => (
                        <div key={service.id} className="service-item">
                          <div className="checkbox"></div>
                          <div className="service-name">
                            {service.service_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-services">
                      Inga tilläggstjänster beställda
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
