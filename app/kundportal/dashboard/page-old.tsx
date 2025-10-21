"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
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

// TypeScript-typer enligt Supabase schema
interface Owner {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  address?: string;
  city?: string;
  created_at: string;
}

interface Dog {
  id: string;
  name: string;
  breed: string;
  birth: string;
  heightcm: number;
  subscription: string;
  owner_id: string;
}

interface Booking {
  id: string;
  dog_id: string;
  start_date: string;
  end_date: string;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  base_price: number;
  total_price: number;
  // Relations
  dogs: Dog;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "dogs" | "bookings" | "profile"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [currentOwner, setCurrentOwner] = useState<Owner | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Mock data - skulle komma från API
  const customerData = {
    name: "Anna Andersson",
    email: "anna@email.se",
    phone: "070-123 45 67",
    address: "Testgatan 1, Stockholm",
    memberSince: "2024-01-15",
  };

  const dogs: Dog[] = [
    {
      id: "1",
      name: "Bella",
      breed: "Golden Retriever",
      age: 3,
      weight: 28,
      mankhojd: 55,
    },
    {
      id: "2",
      name: "Max",
      breed: "Border Collie",
      age: 5,
      weight: 22,
      mankhojd: 50,
    },
  ];

  const bookings: Booking[] = [
    {
      id: "1",
      dogName: "Bella",
      pensionat: "Glada Tassar Pensionat",
      checkin: "2024-02-15",
      checkout: "2024-02-20",
      status: "confirmed",
      price: 2500,
    },
    {
      id: "2",
      dogName: "Max",
      pensionat: "Hundparadiset",
      checkin: "2024-03-10",
      checkout: "2024-03-15",
      status: "pending",
      price: 2200,
    },
  ];

  const getStatusBadge = (status: Booking["status"]) => {
    const configs = {
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
      completed: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle,
        text: "Genomförd",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        text: "Avbokad",
      },
    };

    const config = configs[status];
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

  const getDogSizeCategory = (mankhojd: number) => {
    if (mankhojd < 35) return "Liten hund";
    if (mankhojd < 55) return "Medelstor hund";
    return "Stor hund";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <PawPrint className="h-8 w-8 text-[#2c7a4c] mr-3" />
              <h1 className="text-xl font-bold text-gray-800">
                Min Kundportal
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Välkommen, {customerData.name}!
              </span>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <Link href="/kundportal/boka">
                    <Button className="w-full h-20 bg-[#2c7a4c] hover:bg-[#245a3e] flex flex-col">
                      <Plus className="h-6 w-6 mb-2" />
                      Ny bokning
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
                  >
                    <PawPrint className="h-6 w-6 mb-2" />
                    Lägg till hund
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-20 flex flex-col"
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
                  <CardTitle>Senaste bokningar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">{booking.dogName}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(booking.checkin)}
                          </p>
                        </div>
                        {getStatusBadge(booking.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mina hundar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dogs.map((dog) => (
                      <div
                        key={dog.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded"
                      >
                        <div>
                          <p className="font-medium">{dog.name}</p>
                          <p className="text-sm text-gray-600">
                            {dog.breed} • {getDogSizeCategory(dog.mankhojd)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
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
                        <strong>Ålder:</strong> {dog.age} år
                      </p>
                      <p>
                        <strong>Vikt:</strong> {dog.weight} kg
                      </p>
                      <p>
                        <strong>Mankhöjd:</strong> {dog.mankhojd} cm
                      </p>
                      <p>
                        <strong>Storlek:</strong>{" "}
                        {getDogSizeCategory(dog.mankhojd)}
                      </p>
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
                            {booking.dogName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.pensionat}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Incheckning</p>
                          <p className="font-medium">
                            {formatDate(booking.checkin)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Utcheckning</p>
                          <p className="font-medium">
                            {formatDate(booking.checkout)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600">Pris</p>
                          <p className="font-medium">
                            {booking.price.toLocaleString()} kr
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
            </div>
          </div>
        )}

        {activeTab === "profile" && (
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
                      <p className="font-medium">{customerData.email}</p>
                      <p className="text-sm text-gray-600">E-postadress</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{customerData.phone}</p>
                      <p className="text-sm text-gray-600">Telefonnummer</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{customerData.address}</p>
                      <p className="text-sm text-gray-600">Adress</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">
                        Medlem sedan {formatDate(customerData.memberSince)}
                      </p>
                      <p className="text-sm text-gray-600">Medlemskap</p>
                    </div>
                  </div>

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
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Radera konto
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
