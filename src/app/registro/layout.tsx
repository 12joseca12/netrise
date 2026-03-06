import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Completar perfil | Netrise",
  description:
    "Completa tu perfil profesional en Netrise para conectar con agencias y closers. Configura tu rol, servicios y preferencias.",
  robots: "noindex, nofollow",
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
