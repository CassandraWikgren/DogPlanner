// Hjälpfunktioner för väntelista/applications

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("sv-SE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getPriorityLabel(priority: number | null | undefined): {
  text: string;
  color: string;
} {
  if (priority === 1)
    return { text: "Hög", color: "bg-red-100 text-red-700 border-red-300" };
  if (priority === -1)
    return { text: "Låg", color: "bg-gray-100 text-gray-600 border-gray-300" };
  return { text: "Normal", color: "bg-blue-100 text-blue-700 border-blue-300" };
}

export function getVisitStatusLabel(status: string | null | undefined): {
  text: string;
  color: string;
} {
  switch (status) {
    case "booked":
      return {
        text: "Bokad",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      };
    case "completed":
      return {
        text: "Genomförd",
        color: "bg-green-100 text-green-800 border-green-300",
      };
    case "cancelled":
      return {
        text: "Inställd",
        color: "bg-gray-100 text-gray-700 border-gray-300",
      };
    case "no_show":
      return {
        text: "Uteblev",
        color: "bg-red-100 text-red-700 border-red-300",
      };
    default:
      return { text: "-", color: "bg-gray-50 text-gray-500 border-gray-200" };
  }
}

export function getVisitResultLabel(result: string | null | undefined): {
  text: string;
  color: string;
} {
  switch (result) {
    case "approved":
      return {
        text: "Godkänd",
        color: "bg-green-100 text-green-800 border-green-300",
      };
    case "declined":
      return {
        text: "Avböjd",
        color: "bg-red-100 text-red-700 border-red-300",
      };
    case "waiting":
      return {
        text: "Väntar",
        color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      };
    case "not_suitable":
      return {
        text: "Ej lämplig",
        color: "bg-orange-100 text-orange-700 border-orange-300",
      };
    default:
      return { text: "-", color: "bg-gray-50 text-gray-500 border-gray-200" };
  }
}
