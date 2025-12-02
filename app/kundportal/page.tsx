"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, User, Calendar, FileText, Heart } from "lucide-react";

/**
 * Kundportal startsida för hundägare
 * Separat från pensionatets dashboard
 */
export default function CustomerPortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-slate-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="DogPlanner"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold">DogPlanner Kundportal</h1>
            </Link>
            <div className="flex space-x-4">
              <Link href="/kundportal/login">
                <Button
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-slate-700"
                >
                  Logga in
                </Button>
              </Link>
              <Link href="/kundportal/registrera">
                <Button className="bg-white text-slate-700 hover:bg-gray-100">
                  Skapa konto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Välkommen till vår hundpensionat-portal! 🐕
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Hantera din hunds pensionatsbokning enkelt och smidigt. Registrera
            dig, skapa hundprofiler och skicka bokningsförfrågningar.
          </p>

          <div className="flex justify-center space-x-4">
            <Link href="/kundportal/registrera">
              <Button
                size="lg"
                className="bg-slate-700 hover:bg-slate-800 text-white px-8 py-3"
              >
                Kom igång - Skapa konto
              </Button>
            </Link>
            <Link href="/kundportal/login">
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white px-8 py-3"
              >
                Har redan konto? Logga in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Så här fungerar det
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent>
                <User className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">1. Skapa profil</h4>
                <p className="text-gray-600">
                  Registrera dig och fyll i dina uppgifter samt kontaktperson
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent>
                <PawPrint className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">
                  2. Lägg till hund
                </h4>
                <p className="text-gray-600">
                  Skapa hundprofiler med all nödvändig information och
                  hälsouppgifter
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent>
                <Calendar className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">
                  3. Boka pensionat
                </h4>
                <p className="text-gray-600">
                  Välj datum, pensionat och tillvalstjänster för din hunds
                  vistelse
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent>
                <FileText className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">
                  4. Få bekräftelse
                </h4>
                <p className="text-gray-600">
                  Få din ansökan granskad och få faktura samt
                  bokningsbekräftelse
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-slate-700 text-white">
        <div className="container mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto mb-6 text-pink-200" />
          <h3 className="text-3xl font-bold mb-4">
            Din hund förtjänar det bästa!
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Ge din fyrbenta vän en trygg och rolig pensionatsvistelse
          </p>
          <Link href="/kundportal/registrera">
            <Button
              size="lg"
              className="bg-white text-slate-700 hover:bg-gray-100 px-8 py-3"
            >
              Börja nu - det är gratis!
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <p>&copy; 2025 DogPlanner. Alla rättigheter förbehållna.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link href="/kundportal/support" className="hover:text-gray-300">
              Support
            </Link>
            <Link href="/kundportal/integritet" className="hover:text-gray-300">
              Integritetspolicy
            </Link>
            <Link href="/kundportal/villkor" className="hover:text-gray-300">
              Villkor
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
