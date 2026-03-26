import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed y notificaciones | Netrise",
  description: "Feed y notificaciones en Netrise.",
};

export default function FeedPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-title)]">Feed y notificaciones</h1>
    </div>
  );
}
