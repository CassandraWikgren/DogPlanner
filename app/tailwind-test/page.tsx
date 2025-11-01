export default function TailwindTest() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        Tailwind CSS Test
      </h1>

      {/* Enkel grid test */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-emerald-50 p-6 rounded-lg">
          <p className="text-4xl font-bold text-emerald-600">1</p>
          <p className="text-sm text-gray-600">Emerald</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-4xl font-bold text-blue-600">2</p>
          <p className="text-sm text-gray-600">Blue</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <p className="text-4xl font-bold text-orange-600">3</p>
          <p className="text-sm text-gray-600">Orange</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <p className="text-4xl font-bold text-purple-600">4</p>
          <p className="text-sm text-gray-600">Purple</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg">
        <p className="text-lg">
          Om du ser 4 färgade kort bredvid varandra (på stora skärmar) =
          Tailwind fungerar ✅
        </p>
        <p className="text-lg mt-2">
          Om du ser 4 vita kort staplade vertikalt = Tailwind fungerar INTE ❌
        </p>
      </div>
    </div>
  );
}
