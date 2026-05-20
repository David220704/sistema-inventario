"use client";

/** Settings page — user profile view, password change form, dark mode toggle, email notification toggle, data export, and account deletion. */
import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/components/Toast";
import {
  User,
  Shield,
  Palette,
  Bell,
  Database,
  Trash2,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Real API wrappers (no mocks)
import {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  exportData as apiExportData,
  deleteAccount as apiDeleteAccount,
} from "@/lib/api";

/** Reusable settings card wrapper — consistent section container with title and optional icon. */
const Card: React.FC<{
  title: string;
  Icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}> = ({ title, Icon, children }) => {
  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-3 border-b border-gray-200 dark:border-slate-700 pb-3 mb-4">
        {Icon ? <Icon className="h-5 w-5 text-indigo-500" /> : null}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
};

type UserProfile = {
  name: string;
  email: string;
  role: string;
};

/**
 * Full settings dashboard. Fetches user profile and notification preferences on mount.
 * Sections: profile info, password change (with validation), dark/light theme toggle,
 * email notifications toggle (persisted to API), data export (downloads JSON blob),
 * and account deletion with confirmation modal. Toast feedback for actions.
 */
export default function SettingsPage(): JSX.Element {
  const router = useRouter();
  // Use global theme management via useTheme()
  const { darkMode, toggleDarkMode } = useTheme();
  const isDark = darkMode;

  // User profile (pretend fetch; fallback to demo data if API not available)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const p = await getProfile();
        if (mounted) {
          setUser({
            name: p?.name ?? "",
            email: p?.email ?? "",
            role: p?.role ?? "",
          });
        }
      } catch {
        // Ignore errors; keep UI stable
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  // Load email notification preferences on mount
  useEffect(() => {
    let mounted = true;
    const loadPrefs = async () => {
      try {
        const prefs = await getPreferences();
        if (mounted) setEmailNotifications(!!prefs?.notifications);
      } catch {
        // ignore
      }
    };
    loadPrefs();
    return () => {
      mounted = false;
    };
  }, []);

  // Sections: form state for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdErrors, setPwdErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Email notifications toggle
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  // Toast (global via ToastProvider)
  const { addToast } = useToast();

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Data management flags
  const [exporting, setExporting] = useState(false);

  // Actions
  // Real password update using API
  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple local validation
    const errs: typeof pwdErrors = {};
    if (!currentPassword) errs.current = "Current password is required";
    if (!newPassword || newPassword.length < 8)
      errs.new = "New password must be at least 8 characters";
    if (confirmPassword !== newPassword)
      errs.confirm = "Passwords do not match";
    setPwdErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwdSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdErrors({});
      addToast("success", "Contraseña actualizada correctamente");
    } catch {
      addToast("error", "Error al actualizar la contraseña");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await apiExportData();
      let blob: Blob;
      let filename = "export.json";
      if (res instanceof Response) {
        if (!res.ok) throw new Error("Export failed");
        const contentDisp = res.headers.get("Content-Disposition");
        const m = contentDisp?.match(/filename\"?=\"?([^\";]+)\"?/i);
        if (m?.[1]) filename = m[1];
        blob = await res.blob();
      } else if (res instanceof Blob) {
        blob = res;
      } else {
        blob = new Blob([JSON.stringify(res, null, 2)], {
          type: "application/json",
        });
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      addToast("success", "Exportación iniciada");
    } catch {
      addToast("error", "Error al exportar datos");
    } finally {
      setExporting(false);
    }
  };

  // Clear cache button removed: backend does not support it yet

  const onDeleteAccount = async () => {
    try {
      await apiDeleteAccount();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    } catch {
      addToast("error", "Error al eliminar la cuenta");
    }
  };

  const logout = async () => {
    try {
      // await fetch('/api/auth/logout', { method: 'POST' });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  // Layout
  return (
    <main className="min-h-screen p-4 sm:p-6 lg:px-8 lg:py-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Palette className="h-6 w-6 text-sky-500" />
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h1>
        </div>

      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <Card title="User Profile" Icon={User}>
          {loadingUser ? (
            <div className="h-10 bg-gray-200 dark:bg-slate-700 animate-pulse rounded-md" />
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold w-28">Name</span>
                <span className="ml-auto">{user?.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold w-28">Email</span>
                <span className="ml-auto">{user?.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="font-semibold w-28">Role</span>
                <span className="ml-auto">{user?.role}</span>
              </div>
            </div>
          )}
        </Card>

        <Card title="Security" Icon={Shield}>
          <form onSubmit={onChangePassword} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                {pwdErrors.current && (
                  <span className="text-xs text-red-600 mt-1">
                    {pwdErrors.current}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                {pwdErrors.new && (
                  <span className="text-xs text-red-600 mt-1">
                    {pwdErrors.new}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-700 dark:text-gray-200 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
              {pwdErrors.confirm && (
                <span className="text-xs text-red-600 mt-1">
                  {pwdErrors.confirm}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className={`px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none ${pwdLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={pwdLoading}
              >
                {pwdLoading ? "Updating..." : "Change Password"}
              </button>
            </div>
            {pwdSuccess && (
              <div className="text-sm text-green-600">{pwdSuccess}</div>
            )}
          </form>
        </Card>

        <Card title="Appearance" Icon={Palette}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <Palette className="h-4 w-4" />
              <span className="font-semibold">Theme</span>
            </div>
            <div
              role="switch"
              aria-checked={isDark}
              onClick={toggleDarkMode}
              className="relative inline-flex h-9 w-20 cursor-pointer items-center rounded-full bg-gray-300"
              style={{ userSelect: "none" }}
            >
              <span
                className="left-0 absolute w-8 h-8 bg-white rounded-full shadow transform transition-transform"
                style={{
                  transform: isDark ? "translateX(28px)" : "translateX(0)",
                }}
              />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Current: {isDark ? "Dark" : "Light"} mode
          </div>
        </Card>

        <Card title="Notifications" Icon={Bell}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <Bell className="h-4 w-4" />
              <span className="font-semibold">Email Notifications</span>
            </div>
            <div
              role="switch"
              aria-checked={emailNotifications}
              onClick={async () => {
                const next = !emailNotifications;
                setEmailNotifications(next);
                try {
                  await updatePreferences({ notifications: next });
                  addToast("success", "Notificaciones actualizadas");
                } catch {
                  setEmailNotifications(!next);
                  addToast("error", "Error al actualizar preferencias");
                }
              }}
              className="relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full bg-gray-300"
            >
              <span
                className={`inline-block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${emailNotifications ? "translate-x-6" : ""}`}
              />
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Status: {emailNotifications ? "Enabled" : "Disabled"}
          </div>
        </Card>

        <Card title="Data Management" Icon={Database}>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              onClick={handleExportData}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 ${exporting ? "opacity-70" : ""}`}
              aria-label="Export data"
              disabled={exporting}
            >
              <Database className="h-4 w-4" />
              <span>{exporting ? "Exporting..." : "Export data"}</span>
            </button>
            {/* Clear cache button removed due to backend unavailability */}
          </div>
        </Card>

        <Card title="Account Actions" Icon={Trash2}>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-between w-full px-4 py-3 rounded-md bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900"
              aria-label="Delete account"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete account</span>
              </div>
              <span className="text-sm font-semibold">Permanent</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-3 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-100"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </Card>
      </section>

      {/* Delete account modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-label="Delete account confirmation"
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trash2 className="h-5 w-5 text-red-600" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete account
              </h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This action is irreversible. All your data will be permanently
              removed. Do you wish to continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
                onClick={onDeleteAccount}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
