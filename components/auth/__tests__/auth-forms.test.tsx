import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "../login-form";
import { RegisterForm } from "../register-form";
import { PhoneOTPForm } from "../phone-otp-form";

// Mock the auth hook
vi.mock("@/lib/hooks/useAuth", () => ({
  useAuth: () => ({
    signIn: vi.fn().mockResolvedValue({ error: null }),
    signUp: vi.fn().mockResolvedValue({ error: null }),
  }),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock verification API
vi.mock("@/lib/api/verification", () => ({
  requestPhoneOTP: vi.fn().mockResolvedValue({
    success: true,
    otp_id: "test-otp-id",
  }),
  confirmPhoneOTP: vi.fn().mockResolvedValue({
    success: true,
    verified: true,
  }),
}));

describe("Authentication Forms", () => {
  describe("LoginForm", () => {
    it("renders login form with email and password fields", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
    });
  });

  describe("RegisterForm", () => {
    it("renders registration form with all required fields", () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });
  });

  describe("PhoneOTPForm", () => {
    it("renders phone input initially", () => {
      render(<PhoneOTPForm />);

      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send otp/i }),
      ).toBeInTheDocument();
    });
  });
});
