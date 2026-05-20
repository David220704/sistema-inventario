import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));

vi.mock("@/components/ThemeProvider", () => ({
  useTheme: () => ({ darkMode: false, toggleDarkMode: vi.fn() }),
}));

vi.mock("@/components/Toast", () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

const mockGetProfile = vi.fn();
const mockGetPreferences = vi.fn();
const mockUpdatePreferences = vi.fn();

vi.mock("@/lib/api", () => ({
  getProfile: (...args: any[]) => mockGetProfile(...args),
  getPreferences: (...args: any[]) => mockGetPreferences(...args),
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  updatePreferences: (...args: any[]) => mockUpdatePreferences(...args),
  exportData: vi.fn(),
  deleteAccount: vi.fn(),
}));

import SettingsPage from "./page";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProfile.mockResolvedValue({
      name: "David",
      email: "david@test.com",
      role: "ADMIN",
    });
    mockGetPreferences.mockResolvedValue({ theme: "light", notifications: true });
  });

  it("renders page title", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("Settings")).toBeDefined();
  });

  it("renders all section cards", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("User Profile")).toBeDefined();
    expect(screen.getByText("Security")).toBeDefined();
    expect(screen.getByText("Appearance")).toBeDefined();
    expect(screen.getByText("Notifications")).toBeDefined();
    expect(screen.getByText("Data Management")).toBeDefined();
    expect(screen.getByText("Account Actions")).toBeDefined();
  });

  it("shows user profile data", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("David")).toBeDefined();
    expect(screen.getByText("david@test.com")).toBeDefined();
    expect(screen.getByText("ADMIN")).toBeDefined();
  });

  it("shows password change form", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("Security")).toBeDefined();
    expect(screen.getByText("Change Password")).toBeDefined();
  });

  it("shows delete account button", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("Delete account")).toBeDefined();
  });

  it("opens delete confirmation modal", async () => {
    render(<SettingsPage />);
    expect(await screen.findByText("Settings")).toBeDefined();

    const user = userEvent.setup();
    const deleteBtn = screen.getByLabelText("Delete account");
    await user.click(deleteBtn);

    expect(
      screen.getByText(
        "This action is irreversible. All your data will be permanently removed. Do you wish to continue?",
      ),
    ).toBeDefined();
  });
});
