"use client";

// Förhindra prerendering för att undvika build-fel
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
  Edit,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  LogOut,
  Lock,
} from "lucide-react";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE: "[ERR-1001]",
  AUTH: "[ERR-5001]",
  REALTIME: "[ERR-3001]",
} as const;

// TypeScript-typer enligt Supabase schema (små bokstäver)
interface Owner {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_number: number | null;
  contact_person_2: string | null;
  contact_phone_2: string | null;
  notes: string | null;
  org_id: string;
  created_at: string | null;
  updated_at: string | null;
}

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  birth: string | null;
  heightcm: number | null;
  subscription: string | null;
  owner_id: string;
  org_id: string;
  room_id: string | null;
  vaccdhp: string | null;
  vaccpi: string | null;
  is_castrated: boolean | null;
  behavior_notes: string | null;
  days: string | null;
  startdate: string | null;
  enddate: string | null;
  photo_url: string | null;
  notes: string | null;
  events: any | null;
  checked_in: boolean | null;
  checkin_date: string | null;
  checkout_date: string | null;
  allergies: string | null;
  medications: string | null;
  special_needs: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Booking {
  id: string;
  org_id: string;
  dog_id: string;
  owner_id: string;
  room_id: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  base_price: number | null;
  total_price: number | null;
  discount_amount: number | null;
  notes: string | null;
  special_requests: string | null;
  created_at: string | null;
  updated_at: string | null;
  // Relations - partial dog object from query
  dogs: {
    id: string;
    name: string;
    breed: string | null;
  };
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "dogs" | "bookings" | "profile"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Hämta data från Supabase när komponenten laddar
  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const supabase = createClient();
      // Kontrollera auth status
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user || !user.email) {
        router.push("/kundportal/login");
        return;
      }

      // Hämta ägaren baserat på email (owners.email)
      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .select("*")
        .eq("email", user.email)
        .single();

      if (ownerError || !ownerData) {
        throw new Error(`${ERROR_CODES.DATABASE} Kunde inte hitta ägardata`);
      }

      setCurrentOwner(ownerData);

      // Hämta hundar för denna ägare (dogs.owner_id → owners.id)
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select("*")
        .eq("owner_id", ownerData.id);

      if (dogsError) {
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte hämta hundar: ${dogsError.message}`
        );
      }

      setDogs(dogsData || []);

      // Hämta bokningar för ägarens hundar
      if (dogsData && dogsData.length > 0) {
        const dogIds = dogsData.map((dog) => dog.id);

        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(
            `
            *,
            dogs!inner (
              id,
              name,
              breed
            )
          `
          )
          .in("dog_id", dogIds)
          .order("start_date", { ascending: false });

        if (bookingsError) {
          throw new Error(
            `${ERROR_CODES.DATABASE} Kunde inte hämta bokningar: ${bookingsError.message}`
          );
        }

        setBookings(bookingsData || []);
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Fel vid hämtning av kunddata:", err);
      setError(err.message || `${ERROR_CODES.DATABASE} Kunde inte ladda data`);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/kundportal");
  };

  const getStatusBadge = (status: Booking["status"]) => {
    const configs: Record<string, { color: string; icon: any; text: string }> =
      {
        pending: {
          color: "bg-yellow-100 text-yellow-800",
          icon: AlertCircle,
          text: "Väntande",
        },
        confirmed: {
          color: "bg-green-100 text-green-800",
          icon: CheckCircle,
          text: "Bekräftad",
        },
        checked_in: {
          color: "bg-blue-100 text-blue-800",
          icon: CheckCircle,
          text: "Incheckad",
        },
        checked_out: {
          color: "bg-gray-100 text-gray-800",
          icon: CheckCircle,
          text: "Utcheckad",
        },
        cancelled: {
          color: "bg-red-100 text-red-800",
          icon: XCircle,
          text: "Avbokad",
        },
      };

    const config = configs[status || "pending"];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDogSizeCategory = (heightcm: number | null) => {
    if (!heightcm) return "Okänd storlek";
    if (heightcm < 35) return "Liten hund";
    if (heightcm < 55) return "Medelstor hund";
    return "Stor hund";
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return "Okänd ålder";
    const birth = new Date(birthDate);
    const today = new Date();
    const age = Math.floor(
      (today.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    return `${age} år`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-[#2c7a4c] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Laddar dina uppgifter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Ett fel uppstod</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Försök igen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <PawPrint className="h-8 w-8 text-[#2c7a4c] mr-3" />
              <h1 className="text-xl font-bold text-gray-800">
                Min Kundportal
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Välkommen, {currentOwner?.full_name || "Kund"}!
              </span>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <nav className="flex space-x-8 mb-8">
          {[
            { key: "overview", label: "Översikt", icon: FileText },
            { key: "dogs", label: "Mina hundar", icon: PawPrint },
            { key: "bookings", label: "Bokningar", icon: Calendar },
            { key: "profile", label: "Min profil", icon: Settings },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                activeTab === key
                  ? "bg-[#2c7a4c] text-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content based on active tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Snabbåtkomst</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/kundportal/ny-bokning">
                    <Button className="w-full h-20 bg-[#2c7a4c] hover:bg-[#245a3e] flex flex-col">
                      <Plus className="h-6 w-6 mb-2" />
                      Ny bokning
                    </Button>
                  </Link>

                  <Link href="/kundportal/mina-hundar">
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col"
                    >
                      <PawPrint className="h-6 w-6 mb-2" />
                      Hantera hundar
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
                    onClick={() => setActiveTab("profile")}
                  >
                    <Edit className="h-6 w-6 mb-2" />
                    Uppdatera profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Bookings Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Senaste bokningar</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("bookings")}
                    >
                      Visa alla →
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex justify-between items-start p-3 bg-gray-50 rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{booking.dogs.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.start_date)} →{" "}
                            {formatDate(booking.end_date)}
                          </p>
                          {booking.total_price && (
                            <p className="text-sm font-semibold text-[#2c7a4c] mt-1">
                              {booking.total_price} kr
                            </p>
                          )}
                        </div>
                        <div className="ml-3">
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">Inga bokningar än</p>
                        <Link href="/kundportal/ny-bokning">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#2c7a4c] text-[#2c7a4c] hover:bg-[#2c7a4c] hover:text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Skapa din första bokning
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Mina hundar</CardTitle>
                    <Link href="/kundportal/mina-hundar">
                      <Button variant="ghost" size="sm">
                        Visa alla →
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dogs.slice(0, 3).map((dog) => (
                      <div
                        key={dog.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">{dog.name}</p>
                          <p className="text-sm text-gray-600">
                            {dog.breed} • {dog.heightcm || "?"} cm
                          </p>
                        </div>
                        <Badge variant="outline">
                          {!dog.heightcm
                            ? "Okänd"
                            : dog.heightcm <= 34
                              ? "Liten"
                              : dog.heightcm <= 49
                                ? "Mellan"
                                : "Stor"}
                        </Badge>
                      </div>
                    ))}
                    {dogs.length === 0 && (
                      <div className="text-center py-8">
                        <PawPrint className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-4">
                          Inga hundar registrerade än
                        </p>
                        <Link href="/kundportal/mina-hundar">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#2c7a4c] text-[#2c7a4c] hover:bg-[#2c7a4c] hover:text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Lägg till din första hund
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "dogs" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mina hundar</h2>
              <Button className="bg-[#2c7a4c] hover:bg-[#245a3e]">
                <Plus className="h-4 w-4 mr-2" />
                Lägg till hund
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {dogs.map((dog) => (
                <Card key={dog.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PawPrint className="h-5 w-5 mr-2 text-[#2c7a4c]" />
                      {dog.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Ras:</strong> {dog.breed}
                      </p>
                      <p>
                        <strong>Ålder:</strong> {calculateAge(dog.birth)}
                      </p>
                      <p>
                        <strong>Mankhöjd:</strong> {dog.heightcm} cm
                      </p>
                      <p>
                        <strong>Storlek:</strong>{" "}
                        {getDogSizeCategory(dog.heightcm)}
                      </p>
                      {dog.subscription && (
                        <p>
                          <strong>Abonnemang:</strong> {dog.subscription}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Redigera
                      </Button>
                      <Link href={`/kundportal/boka?dog=${dog.id}`}>
                        <Button
                          size="sm"
                          className="bg-[#2c7a4c] hover:bg-[#245a3e]"
                        >
                          Boka
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {dogs.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <PawPrint className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Inga hundar registrerade
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Lägg till din första hund för att komma igång med bokningar
                  </p>
                  <Button className="bg-[#2c7a4c] hover:bg-[#245a3e]">
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till hund
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Mina bokningar</h2>
              <Link href="/kundportal/boka">
                <Button className="bg-[#2c7a4c] hover:bg-[#245a3e]">
                  <Plus className="h-4 w-4 mr-2" />
                  Ny bokning
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                        <div>
                          <p className="font-medium text-lg">
                            {booking.dogs.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.dogs.breed}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Incheckning</p>
                          <p className="font-medium">
                            {formatDate(booking.start_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Utcheckning</p>
                          <p className="font-medium">
                            {formatDate(booking.end_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Pris</p>
                          <p className="font-medium">
                            {(
                              booking.total_price ||
                              booking.base_price ||
                              0
                            ).toLocaleString()}{" "}
                            kr
                          </p>
                        </div>
                      </div>

                      <div className="ml-4">
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Detaljer
                      </Button>
                      {booking.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Avboka
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Inga bokningar ännu
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Skapa din första bokning för att se den här
                  </p>
                  <Link href="/kundportal/boka">
                    <Button className="bg-[#2c7a4c] hover:bg-[#245a3e]">
                      <Plus className="h-4 w-4 mr-2" />
                      Ny bokning
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "profile" && currentOwner && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Min profil</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kontaktinformation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{currentOwner.email}</p>
                      <p className="text-sm text-gray-600">E-postadress</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">
                        {currentOwner.phone || "Ej angett"}
                      </p>
                      <p className="text-sm text-gray-600">Telefonnummer</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">
                        {currentOwner.address || "Ej angett"}
                      </p>
                      <p className="text-sm text-gray-600">Adress</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">
                        Medlem sedan{" "}
                        {currentOwner.created_at
                          ? formatDate(currentOwner.created_at)
                          : "Okänt"}
                      </p>
                      <p className="text-sm text-gray-600">Medlemskap</p>
                    </div>
                  </div>

                  {currentOwner.contact_person_2 && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Reservkontakt</h4>
                      <p className="text-sm">{currentOwner.contact_person_2}</p>
                      {currentOwner.contact_phone_2 && (
                        <p className="text-sm text-gray-600">
                          {currentOwner.contact_phone_2}
                        </p>
                      )}
                    </div>
                  )}

                  <Button className="w-full mt-4">
                    <Edit className="h-4 w-4 mr-2" />
                    Redigera information
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kontoinställningar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="h-4 w-4 mr-2" />
                    Byt lösenord
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    E-postinställningar
                  </Button>

                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Ladda ner mina data
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logga ut
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
