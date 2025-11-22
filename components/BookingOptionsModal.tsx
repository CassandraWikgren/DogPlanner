"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PawPrint, LogIn, UserPlus, Zap } from "lucide-react";
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <PawPrint className="h-6 w-6 text-[#2c7a4c]" />
            Boka {bookingTitle}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Välj hur du vill fortsätta med din bokning
          </p>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {/* Alternativ 1: Snabboka utan konto */}
          <Link href={bookingPath} onClick={onClose}>
            <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#e6f4ea] transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <Zap className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Snabboka utan konto
                  </h3>
                  <p className="text-sm text-gray-600">
                    Perfekt för engångsbokning. Fyll i uppgifter direkt.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚡ Snabbast alternativet
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Alternativ 2: Logga in */}
          <Link href="/kundportal/login" onClick={onClose}>
            <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#e6f4ea] transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <LogIn className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Logga in på ditt konto
                  </h3>
                  <p className="text-sm text-gray-600">
                    Har du redan ett konto? Logga in för att boka snabbare.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    🔐 Sparat information
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Alternativ 3: Skapa konto först */}
          <Link href="/kundportal/registrera" onClick={onClose}>
            <div className="p-4 border-2 border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#e6f4ea] transition-all cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Skapa konto först
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ny här? Skapa ett gratis konto och spara dina uppgifter.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ✨ Boka snabbare nästa gång
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-gray-600"
          >
            Avbryt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
