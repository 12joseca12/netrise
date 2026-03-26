import type { Metadata } from "next";
import { DashboardContent } from "./DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard | Netrise",
  description: "Panel principal de Netrise. Métricas, ingresos y tablas de closers, freelancers y agencias.",
};

export default function DashboardPage() {
  return <DashboardContent />;
}
