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
import { Upload, X, Package, ImageIcon, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  product_type: z.enum(["physical", "digital"]),
  price: z.coerce.number().positive("Price must be positive").max(999999999.99, "Price too large"),
  currency: z.string().default("NGN"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative").optional(),
  low_stock_threshold: z.coerce.number().int().min(0).optional().default(5),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductListingFormProps {
  onSubmit: (data: ProductFormData, images: File[]) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<ProductFormData>;
  isEditing?: boolean;
}

const MAX_IMAGES = 10;
const MIN_IMAGES = 1;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProductListingForm({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}: ProductListingFormProps) {
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
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: initialData || {
      product_type: "physical",
      currency: "NGN",
      stock_quantity: 0,
      low_stock_threshold: 5,
    },
  });

  const productType = watch("product_type");

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

  const handleFormSubmit = async (data: ProductFormData) => {
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
          <Package className="w-5 h-5 mr-2" />
          Product Details
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Product Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter product name"
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
              placeholder="Describe your product in detail"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="product_type">Product Type *</Label>
            <Select
              value={productType}
              onValueChange={(value) => setValue("product_type", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Physical Product</SelectItem>
                <SelectItem value="digital">Digital Product</SelectItem>
              </SelectContent>
            </Select>
            {errors.product_type && (
              <p className="text-sm text-red-500 mt-1">{errors.product_type.message}</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Pricing & Inventory</h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₦) *</Label>
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

          {productType === "physical" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  {...register("stock_quantity")}
                  placeholder="0"
                />
                {errors.stock_quantity && (
                  <p className="text-sm text-red-500 mt-1">{errors.stock_quantity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  {...register("low_stock_threshold")}
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You&apos;ll be notified when stock reaches this level
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Product Images *</h2>
        
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
                        alt={`Product ${index + 1}`}
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
                No images uploaded yet. Click to add product images.
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
          {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
