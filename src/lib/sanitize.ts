/**
 * Sanitización de entradas para evitar XSS e inyección de código.
 * No sustituye la validación en servidor cuando exista backend.
 */

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 100;
const MAX_ROLE_LENGTH = 50;

/** Elimina caracteres que podrían usarse en inyección HTML/script */
function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };
  return str.replace(/[&<>"'`=/]/g, (ch) => map[ch] ?? ch);
}

/** Recorta y normaliza espacios; opcionalmente escapa HTML */
export function sanitizeString(
  value: string,
  options: { maxLength?: number; escape?: boolean } = {}
): string {
  const { maxLength = 500, escape: doEscape = true } = options;
  let out = value.trim().slice(0, maxLength);
  if (doEscape) out = escapeHtml(out);
  return out;
}

/** Sanitiza email: solo caracteres permitidos en email, longitud máxima */
export function sanitizeEmail(value: string): string {
  const trimmed = value.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
  return trimmed.replace(/[^\w.@+-]/g, "");
}

/** Sanitiza campo de contraseña: sin HTML, longitud máxima (no revelar reglas) */
export function sanitizePassword(value: string): string {
  return value.slice(0, MAX_PASSWORD_LENGTH);
}

/** Sanitiza nombre/apellidos para registro. Permite espacios (p. ej. "María Luisa"). */
export function sanitizeName(value: string): string {
  const trimmed = value.trim().slice(0, MAX_NAME_LENGTH);
  return escapeHtml(trimmed);
}

/** Sanitiza valor de rol (solo uno de los permitidos) */
const ALLOWED_ROLES = ["agency", "closer", "freelancer"] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export function sanitizeRole(value: string): AllowedRole | "" {
  const lower = value.trim().toLowerCase().slice(0, MAX_ROLE_LENGTH);
  return ALLOWED_ROLES.includes(lower as AllowedRole) ? (lower as AllowedRole) : "";
}

/** Valida formato básico de email */
export function isValidEmailFormat(email: string): boolean {
  if (!email || email.length > MAX_EMAIL_LENGTH) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}
