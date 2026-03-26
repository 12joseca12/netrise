import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Equipo | Netrise",
  description: "Gestiona tu equipo en Netrise.",
};

export default function EquipoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Equipo</h1>
    </div>
  );
}
