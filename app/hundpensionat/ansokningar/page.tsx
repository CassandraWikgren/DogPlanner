"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Dog,
  User,
  Calendar,
  FileText,
  Percent,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ====================================
// TYPER
// ====================================
interface Owner {
  id: string;
  full_name: string;
  phone: string;
  email: string;
}

interface DogData {
  id: string;
  name: string;
  breed: string;
  birth: string;
  heightcm: number;
  owners?: Owner;
}

interface ExtraService {
  id: string;
  label: string;
  price: number;
  unit: string;
}

interface PendingBooking {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  discount_amount: number | null;
  notes: string | null;
  extra_service_ids: string[] | null;
  created_at: string;
  dogs?: DogData;
}

interface OwnerDiscount {
  id: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  description: string | null;
}

// ====================================
// HUVUDKOMPONENT
// ====================================
export default function PensionatAnsokningarPage() {
  const supabase = createClientComponentClient();
  const { user, currentOrgId, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState<PendingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Rabatter & kommentarer per bokning
  const [discounts, setDiscounts] = useState<Record<string, OwnerDiscount[]>>(
    {}
  );
  const [selectedDiscounts, setSelectedDiscounts] = useState<
    Record<string, string>
  >({});
  const [customDiscountType, setCustomDiscountType] = useState<
    Record<string, "percentage" | "fixed_amount">
  >({});
  const [customDiscountValue, setCustomDiscountValue] = useState<
    Record<string, number>
  >({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Extra tjänster mapping
  const [extraServices, setExtraServices] = useState<
    Record<string, ExtraService[]>
  >({});

  // ====================================
  // LADDA DATA
  // ====================================
  useEffect(() => {
    if (currentOrgId && !authLoading) {
      loadPendingBookings();
      loadAllExtraServices();
    }
  }, [currentOrgId, authLoading]);

  const loadPendingBookings = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from("bookings")
        .select(
          `
          id,
          start_date,
          end_date,
          total_price,
          discount_amount,
          notes,
          extra_service_ids,
          created_at,
          dogs (
            id,
            name,
            breed,
            birth,
            heightcm,
            owners (
              id,
              full_name,
              phone,
              email
            )
          )
        `
        )
        .eq("org_id", currentOrgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fel vid hämtning av pending bookings:", error);
        return;
      }

      setBookings(data || []);

      // Ladda rabatter för varje ägare
      if (data && data.length > 0) {
        const ownerIds = data
          .map((b: any) => b.dogs?.owners?.id)
          .filter(Boolean);
        await loadDiscountsForOwners(ownerIds);
      }
    } catch (err) {
      console.error("Oväntat fel:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDiscountsForOwners = async (ownerIds: string[]) => {
    try {
      const { data, error } = await (supabase as any)
        .from("owner_discounts")
        .select("*")
        .in("owner_id", ownerIds)
        .eq("is_active", true);

      if (error) {
        console.error("Fel vid hämtning av rabatter:", error);
        return;
      }

      // Gruppera rabatter per owner_id
      const grouped: Record<string, OwnerDiscount[]> = {};
      data?.forEach((discount: any) => {
        if (!grouped[discount.owner_id]) {
          grouped[discount.owner_id] = [];
        }
        grouped[discount.owner_id].push(discount);
      });

      setDiscounts(grouped);
    } catch (err) {
      console.error("Oväntat fel vid rabatthämtning:", err);
    }
  };

  const loadAllExtraServices = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await (supabase as any)
        .from("extra_services")
        .select("id, label, price, unit")
        .eq("org_id", currentOrgId)
        .in("service_type", ["boarding", "both"]);

      if (error) {
        console.error("Fel vid hämtning av extra_services:", error);
        return;
      }

      // Skapa lookup map: service_id -> service object
      const serviceMap: Record<string, ExtraService> = {};
      data?.forEach((service: ExtraService) => {
        serviceMap[service.id] = service;
      });

      // För varje bokning, mappa extra_service_ids till services
      const servicesPerBooking: Record<string, ExtraService[]> = {};
      bookings.forEach((booking) => {
        if (booking.extra_service_ids) {
          servicesPerBooking[booking.id] = booking.extra_service_ids
            .map((sid) => serviceMap[sid])
            .filter(Boolean);
        }
      });

      setExtraServices(servicesPerBooking);
    } catch (err) {
      console.error("Oväntat fel vid extra_services:", err);
    }
  };

  // ====================================
  // GODKÄNN BOKNING
  // ====================================
  const handleApprove = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    setProcessing(bookingId);

    try {
      let finalPrice = booking.total_price;
      let finalDiscountAmount = booking.discount_amount || 0;
      let discountDescription = "";

      // Applicera vald rabatt
      const selectedDiscountId = selectedDiscounts[bookingId];
      if (selectedDiscountId) {
        const ownerId = booking.dogs?.owners?.id;
        const ownerDiscounts = discounts[ownerId || ""] || [];
        const discount = ownerDiscounts.find(
          (d) => d.id === selectedDiscountId
        );

        if (discount) {
          if (discount.discount_type === "percentage") {
            const discountAmt = finalPrice * (discount.discount_value / 100);
            finalDiscountAmount += discountAmt;
            finalPrice -= discountAmt;
          } else {
            finalDiscountAmount += discount.discount_value;
            finalPrice -= discount.discount_value;
          }
          discountDescription = discount.description || "Kundrabatt";
        }
      }

      // Applicera custom rabatt
      const customType = customDiscountType[bookingId];
      const customValue = customDiscountValue[bookingId];
      if (customValue && customValue > 0) {
        if (customType === "percentage") {
          const discountAmt = finalPrice * (customValue / 100);
          finalDiscountAmount += discountAmt;
          finalPrice -= discountAmt;
        } else {
          finalDiscountAmount += customValue;
          finalPrice -= customValue;
        }
        discountDescription += discountDescription
          ? ` + Custom ${customValue}${
              customType === "percentage" ? "%" : " kr"
            }`
          : `Custom ${customValue}${customType === "percentage" ? "%" : " kr"}`;
      }

      // Uppdatera bokning till confirmed
      const updateData: any = {
        status: "confirmed",
        total_price: finalPrice,
        discount_amount: finalDiscountAmount,
      };

      // Lägg till admin notes om finns
      if (adminNotes[bookingId]) {
        const existingNotes = booking.notes || "";
        updateData.notes = existingNotes
          ? `${existingNotes}\n\n[Admin]: ${adminNotes[bookingId]}`
          : `[Admin]: ${adminNotes[bookingId]}`;
      }

      const { error } = await (supabase as any)
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);

      if (error) {
        console.error("Fel vid godkännande:", error);
        alert("Kunde inte godkänna bokningen. Se konsolen.");
        return;
      }

      // Vänta lite så trigger hinner skapa fakturan
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Hämta den skapade förskottsfakturan
      const { data: updatedBooking } = await (supabase as any)
        .from("bookings")
        .select("prepayment_invoice_id")
        .eq("id", bookingId)
        .single();

      let invoiceMessage = "";
      if (updatedBooking?.prepayment_invoice_id) {
        invoiceMessage = `\n\n📄 Förskottsfaktura skapad!\nFaktura-ID: ${updatedBooking.prepayment_invoice_id}\n\nKunden ska betala förskottet innan ankomst.`;
      }

      alert(
        `✅ Bokning godkänd!\n\nSlutpris: ${finalPrice.toFixed(
          2
        )} kr\nRabatt: ${finalDiscountAmount.toFixed(2)} kr${
          discountDescription ? `\n${discountDescription}` : ""
        }${invoiceMessage}`
      );

      // Ta bort från listan
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error("Oväntat fel:", err);
      alert("Ett oväntat fel uppstod.");
    } finally {
      setProcessing(null);
    }
  };

  // ====================================
  // AVSLÅ BOKNING
  // ====================================
  const handleReject = async (bookingId: string) => {
    if (!confirm("Är du säker på att du vill avslå denna bokning?")) return;

    setProcessing(bookingId);

    try {
      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) {
        console.error("Fel vid avslag:", error);
        alert("Kunde inte avslå bokningen.");
        return;
      }

      alert("❌ Bokning avslogs och markerades som cancelled.");
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error("Oväntat fel:", err);
    } finally {
      setProcessing(null);
    }
  };

  // ====================================
  // HJÄLPFUNKTIONER
  // ====================================
  const getSizeCategory = (heightcm: number): string => {
    if (heightcm <= 34) return "Liten (0-34 cm)";
    if (heightcm <= 49) return "Mellan (35-49 cm)";
    return "Stor (50+ cm)";
  };

  const calculateNights = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ====================================
  // RENDERING
  // ====================================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Laddar ansökningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bokningsansökningar
            </h1>
            <p className="text-gray-600">
              Granska och godkänn nya pensionatbokningar
            </p>
          </div>
          <Link href="/hundpensionat">
            <Button variant="outline">← Tillbaka till Pensionat</Button>
          </Link>
        </div>

        {/* Statistik */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{bookings.length}</p>
                  <p className="text-gray-600">Väntande ansökningar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {bookings
                      .reduce((sum, b) => sum + (b.total_price || 0), 0)
                      .toFixed(0)}{" "}
                    kr
                  </p>
                  <p className="text-gray-600">Totalt bokningsvärde</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Dog className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {new Set(bookings.map((b) => b.dogs?.id)).size}
                  </p>
                  <p className="text-gray-600">Unika hundar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bokningslista */}
      <div className="max-w-[1600px] mx-auto space-y-6">
        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Inga väntande ansökningar
              </h3>
              <p className="text-gray-600">
                Alla bokningar har behandlats. Bra jobbat!
              </p>
            </CardContent>
          </Card>
        ) : (
          bookings.map((booking) => {
            const ownerId = booking.dogs?.owners?.id || "";
            const ownerDiscounts = discounts[ownerId] || [];
            const nights = calculateNights(
              booking.start_date,
              booking.end_date
            );
            const services = extraServices[booking.id] || [];

            return (
              <Card key={booking.id} className="border-2 border-yellow-200">
                <CardHeader className="bg-yellow-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Dog className="h-6 w-6 text-blue-600" />
                        {booking.dogs?.name || "Okänd hund"}
                        <span className="text-sm font-normal text-gray-600">
                          ({booking.dogs?.breed || "Okänd ras"})
                        </span>
                      </CardTitle>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            {booking.dogs?.owners?.full_name || "Okänd ägare"}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{booking.dogs?.owners?.phone || "—"}</span>
                          <span className="text-gray-400">•</span>
                          <span>{booking.dogs?.owners?.email || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {booking.start_date} → {booking.end_date}
                          </span>
                          <span className="font-medium">({nights} nätter)</span>
                        </div>
                        {booking.dogs && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>
                              {getSizeCategory(booking.dogs.heightcm)} •{" "}
                              {booking.dogs.heightcm} cm
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Totalpris</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {booking.total_price?.toFixed(2) || 0} kr
                      </p>
                      {booking.discount_amount &&
                        booking.discount_amount > 0 && (
                          <p className="text-sm text-green-600">
                            Rabatt: -{booking.discount_amount.toFixed(2)} kr
                          </p>
                        )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Extra tjänster */}
                  {services.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Valda tillvalstjänster
                      </h4>
                      <div className="space-y-1 text-sm">
                        {services.map((service) => (
                          <div
                            key={service.id}
                            className="flex justify-between"
                          >
                            <span>{service.label}</span>
                            <span className="font-medium">
                              {service.price} kr ({service.unit})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kundanteckningar */}
                  {booking.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">
                        Anteckningar från kund
                      </h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {booking.notes}
                      </p>
                    </div>
                  )}

                  {/* Rabattval */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      Applicera rabatter
                    </h4>

                    {/* Kundrabatter */}
                    {ownerDiscounts.length > 0 && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                          Kundrabatter för denna ägare
                        </label>
                        <select
                          className="w-full p-2 border rounded"
                          value={selectedDiscounts[booking.id] || ""}
                          onChange={(e) =>
                            setSelectedDiscounts((prev) => ({
                              ...prev,
                              [booking.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Ingen rabatt</option>
                          {ownerDiscounts.map((discount) => (
                            <option key={discount.id} value={discount.id}>
                              {discount.description ||
                                `${discount.discount_value}${
                                  discount.discount_type === "percentage"
                                    ? "%"
                                    : " kr"
                                }`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Custom rabatt */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Typ
                        </label>
                        <select
                          className="w-full p-2 border rounded"
                          value={customDiscountType[booking.id] || "percentage"}
                          onChange={(e) =>
                            setCustomDiscountType((prev) => ({
                              ...prev,
                              [booking.id]: e.target.value as
                                | "percentage"
                                | "fixed_amount",
                            }))
                          }
                        >
                          <option value="percentage">Procent (%)</option>
                          <option value="fixed_amount">Fast belopp (kr)</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Värde
                        </label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={customDiscountValue[booking.id] || ""}
                          onChange={(e) =>
                            setCustomDiscountValue((prev) => ({
                              ...prev,
                              [booking.id]: parseFloat(e.target.value) || 0,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Admin anteckningar */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Admin-anteckningar (valfritt)
                    </label>
                    <Textarea
                      placeholder="T.ex. 'Bekräftad via telefon med kunden'"
                      rows={3}
                      value={adminNotes[booking.id] || ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Åtgärdsknappar */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(booking.id)}
                      disabled={processing === booking.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing === booking.id ? (
                        <Clock className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Godkänn bokning
                    </Button>
                    <Button
                      onClick={() => handleReject(booking.id)}
                      disabled={processing === booking.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Avslå
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
