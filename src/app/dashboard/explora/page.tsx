import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explora | Netrise",
  description: "Explora oportunidades en Netrise.",
};

export default function ExploraPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Explora</h1>
    </div>
  );
}
