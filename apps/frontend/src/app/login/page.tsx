"use client";

/** Login page — email/password form with dark mode toggle, password visibility, loading spinner, and inline error display. */
import { useState } from "react";
import axios from "axios";
import { Mail, Lock, Loader2, Package, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

/**
 * Login form. Posts credentials to /auth/login, stores JWT in localStorage,
 * redirects to /dashboard/onboarding on success. Shows error message on failure.
 * Loading state disables submit button with spinner.
 */
export default function LoginPage() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3001/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      window.location.href = "/dashboard/onboarding";
    } catch (err: any) {
      setError(err.response?.data?.message || "Credenciales inválidas");
    } finally {
      setLoading(false);
    }
  };

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
            Control total de tu
            <br />
            <span className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] bg-clip-text text-transparent">
              inventario
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-sm leading-relaxed">
            Gestiona productos, stock en tiempo real y recibe alertas
            automáticas.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/20">
          © 2026 Sistema Inventario
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className={`flex-1 flex items-center justify-center p-8 transition-colors duration-300 ${darkMode ? "bg-[#0f1117]" : "bg-[#faf9f7]"}`}
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
            Iniciar sesión
          </h2>
          <p
            className={`mt-1 mb-8 ${darkMode ? "text-white/40" : "text-black/40"}`}
          >
            Ingresa tus credenciales
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${darkMode ? "text-white/70" : "text-black/70"}`}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <Mail
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-white/30" : "text-black/30"}`}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all outline-none ${
                    darkMode
                      ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#f59e0b]/50"
                      : "bg-black/[0.03] border border-black/10 text-[#1a1a2e] placeholder:text-black/25 focus:border-[#f59e0b]/50"
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className={`text-sm font-medium ${darkMode ? "text-white/70" : "text-black/70"}`}
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  className={`text-xs ${darkMode ? "text-[#f59e0b]/70 hover:text-[#f59e0b]" : "text-[#d97706]/70 hover:text-[#d97706]"} transition-colors`}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? "text-white/30" : "text-black/30"}`}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-11 pr-11 py-3 rounded-xl text-sm transition-all outline-none ${
                    darkMode
                      ? "bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:border-[#f59e0b]/50"
                      : "bg-black/[0.03] border border-black/10 text-[#1a1a2e] placeholder:text-black/25 focus:border-[#f59e0b]/50"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-white/30 hover:text-white/60" : "text-black/30 hover:text-black/60"} transition-colors`}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${darkMode ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-red-50 border border-red-200 text-red-600"}`}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium text-[#0f1117] bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:opacity-90 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* Register link */}
          <p
            className={`mt-8 text-center text-sm ${darkMode ? "text-white/40" : "text-black/40"}`}
          >
            ¿No tienes cuenta?{" "}
            <a
              href="/register"
              className={`font-medium ${darkMode ? "text-[#f59e0b] hover:text-[#fbbf24]" : "text-[#d97706] hover:text-[#f59e0b]"} transition-colors`}
            >
              Regístrate
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
