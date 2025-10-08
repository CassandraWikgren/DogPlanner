"use client";

import { useEffect, useState } from "react";
import { getDB, updateDog, type Dog } from "@/lib/store";
import { branches } from "@/lib/branches";

export default function EditDogPage({ params }: { params: { id: string } }) {
  const [dog, setDog] = useState<Dog | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingBranch, setPendingBranch] = useState<string>("");

  useEffect(() => {
    async function fetchDog() {
      const db = await getDB(); // ✅ vänta på datan
      const foundDog = db.dogs.find((d) => d.id === params.id);
      setDog(foundDog || null);
      if (foundDog?.branchId) setSelectedBranch(foundDog.branchId);
    }
    fetchDog();
  }, [params.id]);

  if (!dog) return <div>🐶 Hunden hittades inte.</div>;

  const handleBranchChange = (newBranchId: string) => {
    if (newBranchId && newBranchId !== selectedBranch) {
      setPendingBranch(newBranchId);
      setShowConfirm(true);
    }
  };

  const confirmBranchMove = async () => {
    if (!pendingBranch) return;
    await updateDog(dog.id, { branchId: pendingBranch });
    setSelectedBranch(pendingBranch);
    setShowConfirm(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{dog.name}</h1>
      <p className="mb-4 text-gray-700">Ras: {dog.breed || "Okänd"}</p>

      <label className="block mb-2">Välj ny avdelning:</label>
      <select
        value={selectedBranch}
        onChange={(e) => handleBranchChange(e.target.value)}
        className="border rounded p-2"
      >
        <option value="">Välj...</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      {showConfirm && (
        <div className="mt-4">
          <p>Är du säker på att du vill flytta hunden?</p>
          <button
            onClick={confirmBranchMove}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          >
            Ja, flytta
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            className="ml-2 bg-gray-400 text-white px-4 py-2 rounded mt-2"
          >
            Avbryt
          </button>
        </div>
      )}
    </div>
  );
}
