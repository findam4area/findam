"use client";

/**
 * ListingForm Client Component with Multi-Image Upload
 * 
 * A comprehensive form for creating listings with the following features:
 * - Form fields: title, description, price (optional), category, location (state & city)
 * - Multi-image upload integration (3-5 images required)
 * - Real-time field validation with Zod schema
 * - Inline error messages on blur
 * - Loading state during submission
 * - Success/error message handling
 * - Mobile-first responsive design with proper touch targets
 * 
 * Requirements: 13.1, 13.3, 13.4, 13.9, 13.16
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ImageUploader } from "@/components/shared/image-uploader";
import { createListingAction } from "@/lib/actions/listing-actions";
import { createListingSchema } from "@/lib/validation/schemas";
import { getValidStateNames } from "@/lib/utils/location-helpers";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toastSuccess, toastError } from "@/lib/utils/toast";

interface Category {
  id: string;
  name: string;
}

interface ListingFormProps {
  categories: Category[];
}

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  category_id?: string;
  location_state?: string;
  location_city?: string;
  images?: string;
  _form?: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  category_id: string;
  location_state: string;
  location_city: string;
}

export function ListingForm({ categories }: ListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string>("");
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    category_id: "",
    location_state: "",
    location_city: "",
  });

  // Image state
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Get Nigerian states
  const nigerianStates = getValidStateNames();

  /**
   * Validate a single field with Zod schema
   * Requirements: 13.4
   */
  const validateField = (
    fieldName: keyof FormData,
    value: string
  ): string | undefined => {
    try {
      // Create a partial validation object
      const validationData: any = {
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id,
        location_state: formData.location_state,
        location_city: formData.location_city,
        images: imageUrls,
        primary_image_index: 0,
      };

      // Update with current field value
      if (fieldName === "price") {
        validationData.price = value ? parseFloat(value) : null;
      } else {
        validationData[fieldName] = value;
      }

      // Validate with schema
      createListingSchema.parse(validationData);
      return undefined;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find((e) => e.path[0] === fieldName);
        return fieldError?.message;
      }
      return undefined;
    }
  };

  /**
   * Handle field change with validation
   * Requirement: 13.4 - Real-time field validation
   */
  const handleFieldChange = (
    fieldName: keyof FormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  /**
   * Handle field blur with validation
   * Requirement: 13.4 - Show inline error messages for each field on blur
   */
  const handleFieldBlur = (fieldName: keyof FormData) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));

    const value = formData[fieldName];
    const error = validateField(fieldName, value);

    if (error) {
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  /**
   * Handle image upload
   * Requirement: 13.3, 13.9 - Collect uploaded image URLs from ImageUploader
   */
  const handleImagesUploaded = (urls: string[]) => {
    setImageUrls(urls);

    // Clear image error if images are now valid
    if (urls.length > 0 && errors.images) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.images;
        return newErrors;
      });
    }
  };

  /**
   * Validate all fields before submission
   * Requirement: 13.4
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate images
    if (imageUrls.length === 0) {
      newErrors.images = "At least 1 image is required";
    } else if (imageUrls.length > 5) {
      newErrors.images = "Maximum 5 images allowed";
    }

    // Validate all form fields
    try {
      createListingSchema.parse({
        title: formData.title,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        category_id: formData.category_id,
        location_state: formData.location_state,
        location_city: formData.location_city,
        images: imageUrls,
        primary_image_index: 0,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof FormErrors;
          newErrors[field] = err.message;
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   * Requirements: 13.9 - Submit form via createListingAction Server Action
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setSuccessMessage("");
    setErrors({});

    // Validate form
    if (!validateForm()) {
      setErrors((prev) => ({
        ...prev,
        _form: "Please fix the errors above before submitting",
      }));
      return;
    }

    // Show loading state
    setIsSubmitting(true);

    try {
      // Create FormData for Server Action
      const submitData = new FormData();
      submitData.set("title", formData.title);
      submitData.set("description", formData.description);
      submitData.set("price", formData.price || "");
      submitData.set("category_id", formData.category_id);
      submitData.set("location_state", formData.location_state);
      submitData.set("location_city", formData.location_city);
      submitData.set("images", JSON.stringify(imageUrls));
      submitData.set("primary_image_index", "0");

      // Submit via Server Action
      const result = await createListingAction(submitData);

      if (result.success && result.data) {
        // Show success message and toast
        const message = "Listing created successfully! Your listing is pending approval.";
        setSuccessMessage(message);
        toastSuccess("Listing created", "Your listing is pending admin approval");

        // Redirect after short delay
        setTimeout(() => {
          router.push("/listings/my-listings");
        }, 2000);
      } else {
        // Show error message and toast
        const errorMsg = result.error || "Failed to create listing. Please try again.";
        setErrors({
          _form: errorMsg,
        });
        toastError("Failed to create listing", errorMsg);
      }
    } catch (error) {
      const errorMsg = error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.";
      setErrors({
        _form: errorMsg,
      });
      toastError("Failed to create listing", errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Success Message */}
      {successMessage && (
        <Card className="p-4 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              {successMessage}
            </p>
          </div>
        </Card>
      )}

      {/* Form Error Message */}
      {errors._form && (
        <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              {errors._form}
            </p>
          </div>
        </Card>
      )}

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label htmlFor="images" className="text-base font-semibold">
          Images <span className="text-red-500">*</span>
        </Label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload 1-5 images to showcase your listing. The first image will be
          used as the primary image.
        </p>
        <ImageUploader
          onImagesUploaded={handleImagesUploaded}
          maxImages={5}
          maxSizeMB={5}
          existingImages={imageUrls}
          bucket="listings"
        />
        {errors.images && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.images}
          </p>
        )}
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Professional Photography Services"
          value={formData.title}
          onChange={(e) => handleFieldChange("title", e.target.value)}
          onBlur={() => handleFieldBlur("title")}
          disabled={isSubmitting}
          className={cn(
            "min-h-[44px]",
            errors.title && touchedFields.has("title") && "border-red-500"
          )}
          aria-invalid={errors.title && touchedFields.has("title")}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
        {errors.title && touchedFields.has("title") && (
          <p id="title-error" className="text-sm text-red-600 dark:text-red-400">
            {errors.title}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Description Field */}
      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Provide a detailed description of your listing..."
          value={formData.description}
          onChange={(e) => handleFieldChange("description", e.target.value)}
          onBlur={() => handleFieldBlur("description")}
          disabled={isSubmitting}
          rows={6}
          className={cn(
            errors.description &&
              touchedFields.has("description") &&
              "border-red-500"
          )}
          aria-invalid={
            errors.description && touchedFields.has("description")
          }
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && touchedFields.has("description") && (
          <p
            id="description-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.description}
          </p>
        )}
        <p className="text-xs text-gray-500">
          {formData.description.length}/2000 characters
        </p>
      </div>

      {/* Price Field (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="price">Price (Optional)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ₦
          </span>
          <Input
            id="price"
            type="number"
            placeholder="0.00"
            value={formData.price}
            onChange={(e) => handleFieldChange("price", e.target.value)}
            onBlur={() => handleFieldBlur("price")}
            disabled={isSubmitting}
            className={cn(
              "pl-8 min-h-[44px]",
              errors.price && touchedFields.has("price") && "border-red-500"
            )}
            min="0"
            step="0.01"
            aria-invalid={errors.price && touchedFields.has("price")}
            aria-describedby={errors.price ? "price-error" : undefined}
          />
        </div>
        {errors.price && touchedFields.has("price") && (
          <p
            id="price-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.price}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Leave blank if the item/service is free or price is negotiable
        </p>
      </div>

      {/* Category Field */}
      <div className="space-y-2">
        <Label htmlFor="category_id">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => handleFieldChange("category_id", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="category_id"
            className={cn(
              "min-h-[44px]",
              errors.category_id &&
                touchedFields.has("category_id") &&
                "border-red-500"
            )}
            onBlur={() => handleFieldBlur("category_id")}
            aria-invalid={
              errors.category_id && touchedFields.has("category_id")
            }
            aria-describedby={
              errors.category_id ? "category_id-error" : undefined
            }
          >
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && touchedFields.has("category_id") && (
          <p
            id="category_id-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.category_id}
          </p>
        )}
      </div>

      {/* Location State Field */}
      <div className="space-y-2">
        <Label htmlFor="location_state">
          State <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.location_state}
          onValueChange={(value) => handleFieldChange("location_state", value)}
          disabled={isSubmitting}
        >
          <SelectTrigger
            id="location_state"
            className={cn(
              "min-h-[44px]",
              errors.location_state &&
                touchedFields.has("location_state") &&
                "border-red-500"
            )}
            onBlur={() => handleFieldBlur("location_state")}
            aria-invalid={
              errors.location_state && touchedFields.has("location_state")
            }
            aria-describedby={
              errors.location_state ? "location_state-error" : undefined
            }
          >
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {nigerianStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.location_state && touchedFields.has("location_state") && (
          <p
            id="location_state-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.location_state}
          </p>
        )}
      </div>

      {/* Location City Field */}
      <div className="space-y-2">
        <Label htmlFor="location_city">
          City <span className="text-red-500">*</span>
        </Label>
        <Input
          id="location_city"
          type="text"
          placeholder="e.g., Lagos, Abuja, Port Harcourt"
          value={formData.location_city}
          onChange={(e) => handleFieldChange("location_city", e.target.value)}
          onBlur={() => handleFieldBlur("location_city")}
          disabled={isSubmitting}
          className={cn(
            "min-h-[44px]",
            errors.location_city &&
              touchedFields.has("location_city") &&
              "border-red-500"
          )}
          aria-invalid={
            errors.location_city && touchedFields.has("location_city")
          }
          aria-describedby={
            errors.location_city ? "location_city-error" : undefined
          }
        />
        {errors.location_city && touchedFields.has("location_city") && (
          <p
            id="location_city-error"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errors.location_city}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-[44px] px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Listing...
            </>
          ) : (
            "Create Listing"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-[44px] px-8"
        >
          Cancel
        </Button>
      </div>

      {/* Note about approval */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Your listing will be submitted for review and
          must be approved by an administrator before it becomes visible to
          other users.
        </p>
      </div>
    </form>
  );
}
