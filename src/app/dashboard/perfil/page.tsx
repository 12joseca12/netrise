import type { Metadata } from "next";
import { ProfileContent } from "./ProfileContent";

export const metadata: Metadata = {
  title: "Perfil | Netrise",
  description: "Tu perfil profesional en Netrise. Edita tu información y preferencias.",
};

export default function PerfilPage() {
  return <ProfileContent />;
}
