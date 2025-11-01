/**
 * TailwindForcer - Tvingar Tailwind att generera alla våra kritiska klasser
 * Denna komponent renderas aldrig synligt men säkerställer att klasserna finns i CSS:en
 */

export function TailwindForcer() {
  return (
    <div className="hidden">
      {/* Grid layouts */}
      <div className="grid grid-cols-1" />
      <div className="grid grid-cols-2" />
      <div className="grid grid-cols-4" />
      <div className="sm:grid-cols-2" />
      <div className="lg:grid-cols-4" />

      {/* Färger för statistik-kort */}
      <div className="text-emerald-600 bg-emerald-50" />
      <div className="text-blue-600 bg-blue-50" />
      <div className="text-orange-600 bg-orange-50" />
      <div className="text-purple-600 bg-purple-50" />

      {/* Textstorlekar */}
      <div className="text-4xl text-3xl text-2xl" />

      {/* Spacing */}
      <div className="gap-6 mb-8 w-14 h-14 ml-4" />
    </div>
  );
}
