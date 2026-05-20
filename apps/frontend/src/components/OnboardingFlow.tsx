/**
 * OnboardingFlow
 *
 * Componente de onboarding de 3 pasos para nuevos usuarios.
 * Se muestra después del registro/login hasta que el usuario completa el tour.
 *
 * Flujo:
 *   Paso 1: Bienvenida - Descripción general de la app
 *   Paso 2: Tour - Explora las secciones del dashboard
 *   Paso 3: Configuración - Preferencias iniciales (toggles)
 *
 * Cada cambio de paso se persiste en el backend via updateOnboardingStep().
 * Al completar, se llama completeOnboarding() en el backend y luego onComplete().
 *
 * Soporta dark/light mode via useTheme().
 *
 * Uso:
 *   <OnboardingFlow userId="uuid" onComplete={() => router.push("/dashboard")} />
 *
 * @module OnboardingFlow
 */

"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { updateOnboardingStep, completeOnboarding } from "@/lib/api";

interface OnboardingFlowProps {
  /** ID del usuario (se usa para persistir el estado en backend) */
  userId: string;
  /** Callback que se llama al completar o saltar el onboarding */
  onComplete: () => void;
}

export function OnboardingFlow({
  userId,
  onComplete,
}: OnboardingFlowProps) {
  const { darkMode } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    if (currentStep < 3) {
      // Persistir el paso al que vamos en el backend (no bloqueante para UI)
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateOnboardingStep(userId, nextStep).catch(() => {
        /* fallback silencioso */
      });
    } else {
      // Completar onboarding en backend
      setSaving(true);
      try {
        await completeOnboarding(userId);
      } catch {
        /* continuar aunque falle el backend */
      }
      onComplete();
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try {
      await completeOnboarding(userId);
    } catch {
      /* continuar aunque falle el backend */
    }
    onComplete();
  };

  // Colores adaptados al tema actual
  const bg = darkMode ? "bg-[#0f0f1a]" : "bg-[#f5f6fa]";
  const cardBg = darkMode ? "bg-[#1e1f2e]" : "bg-white";
  const border = darkMode ? "border-[#2a2b3d]" : "border-[#e5e7eb]";
  const textPrimary = darkMode ? "text-[#e8e9ed]" : "text-[#1a1a2e]";
  const textSecondary = darkMode ? "text-[#9094a6]" : "text-[#6b7280]";
  const textMuted = darkMode ? "text-[#6b7280]" : "text-[#9ca3af]";
  const accent = darkMode ? "text-[#38bdf8]" : "text-[#0284c7]";
  const accentBg = darkMode ? "bg-[#38bdf8]" : "bg-[#0284c7]";
  const accentHover = darkMode ? "hover:bg-[#7dd3fc]" : "hover:bg-[#0369a1]";
  const stepDone = darkMode
    ? "bg-[#38bdf8] text-[#0f1117]"
    : "bg-[#0284c7] text-white";
  const stepPending = darkMode
    ? "bg-[#2a2b3d] text-[#6b7280]"
    : "bg-[#e5e7eb] text-[#9ca3af]";
  const barDone = darkMode ? "bg-[#38bdf8]" : "bg-[#0284c7]";
  const barPending = darkMode ? "bg-[#2a2b3d]" : "bg-[#e5e7eb]";
  const innerBg = darkMode ? "bg-[#252636]" : "bg-[#f3f4f6]";

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${bg} transition-colors duration-300`}
    >
      <div className="w-full max-w-lg px-6">
        {/* Indicador de progreso (3 pasos) */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  step <= currentStep ? stepDone : stepPending
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-14 h-0.5 mx-1 transition-all ${
                    step < currentStep ? barDone : barPending
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Contenido del paso actual */}
        <div
          className={`${cardBg} rounded-2xl p-8 border ${border} transition-colors duration-300`}
        >
          {currentStep === 1 && (
            <Step1
              darkMode={darkMode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              accent={accent}
              accentBg={accentBg}
            />
          )}
          {currentStep === 2 && (
            <Step2
              darkMode={darkMode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              accent={accent}
              border={border}
              innerBg={innerBg}
            />
          )}
          {currentStep === 3 && (
            <Step3
              darkMode={darkMode}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              accentBg={accentBg}
              border={border}
              innerBg={innerBg}
            />
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleSkip}
              disabled={saving}
              className={`${textMuted} hover:${textSecondary} text-sm transition-colors disabled:opacity-30`}
            >
              Omitir tour
            </button>
            <button
              onClick={handleNext}
              disabled={saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl ${accentBg} text-white font-medium ${accentHover} transition-all disabled:opacity-50`}
            >
              {saving ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : currentStep === 3 ? (
                "Finalizar"
              ) : (
                "Siguiente"
              )}
              {!saving && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Paso 1: Bienvenida */
interface Step1Props {
  darkMode: boolean;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentBg: string;
}

function Step1({
  darkMode,
  textPrimary,
  textSecondary,
  accent,
  accentBg,
}: Step1Props) {
  const iconBg = darkMode ? "bg-[#38bdf8]/15" : "bg-[#0284c7]/10";
  const hintBg = darkMode ? "bg-[#38bdf8]/10" : "bg-[#0284c7]/10";
  const hintText = darkMode ? "text-[#38bdf8]" : "text-[#0284c7]";

  return (
    <div className="text-center">
      <div
        className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-5`}
      >
        <svg
          className={`w-8 h-8 ${accent}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h2 className={`text-2xl font-bold ${textPrimary} mb-3`}>
        Bienvenido a Inventario
      </h2>
      <p className={`${textSecondary} leading-relaxed mb-4`}>
        Gestiona tu inventario de productos, controla el stock en tiempo real y
        recibe alertas automáticas cuando los niveles sean bajos.
      </p>
      <p
        className={`${hintBg} ${hintText} text-sm font-medium px-3 py-1.5 rounded-lg inline-block`}
      >
        Este tour durará menos de 2 minutos
      </p>
    </div>
  );
}

/** Paso 2: Tour de secciones */
interface Step2Props {
  darkMode: boolean;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;
  innerBg: string;
}

function Step2({
  darkMode,
  textPrimary,
  textSecondary,
  accent,
  border,
  innerBg,
}: Step2Props) {
  const features = [
    { label: "Overview", desc: "KPIs y métricas clave" },
    { label: "Stock", desc: "Control de inventario por ubicación" },
    { label: "Productos", desc: "Catálogo y búsquedas rápidas" },
    { label: "Alertas", desc: "Notificaciones de stock bajo" },
  ];
  const hoverBorder = darkMode
    ? "hover:border-[#38bdf8]/30"
    : "hover:border-[#0284c7]/40";

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary} mb-1 text-center`}>
        Explora las secciones
      </h2>
      <p className={`${textSecondary} text-center mb-6`}>
        Navega entre las diferentes áreas del dashboard
      </p>
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => (
          <div
            key={feature.label}
            className={`p-4 rounded-xl ${innerBg} border ${border} ${hoverBorder} transition-all`}
          >
            <div className={`${accent} font-semibold text-sm mb-1`}>
              {feature.label}
            </div>
            <div className={`${textSecondary} text-xs`}>{feature.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Paso 3: Configuración */
interface Step3Props {
  darkMode: boolean;
  textPrimary: string;
  textSecondary: string;
  accentBg: string;
  border: string;
  innerBg: string;
}

function Step3({
  darkMode,
  textPrimary,
  textSecondary,
  accentBg,
  border,
  innerBg,
}: Step3Props) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const toggleOff = darkMode ? "bg-[#2a2b3d]" : "bg-[#d1d5db]";
  const sliderBg = "bg-white";

  return (
    <div>
      <h2 className={`text-2xl font-bold ${textPrimary} mb-1 text-center`}>
        Configuración rápida
      </h2>
      <p className={`${textSecondary} text-center mb-6`}>
        Personaliza tu experiencia
      </p>
      <div className="space-y-3">
        <ToggleRow
          darkMode={darkMode}
          innerBg={innerBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          label="Alertas por email"
          description="Recibe notificaciones de stock bajo"
          checked={emailAlerts}
          onChange={() => setEmailAlerts(!emailAlerts)}
          accentBg={accentBg}
          toggleOff={toggleOff}
          sliderBg={sliderBg}
        />
        <ToggleRow
          darkMode={darkMode}
          innerBg={innerBg}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          label="Notificaciones push"
          description="Alertas en tiempo real"
          checked={pushNotifications}
          onChange={() => setPushNotifications(!pushNotifications)}
          accentBg={accentBg}
          toggleOff={toggleOff}
          sliderBg={sliderBg}
        />
      </div>
    </div>
  );
}

/** Fila de toggle para preferencias */
interface ToggleRowProps {
  darkMode: boolean;
  innerBg: string;
  textPrimary: string;
  textSecondary: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  accentBg: string;
  toggleOff: string;
  sliderBg: string;
}

function ToggleRow({
  innerBg,
  textPrimary,
  textSecondary,
  label,
  description,
  checked,
  onChange,
  accentBg,
  toggleOff,
  sliderBg,
}: ToggleRowProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl ${innerBg}`}
    >
      <div>
        <div className={`${textPrimary} font-medium text-sm`}>{label}</div>
        <div className={`${textSecondary} text-xs`}>{description}</div>
      </div>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-all relative ${checked ? accentBg : toggleOff}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full ${sliderBg} transition-all ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </div>
  );
}
