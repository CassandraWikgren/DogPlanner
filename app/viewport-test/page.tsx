"use client";

import { useEffect, useState } from "react";

export default function ViewportTest() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const getInfo = () => {
      const html = document.documentElement;
      const body = document.body;
      const viewport = document.querySelector('meta[name="viewport"]');

      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        htmlWidth: html.offsetWidth,
        htmlClientWidth: html.clientWidth,
        bodyWidth: body.offsetWidth,
        bodyClientWidth: body.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        viewportContent: viewport?.getAttribute("content") || "SAKNAS!",
        userAgent: navigator.userAgent,
        allMetaTags: Array.from(document.querySelectorAll("meta")).map((m) => ({
          name: m.getAttribute("name"),
          content: m.getAttribute("content"),
          charset: m.getAttribute("charset"),
        })),
        computedBodyStyle: {
          width: window.getComputedStyle(body).width,
          minWidth: window.getComputedStyle(body).minWidth,
          maxWidth: window.getComputedStyle(body).maxWidth,
        },
      };
    };

    setInfo(getInfo());

    // Uppdatera vid resize
    const handleResize = () => setInfo(getInfo());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "20px" }}
      >
        🔍 Viewport & Width Diagnostic
      </h1>

      <div
        style={{
          background: "#f0f0f0",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Viewport Meta Tag
        </h2>
        <code
          style={{
            display: "block",
            background: info.viewportContent === "SAKNAS!" ? "#fee" : "#efe",
            padding: "10px",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          {info.viewportContent}
        </code>
      </div>

      <div
        style={{
          background: "#f0f0f0",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Dimensions
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>
                Window Width
              </td>
              <td style={{ padding: "8px" }}>{info.windowWidth}px</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>
                Screen Width
              </td>
              <td style={{ padding: "8px" }}>{info.screenWidth}px</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>HTML Width</td>
              <td style={{ padding: "8px" }}>{info.htmlWidth}px</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>
                Body Width (offset)
              </td>
              <td style={{ padding: "8px" }}>{info.bodyWidth}px</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>
                Body Width (client)
              </td>
              <td style={{ padding: "8px" }}>{info.bodyClientWidth}px</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>
                Body Width (computed)
              </td>
              <td style={{ padding: "8px" }}>
                {info.computedBodyStyle?.width}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "8px", fontWeight: "bold" }}>
                Device Pixel Ratio
              </td>
              <td style={{ padding: "8px" }}>{info.devicePixelRatio}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        style={{
          background: "#f0f0f0",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "10px" }}
        >
          All Meta Tags
        </h2>
        <pre
          style={{
            background: "#fff",
            padding: "10px",
            borderRadius: "4px",
            overflow: "auto",
          }}
        >
          {JSON.stringify(info.allMetaTags, null, 2)}
        </pre>
      </div>

      <div
        style={{
          background: "#fee",
          padding: "20px",
          borderRadius: "8px",
          border: "2px solid #f00",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "10px",
            color: "#c00",
          }}
        >
          ⚠️ Diagnosis
        </h2>
        {info.bodyWidth < 700 && (
          <p style={{ fontSize: "16px", color: "#c00", fontWeight: "bold" }}>
            🚨 PROBLEM: Body width är {info.bodyWidth}px - detta är FÖR SMALT!
            Borde vara minst 1000px på desktop.
          </p>
        )}
        {info.viewportContent === "SAKNAS!" && (
          <p style={{ fontSize: "16px", color: "#c00", fontWeight: "bold" }}>
            🚨 PROBLEM: Viewport meta tag SAKNAS!
          </p>
        )}
        {info.windowWidth &&
          info.bodyWidth &&
          info.windowWidth > info.bodyWidth + 50 && (
            <p style={{ fontSize: "16px", color: "#c00", fontWeight: "bold" }}>
              🚨 PROBLEM: Window ({info.windowWidth}px) är mycket bredare än
              body ({info.bodyWidth}px)!
            </p>
          )}
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          background: "#e0f0ff",
          borderRadius: "8px",
        }}
      >
        <h2
          style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}
        >
          Visual Width Test
        </h2>
        <div
          style={{
            width: "100px",
            height: "50px",
            background: "red",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px",
          }}
        >
          100px
        </div>
        <div
          style={{
            width: "500px",
            height: "50px",
            background: "blue",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "10px",
          }}
        >
          500px
        </div>
        <div
          style={{
            width: "100%",
            height: "50px",
            background: "green",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          100% (should fill screen)
        </div>
      </div>
    </div>
  );
}
