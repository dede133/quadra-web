import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quadra",
  description: "Organiza el partido sin organizar 200 mensajes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
