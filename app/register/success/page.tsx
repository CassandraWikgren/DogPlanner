"use client";

import Link from "next/link";

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center border border-gray-200">
          {/* Emoji/Icon */}
          <div className="mb-6">
            <span className="text-6xl">🎉</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-[#2c7a4c] mb-4">
            Välkommen till DogPlanner-familjen!
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Din registrering är klar och du är nu redo att komma igång.
            <br />
            Vi finns här för att göra din vardag enklare – och för att ge dig
            full kontroll på allt som rör ditt företag.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#2c7a4c] hover:bg-[#236139] text-white font-semibold rounded-lg shadow-sm transition text-center"
            >
              Tillbaka till startsidan
            </Link>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition text-center"
            >
              Logga in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
