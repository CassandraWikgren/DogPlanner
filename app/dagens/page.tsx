export default function DagensPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">📅 Dagens schema</h1>
      <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4">
        <p className="text-yellow-800">
          ⚠️ Denna sida är tillfälligt inaktiverad under utveckling.
        </p>
        <p className="text-yellow-700 mt-2">
          Använd{" "}
          <a href="/hunddagis" className="underline font-semibold">
            Hunddagis-sidan
          </a>{" "}
          för att se dagens hundar.
        </p>
      </div>
    </div>
  );
}
