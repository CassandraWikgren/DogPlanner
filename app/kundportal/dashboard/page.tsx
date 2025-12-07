"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PawPrint,
  Calendar,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  XCircle,
  ChevronRight,
} from "lucide-react";

interface Owner {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_number: number | null;
  created_at: string | null;
}

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
}

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: string | null;
  total_price: number | null;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
  };
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user || !user.email) {
        router.push("/kundportal/login");
        return;
      }

      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .select("id, full_name, phone, email, address, customer_number, created_at")
        .eq("email", user.email)
        .single();

      if (ownerError || !ownerData) {
        throw new Error("Kunde inte hitta din profil");
      }

      setCurrentOwner(ownerData);

      const { data: dogsData } = await supabase
        .from("dogs")
        .select("id, name, breed, heightcm")
        .eq("owner_id", ownerData.id);

      setDogs(dogsData || []);

      if (dogsData && dogsData.length > 0) {
        const dogIds = dogsData.map((dog) => dog.id);
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("id, start_date, end_date, status, total_price, dogs!inner (id, name, breed)")
          .in("dog_id", dogIds)
          .order("start_date", { ascending: false });

        setBookings(bookingsData || []);
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Fel:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const configs: Record<string, { color: string; text: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", text: "Väntande" },
      confirmed: { color: "bg-green-100 text-green-800 border-green-200", text: "Bekräftad" },
      checked_in: { color: "bg-blue-100 text-blue-800 border-blue-200", text: "Incheckad" },
      checked_out: { color: "bg-gray-100 text-gray-800 border-gray-200", text: "Utcheckad" },
      cancelled: { color: "bg-red-100 text-red-800 border-red-200", text: "Avbokad" },
    };
    const config = configs[status || "pending"] || configs.pending;
    return <Badge className={`${config.color} border`}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-[#2c7a4c] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Ett fel uppstod</h2>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-[#2c7a4c] font-medium text-sm hover:underline"
            >
              Försök igen
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => b.status !== "cancelled" && b.status !== "checked_out");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Hej, {currentOwner?.full_name?.split(" ")[0] || "där"}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            {currentOwner?.customer_number && `Kundnummer #${currentOwner.customer_number}`}
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        
        {/* Snabbåtgärd - Ny bokning (ENDAST en CTA) */}
        <Link href="/kundportal/ny-bokning" className="block">
          <div className="bg-[#2c7a4c] text-white rounded-xl p-5 flex items-center justify-between hover:bg-[#236139] transition-colors">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-3">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-lg">Boka pensionatvistelse</p>
                <p className="text-white/80 text-sm">Välj datum och hund</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/60" />
          </div>
        </Link>

        {/* Mina hundar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Mina hundar</h2>
            <Link href="/kundportal/mina-hundar" className="text-sm text-[#2c7a4c] font-medium hover:underline">
              {dogs.length > 0 ? "Hantera" : "Lägg till"}
            </Link>
          </div>
          
          {dogs.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
              <CardContent className="py-8 text-center">
                <PawPrint className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1">Inga hundar registrerade</p>
                <Link href="/kundportal/mina-hundar" className="text-sm text-[#2c7a4c] font-medium hover:underline">
                  Lägg till din första hund →
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {dogs.map((dog) => (
                <Card key={dog.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E6F4EA] rounded-full flex items-center justify-center flex-shrink-0">
                        <PawPrint className="h-6 w-6 text-[#2c7a4c]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{dog.name}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {dog.breed || "Blandras"} {dog.heightcm ? `• ${dog.heightcm} cm` : ""}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Kommande bokningar */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Kommande bokningar</h2>
            {bookings.length > 0 && (
              <Link href="/kundportal/mina-bokningar" className="text-sm text-[#2c7a4c] font-medium hover:underline">
                Visa alla
              </Link>
            )}
          </div>
          
          {activeBookings.length === 0 ? (
            <Card className="border-dashed border-2 border-gray-200 bg-gray-50">
              <CardContent className="py-8 text-center">
                <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Inga kommande bokningar</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeBookings.slice(0, 3).map((booking) => (
                <Card key={booking.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{booking.dogs?.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(booking.start_date)} – {formatDate(booking.end_date)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Kontaktuppgifter */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Mina uppgifter</h2>
          <Card className="border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{currentOwner?.email || "Ej angett"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{currentOwner?.phone || "Ej angett"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{currentOwner?.address || "Ej angett"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">
                  Medlem sedan {currentOwner?.created_at 
                    ? new Date(currentOwner.created_at).toLocaleDateString("sv-SE", { year: "numeric", month: "long" })
                    : "okänt"
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

      </main>
    </div>
  );
}
