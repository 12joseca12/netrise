"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeName,
  sanitizeRole,
  isValidEmailFormat,
  type AllowedRole,
} from "@/lib/sanitize";
import { supabase } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;
const ROLES: { value: AllowedRole; key: "login.roleAgency" | "login.roleCloser" | "login.roleFreelancer" }[] = [
  { value: "agency", key: "login.roleAgency" },
  { value: "closer", key: "login.roleCloser" },
  { value: "freelancer", key: "login.roleFreelancer" },
];

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AllowedRole | "">("agency");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const setFirstNameSafe = useCallback((v: string) => setFirstName(sanitizeName(v)), []);
  const setLastNameSafe = useCallback((v: string) => setLastName(sanitizeName(v)), []);
  const setEmailSafe = useCallback((v: string) => setEmail(sanitizeEmail(v)), []);
  const setPasswordSafe = useCallback((v: string) => setPassword(sanitizePassword(v)), []);
  const setConfirmPasswordSafe = useCallback((v: string) => setConfirmPassword(sanitizePassword(v)), []);
  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {};
    const rawEmail = email.trim().toLowerCase();
    if (!rawEmail) next.email = t("login.validation.emailRequired");
    else if (!isValidEmailFormat(rawEmail)) next.email = t("login.validation.emailInvalid");
    if (!password) next.password = t("login.validation.passwordRequired");
    else if (password.length < MIN_PASSWORD_LENGTH) next.password = t("login.validation.passwordMin");
    if (mode === "register") {
      if (!role) next.role = t("login.validation.roleRequired");
      if (!firstName.trim()) next.firstName = t("login.validation.firstNameRequired");
      if (!lastName.trim()) next.lastName = t("login.validation.lastNameRequired");
      if (password !== confirmPassword) next.confirmPassword = t("login.validation.passwordMatch");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [email, password, confirmPassword, role, firstName, lastName, mode, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setTouched({ email: true, password: true, confirmPassword: true, role: true, firstName: true, lastName: true });
    if (!validate()) return;

    const rawEmail = sanitizeEmail(email);
    const rawPassword = sanitizePassword(password);

    if (mode === "register") {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: rawEmail,
          password: rawPassword,
          options: {
            data: {
              role: sanitizeRole(role) || "agency",
              first_name: sanitizeName(firstName),
              last_name: sanitizeName(lastName),
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered") || error.code === "user_already_exists") {
            setMessage({ type: "error", text: t("login.register.errorEmailTaken") });
          } else {
            setMessage({ type: "error", text: t("login.register.error") });
          }
          setLoading(false);
          return;
        }
        const roleToStore = sanitizeRole(role) || "agency";
        if (typeof window !== "undefined") {
          window.localStorage.setItem("netrise-pending-role", roleToStore);
          window.localStorage.setItem("netrise-pending-name", sanitizeName(firstName).trim() || "");
        }
        setMessage({ type: "success", text: t("login.register.success") });
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        router.push("/registro/completar-perfil");
      } catch {
        setMessage({ type: "error", text: t("login.register.error") });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Login: de momento solo validación (sin backend)
    console.info("[Login] Sign in (no backend yet):", { email: rawEmail, rememberMe });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 text-[var(--color-title)] no-underline"
            aria-label="Netrise - Inicio"
          >
            <Image src="/netriseIcon.svg" alt="" width={32} height={28} className="h-8 w-auto" />
            <span className="text-xl font-semibold">Netrise</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
          <div className="grid min-h-[32rem] md:grid-cols-2">
            {/* Left: marketing — gradiente moteado que se difumina hacia el borde derecho */}
            <div
              className="relative flex flex-col justify-between overflow-hidden p-8 md:p-10"
              style={{
                background: `
                  radial-gradient(ellipse 70% 50% at 15% 25%, rgba(59, 130, 246, 0.14), transparent 65%),
                  radial-gradient(ellipse 55% 55% at 75% 60%, rgba(59, 130, 246, 0.1), transparent 60%),
                  radial-gradient(ellipse 50% 70% at 45% 85%, rgba(59, 130, 246, 0.08), transparent 55%),
                  radial-gradient(ellipse 40% 40% at 85% 20%, rgba(59, 130, 246, 0.06), transparent 50%),
                  linear-gradient(to right, rgba(59, 130, 246, 0.07) 0%, rgba(59, 130, 246, 0.03) 50%, transparent 85%),
                  var(--color-background)
                `,
                backgroundBlendMode: "normal",
              }}
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-title)] md:text-3xl">
                  {t("login.leftHeadline")}
                </h2>
                <p className="mt-4 text-[var(--color-muted)]">
                  {t("login.leftSubline")}
                </p>
                <div className="mt-8 space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]" aria-hidden>
                      <ShieldCheck className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-title)]">
                        {t("login.leftFeature1.title")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {t("login.leftFeature1.desc")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]" aria-hidden>
                      <Banknote className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-title)]">
                        {t("login.leftFeature2.title")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">
                        {t("login.leftFeature2.desc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[var(--color-muted)]">
                {t("login.leftTrust")}
              </p>
            </div>

            {/* Right: form */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-[var(--color-title)]">
                  {mode === "login" ? t("login.title") : t("login.registerTitle")}
                </h1>
                <p className="mt-2 text-[var(--color-muted)]">
                  {mode === "login" ? t("login.subtitle") : t("login.registerSubtitle")}
                </p>
              </div>

              {mode === "register" && (
                <div className="mb-6">
                  <p className="mb-2 text-sm font-medium text-[var(--color-text)]">
                    {t("login.roleLabel")}
                  </p>
                  <div className="flex gap-2 flex-wrap" role="group" aria-label={t("login.roleLabel")}>
                    {ROLES.map(({ value, key }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRole(value)}
                        aria-pressed={role === value}
                        className={`rounded-lg border px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
                          role === value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-alt)]"
                        }`}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                  {touched.role && errors.role && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.role}
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {mode === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="login-firstName" className="block text-sm font-medium text-[var(--color-text)]">
                        {t("login.firstName")}
                      </label>
                      <input
                        id="login-firstName"
                        type="text"
                        autoComplete="given-name"
                        placeholder={t("login.firstNamePlaceholder")}
                        value={firstName}
                        onChange={(e) => setFirstNameSafe(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, firstName: true }))}
                        className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 px-4 text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        aria-invalid={touched.firstName && !!errors.firstName}
                        aria-describedby={touched.firstName && errors.firstName ? "login-firstName-error" : undefined}
                      />
                      {touched.firstName && errors.firstName && (
                        <p id="login-firstName-error" className="mt-1 text-sm text-red-600" role="alert">
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="login-lastName" className="block text-sm font-medium text-[var(--color-text)]">
                        {t("login.lastName")}
                      </label>
                      <input
                        id="login-lastName"
                        type="text"
                        autoComplete="family-name"
                        placeholder={t("login.lastNamePlaceholder")}
                        value={lastName}
                        onChange={(e) => setLastNameSafe(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
                        className="mt-1 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 px-4 text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        aria-invalid={touched.lastName && !!errors.lastName}
                        aria-describedby={touched.lastName && errors.lastName ? "login-lastName-error" : undefined}
                      />
                      {touched.lastName && errors.lastName && (
                        <p id="login-lastName-error" className="mt-1 text-sm text-red-600" role="alert">
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-[var(--color-text)]">
                    {t("login.email")}
                  </label>
                  <div className="relative mt-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={t("login.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmailSafe(e.target.value)}
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 pl-10 pr-4 text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                      aria-invalid={touched.email && !!errors.email}
                      aria-describedby={touched.email && errors.email ? "login-email-error" : undefined}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p id="login-email-error" className="mt-1 text-sm text-red-600" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {mode === "login" ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-text)]">
                        {t("login.password")}
                      </label>
                      <Link
                        href="#forgot"
                        className="text-sm text-[var(--color-primary)] hover:underline"
                      >
                        {t("login.forgotPassword")}
                      </Link>
                    </div>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </span>
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder={t("login.passwordPlaceholder")}
                        value={password}
                        onChange={(e) => setPasswordSafe(e.target.value)}
                        onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 pl-10 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                        aria-invalid={touched.password && !!errors.password}
                        aria-describedby={touched.password && errors.password ? "login-password-error" : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <p id="login-password-error" className="mt-1 text-sm text-red-600" role="alert">
                        {errors.password}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="login-password" className="block text-sm font-medium text-[var(--color-text)]">
                        {t("login.password")}
                      </label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={t("login.passwordPlaceholder")}
                          value={password}
                          onChange={(e) => setPasswordSafe(e.target.value)}
                          onBlur={() => setTouched((p) => ({ ...p, password: true }))}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 pl-10 pr-12 text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                          aria-invalid={touched.password && !!errors.password}
                          aria-describedby={touched.password && errors.password ? "login-password-error" : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {touched.password && errors.password && (
                        <p id="login-password-error" className="mt-1 text-sm text-red-600" role="alert">
                          {errors.password}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="login-confirm" className="block text-sm font-medium text-[var(--color-text)]">
                        {t("login.confirmPassword")}
                      </label>
                      <div className="relative mt-1">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" aria-hidden>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </span>
                        <input
                          id="login-confirm"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={t("login.confirmPasswordPlaceholder")}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPasswordSafe(e.target.value)}
                          onBlur={() => setTouched((p) => ({ ...p, confirmPassword: true }))}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-3 pl-10 pr-4 text-[var(--color-text)] placeholder:text-[var(--color-muted)] outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                          aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
                          aria-describedby={touched.confirmPassword && errors.confirmPassword ? "login-confirm-error" : undefined}
                        />
                      </div>
                      {touched.confirmPassword && errors.confirmPassword && (
                        <p id="login-confirm-error" className="mt-1 text-sm text-red-600" role="alert">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {mode === "login" && (
                  <div className="flex items-center gap-2">
                    <input
                      id="login-remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <label htmlFor="login-remember" className="text-sm text-[var(--color-text)]">
                      {t("login.rememberMe")}
                    </label>
                  </div>
                )}

                {message && (
                  <p
                    role="alert"
                    className={`rounded-xl px-4 py-3 text-sm ${
                      message.type === "success"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    {message.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[var(--color-primary)] py-3.5 text-base font-semibold text-white shadow-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading && mode === "register"
                    ? t("login.register.sending")
                    : mode === "login"
                      ? t("login.submit")
                      : t("login.submitRegister")}
                </button>
              </form>

              <div className="mt-6">
                <p className="text-center text-sm text-[var(--color-muted)]">
                  {mode === "login" ? t("login.noAccount") : t("login.hasAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode((m) => (m === "login" ? "register" : "login"));
                      setErrors({});
                      setTouched({});
                    }}
                    className="font-medium text-[var(--color-primary)] hover:underline"
                  >
                    {mode === "login" ? t("login.createAccount") : t("login.signIn")}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
