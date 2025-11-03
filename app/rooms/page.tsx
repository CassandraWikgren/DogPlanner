"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Home,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Users,
  Square,
  PawPrint,
  Calendar,
  Settings,
  Info,
} from "lucide-react";
import {
  calculateAllRoomsOccupancy,
  calculateMaxDogsCapacity,
  type RoomOccupancy,
} from "@/lib/roomCalculator";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

interface Room {
  id: string;
  name: string;
  capacity_m2: number;
  room_type: "daycare" | "boarding" | "both";
  max_dogs?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

interface Dog {
  id: string;
  name: string;
  height_cm?: number;
  weight_kg?: number;
  subscription?: string;
  days?: string;
  checked_in?: boolean;
  room_id?: string;
  owner?: {
    full_name: string;
  } | null;
}

export default function RoomsPage() {
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [occupancies, setOccupancies] = useState<RoomOccupancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;
    fetchData();
    setupRealtimeListeners();
  }, [user, authLoading]);

  useEffect(() => {
    if (rooms.length > 0 && dogs.length > 0) {
      calculateOccupancies();
    }
  }, [rooms, dogs]);

  const fetchData = async () => {
    try {
      if (!user) return;

      const orgId = user?.user_metadata?.org_id || user?.id;

      // Hämta rum
      const { data: roomsData, error: roomsError } = await (supabase as any)
        .from("rooms")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("name");

      if (roomsError) throw roomsError;

      // Hämta hundar med ägarinfo
      const { data: dogsData, error: dogsError } = await (supabase as any)
        .from("dogs")
        .select(
          `
          id,
          name,
          height_cm,
          weight_kg,
          subscription,
          days,
          checked_in,
          room_id,
          owner:owners!dogs_owner_id_fkey(full_name)
        `
        )
        .eq("org_id", orgId)
        .order("name");

      if (dogsError) throw dogsError;

      setRooms(roomsData || []);
      const processedDogs =
        dogsData?.map((dog: any) => ({
          ...dog,
          owner: Array.isArray(dog.owner) ? dog.owner[0] : dog.owner,
        })) || [];
      setDogs(processedDogs);
    } catch (error) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} ROOMS_FETCH_ERROR:`,
        error
      );
      setError(
        `Fel vid hämtning av data (ROOMS_FETCH_ERROR): ${
          error instanceof Error ? error.message : "Okänt fel"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeListeners = () => {
    if (!supabase) return () => {};

    const roomsChannel = supabase
      .channel("rooms_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dogs" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(roomsChannel);
      }
    };
  };

  const calculateOccupancies = () => {
    const newOccupancies = calculateAllRoomsOccupancy(rooms, dogs);
    setOccupancies(newOccupancies);
  };

  const stats = {
    totalRooms: rooms.length,
    totalCapacity: rooms.reduce((sum, room) => sum + room.capacity_m2, 0),
    totalDogs: dogs.filter((dog) => dog.room_id).length,
    violationRooms: occupancies.filter(
      (occ) => occ.compliance_status === "violation"
    ).length,
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "violation":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "violation":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const handleSaveRoom = async (roomData: Partial<Room>) => {
    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      if (editingRoom) {
        const { error } = await (supabase as any)
          .from("rooms")
          .update({
            name: roomData.name,
            capacity_m2: roomData.capacity_m2,
            room_type: roomData.room_type,
            max_dogs: roomData.max_dogs,
            notes: roomData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingRoom.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("rooms").insert({
          name: roomData.name,
          capacity_m2: roomData.capacity_m2,
          room_type: roomData.room_type || "both",
          max_dogs: roomData.max_dogs,
          notes: roomData.notes,
          is_active: true,
          org_id: orgId,
        });

        if (error) throw error;
      }

      setShowAddRoom(false);
      setEditingRoom(null);
      fetchData();
    } catch (error) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} ROOMS_SAVE_ERROR:`,
        error
      );
      setError(
        `Fel vid sparande av rum (ROOMS_SAVE_ERROR): ${
          error instanceof Error ? error.message : "Okänt fel"
        }`
      );
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Home className="h-8 w-8 text-blue-600" />
              Hundrum
            </h1>
            <Button
              onClick={() => setShowAddRoom(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till rum
            </Button>
          </div>
          <p className="text-gray-600">
            Hantera hundrum och övervaka beläggning enligt Jordbruksverkets
            inomhuskrav (SJVFS 2019:2 § 7-8).
          </p>
        </div>

        {/* Felmeddelande */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium mb-1">Systemfel</p>
                  <p className="text-red-700 text-sm mb-3">{error}</p>
                  <Button
                    onClick={() => {
                      setError(null);
                      fetchData();
                    }}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Försök igen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Antal rum</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalRooms}
                  </p>
                </div>
                <Home className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total yta</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalCapacity} m²
                  </p>
                </div>
                <Square className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Hundar i rum
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalDogs}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Överbelagda
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.violationRooms}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rumlista */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {occupancies.map((occupancy) => {
            const room = rooms.find((r) => r.id === occupancy.room_id);
            if (!room) return null;

            return (
              <Card
                key={room.id}
                className={`border-2 ${getComplianceColor(
                  occupancy.compliance_status
                )}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Home className="h-5 w-5 text-blue-600" />
                        {room.name}
                      </CardTitle>
                      <p className="text-gray-600">
                        {room.capacity_m2} m² • {room.room_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRoom(room)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Beläggningsinfo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Beläggning
                      </p>
                      <p className="text-lg font-bold">
                        {occupancy.occupancy_percentage}%
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            occupancy.compliance_status === "violation"
                              ? "bg-red-500"
                              : occupancy.compliance_status === "warning"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              occupancy.occupancy_percentage
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Hundar
                      </p>
                      <p className="text-lg font-bold">
                        {occupancy.dogs_count}
                      </p>
                      <p className="text-sm text-gray-500">
                        +{occupancy.max_additional_dogs} max till
                      </p>
                    </div>
                  </div>

                  {/* Compliance status */}
                  <div
                    className={`p-3 rounded-lg border ${getComplianceColor(
                      occupancy.compliance_status
                    )}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getComplianceIcon(occupancy.compliance_status)}
                      <span className="font-medium">
                        {occupancy.compliance_status === "compliant" &&
                          "Godkänt"}
                        {occupancy.compliance_status === "warning" && "Varning"}
                        {occupancy.compliance_status === "violation" &&
                          "Överträdelse"}
                      </span>
                    </div>
                    <p className="text-sm">{occupancy.compliance_message}</p>
                  </div>

                  {/* Kapacitetsberäkningar */}
                  {(() => {
                    const capacity = calculateMaxDogsCapacity(room.capacity_m2);
                    return (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Max kapacitet per hundkategori
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <p className="text-gray-600">&lt;25cm</p>
                            <p className="font-semibold">
                              {capacity.max_very_small_dogs}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">25-35cm</p>
                            <p className="font-semibold">
                              {capacity.max_small_dogs}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">36-45cm</p>
                            <p className="font-semibold">
                              {capacity.max_small_medium_dogs}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">46-55cm</p>
                            <p className="font-semibold">
                              {capacity.max_medium_dogs}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">56-65cm</p>
                            <p className="font-semibold">
                              {capacity.max_medium_large_dogs}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">&gt;65cm</p>
                            <p className="font-semibold">
                              {capacity.max_large_dogs}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hundar i rummet */}
                  {occupancy.dogs_present.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-900 mb-2">
                        Hundar i rummet:
                      </p>
                      <div className="space-y-1">
                        {occupancy.dogs_present.map((dog: any) => (
                          <div
                            key={dog.id}
                            className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                          >
                            <span>
                              <strong>{dog.name}</strong>
                              {dog.owner && ` (${dog.owner.full_name})`}
                            </span>
                            <span className="text-gray-500">
                              {dog.height_cm
                                ? `${dog.height_cm}cm`
                                : "Okänd höjd"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {room.notes && (
                    <div>
                      <p className="font-medium text-gray-900 mb-1">
                        Anteckningar:
                      </p>
                      <p className="text-sm text-gray-600">{room.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tom lista */}
        {rooms.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga rum registrerade
              </h3>
              <p className="text-gray-600 mb-4">
                Skapa ditt första rum för att komma igång med rumshantering.
              </p>
              <Button
                onClick={() => setShowAddRoom(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Skapa första rummet
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modal för att lägga till/redigera rum */}
        {(showAddRoom || editingRoom) && (
          <RoomModal
            room={editingRoom}
            onSave={handleSaveRoom}
            onCancel={() => {
              setShowAddRoom(false);
              setEditingRoom(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function RoomModal({
  room,
  onSave,
  onCancel,
}: {
  room: Room | null;
  onSave: (data: Partial<Room>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: room?.name || "",
    capacity_m2: room?.capacity_m2 || 0,
    room_type: room?.room_type || ("both" as "daycare" | "boarding" | "both"),
    max_dogs: room?.max_dogs || "",
    notes: room?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      max_dogs: formData.max_dogs ? Number(formData.max_dogs) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{room ? "Redigera rum" : "Lägg till nytt rum"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rumsnamn *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="t.ex. Rum 1, Stora rummet"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Yta (m²) *
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.capacity_m2}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    capacity_m2: Number(e.target.value),
                  }))
                }
                placeholder="t.ex. 25.5"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enligt Jordbruksverket (SJVFS 2019:2): <br />
                <strong>En hund:</strong> 2m² (&lt;25cm), 2m² (25-35cm), 2,5m²
                (36-45cm), 3,5m² (46-55cm), 4,5m² (56-65cm), 5,5m² (&gt;65cm){" "}
                <br />
                <strong>Flera hundar:</strong> Grundyta för största hunden +
                tillägg per hund enligt egen storlek
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rumstyp
              </label>
              <select
                value={formData.room_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    room_type: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daycare">Endast dagis</option>
                <option value="boarding">Endast pensionat</option>
                <option value="both">Både dagis och pensionat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max antal hundar (valfritt)
              </label>
              <Input
                type="number"
                min="1"
                value={formData.max_dogs}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, max_dogs: e.target.value }))
                }
                placeholder="Lämna tomt för automatisk beräkning"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anteckningar
              </label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Ytterligare information om rummet..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {room ? "Uppdatera" : "Skapa"} rum
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Avbryt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
