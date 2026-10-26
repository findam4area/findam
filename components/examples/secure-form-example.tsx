/**
 * Secure Form Example Component
 * Demonstrates proper input sanitization and CSRF protection
 * Requirements: 31.3, 31.4
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSecureFormHandler } from "@/lib/utils/form-security";
import { useCsrfToken } from "@/lib/hooks/use-csrf-token";

interface FormData {
  title: string;
  description: string;
  email: string;
  price: number;
}

/**
 * Example component showing secure form handling
 * This demonstrates:
 * 1. CSRF token usage
 * 2. Input sanitization
 * 3. Secure form submission
 */
export function SecureFormExample() {
  const csrfToken = useCsrfToken();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    email: "",
    price: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Create secure form handler with automatic sanitization and CSRF protection
  const handleSecureSubmit = createSecureFormHandler<FormData>(
    "/api/example",
    {
      method: "POST",
      // Specify which fields contain user-generated content (will be sanitized more aggressively)
      contentFields: ["description"],
      // Specify fields to skip sanitization (e.g., passwords, tokens)
      skipFields: [],
      onSuccess: async (response) => {
        setSuccess(true);
        setError(null);
        // Reset form
        setFormData({
          title: "",
          description: "",
          email: "",
          price: 0,
        });
      },
      onError: (error) => {
        setError(error.message);
        setSuccess(false);
      },
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await handleSecureSubmit(formData);
    } catch (err) {
      // Error already handled by onError callback
      console.error("Form submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Secure Form Example</h2>
        <p className="text-gray-600">
          This form demonstrates proper input sanitization and CSRF protection.
        </p>
        {csrfToken && (
          <p className="text-sm text-green-600 mt-2">
            ✓ CSRF token loaded: {csrfToken.substring(0, 8)}...
          </p>
        )}
        {!csrfToken && (
          <p className="text-sm text-yellow-600 mt-2">
            ⚠ CSRF token not yet loaded
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Form submitted successfully!
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            placeholder="Enter title"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Will be sanitized to remove dangerous characters
          </p>
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            placeholder="Enter description"
            rows={4}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            User-generated content - will be sanitized to prevent XSS attacks
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            placeholder="your@email.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="mt-1"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || !csrfToken}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Securely"}
          </Button>
          {!csrfToken && (
            <p className="text-xs text-yellow-600 mt-2 text-center">
              Waiting for CSRF token...
            </p>
          )}
        </div>
      </form>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Security Features:</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>✓ CSRF token automatically included in request</li>
          <li>✓ Input sanitization to prevent XSS attacks</li>
          <li>✓ SQL injection prevention through parameterized queries</li>
          <li>✓ Content Security Policy (CSP) headers</li>
          <li>✓ Secure cookie settings (HttpOnly, SameSite)</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Try These Attacks (They won't Work):</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>
            • Script injection:{" "}
            <code className="bg-white px-1">&lt;script&gt;alert('XSS')&lt;/script&gt;</code>
          </li>
          <li>
            • Event handler:{" "}
            <code className="bg-white px-1">&lt;img onerror="alert(1)" src="x"&gt;</code>
          </li>
          <li>
            • JavaScript protocol:{" "}
            <code className="bg-white px-1">javascript:alert(1)</code>
          </li>
          <li>
            • SQL injection:{" "}
            <code className="bg-white px-1">'; DROP TABLE users; --</code>
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">
          All malicious input will be sanitized before storage and display.
        </p>
      </div>
    </div>
  );
}
