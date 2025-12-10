"use client";

// ⚠️ VIKTIGT: Denna sida kräver migrationen 20251210_create_daily_schedule.sql
// Se DAILY_SCHEDULE_MIGRATION_README.md för instruktioner

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Database } from "@/types/database";

// ✅ Use database types directly for type safety
type DailyScheduleEntry = Database["public"]["Tables"]["daily_schedule"]["Row"];

interface Dog {
  id: string;
  name: string;
  breed?: string | null;
  owner_name?: string | null;
}

/**
 * Hunddagis Dagens Schema - Hantera dagliga aktiviteter och schema
 * [ERR-1001] Databaskoppling, [ERR-4001] Uppdatering, [ERR-5001] Okänt fel
 */
export default function HunddagisDagensSchemaPage() {
  const supabase = createClient();
  const { currentOrgId } = useAuth();
  const [scheduleEntries, setScheduleEntries] = useState<DailyScheduleEntry[]>(
    []
  );
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<DailyScheduleEntry>>({
    date: new Date().toISOString().split("T")[0],
    time_slot: "",
    activity_type: "walk",
    activity_name: "",
    description: "",
    location: "",
    dogs: [],
    staff_member: "",
    completed: false,
  });

  const activityTypes = [
    {
      value: "walk",
      label: "Promenad",
      icon: "🚶",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "play",
      label: "Lek",
      icon: "🎾",
      color: "bg-blue-100 text-blue-800",
    },
    {
      value: "feeding",
      label: "Matning",
      icon: "🍽️",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "rest",
      label: "Vila",
      icon: "😴",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "grooming",
      label: "Skötsel",
      icon: "✨",
      color: "bg-pink-100 text-pink-800",
    },
    {
      value: "training",
      label: "Träning",
      icon: "🎯",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "other",
      label: "Övrigt",
      icon: "📝",
      color: "bg-gray-100 text-gray-800",
    },
  ];

  const timeSlots = [
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
  ];

  useEffect(() => {
    if (currentOrgId) {
      loadData();
    } else {
      // ✅ FIX: Stoppa loading spinner om currentOrgId saknas
      setLoading(false);
    }
  }, [currentOrgId, selectedDate]);

  const loadData = async () => {
    if (!currentOrgId || !supabase) return;

    setLoading(true);
    setError(null);

    try {
      // Load schedule entries for selected date
      const { data: scheduleData, error: scheduleError } = await supabase
        .from("daily_schedule")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("date", selectedDate)
        .order("time_slot", { ascending: true });

      if (scheduleError) {
        throw new Error(
          `[ERR-1001] Databaskoppling schema: ${scheduleError.message}`
        );
      }

      // Load dogs for the organization
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select(
          `
          id, name, breed,
          owners(first_name, last_name)
        `
        )
        .eq("org_id", currentOrgId)
        .eq("active", true)
        .order("name", { ascending: true });

      if (dogsError) {
        console.warn("Error loading dogs:", dogsError);
      }

      setScheduleEntries(scheduleData || []);

      // Transform dogs data
      const transformedDogs = (dogsData || []).map((dog: any) => ({
        id: dog.id,
        name: dog.name,
        breed: dog.breed,
        owner_name: dog.owners
          ? `${dog.owners.first_name} ${dog.owners.last_name}`.trim()
          : "Okänd ägare",
      }));

      setDogs(transformedDogs);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid laddning av schema");
    } finally {
      setLoading(false);
    }
  };

  const addScheduleEntry = async () => {
    if (
      !currentOrgId ||
      !newEntry.time_slot ||
      !newEntry.activity_name ||
      !newEntry.activity_type ||
      !newEntry.date
    ) {
      setError(
        "Tidpunkt, aktivitetstyp, aktivitetsnamn och datum måste fyllas i"
      );
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("daily_schedule").insert([
        {
          org_id: currentOrgId,
          date: newEntry.date,
          time_slot: newEntry.time_slot,
          activity_type: newEntry.activity_type,
          activity_name: newEntry.activity_name,
          description: newEntry.description || null,
          location: newEntry.location || null,
          dogs: newEntry.dogs || [],
          staff_member: newEntry.staff_member || null,
          notes: newEntry.notes || null,
        },
      ]);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadData();
      setShowAddForm(false);
      setNewEntry({
        date: selectedDate,
        time_slot: "",
        activity_type: "walk",
        activity_name: "",
        description: "",
        location: "",
        dogs: [],
        staff_member: "",
        completed: false,
      });
    } catch (err: any) {
      console.error("Error adding schedule entry:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid tillägg");
    } finally {
      setSaving(false);
    }
  };

  const toggleCompleted = async (entryId: string, completed: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("daily_schedule")
        .update({ completed, updated_at: new Date().toISOString() })
        .eq("id", entryId);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadData();
    } catch (err: any) {
      console.error("Error updating entry:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid uppdatering");
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna aktivitet?")) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("daily_schedule")
        .delete()
        .eq("id", entryId);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadData();
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid borttagning");
    } finally {
      setSaving(false);
    }
  };

  const getActivityTypeInfo = (type: string) => {
    return (
      activityTypes.find((activity) => activity.value === type) ||
      activityTypes[0]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("sv-SE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDogNames = (dogIds: string[]) => {
    if (!dogIds || dogIds.length === 0) return "Inga hundar valda";
    return dogIds
      .map((id) => {
        const dog = dogs.find((d) => d.id === id);
        return dog ? dog.name : "Okänd hund";
      })
      .join(", ");
  };

  const completedCount = scheduleEntries.filter(
    (entry) => entry.completed
  ).length;
  const totalCount = scheduleEntries.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Laddar dagens schema...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📅 Dagens schema
              </h1>
              <p className="text-gray-600 mt-1">
                Planera och följ upp dagliga aktiviteter
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till aktivitet
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {formatDate(selectedDate)}
              </h2>
              <p className="text-gray-600">
                {totalCount} aktiviteter planerade, {completedCount} genomförda
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedCount}
                </div>
                <div className="text-sm text-gray-600">Klara</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {totalCount - completedCount}
                </div>
                <div className="text-sm text-gray-600">Kvar</div>
              </div>
              <div className="w-20 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{
                    width:
                      totalCount > 0
                        ? `${(completedCount / totalCount) * 100}%`
                        : "0%",
                  }}
                ></div>
              </div>
            </div>
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

      {/* Add New Entry Form */}
      {showAddForm && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">
              Lägg till ny aktivitet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-time">Tidpunkt</Label>
                <select
                  id="new-time"
                  value={newEntry.time_slot || ""}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, time_slot: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Välj tidpunkt</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="new-activity-type">Aktivitetstyp</Label>
                <select
                  id="new-activity-type"
                  value={newEntry.activity_type || "walk"}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      activity_type: e.target
                        .value as DailyScheduleEntry["activity_type"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="new-activity-name">Aktivitetsnamn</Label>
                <Input
                  id="new-activity-name"
                  value={newEntry.activity_name || ""}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      activity_name: e.target.value,
                    })
                  }
                  placeholder="T.ex. Morgonpromenad"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-location">Plats (valfritt)</Label>
                <Input
                  id="new-location"
                  value={newEntry.location || ""}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, location: e.target.value })
                  }
                  placeholder="T.ex. Stora parken"
                />
              </div>

              <div>
                <Label htmlFor="new-staff">Ansvarig personal (valfritt)</Label>
                <Input
                  id="new-staff"
                  value={newEntry.staff_member || ""}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, staff_member: e.target.value })
                  }
                  placeholder="Personalens namn"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-description">Beskrivning (valfritt)</Label>
              <Textarea
                id="new-description"
                value={newEntry.description || ""}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, description: e.target.value })
                }
                placeholder="Beskrivning av aktiviteten"
                rows={2}
              />
            </div>

            <div>
              <Label>Hundar som deltar</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {dogs.map((dog) => (
                  <label
                    key={dog.id}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={newEntry.dogs?.includes(dog.id) || false}
                      onChange={(e) => {
                        const currentDogs = newEntry.dogs || [];
                        if (e.target.checked) {
                          setNewEntry({
                            ...newEntry,
                            dogs: [...currentDogs, dog.id],
                          });
                        } else {
                          setNewEntry({
                            ...newEntry,
                            dogs: currentDogs.filter((id) => id !== dog.id),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span>{dog.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={addScheduleEntry}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {saving ? "Sparar..." : "Spara aktivitet"}
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Entries */}
      <div className="space-y-4">
        {scheduleEntries.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Inga aktiviteter planerade för {formatDate(selectedDate)}
              </p>
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Lägg till första aktiviteten
              </Button>
            </CardContent>
          </Card>
        ) : (
          scheduleEntries.map((entry) => {
            const activityInfo = getActivityTypeInfo(entry.activity_type);

            return (
              <Card
                key={entry.id}
                className={`${
                  entry.completed ? "bg-green-50 border-green-200" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold">
                            {entry.time_slot}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${activityInfo.color}`}
                        >
                          {activityInfo.icon} {activityInfo.label}
                        </span>
                        {entry.completed && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Genomförd
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold mb-2">
                        {entry.activity_name}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <strong>Hundar:</strong> {getDogNames(entry.dogs)}
                        </div>
                        {entry.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{entry.location}</span>
                          </div>
                        )}
                        {entry.staff_member && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{entry.staff_member}</span>
                          </div>
                        )}
                      </div>

                      {entry.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {entry.description}
                        </p>
                      )}

                      {entry.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                          <strong>Anteckningar:</strong> {entry.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        onClick={() =>
                          toggleCompleted(entry.id, !entry.completed)
                        }
                        disabled={saving}
                        size="sm"
                        className={
                          entry.completed
                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }
                      >
                        {entry.completed
                          ? "Markera som ej klar"
                          : "Markera som klar"}
                      </Button>

                      <Button
                        onClick={() => deleteEntry(entry.id)}
                        disabled={saving}
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </PageContainer>
  );
}
