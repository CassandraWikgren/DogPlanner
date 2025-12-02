"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PawPrint, LogIn, UserPlus, Zap, X } from "lucide-react";
import Link from "next/link";

interface BookingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingType: "hunddagis" | "pensionat";
}

export default function BookingOptionsModal({
  isOpen,
  onClose,
  bookingType,
}: BookingOptionsModalProps) {
  const bookingPath =
    bookingType === "hunddagis" ? "/ansokan/hunddagis" : "/ansokan/pensionat";
  const bookingTitle = bookingType === "hunddagis" ? "hunddagis" : "pensionat";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-0 top-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Stäng"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#e6f4ea] rounded-lg">
              <PawPrint className="h-7 w-7 text-slate-700" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Boka {bookingTitle}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Välj hur du vill fortsätta med din bokning
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Alternativ 1: Snabboka utan konto - REKOMMENDERAT */}
          <Link href={bookingPath} onClick={onClose} className="block">
            <div className="relative p-5 border-2 border-slate-700 bg-gradient-to-br from-slate-50 to-white rounded-xl hover:shadow-lg transition-all cursor-pointer group">
              <div className="absolute top-3 right-3">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  ⚡ SNABBAST
                </span>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors flex-shrink-0">
                  <Zap className="h-7 w-7 text-orange-600" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Boka utan konto
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">
                    Perfekt för engångsbokning. Fyll i alla uppgifter direkt och
                    gör din bokning på några minuter.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      ✓ Inget konto behövs
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="inline-flex items-center gap-1">
                      ✓ Snabbt och enkelt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">
                Eller
              </span>
            </div>
          </div>

          {/* Alternativ 2: Logga in */}
          <Link href="/kundportal/login" onClick={onClose} className="block">
            <div className="p-5 border-2 border-gray-200 bg-white rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors flex-shrink-0">
                  <LogIn className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Logga in på ditt konto
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Har du redan ett konto? Logga in så är alla dina uppgifter
                    redan sparade.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      🔐 Sparad information
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Alternativ 3: Skapa konto först */}
          <Link
            href="/kundportal/registrera"
            onClick={onClose}
            className="block"
          >
            <div className="p-5 border-2 border-gray-200 bg-white rounded-xl hover:border-green-300 hover:bg-green-50 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors flex-shrink-0">
                  <UserPlus className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 pt-0.5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Skapa konto först
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Ny här? Skapa ett gratis konto och spara dina uppgifter för
                    framtida bokningar.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      ✨ Boka snabbare nästa gång
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t mt-4">
          <p className="text-xs text-center text-gray-500">
            💡 Tips: Om du bara vill boka en gång, välj "Boka utan konto"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
