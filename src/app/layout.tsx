import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/contexts/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Netrise | Plataforma para agencias creativas",
  description:
    "La plataforma todo-en-uno para automatizar tu flujo de trabajo, gestionar clientes de alto valor y centralizar las operaciones de tu agencia en una interfaz clara.",
  keywords: ["agencias creativas", "gestión de proyectos", "portal cliente", "facturación automatizada", "Netrise"],
  openGraph: {
    title: "Netrise | Plataforma para agencias creativas",
    description:
      "La plataforma todo-en-uno para automatizar tu flujo de trabajo, gestionar clientes de alto valor y centralizar las operaciones de tu agencia.",
    type: "website",
  },
  icons: {
    icon: "/netriseIcon.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://netrise.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
