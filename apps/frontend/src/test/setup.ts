/** Vitest setup file — configures localStorage, location, and matchMedia mocks for all tests. */
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal("localStorage", mockLocalStorage);

// Mock window.location
vi.stubGlobal("location", {
  href: "http://localhost:3000",
  pathname: "/",
});

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
