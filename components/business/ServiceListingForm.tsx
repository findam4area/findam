"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Briefcase, ImageIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pricing_model: z.enum(["fixed", "hourly", "custom"]),
  price: z.coerce.number().positive("Price must be positive").max(999999999.99, "Price too large").optional(),
  currency: z.string().default("NGN"),
  duration_text: z.string().optional(),
}).refine((data) => {
  // If pricing model is not custom, price is required
  if (data.pricing_model !== "custom" && !data.price) {
    return false;
  }
  return true;
}, {
  message: "Price is required for fixed and hourly pricing models",
  path: ["price"],
});

type ServiceFormData = z.infer<typeof serviceSchema>;

interface ServiceListingFormProps {
  onSubmit: (data: ServiceFormData, images: File[]) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ServiceFormData>;
  isEditing?: boolean;
}

const MAX_IMAGES = 5;
const MIN_IMAGES = 1;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ServiceListingForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: ServiceListingFormProps) {
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData || {
      pricing_model: "fixed",
      currency: "NGN",
    },
  });

  const pricingModel = watch("pricing_model");

  const validateImage = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return `${file.name}: Not an image file`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size exceeds 5MB`;
    }

    return null;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const errors: string[] = [];

    // Check total count
    if (images.length + files.length > MAX_IMAGES) {
      setImageErrors([`Maximum ${MAX_IMAGES} images allowed. You can add ${MAX_IMAGES - images.length} more.`]);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      const error = validateImage(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length > 0) {
      // Create previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImages([...images, ...validFiles]);
      setImagePreviews([...imagePreviews, ...newPreviews]);
    }

    setImageErrors(errors);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setImageErrors([]);
  };

  const handleFormSubmit = async (data: ServiceFormData) => {
    // Validate images
    if (images.length < MIN_IMAGES) {
      setImageErrors([`Please upload at least ${MIN_IMAGES} image`]);
      return;
    }

    if (images.length > MAX_IMAGES) {
      setImageErrors([`Maximum ${MAX_IMAGES} images allowed`]);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data, images);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" />
          Service Details
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter service name"
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe your service in detail"
              rows={5}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="duration_text">Service Duration / Delivery Timeframe</Label>
            <Input
              id="duration_text"
              {...register("duration_text")}
              placeholder="e.g., 2-3 hours, 1 week, Same day"
            />
            <p className="text-xs text-gray-500 mt-1">
              How long does this service take to complete?
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pricing</h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="pricing_model">Pricing Model *</Label>
            <Select
              value={pricingModel}
              onValueChange={(value) => setValue("pricing_model", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pricing model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed Price</SelectItem>
                <SelectItem value="hourly">Hourly Rate</SelectItem>
                <SelectItem value="custom">Custom Quote</SelectItem>
              </SelectContent>
            </Select>
            {errors.pricing_model && (
              <p className="text-sm text-red-500 mt-1">{errors.pricing_model.message}</p>
            )}
          </div>

          {pricingModel !== "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">
                  {pricingModel === "hourly" ? "Hourly Rate (₦) *" : "Price (₦) *"}
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("price")}
                  placeholder="0.00"
                />
                {errors.price && (
                  <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  {...register("currency")}
                  value="NGN"
                  disabled
                />
              </div>
            </div>
          )}

          {pricingModel === "custom" && (
            <Card className="p-4 bg-blue-50 dark:bg-blue-950">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                With custom pricing, your service will display &quot;Contact for Quote&quot; to potential customers. 
                They can reach out to discuss pricing based on their specific needs.
              </p>
            </Card>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Service Images *</h2>
        
        <div className="space-y-4">
          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= MAX_IMAGES}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Images ({images.length}/{MAX_IMAGES})
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Upload {MIN_IMAGES}-{MAX_IMAGES} images • Max 5MB per image • JPG, PNG, WebP
            </p>
          </div>

          {/* Error Messages */}
          <AnimatePresence>
            {imageErrors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="p-3 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                        {imageErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image Preview Grid */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <AnimatePresence>
                {imagePreviews.map((preview, index) => (
                  <motion.div
                    key={preview}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group"
                  >
                    <Card className="relative aspect-square overflow-hidden">
                      <Image
                        src={preview}
                        alt={`Service ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 20vw"
                      />
                      
                      {index === 0 && (
                        <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
                          Primary
                        </Badge>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {imagePreviews.length === 0 && (
            <Card className="p-8 text-center bg-gray-50 dark:bg-gray-900">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No images uploaded yet. Add images showcasing your service.
              </p>
            </Card>
          )}
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || images.length < MIN_IMAGES}
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </form>
  );
}
