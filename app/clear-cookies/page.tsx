"use client";

export default function ClearCookies() {
  const clearAllCookies = () => {
    // Rensa alla cookies
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Clear Cookies</h1>
      <button
        onClick={clearAllCookies}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Rensa alla cookies och ladda om
      </button>
    </div>
  );
}
