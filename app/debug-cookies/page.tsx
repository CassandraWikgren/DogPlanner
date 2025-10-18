"use client";

export default function DebugCookies() {
  const allCookies =
    typeof document !== "undefined" ? document.cookie : "Server side";

  const demoUser =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("demoUser="))
          ?.split("=")[1]
      : "Not available";

  const demoOrg =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((row) => row.startsWith("demoOrg="))
          ?.split("=")[1]
      : "Not available";

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cookie Debug</h1>
      <div className="space-y-4">
        <div>
          <strong>All Cookies:</strong>
          <pre className="bg-gray-100 p-2 mt-2 rounded">{allCookies}</pre>
        </div>
        <div>
          <strong>Demo User:</strong> {demoUser || "Not found"}
        </div>
        <div>
          <strong>Demo Org:</strong> {demoOrg || "Not found"}
        </div>
      </div>
    </div>
  );
}
