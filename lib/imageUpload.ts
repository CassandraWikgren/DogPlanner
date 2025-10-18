import { supabase } from "./supabase";

/**
 * Ladda upp en bild till Supabase Storage
 * @param file - Bildfilen som ska laddas upp
 * @param folder - Mapp i bucket (t.ex. 'dogs', 'profiles')
 * @param fileName - Filnamn (utan extension)
 * @returns Promise med URL till den uppladdade bilden
 */
export async function uploadImage(
  file: File,
  folder: string = "dogs",
  fileName?: string
): Promise<string> {
  try {
    // Validera filtyp
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Endast JPG, PNG och WebP-filer är tillåtna");
    }

    // Validera filstorlek (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("Filen är för stor. Max 5MB är tillåtet");
    }

    // Generera unikt filnamn om inget angivet
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2);
    const extension = file.name.split(".").pop();
    const finalFileName = fileName || `${timestamp}_${randomStr}`;
    const fullPath = `${folder}/${finalFileName}.${extension}`;

    // Ladda upp till Supabase Storage
    const { data, error } = await supabase.storage
      .from("images")
      .upload(fullPath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Uppladdning misslyckades: ${error.message}`);
    }

    // Hämta den publika URL:en
    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(fullPath);

    return publicUrl;
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

/**
 * Ta bort en bild från Supabase Storage
 * @param imageUrl - URL till bilden som ska tas bort
 * @returns Promise<boolean>
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Extrahera path från URL
    const urlParts = imageUrl.split("/");
    const path = urlParts.slice(-2).join("/"); // folder/filename

    const { error } = await supabase.storage.from("images").remove([path]);

    if (error) {
      console.error("Delete image error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Delete image error:", error);
    return false;
  }
}

/**
 * Komprimera bild innan uppladdning
 * @param file - Originalfilen
 * @param maxWidth - Max bredd i pixlar
 * @param quality - Kvalitet (0-1)
 * @returns Promise med komprimerad fil
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      // Beräkna nya dimensioner
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // Rita bilden på canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Konvertera till blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback till originalfil
          }
        },
        "image/jpeg",
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * React hook för bilduppladdning
 */
export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (
    file: File,
    folder: string = "dogs",
    fileName?: string,
    shouldCompress: boolean = true
  ): Promise<string | null> => {
    try {
      setUploading(true);
      setError(null);

      let fileToUpload = file;

      // Komprimera bilden om önskat
      if (shouldCompress && file.type.startsWith("image/")) {
        fileToUpload = await compressImage(file);
      }

      const url = await uploadImage(fileToUpload, folder, fileName);
      return url;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}

// React import för hook
import { useState } from "react";
