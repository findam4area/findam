/**
 * Vendor Application Form Component
 * 
 * Client component for submitting vendor applications with real-time validation,
 * inline error messages, and loading states. Supports Nigerian phone format validation.
 * 
 * Requirements: 4.1, 4.2
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { submitVendorApplicationAction } from '@/lib/actions/vendor-actions';
import { vendorApplicationSchema } from '@/lib/validation/schemas';
import type { VendorApplicationInput } from '@/lib/validation/schemas';
import { z } from 'zod';
import { toastSuccess, toastError } from '@/lib/utils/toast';

interface VendorApplicationFormProps {
  className?: string;
}

interface FieldError {
  business_name?: string;
  business_description?: string;
  contact_email?: string;
  contact_phone?: string;
}

export function VendorApplicationForm({ className }: VendorApplicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    contact_email: '',
    contact_phone: '',
  });

  // Real-time validation for touched fields
  useEffect(() => {
    if (touchedFields.size === 0) return;

    const errors: FieldError = {};
    
    touchedFields.forEach((field) => {
      try {
        // Validate individual field
        const fieldSchema = vendorApplicationSchema.shape[field as keyof typeof vendorApplicationSchema.shape];
        fieldSchema.parse(formData[field as keyof typeof formData]);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors[field as keyof FieldError] = error.errors[0].message;
        }
      }
    });

    setFieldErrors(errors);
  }, [formData, touchedFields]);

  const handleBlur = (fieldName: string) => {
    setTouchedFields((prev) => new Set([...prev, fieldName]));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous messages
    setServerError(null);
    setSuccessMessage(null);

    // Mark all fields as touched for validation display
    setTouchedFields(new Set(['business_name', 'business_description', 'contact_email', 'contact_phone']));

    // Validate all fields
    const validation = vendorApplicationSchema.safeParse(formData);
    
    if (!validation.success) {
      const errors: FieldError = {};
      validation.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FieldError;
        if (!errors[field]) {
          errors[field] = err.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // Submit form
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('business_name', formData.business_name);
      formDataObj.append('business_description', formData.business_description);
      formDataObj.append('contact_email', formData.contact_email);
      formDataObj.append('contact_phone', formData.contact_phone);

      const result = await submitVendorApplicationAction(formDataObj);

      if (result.success) {
        const message = 'Your vendor application has been submitted successfully! We will review it and get back to you soon.';
        setSuccessMessage(message);
        toastSuccess('Application submitted', 'We will review it and get back to you soon');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      } else {
        const errorMsg = result.error || 'Failed to submit application. Please try again.';
        setServerError(errorMsg);
        toastError('Submission failed', errorMsg);
      }
    } catch (error) {
      console.error('Unexpected error during vendor application:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setServerError(errorMsg);
      toastError('Submission failed', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className || ''}`}
      noValidate
    >
      {/* Server Error Message */}
      {serverError && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg"
          role="alert"
        >
          <p className="font-medium">Error</p>
          <p className="text-sm">{serverError}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg"
          role="alert"
        >
          <p className="font-medium">Success!</p>
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {/* Business Name */}
      <div>
        <label
          htmlFor="business_name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="business_name"
          name="business_name"
          value={formData.business_name}
          onChange={handleChange}
          onBlur={() => handleBlur('business_name')}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 rounded-lg border ${
            fieldErrors.business_name && touchedFields.has('business_name')
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="Enter your business name"
          aria-invalid={!!fieldErrors.business_name && touchedFields.has('business_name')}
          aria-describedby={fieldErrors.business_name ? 'business_name-error' : undefined}
        />
        {fieldErrors.business_name && touchedFields.has('business_name') && (
          <p
            id="business_name-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.business_name}
          </p>
        )}
      </div>

      {/* Business Description */}
      <div>
        <label
          htmlFor="business_description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Business Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="business_description"
          name="business_description"
          value={formData.business_description}
          onChange={handleChange}
          onBlur={() => handleBlur('business_description')}
          disabled={isSubmitting}
          rows={5}
          className={`w-full px-4 py-3 rounded-lg border ${
            fieldErrors.business_description && touchedFields.has('business_description')
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none`}
          placeholder="Describe your business, services, and what makes you unique (20-500 characters)"
          aria-invalid={!!fieldErrors.business_description && touchedFields.has('business_description')}
          aria-describedby={fieldErrors.business_description ? 'business_description-error' : undefined}
        />
        <div className="mt-1 flex justify-between items-start">
          {fieldErrors.business_description && touchedFields.has('business_description') ? (
            <p
              id="business_description-error"
              className="text-sm text-red-600"
              role="alert"
            >
              {fieldErrors.business_description}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              {formData.business_description.length}/500 characters
            </p>
          )}
        </div>
      </div>

      {/* Contact Email */}
      <div>
        <label
          htmlFor="contact_email"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Contact Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="contact_email"
          name="contact_email"
          value={formData.contact_email}
          onChange={handleChange}
          onBlur={() => handleBlur('contact_email')}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 rounded-lg border ${
            fieldErrors.contact_email && touchedFields.has('contact_email')
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="your.email@example.com"
          aria-invalid={!!fieldErrors.contact_email && touchedFields.has('contact_email')}
          aria-describedby={fieldErrors.contact_email ? 'contact_email-error' : undefined}
        />
        {fieldErrors.contact_email && touchedFields.has('contact_email') && (
          <p
            id="contact_email-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.contact_email}
          </p>
        )}
      </div>

      {/* Contact Phone */}
      <div>
        <label
          htmlFor="contact_phone"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Contact Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="contact_phone"
          name="contact_phone"
          value={formData.contact_phone}
          onChange={handleChange}
          onBlur={() => handleBlur('contact_phone')}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 rounded-lg border ${
            fieldErrors.contact_phone && touchedFields.has('contact_phone')
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          } focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="+234XXXXXXXXXX or 0XXXXXXXXXX"
          aria-invalid={!!fieldErrors.contact_phone && touchedFields.has('contact_phone')}
          aria-describedby={fieldErrors.contact_phone ? 'contact_phone-error contact_phone-help' : 'contact_phone-help'}
        />
        {fieldErrors.contact_phone && touchedFields.has('contact_phone') ? (
          <p
            id="contact_phone-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {fieldErrors.contact_phone}
          </p>
        ) : (
          <p
            id="contact_phone-help"
            className="mt-1 text-sm text-gray-500"
          >
            Nigerian phone format: +234XXXXXXXXXX or 0XXXXXXXXXX
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Application'
          )}
        </button>
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-600 text-center">
        Your application will be reviewed by our team. You'll receive an email notification once it's been processed.
      </p>
    </form>
  );
}
