import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trabajos | Netrise",
  description: "Trabajos en Netrise.",
};

export default function TrabajosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Trabajos</h1>
    </div>
  );
}
