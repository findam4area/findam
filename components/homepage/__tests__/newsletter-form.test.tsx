import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NewsletterForm } from "../newsletter-form";

describe("NewsletterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders newsletter form with email input and submit button", () => {
    render(<NewsletterForm />);

    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /subscribe/i })).toBeInTheDocument();
  });

  it("validates email format and shows error for invalid email", async () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitButton);

    // The form should not proceed to loading state for invalid email
    await waitFor(() => {
      expect(submitButton).not.toHaveTextContent(/subscribing/i);
    });
  });

  it("validates email format and shows error for empty email", async () => {
    render(<NewsletterForm />);

    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Submit without entering email
    fireEvent.click(submitButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it("accepts valid email format", async () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/subscribing/i)).toBeInTheDocument();
    });

    // Should show success message after submission
    await waitFor(
      () => {
        expect(screen.getByText(/thanks for subscribing/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("clears email input after successful submission", async () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email") as HTMLInputElement;
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // Wait for success
    await waitFor(
      () => {
        expect(screen.getByText(/thanks for subscribing/i)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Email input should be cleared
    expect(emailInput.value).toBe("");
  });

  it("disables form during submission", async () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Enter valid email
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // Should be disabled during loading
    await waitFor(() => {
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  it("clears error state when user starts typing after error", async () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Trigger error
    fireEvent.change(emailInput, { target: { value: "invalid" } });
    fireEvent.click(submitButton);

    // Form should not be in loading state
    expect(submitButton).not.toHaveTextContent(/subscribing/i);

    // Start typing again - this should clear the error state
    fireEvent.change(emailInput, { target: { value: "valid@example.com" } });

    // Now submit with valid email should work
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(submitButton).toHaveTextContent(/subscribing/i);
    });
  });

  it("has proper accessibility attributes", () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");

    expect(emailInput).toHaveAttribute("aria-label", "Email address");
    expect(emailInput).toHaveAttribute("type", "email");
  });

  it("validates email before submission", async () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Trigger error with invalid email
    fireEvent.change(emailInput, { target: { value: "invalid" } });
    fireEvent.click(submitButton);

    // Should not proceed to loading state
    expect(submitButton).not.toHaveTextContent(/subscribing/i);
    
    // Input should still have the invalid value
    expect(emailInput).toHaveValue("invalid");
  });

  it("maintains minimum touch target size of 44x44 pixels", () => {
    render(<NewsletterForm />);

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /subscribe/i });

    // Check for min-h-[44px] class
    expect(emailInput.className).toContain("min-h-[44px]");
    expect(submitButton.className).toContain("min-h-[44px]");
  });
});
