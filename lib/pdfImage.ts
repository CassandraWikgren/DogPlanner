/**
 * Hämtar en bild från en publik URL (t.ex. Supabase Storage)
 * och returnerar den som en base64-dataURL (lämplig för PDF eller canvas).
 */
export async function getImageDataUrl(url: string): Promise<string> {
  if (!url) throw new Error("Ingen URL angiven för getImageDataUrl.");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Kunde inte hämta bild: ${res.statusText}`);

  const blob = await res.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) resolve(reader.result as string);
      else reject(new Error("Kunde inte läsa bild som base64"));
    };
    reader.onerror = () => reject(new Error("Fel vid FileReader för bild"));
    reader.readAsDataURL(blob);
  });
}
