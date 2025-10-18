import Terms from "@/components/Terms";
import "../marketing.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DogPlanner – Villkor",
};

export default function PublicTermsPage() {
  return (
    <main>
      <header>
        <img src="/logo.png" alt="DogPlanner logotyp" className="logo" />
        <a className="login-btn" href="/login">
          Logga in
        </a>
      </header>
      <Terms />
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <a className="btn primary" href="/login">
          Skapa konto
        </a>
      </div>
    </main>
  );
}
