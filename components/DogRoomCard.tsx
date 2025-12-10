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
              margin: 12mm;
            }
            
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
              color: #1f2937;
              background: white;
              padding: 0;
              line-height: 1.4;
            }
            
            .card-wrapper {
              position: relative;
              padding-top: 8px;
            }
            
            .room-ribbon {
              position: absolute;
              top: 0;
              right: 40px;
              background: linear-gradient(135deg, #2c7a4c 0%, #1d5c38 100%);
              color: white;
              padding: 12px 28px 14px;
              font-weight: 800;
              font-size: 20px;
              letter-spacing: 0.5px;
              border-radius: 0 0 12px 12px;
              box-shadow: 0 4px 12px rgba(44, 122, 76, 0.3);
            }
            
            .card {
              border: 2px solid #e5e7eb;
              border-radius: 20px;
              padding: 28px;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            
            /* Header Section */
            .header {
              display: flex;
              gap: 28px;
              margin-bottom: 24px;
              padding-bottom: 24px;
              border-bottom: 2px dashed #e5e7eb;
            }
            
            .photo-container {
              flex-shrink: 0;
              width: 150px;
              height: 150px;
              border-radius: 16px;
              overflow: hidden;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #e5e7eb;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            }
            
            .photo-container img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            
            .photo-placeholder {
              font-size: 56px;
            }
            
            .dog-info {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            .dog-name {
              font-size: 42px;
              font-weight: 800;
              color: #2c7a4c;
              margin-bottom: 6px;
              line-height: 1.1;
              letter-spacing: -0.5px;
            }
            
            .dog-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-bottom: 16px;
            }
            
            .meta-badge {
              display: inline-flex;
              align-items: center;
              gap: 4px;
              padding: 5px 12px;
              background: #f3f4f6;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              color: #4b5563;
            }
            
            .dates-container {
              display: flex;
              gap: 12px;
            }
            
            .date-box {
              flex: 1;
              background: #f0fdf4;
              border: 2px solid #86efac;
              border-radius: 10px;
              padding: 10px 14px;
              text-align: center;
            }
            
            .date-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #166534;
              margin-bottom: 2px;
            }
            
            .date-value {
              font-size: 15px;
              font-weight: 600;
              color: #1f2937;
            }
            
            /* Share Room Indicator */
            .share-indicator {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              padding: 10px 20px;
              border-radius: 12px;
              font-weight: 700;
              font-size: 16px;
              margin-bottom: 20px;
            }
            
            .share-indicator.can-share {
              background: #dcfce7;
              border: 2px solid #86efac;
              color: #166534;
            }
            
            .share-indicator.no-share {
              background: #fee2e2;
              border: 2px solid #fca5a5;
              color: #991b1b;
            }
            
            .share-icon {
              font-size: 20px;
            }
            
            /* Section Styling */
            .section {
              margin-bottom: 16px;
            }
            
            .section-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 8px;
            }
            
            .section-icon {
              font-size: 18px;
            }
            
            .section-title {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #6b7280;
            }
            
            .section-content {
              background: #fafafa;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 14px 18px;
              font-size: 15px;
              line-height: 1.6;
            }
            
            .section-content.alert {
              background: linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%);
              border: 2px solid #fbbf24;
              font-weight: 500;
            }
            
            .section-content.danger {
              background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
              border: 2px solid #f87171;
              font-weight: 500;
            }
            
            .empty-text {
              color: #9ca3af;
              font-style: italic;
            }
            
            /* Two Column Grid */
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            
            /* Food Card */
            .food-card {
              background: #fffbeb;
              border: 2px solid #fde68a;
              border-radius: 12px;
              padding: 16px;
            }
            
            .food-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px dashed #fde68a;
            }
            
            .food-row:last-child {
              border-bottom: none;
            }
            
            .food-label {
              font-weight: 600;
              color: #92400e;
              font-size: 14px;
            }
            
            .food-value {
              color: #1f2937;
              font-size: 14px;
            }
            
            /* Contact Cards */
            .contact-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-top: 8px;
            }
            
            .contact-card {
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              border: 2px solid #93c5fd;
              border-radius: 12px;
              padding: 14px 16px;
            }
            
            .contact-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #3b82f6;
              margin-bottom: 4px;
            }
            
            .contact-name {
              font-weight: 700;
              color: #1e40af;
              font-size: 15px;
              margin-bottom: 4px;
            }
            
            .contact-phone {
              font-size: 20px;
              font-weight: 800;
              color: #1e3a8a;
              letter-spacing: 0.5px;
            }
            
            .contact-email {
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }
            
            /* Services Section */
            .services-section {
              background: #f8fafc;
              border: 2px solid #e2e8f0;
              border-radius: 14px;
              padding: 18px;
              margin-top: 20px;
            }
            
            .services-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 14px;
              padding-bottom: 10px;
              border-bottom: 2px solid #2c7a4c;
            }
            
            .services-title {
              font-size: 16px;
              font-weight: 700;
              color: #1f2937;
            }
            
            .services-count {
              background: #2c7a4c;
              color: white;
              padding: 2px 10px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 700;
            }
            
            .service-list {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            
            .service-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 14px;
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
            }
            
            .checkbox {
              width: 26px;
              height: 26px;
              border: 3px solid #9ca3af;
              border-radius: 6px;
              flex-shrink: 0;
              background: white;
            }
            
            .service-name {
              flex: 1;
              font-size: 15px;
              font-weight: 500;
              color: #374151;
            }
            
            .no-services {
              text-align: center;
              color: #9ca3af;
              font-style: italic;
              padding: 16px;
            }
            
            /* Footer */
            .card-footer {
              margin-top: 20px;
              padding-top: 16px;
              border-top: 2px dashed #e5e7eb;
              text-align: center;
              font-size: 11px;
              color: #9ca3af;
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
                <div className="room-ribbon">🏠 {booking.rooms.name}</div>
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
                    <div className="dog-meta">
                      <span className="meta-badge">
                        🐕 {dog?.breed || "Okänd ras"}
                      </span>
                      <span className="meta-badge">🎂 {age}</span>
                      {dog?.gender && (
                        <span className="meta-badge">
                          {dog.gender === "male"
                            ? "♂ Hane"
                            : dog.gender === "female"
                              ? "♀ Tik"
                              : dog.gender}
                        </span>
                      )}
                      {dog?.heightcm && (
                        <span className="meta-badge">📏 {dog.heightcm} cm</span>
                      )}
                    </div>
                    <div className="dates-container">
                      <div className="date-box">
                        <div className="date-label">Incheckning</div>
                        <div className="date-value">
                          {formatDate(booking.start_date)}
                        </div>
                      </div>
                      <div className="date-box">
                        <div className="date-label">Utcheckning</div>
                        <div className="date-value">
                          {formatDate(booking.end_date)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share room indicator */}
                <div
                  className={`share-indicator ${dog?.can_share_room ? "can-share" : "no-share"}`}
                >
                  <span className="share-icon">
                    {dog?.can_share_room ? "✓" : "✗"}
                  </span>
                  {dog?.can_share_room
                    ? "Kan dela rum med andra hundar"
                    : "Kan EJ dela rum med andra hundar"}
                </div>

                {/* Allergies, Medications, Special Needs */}
                <div className="grid-2">
                  <div className="section">
                    <div className="section-header">
                      <span className="section-icon">⚠️</span>
                      <span className="section-title">Allergier</span>
                    </div>
                    <div
                      className={`section-content ${dog?.allergies ? "danger" : ""}`}
                    >
                      {dog?.allergies || (
                        <span className="empty-text">Inga kända allergier</span>
                      )}
                    </div>
                  </div>
                  <div className="section">
                    <div className="section-header">
                      <span className="section-icon">💊</span>
                      <span className="section-title">Mediciner</span>
                    </div>
                    <div
                      className={`section-content ${dog?.medications ? "alert" : ""}`}
                    >
                      {dog?.medications || (
                        <span className="empty-text">Inga mediciner</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Special needs */}
                {dog?.special_needs && (
                  <div className="section">
                    <div className="section-header">
                      <span className="section-icon">⭐</span>
                      <span className="section-title">Särskilda behov</span>
                    </div>
                    <div className="section-content alert">
                      {dog.special_needs}
                    </div>
                  </div>
                )}

                {/* Behavior notes */}
                {dog?.behavior_notes && (
                  <div className="section">
                    <div className="section-header">
                      <span className="section-icon">🐕</span>
                      <span className="section-title">
                        Beteende att känna till
                      </span>
                    </div>
                    <div className="section-content">{dog.behavior_notes}</div>
                  </div>
                )}

                {/* Food information */}
                <div className="section">
                  <div className="section-header">
                    <span className="section-icon">🍖</span>
                    <span className="section-title">Matinformation</span>
                  </div>
                  {dog?.food_type ||
                  dog?.food_brand ||
                  dog?.food_amount ||
                  dog?.food_times ? (
                    <div className="food-card">
                      {dog.food_type && (
                        <div className="food-row">
                          <span className="food-label">Typ</span>
                          <span className="food-value">
                            {dog.food_type === "own"
                              ? "🏠 Eget foder"
                              : dog.food_type === "pensionat"
                                ? "🏨 Pensionatets foder"
                                : dog.food_type}
                          </span>
                        </div>
                      )}
                      {dog.food_brand && (
                        <div className="food-row">
                          <span className="food-label">Märke</span>
                          <span className="food-value">{dog.food_brand}</span>
                        </div>
                      )}
                      {dog.food_amount && (
                        <div className="food-row">
                          <span className="food-label">Mängd/mål</span>
                          <span className="food-value">{dog.food_amount}</span>
                        </div>
                      )}
                      {dog.food_times && (
                        <div className="food-row">
                          <span className="food-label">Antal mål</span>
                          <span className="food-value">
                            {dog.food_times} mål/dag
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="section-content">
                      <span className="empty-text">
                        Ingen matinformation angiven
                      </span>
                    </div>
                  )}
                </div>

                {/* Owner contact info */}
                <div className="section">
                  <div className="section-header">
                    <span className="section-icon">📞</span>
                    <span className="section-title">
                      Kontaktuppgifter vid nödsituation
                    </span>
                  </div>
                  <div className="contact-grid">
                    <div className="contact-card">
                      <div className="contact-label">Ägare</div>
                      <div className="contact-name">
                        {dog?.owners?.full_name || "Okänd ägare"}
                      </div>
                      <div className="contact-phone">
                        {dog?.owners?.phone || "—"}
                      </div>
                      {dog?.owners?.email && (
                        <div className="contact-email">{dog.owners.email}</div>
                      )}
                    </div>
                    {dog?.owners?.contact_person2_name && (
                      <div className="contact-card">
                        <div className="contact-label">Kontaktperson 2</div>
                        <div className="contact-name">
                          {dog.owners.contact_person2_name}
                        </div>
                        <div className="contact-phone">
                          {dog?.owners?.contact_person2_phone || "—"}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Services checklist */}
                <div className="services-section">
                  <div className="services-header">
                    <span style={{ fontSize: "20px" }}>✅</span>
                    <span className="services-title">
                      Beställda tilläggstjänster
                    </span>
                    {services.length > 0 && (
                      <span className="services-count">
                        {services.length} st
                      </span>
                    )}
                  </div>
                  {services.length > 0 ? (
                    <div className="service-list">
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

                {/* Footer */}
                <div className="card-footer">
                  Utskrivet {new Date().toLocaleDateString("sv-SE")} •
                  DogPlanner
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
