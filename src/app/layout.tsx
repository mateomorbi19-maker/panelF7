import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel F7 Automotriz",
  description: "CRM F7 — gestion de conversaciones y precios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-f7black text-slate-100 antialiased">{children}</body>
    </html>
  );
}
