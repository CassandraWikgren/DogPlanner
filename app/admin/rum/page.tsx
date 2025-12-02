"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import {
  ArrowLeft,
  Home,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import type { Database } from "@/types/database";

type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"];
type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];

interface Room {
  id: string;
  name: string;
  capacity_m2: number;
  room_type: "daycare" | "boarding" | "both";
  max_dogs?: number | null;
  notes?: string | null;
  is_active: boolean;
}

export default function AdminRumPage() {
  const { currentOrgId } = useAuth();
  const supabase = createClient();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Room>>({});
  const [saving, setSaving] = useState(false);
  const [newRoom, setNewRoom] = useState({
    name: "",
    capacity_m2: 0,
    room_type: "both" as "daycare" | "boarding" | "both",
    notes: "",
  });

  const roomTypes = [
    { value: "daycare", label: "Dagis" },
    { value: "boarding", label: "Pensionat" },
    { value: "both", label: "Både dagis & pensionat" },
  ];

  useEffect(() => {
    if (currentOrgId) {
      fetchRooms();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!currentOrgId) return;

      const { data, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("name");

      if (fetchError) throw fetchError;
      setRooms((data as Room[]) || []);
    } catch (err: any) {
      setError(err.message || "Kunde inte hämta rum");
    } finally {
      setLoading(false);
    }
  };

  const addNewRoom = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!currentOrgId) return;
      if (!newRoom.name || !newRoom.capacity_m2) {
        setError("Namn och kapacitet krävs");
        return;
      }

      const roomData: RoomInsert = {
        name: newRoom.name,
        capacity_m2: newRoom.capacity_m2,
        room_type: newRoom.room_type,
        notes: newRoom.notes || null,
        is_active: true,
        org_id: currentOrgId,
      };

      const { error: insertError } = await supabase
        .from("rooms")
        .insert(roomData);

      if (insertError) throw insertError;

      setShowAddForm(false);
      setNewRoom({ name: "", capacity_m2: 0, room_type: "both", notes: "" });
      fetchRooms();
    } catch (err: any) {
      setError(err.message || "Kunde inte skapa rum");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    try {
      setSaving(true);
      setError(null);
      if (!editingId) return;
      if (!editForm.name || !editForm.capacity_m2) {
        setError("Namn och kapacitet krävs");
        return;
      }

      const roomUpdate: RoomUpdate = {
        name: editForm.name,
        capacity_m2: editForm.capacity_m2,
        room_type: editForm.room_type,
        notes: editForm.notes || null,
        is_active: editForm.is_active,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("rooms")
        .update(roomUpdate)
        .eq("id", editingId);

      if (updateError) throw updateError;

      setEditingId(null);
      setEditForm({});
      fetchRooms();
    } catch (err: any) {
      setError(err.message || "Kunde inte uppdatera rum");
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta rum?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("rooms")
        .delete()
        .eq("id", roomId);
      if (deleteError) throw deleteError;
      fetchRooms();
    } catch (err: any) {
      setError(err.message || "Kunde inte ta bort rum");
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <Link
                  href="/admin"
                  className="inline-flex items-center text-gray-600 hover:text-[#2c7a4c] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Tillbaka
                </Link>
              </div>
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Rum & Platser
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera hundrum - ange kvadratmeter, systemet räknar ut
                kapacitet
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till rum
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-8 py-6">
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 font-medium mb-1">Fel uppstod</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
                <Button
                  onClick={() => setError(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAddForm && (
          <Card className="mb-6 border-blue-200">
            <CardHeader className="bg-blue-50">
              <CardTitle className="text-lg font-semibold text-blue-900">
                Lägg till nytt rum
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="new-name">Namn *</Label>
                  <Input
                    id="new-name"
                    value={newRoom.name}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, name: e.target.value })
                    }
                    placeholder="T.ex. Rum 1, Box A"
                  />
                </div>
                <div>
                  <Label htmlFor="new-capacity">Kapacitet (m²) *</Label>
                  <Input
                    id="new-capacity"
                    type="number"
                    step="0.1"
                    value={newRoom.capacity_m2 || ""}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        capacity_m2: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="T.ex. 12.5"
                  />
                </div>
                <div>
                  <Label htmlFor="new-type">Typ</Label>
                  <select
                    id="new-type"
                    value={newRoom.room_type}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        room_type: e.target.value as
                          | "daycare"
                          | "boarding"
                          | "both",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="new-notes">Anteckningar</Label>
                  <Textarea
                    id="new-notes"
                    value={newRoom.notes}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, notes: e.target.value })
                    }
                    placeholder="Valfri information om rummet"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={addNewRoom}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? "Sparar..." : "Spara rum"}
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewRoom({
                      name: "",
                      capacity_m2: 0,
                      room_type: "both",
                      notes: "",
                    });
                  }}
                  variant="outline"
                  disabled={saving}
                >
                  Avbryt
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {rooms.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Inga rum registrerade ännu</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till första rummet
                </Button>
              </CardContent>
            </Card>
          ) : (
            rooms.map((room) => (
              <Card
                key={room.id}
                className={!room.is_active ? "opacity-60 bg-gray-50" : ""}
              >
                <CardContent className="pt-6">
                  {editingId === room.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Namn *</Label>
                          <Input
                            value={editForm.name || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>Kapacitet (m²) *</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.capacity_m2 || 0}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                capacity_m2: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Typ</Label>
                          <select
                            value={editForm.room_type || "both"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                room_type: e.target.value as
                                  | "daycare"
                                  | "boarding"
                                  | "both",
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {roomTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Status</Label>
                          <select
                            value={editForm.is_active ? "true" : "false"}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                is_active: e.target.value === "true",
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="true">Aktiv</option>
                            <option value="false">Inaktiv</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Anteckningar</Label>
                          <Textarea
                            value={editForm.notes || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                notes: e.target.value,
                              })
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={saveEdit}
                          disabled={saving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {saving ? "Sparar..." : "Spara"}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm({});
                          }}
                          variant="outline"
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {room.name}
                          </h3>
                          {!room.is_active && (
                            <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">
                              Inaktiv
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Kapacitet</p>
                            <p className="font-medium text-gray-900">
                              {room.capacity_m2} m²
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Typ</p>
                            <p className="font-medium text-gray-900">
                              {roomTypes.find((t) => t.value === room.room_type)
                                ?.label || room.room_type}
                            </p>
                          </div>
                          {room.max_dogs && (
                            <div>
                              <p className="text-gray-600">Max hundar</p>
                              <p className="font-medium text-gray-900">
                                {room.max_dogs} st
                              </p>
                            </div>
                          )}
                        </div>
                        {room.notes && (
                          <p className="text-gray-600 text-sm mt-3">
                            {room.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => {
                            setEditingId(room.id);
                            setEditForm(room);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteRoom(room.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
