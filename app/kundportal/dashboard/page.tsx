"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PawPrint, Calendar, Plus, Phone, Mail, XCircle } from "lucide-react";

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
  orgs: {
    id: string;
    name: string | null;
  } | null;
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || !user.email) {
        router.push("/kundportal/login");
        return;
      }

      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .select(
          "id, full_name, phone, email, address, customer_number, created_at"
        )
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
          .select(
            "id, start_date, end_date, status, total_price, dogs!inner (id, name, breed), orgs (id, name)"
          )
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
      pending: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        text: "Väntande",
      },
      confirmed: {
        color: "bg-green-100 text-green-800 border-green-200",
        text: "Bekräftad",
      },
      checked_in: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        text: "Incheckad",
      },
      checked_out: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        text: "Utcheckad",
      },
      cancelled: {
        color: "bg-red-100 text-red-800 border-red-200",
        text: "Avbokad",
      },
    };
    const config = configs[status || "pending"] || configs.pending;
    return <Badge className={`${config.color} border`}>{config.text}</Badge>;
  };

  // Hjälpfunktion för att formatera namn med stor bokstav
  const formatName = (name: string | undefined | null): string => {
    if (!name) return "";
    // Hantera fall där namnet kan vara "testkund3" eller "Mia Nilsson"
    return name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "short",
    });
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

  const activeBookings = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "checked_out"
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header - Cleaner with subtle background */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Hej,{" "}
                {formatName(currentOwner?.full_name?.split(" ")[0]) || "där"}!
                👋
              </h1>
              {currentOwner?.customer_number && (
                <p className="text-sm text-gray-400 mt-1 font-medium">
                  Kundnummer #{currentOwner.customer_number}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Snabbnavigation - diskret och enhetlig */}
        <div className="grid grid-cols-4 gap-3">
          <Link
            href="/kundportal/mina-hundar"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-center group"
          >
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <PawPrint className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">
              Mina hundar
            </span>
          </Link>
          <Link
            href="/kundportal/mina-bokningar"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-center group"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">Bokningar</span>
          </Link>
          <Link
            href="/kundportal/ny-bokning"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-center group"
          >
            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-gray-100 transition-colors">
              <Plus className="h-5 w-5 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">
              Ny bokning
            </span>
          </Link>
          <Link
            href="/kundportal/min-profil"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-center group"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-600">
              Min profil
            </span>
          </Link>
        </div>

        {/* Mina hundar */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Mina hundar
            </h2>
            <Link
              href="/kundportal/mina-hundar"
              className="text-sm text-[#2c7a4c] font-medium hover:text-[#236139] transition-colors"
            >
              Hantera
            </Link>
          </div>

          {dogs.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-white p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PawPrint className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-2">
                Inga hundar registrerade
              </p>
              <Link
                href="/kundportal/mina-hundar"
                className="text-sm text-[#2c7a4c] font-medium hover:text-[#236139]"
              >
                Lägg till din första hund →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {dogs.map((dog) => (
                <div
                  key={dog.id}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <PawPrint className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{dog.name}</p>
                      <p className="text-sm text-gray-500">
                        {dog.breed || "Blandras"}
                        {dog.heightcm && (
                          <span className="text-gray-300 mx-1.5">•</span>
                        )}
                        {dog.heightcm && `${dog.heightcm} cm`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Kommande bokningar */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">
              Kommande bokningar
            </h2>
            {bookings.length > 0 && (
              <Link
                href="/kundportal/mina-bokningar"
                className="text-sm text-[#2c7a4c] font-medium hover:text-[#236139] transition-colors"
              >
                Visa alla
              </Link>
            )}
          </div>

          {activeBookings.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl bg-white p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">Inga kommande bokningar</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {activeBookings.slice(0, 3).map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {booking.dogs?.name}
                        </p>
                        {booking.orgs?.name && (
                          <p className="text-sm text-emerald-600 font-medium truncate">
                            {booking.orgs.name}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {formatDate(booking.start_date)} –{" "}
                          {formatDate(booking.end_date)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mina uppgifter */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Mina uppgifter
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-700">
                  {currentOwner?.email || "Ej angett"}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-700">
                  {currentOwner?.phone || "Ej angett"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
