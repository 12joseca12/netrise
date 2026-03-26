import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notificaciones | Netrise",
  description: "Notificaciones de tu cuenta Netrise.",
};

export default function NotificacionesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Notificaciones</h1>
    </div>
  );
}
