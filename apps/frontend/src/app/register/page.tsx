"use client";

/** Registration page — name/email/password form with client-side validation, password confirmation, dark mode, and theme toggle. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Mail,
  Lock,
  User,
  Loader2,
  ArrowRight,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * Registration form. Validates passwords match and min length client-side,
 * posts to /auth/register, stores JWT, redirects to onboarding on success.
 * Features password visibility toggles and loading state.
 */
export default function RegisterPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      router.push("/dashboard/onboarding");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al registrar usuario");
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware colors
  const rightBg = darkMode ? "bg-[#0f1117]" : "bg-[#faf9f7]";
  const inputBg = darkMode ? "bg-white/5" : "bg-black/[0.03]";
  const inputBorder = darkMode ? "border-white/10" : "border-black/10";
  const inputFocus = "focus:border-[#f59e0b]/50";
  const inputText = darkMode ? "text-white" : "text-[#1a1a2e]";
  const inputPlaceholder = darkMode
    ? "placeholder:text-white/20"
    : "placeholder:text-black/25";
  const labelText = darkMode ? "text-white/70" : "text-black/70";
  const errorBg = darkMode
    ? "bg-red-500/10 border border-red-500/20 text-red-400"
    : "bg-red-50 border border-red-200 text-red-600";
  const linkColor = darkMode
    ? "text-[#f59e0b] hover:text-[#fbbf24]"
    : "text-[#d97706] hover:text-[#f59e0b]";
  const iconColor = darkMode ? "text-white/30" : "text-black/30";
  const iconHover = darkMode ? "hover:text-white/60" : "hover:text-black/60";
  const btnBg = "bg-gradient-to-r from-[#f59e0b] to-[#d97706]";

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] relative overflow-hidden">
        {/* Subtle gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#f59e0b]/10 rounded-full blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#7c3aed]/10 rounded-full blur-[100px]" />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
            <Package className="h-5 w-5 text-[#0f0f1a]" />
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">
            Inventario
          </span>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Empieza a gestionar
            <br />
            <span className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] bg-clip-text text-transparent">
              tu inventario
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-sm leading-relaxed">
            Crea tu cuenta en segundos y obtén control total sobre productos,
            stock y alertas.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {[
            "Gestión de productos en tiempo real",
            "Alertas automáticas de stock bajo",
            "Historial completo de movimientos",
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#f59e0b]/20 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 text-[#f59e0b]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-white/40 text-sm">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={`flex-1 flex items-center justify-center p-8 transition-colors duration-300 ${rightBg}`}
      >
        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className={`absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            darkMode
              ? "bg-white/5 border border-white/10 text-white/50 hover:text-white"
              : "bg-black/5 border border-black/10 text-black/50 hover:text-black"
          }`}
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
              <Package className="h-5 w-5 text-[#0f1117]" />
            </div>
            <span
              className={`text-xl font-semibold ${darkMode ? "text-white" : "text-[#1a1a2e]"}`}
            >
              Inventario
            </span>
          </div>

          <h2
            className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-[#1a1a2e]"}`}
          >
            Crear cuenta
          </h2>
          <p
            className={`mt-1 mb-8 ${darkMode ? "text-white/40" : "text-black/40"}`}
          >
            Completa tus datos para comenzar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className={`rounded-xl px-4 py-3 text-sm ${errorBg}`}>
                {error}
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className={`block text-sm font-medium mb-2 ${labelText}`}
              >
                Nombre completo
              </label>
              <div className="relative">
                <User
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`}
                />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  required
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all outline-none ${inputBg} border ${inputBorder} ${inputText} ${inputPlaceholder} ${inputFocus}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${labelText}`}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`}
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all outline-none ${inputBg} border ${inputBorder} ${inputText} ${inputPlaceholder} ${inputFocus}`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className={`block text-sm font-medium mb-2 ${labelText}`}
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`}
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                  className={`w-full pl-11 pr-11 py-3 rounded-xl text-sm transition-all outline-none ${inputBg} border ${inputBorder} ${inputText} ${inputPlaceholder} ${inputFocus}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${iconColor} ${iconHover} transition-colors`}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className={`block text-sm font-medium mb-2 ${labelText}`}
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${iconColor}`}
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                  className={`w-full pl-11 pr-11 py-3 rounded-xl text-sm transition-all outline-none ${inputBg} border ${inputBorder} ${inputText} ${inputPlaceholder} ${inputFocus}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${iconColor} ${iconHover} transition-colors`}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-[#0f1117] ${btnBg} hover:opacity-90 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p
            className={`mt-8 text-center text-sm ${darkMode ? "text-white/40" : "text-black/40"}`}
          >
            ¿Ya tienes cuenta?{" "}
            <a
              href="/login"
              className={`font-medium ${linkColor} transition-colors`}
            >
              Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
