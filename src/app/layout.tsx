import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner"
import { FloatingTimer } from "@/components/ui/floating-timer"
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Klowezone - CRM Profesional",
  description: "Sistema de gestión de proyectos y clientes para profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
        <FloatingTimer />
      </body>
    </html>
  );
}
