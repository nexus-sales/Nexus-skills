import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus - Sistemas de IA reutilizables",
  description: "Convierte ideas en prompts, skills, agentes y workflows reutilizables",
  authors: [{ name: "Salvador Munoz Portillo", url: "https://nexus-sales.eu" }],
  keywords: ["Nexus", "prompt engineering", "skills IA", "agentes IA", "workflows IA"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased font-syne">
        {children}
      </body>
    </html>
  );
}
