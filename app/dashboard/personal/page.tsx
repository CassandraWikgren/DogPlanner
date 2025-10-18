export default function PersonalPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">👥 Personal</h1>
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4">
        <p className="text-yellow-800">
          ⚠️ Personalhantering är tillfälligt inaktiverad under utveckling.
        </p>
        <p className="text-yellow-700 mt-2">
          <a href="/dashboard" className="underline font-semibold">
            Tillbaka till Dashboard
          </a>
        </p>
      </div>
    </div>
  );
}
