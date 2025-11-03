"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ArrowLeft,
  Home,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  AlertTriangle,
  Bed,
  Users,
  Calendar,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

interface RoomData {
  id: string;
  room_number: string;
  room_type: "standard" | "premium" | "suite";
  capacity: number;
  price_per_night: number;
  description?: string;
  amenities?: string[];
  active: boolean;
  floor?: number;
  size_sqm?: number;
}

interface BookingData {
  id: string;
  room_id: string;
  dog_name: string;
  owner_name: string;
  checkin_date: string;
  checkout_date: string;
  status: string;
}

/**
 * Admin Rum - Hantera rum och överblick
 * [ERR-1001] Databaskoppling, [ERR-4001] Uppdatering, [ERR-5001] Okänt fel
 */
export default function AdminRumPage() {
  const { currentOrgId } = useAuth();
  const [rooms, setRooms] = useState<RoomData[]>([]);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RoomData>>({});
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRoom, setNewRoom] = useState<Partial<RoomData>>({
    room_number: "",
    room_type: "standard",
    capacity: 1,
    price_per_night: 0,
    description: "",
    amenities: [],
    active: true,
    floor: 1,
    size_sqm: 0,
  });

  const roomTypes = [
    {
      value: "standard",
      label: "Standard",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "premium",
      label: "Premium",
      color: "bg-purple-100 text-purple-800",
    },
    { value: "suite", label: "Suite", color: "bg-yellow-100 text-yellow-800" },
  ];

  const amenitiesOptions = [
    "Uteområde",
    "Värme",
    "Kyla",
    "Leksaker",
    "Extra säng",
    "Fönster",
    "Ljudisolering",
    "Kamera",
  ];

  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId]);

  const loadData = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      // Load rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("room_number", { ascending: true });

      if (roomsError) {
        throw new Error(
          `[ERR-1001] Databaskoppling rum: ${roomsError.message}`
        );
      }

      // Load current bookings
      const today = new Date().toISOString().split("T")[0];
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id, room_id, checkin_date, checkout_date, status,
          dogs(name),
          owners(first_name, last_name)
        `
        )
        .eq("org_id", currentOrgId)
        .gte("checkout_date", today)
        .eq("status", "confirmed");

      if (bookingsError) {
        console.warn("Error loading bookings:", bookingsError);
      }

      setRooms(roomsData || []);

      // Transform bookings data
      const transformedBookings = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        room_id: booking.room_id,
        dog_name: booking.dogs?.name || "Okänd hund",
        owner_name:
          `${booking.owners?.first_name || ""} ${
            booking.owners?.last_name || ""
          }`.trim() || "Okänd ägare",
        checkin_date: booking.checkin_date,
        checkout_date: booking.checkout_date,
        status: booking.status,
      }));

      setBookings(transformedBookings);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid laddning av rum");
    } finally {
      setLoading(false);
    }
  };

  const getRoomStatus = (room: RoomData) => {
    const today = new Date().toISOString().split("T")[0];
    const activeBooking = bookings.find(
      (booking) =>
        booking.room_id === room.id &&
        booking.checkin_date <= today &&
        booking.checkout_date >= today
    );

    if (activeBooking) {
      return {
        status: "occupied",
        booking: activeBooking,
        color: "bg-red-100 text-red-800",
      };
    }

    const upcomingBooking = bookings.find(
      (booking) => booking.room_id === room.id && booking.checkin_date > today
    );

    if (upcomingBooking) {
      return {
        status: "reserved",
        booking: upcomingBooking,
        color: "bg-yellow-100 text-yellow-800",
      };
    }

    return {
      status: "available",
      booking: null,
      color: "bg-green-100 text-green-800",
    };
  };

  const startEdit = (room: RoomData) => {
    setEditingId(room.id);
    setEditForm({ ...room });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("rooms")
        .update(editForm)
        .eq("id", editingId);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadData();
      setEditingId(null);
      setEditForm({});
    } catch (err: any) {
      console.error("Error saving room:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid sparning");
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (id: string) => {
    if (
      !confirm(
        "Är du säker på att du vill ta bort detta rum? Detta kan påverka befintliga bokningar."
      )
    )
      return;

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("rooms")
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadData();
    } catch (err: any) {
      console.error("Error deleting room:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid borttagning");
    } finally {
      setSaving(false);
    }
  };

  const addNewRoom = async () => {
    if (!currentOrgId || !newRoom.room_number) {
      setError("Rumsnummer måste fyllas i");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("rooms")
        .insert([{ ...newRoom, org_id: currentOrgId }]);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadData();
      setShowAddForm(false);
      setNewRoom({
        room_number: "",
        room_type: "standard",
        capacity: 1,
        price_per_night: 0,
        description: "",
        amenities: [],
        active: true,
        floor: 1,
        size_sqm: 0,
      });
    } catch (err: any) {
      console.error("Error adding room:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid tillägg");
    } finally {
      setSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
    }).format(price);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied":
        return "Upptaget";
      case "reserved":
        return "Reserverat";
      case "available":
        return "Ledigt";
      default:
        return "Okänt";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Laddar rum...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🏠 Rum</h1>
                <p className="text-gray-600 mt-1">Hantera rum och överblick</p>
              </div>
            </div>

            <div className="flex space-x-4">
              <Link href="/rooms/overview">
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Rumskalender
                </Button>
              </Link>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till rum
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">{rooms.length}</p>
                  <p className="text-gray-600">Totalt rum</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Bed className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {
                      rooms.filter(
                        (room) => getRoomStatus(room).status === "occupied"
                      ).length
                    }
                  </p>
                  <p className="text-gray-600">Upptagna</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {
                      rooms.filter(
                        (room) => getRoomStatus(room).status === "reserved"
                      ).length
                    }
                  </p>
                  <p className="text-gray-600">Reserverade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold">
                    {
                      rooms.filter(
                        (room) => getRoomStatus(room).status === "available"
                      ).length
                    }
                  </p>
                  <p className="text-gray-600">Lediga</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Room Form */}
        {showAddForm && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">
                Lägg till nytt rum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="new-room-number">Rumsnummer</Label>
                  <Input
                    id="new-room-number"
                    value={newRoom.room_number || ""}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, room_number: e.target.value })
                    }
                    placeholder="101, A1, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="new-room-type">Rumstyp</Label>
                  <select
                    id="new-room-type"
                    value={newRoom.room_type || "standard"}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        room_type: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="new-capacity">Kapacitet</Label>
                  <Input
                    id="new-capacity"
                    type="number"
                    value={newRoom.capacity || ""}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        capacity: Number(e.target.value),
                      })
                    }
                    placeholder="1"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="new-price">Pris per natt (SEK)</Label>
                  <Input
                    id="new-price"
                    type="number"
                    value={newRoom.price_per_night || ""}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        price_per_night: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="new-floor">Våning</Label>
                  <Input
                    id="new-floor"
                    type="number"
                    value={newRoom.floor || ""}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, floor: Number(e.target.value) })
                    }
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label htmlFor="new-size">Storlek (kvm)</Label>
                  <Input
                    id="new-size"
                    type="number"
                    value={newRoom.size_sqm || ""}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        size_sqm: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="new-description">Beskrivning</Label>
                  <Input
                    id="new-description"
                    value={newRoom.description || ""}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, description: e.target.value })
                    }
                    placeholder="Kort beskrivning"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addNewRoom}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {saving ? "Sparar..." : "Spara rum"}
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const roomStatus = getRoomStatus(room);
            const roomTypeInfo = roomTypes.find(
              (type) => type.value === room.room_type
            );

            return (
              <Card
                key={room.id}
                className={`${room.active ? "" : "opacity-60"}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Rum {room.room_number}
                    </CardTitle>
                    <div className="flex space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${roomTypeInfo?.color}`}
                      >
                        {roomTypeInfo?.label}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${roomStatus.color}`}
                      >
                        {getStatusText(roomStatus.status)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Kapacitet:</span>
                      <span className="ml-1 font-medium">
                        {room.capacity} hund{room.capacity !== 1 ? "ar" : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pris:</span>
                      <span className="ml-1 font-medium">
                        {formatPrice(room.price_per_night)}/natt
                      </span>
                    </div>
                    {room.floor && (
                      <div>
                        <span className="text-gray-600">Våning:</span>
                        <span className="ml-1 font-medium">{room.floor}</span>
                      </div>
                    )}
                    {room.size_sqm && (
                      <div>
                        <span className="text-gray-600">Storlek:</span>
                        <span className="ml-1 font-medium">
                          {room.size_sqm} kvm
                        </span>
                      </div>
                    )}
                  </div>

                  {room.description && (
                    <p className="text-sm text-gray-600">{room.description}</p>
                  )}

                  {roomStatus.booking && (
                    <div className="bg-gray-50 rounded-lg p-3 text-sm">
                      <p className="font-medium">
                        {roomStatus.booking.dog_name}
                      </p>
                      <p className="text-gray-600">
                        {roomStatus.booking.owner_name}
                      </p>
                      <p className="text-gray-600">
                        {new Date(
                          roomStatus.booking.checkin_date
                        ).toLocaleDateString("sv-SE")}{" "}
                        -
                        {new Date(
                          roomStatus.booking.checkout_date
                        ).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => startEdit(room)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Redigera
                    </Button>
                    <Button
                      onClick={() => deleteRoom(room.id)}
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {rooms.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Inga rum har lagts till ännu</p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till första rummet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
