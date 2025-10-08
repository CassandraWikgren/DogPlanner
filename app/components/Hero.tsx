"use client";

interface HeroProps {
  title: string;
  subtitle?: string;
  image?: string;
}

export default function Hero({ title, subtitle, image }: HeroProps) {
  return (
    <div
      className="relative w-full h-60 md:h-72 flex items-center justify-center text-center text-white"
      style={{
        backgroundImage: image ? `url(${image})` : "url('/dog-bg.jpg')", // fallback-bild
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-green-800/70" />

      {/* Text */}
      <div className="relative z-10 px-4">
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg md:text-xl text-gray-100">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
