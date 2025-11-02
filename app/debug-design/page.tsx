"use client";

import { useEffect, useState } from "react";

export default function DebugDesignPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Samla all relevant design-information
    const info = {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      computed: {
        htmlFontSize: window.getComputedStyle(document.documentElement)
          .fontSize,
        bodyFontSize: window.getComputedStyle(document.body).fontSize,
        bodyFontFamily: window.getComputedStyle(document.body).fontFamily,
        bodyLineHeight: window.getComputedStyle(document.body).lineHeight,
      },
      meta: {
        viewport:
          document
            .querySelector('meta[name="viewport"]')
            ?.getAttribute("content") || "SAKNAS",
        charset: document.charset,
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
      },
      environment: {
        isProduction: process.env.NODE_ENV === "production",
        isVercel: !!process.env.NEXT_PUBLIC_VERCEL_URL,
        userAgent: navigator.userAgent,
      },
      css: {
        tailwindLoaded: !!document.querySelector("style[data-tailwind]"),
        globalStylesCount: document.querySelectorAll("style").length,
      },
    };

    setDebugInfo(info);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🔍 Design Debug Information
        </h1>

        {/* Viewport Info */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📐 Viewport
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Width:</strong> {debugInfo.viewport?.width}px
            </div>
            <div>
              <strong>Height:</strong> {debugInfo.viewport?.height}px
            </div>
            <div>
              <strong>Device Pixel Ratio:</strong>{" "}
              {debugInfo.viewport?.devicePixelRatio}
            </div>
          </div>
        </section>

        {/* Computed Styles */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎨 Computed Styles
          </h2>
          <div className="space-y-2">
            <div>
              <strong>HTML Font Size:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {debugInfo.computed?.htmlFontSize}
              </code>
            </div>
            <div>
              <strong>Body Font Size:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {debugInfo.computed?.bodyFontSize}
              </code>
            </div>
            <div>
              <strong>Font Family:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {debugInfo.computed?.bodyFontFamily}
              </code>
            </div>
            <div>
              <strong>Line Height:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {debugInfo.computed?.bodyLineHeight}
              </code>
            </div>
          </div>
        </section>

        {/* Meta Tags */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🏷️ Meta Tags
          </h2>
          <div className="space-y-2">
            <div>
              <strong>Viewport:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {debugInfo.meta?.viewport}
              </code>
            </div>
            <div>
              <strong>Charset:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                {debugInfo.meta?.charset}
              </code>
            </div>
          </div>
        </section>

        {/* Screen Info */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🖥️ Screen
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Width:</strong> {debugInfo.screen?.width}px
            </div>
            <div>
              <strong>Height:</strong> {debugInfo.screen?.height}px
            </div>
            <div>
              <strong>Available Width:</strong> {debugInfo.screen?.availWidth}px
            </div>
            <div>
              <strong>Available Height:</strong> {debugInfo.screen?.availHeight}
              px
            </div>
          </div>
        </section>

        {/* Environment */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            ⚙️ Environment
          </h2>
          <div className="space-y-2">
            <div>
              <strong>Production:</strong>{" "}
              <span
                className={
                  debugInfo.environment?.isProduction
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {debugInfo.environment?.isProduction ? "YES" : "NO"}
              </span>
            </div>
            <div>
              <strong>Vercel:</strong>{" "}
              <span
                className={
                  debugInfo.environment?.isVercel
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {debugInfo.environment?.isVercel ? "YES" : "NO"}
              </span>
            </div>
            <div>
              <strong>User Agent:</strong>{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs block mt-1">
                {debugInfo.environment?.userAgent}
              </code>
            </div>
          </div>
        </section>

        {/* CSS Info */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">💅 CSS</h2>
          <div className="space-y-2">
            <div>
              <strong>Tailwind Loaded:</strong>{" "}
              <span
                className={
                  debugInfo.css?.tailwindLoaded
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {debugInfo.css?.tailwindLoaded ? "YES" : "NO"}
              </span>
            </div>
            <div>
              <strong>Total Style Tags:</strong>{" "}
              {debugInfo.css?.globalStylesCount}
            </div>
          </div>
        </section>

        {/* Visual Test */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📏 Visual Test
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">
                Detta är 16px (1rem) text - standard
              </p>
              <p className="text-lg text-gray-600 mb-2">
                Detta är 18px (1.125rem) text - large
              </p>
              <p className="text-xl text-gray-600 mb-2">
                Detta är 20px (1.25rem) text - xl
              </p>
              <p className="text-2xl text-gray-600 mb-2">
                Detta är 24px (1.5rem) text - 2xl
              </p>
              <p className="text-3xl text-gray-600 mb-2">
                Detta är 30px (1.875rem) text - 3xl
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="mb-2">
                <strong>Inline style test:</strong>
              </p>
              <p style={{ fontSize: "16px" }}>16px inline</p>
              <p style={{ fontSize: "1rem" }}>1rem inline</p>
              <p style={{ fontSize: "24px" }}>24px inline</p>
            </div>
          </div>
        </section>

        {/* Raw JSON */}
        <section className="bg-gray-900 rounded-lg shadow p-6 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            📊 Raw Data (JSON)
          </h2>
          <pre className="text-green-400 text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
