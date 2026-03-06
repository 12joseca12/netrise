import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión | Netrise",
  description: "Inicia sesión o crea tu cuenta en Netrise. Elige tu rol: agencia, closer o freelancer.",
  robots: "noindex, nofollow",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
