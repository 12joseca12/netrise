import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard | Netrise",
  description: "Panel de control de tu cuenta Netrise. Gestiona tu perfil, explora oportunidades, mensajes y más.",
  robots: "noindex, nofollow",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
