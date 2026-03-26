import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mensajes | Netrise",
  description: "Mensajes en Netrise.",
};

export default function MensajesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Mensajes</h1>
    </div>
  );
}
