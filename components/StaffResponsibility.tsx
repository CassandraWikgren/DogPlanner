"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Circle } from "lucide-react";

interface Responsibility {
  id: string;
  staff_id: string;
  staff_name?: string;
  task: string;
  done: boolean;
}

export default function StaffResponsibility() {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Responsibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState("");

  // 🧠 Ladda allt vid start
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!supabase) return;

    setLoading(true);

    // Hämta personal (using 'as any' because 'staff' table may not exist in schema)
    const { data: staffData } = await (supabase as any)
      .from("staff")
      .select("id, name")
      .eq("on_duty", true);

    setStaffList(staffData || []);

    // Hämta ansvar (using 'as any' because 'responsibilities' table may not exist in schema)
    const { data: tasksData } = await (supabase as any)
      .from("responsibilities")
      .select("*")
      .order("id");

    setTasks(tasksData || []);
    setLoading(false);
  }

  // ✅ Markera uppgift som klar
  async function toggleDone(task: Responsibility) {
    const updated = { ...task, done: !task.done };
    await (supabase as any)
      .from("responsibilities")
      .update({ done: updated.done })
      .eq("id", task.id);

    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
  }

  // ➕ Lägg till ny uppgift
  async function addTask() {
    if (!newTask || !selectedStaff)
      return alert("Fyll i både personal och uppgift.");

    const { data, error } = await (supabase as any)
      .from("responsibilities")
      .insert([
        {
          staff_id: selectedStaff,
          task: newTask,
          done: false,
        },
      ])
      .select("*, staff(name)")
      .single();

    if (!error && data) {
      setTasks([...tasks, data]);
      setNewTask("");
      setSelectedStaff("");
    }
  }

  if (loading)
    return <p className="text-gray-500 text-center py-6">Laddar ansvar...</p>;

  return (
    <section className="max-w-6xl mx-auto my-12 px-6">
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-green-700">
            👩‍⚕️ Personal & ansvar för dagen
          </h2>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">Välj personal</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Uppgift, t.ex. 'Promenad – Grupp 1'"
              className="border rounded px-3 py-2 text-sm w-56"
            />

            <button
              onClick={addTask}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm font-semibold"
            >
              Lägg till
            </button>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-gray-500 text-sm italic">
            Inga uppgifter tillagda ännu.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Personal</th>
                  <th className="py-3 px-4 text-left">Uppgift</th>
                  <th className="py-3 px-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="odd:bg-gray-50 even:bg-gray-100 hover:bg-green-50 transition"
                  >
                    <td className="py-2 px-4">
                      {staffList.find((s) => s.id === task.staff_id)?.name ||
                        "-"}
                    </td>
                    <td className="py-2 px-4">{task.task}</td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => toggleDone(task)}
                        className="flex items-center gap-2 text-green-700 hover:text-green-900"
                      >
                        {task.done ? (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            <span>Klart</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-5 h-5 text-gray-400" />
                            <span>Ej klart</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
