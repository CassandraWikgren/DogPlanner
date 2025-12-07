"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PawPrint,
  Calendar,
  Plus,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
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
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Väntande" },
      confirmed: { color: "bg-green-100 text-green-800", text: "Bekräftad" },
      checked_in: { color: "bg-blue-100 text-blue-800", text: "Incheckad" },
      checked_out: { color: "bg-gray-100 text-gray-800", text: "Utcheckad" },
      cancelled: { color: "bg-red-100 text-red-800", text: "Avbokad" },
    };
    const config = configs[status || "pending"] || configs.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-[#2c7a4c] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ett fel uppstod</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Försök igen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Välkommen, {currentOwner?.full_name || "Kund"}!
              </h1>
              <p className="text-base text-gray-600 mt-1">
                {currentOwner?.customer_number ? `Kundnummer: #${currentOwner.customer_number}` : "Din portal för hundar och bokningar"}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#E6F4EA] rounded-lg px-4 py-3 text-center">
                <p className="text-2xl font-bold text-[#2c7a4c]">{dogs.length}</p>
                <p className="text-xs text-gray-600">Hundar</p>
              </div>
              <div className="bg-blue-50 rounded-lg px-4 py-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{bookings.filter(b => b.status !== "cancelled").length}</p>
                <p className="text-xs text-gray-600">Bokningar</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link href="/kundportal/ny-bokning">
            <Button className="w-full h-20 bg-[#2c7a4c] hover:bg-[#236139] text-white flex items-center justify-center gap-3 rounded-lg shadow-sm">
              <Plus className="h-6 w-6" />
              <span className="font-medium text-lg">Ny bokning</span>
            </Button>
          </Link>
          <Link href="/kundportal/mina-hundar">
            <Button variant="outline" className="w-full h-20 flex items-center justify-center gap-3 border-[#2c7a4c] text-[#2c7a4c] hover:bg-[#2c7a4c] hover:text-white rounded-lg">
              <PawPrint className="h-6 w-6" />
              <span className="font-medium text-lg">Mina hundar</span>
            </Button>
          </Link>
          <Link href="/kundportal/mina-bokningar">
            <Button variant="outline" className="w-full h-20 flex items-center justify-center gap-3 border-[#2c7a4c] text-[#2c7a4c] hover:bg-[#2c7a4c] hover:text-white rounded-lg">
              <Calendar className="h-6 w-6" />
              <span className="font-medium text-lg">Bokningar</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PawPrint className="h-5 w-5 text-[#2c7a4c]" />
                  Mina hundar
                </CardTitle>
                <Link href="/kundportal/mina-hundar">
                  <Button variant="outline" size="sm" className="border-[#2c7a4c] text-[#2c7a4c] hover:bg-[#2c7a4c] hover:text-white">
                    Visa alla →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {dogs.length === 0 ? (
                <div className="text-center py-8">
                  <PawPrint className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Inga hundar registrerade</p>
                  <Link href="/kundportal/mina-hundar">
                    <Button variant="outline" size="sm" className="border-[#2c7a4c] text-[#2c7a4c]">
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till hund
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {dogs.map((dog) => (
                    <div key={dog.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#E6F4EA] rounded-full flex items-center justify-center">
                          <PawPrint className="h-5 w-5 text-[#2c7a4c]" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dog.name}</p>
                          <p className="text-sm text-gray-600">{dog.breed || "Ingen ras"} • {dog.heightcm ? `${dog.heightcm} cm` : "?"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {!dog.heightcm ? "?" : dog.heightcm <= 34 ? "Liten" : dog.heightcm <= 49 ? "Mellan" : "Stor"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#2c7a4c]" />
                  Senaste bokningar
                </CardTitle>
                <Link href="/kundportal/mina-bokningar">
                  <Button variant="outline" size="sm" className="border-[#2c7a4c] text-[#2c7a4c] hover:bg-[#2c7a4c] hover:text-white">
                    Visa alla →
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">Inga bokningar</p>
                  <Link href="/kundportal/ny-bokning">
                    <Button variant="outline" size="sm" className="border-[#2c7a4c] text-[#2c7a4c]">
                      <Plus className="h-4 w-4 mr-2" />
                      Skapa bokning
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{booking.dogs?.name}</p>
                          <p className="text-sm text-gray-600">{formatDate(booking.start_date)} → {formatDate(booking.end_date)}</p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                      {booking.total_price && <p className="text-sm font-semibold text-[#2c7a4c]">{booking.total_price} kr</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-200 shadow-sm mt-6">
          <CardHeader className="border-b border-gray-100 bg-gray-50">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#2c7a4c]" />
              Min profil
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentOwner?.email || "Ej angett"}</p>
                  <p className="text-xs text-gray-500">E-post</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentOwner?.phone || "Ej angett"}</p>
                  <p className="text-xs text-gray-500">Telefon</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentOwner?.address || "Ej angett"}</p>
                  <p className="text-xs text-gray-500">Adress</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{currentOwner?.created_at ? formatDate(currentOwner.created_at) : "Okänt"}</p>
                  <p className="text-xs text-gray-500">Medlem sedan</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
