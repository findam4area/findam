"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { listingSchema } from "@/lib/validations/listing";
import { createListing } from "@/lib/api/listings";
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
import { Progress } from "@/components/ui/progress";
import { StateSelector, AreaSelector } from "@/components/location";
import { motion, AnimatePresence } from "framer-motion";
import { MediaUpload, type MediaFile } from "@/components/listing/media-upload";
import { ImageGallery, type GalleryMedia } from "@/components/listing/image-gallery";
import type { Category, Subcategory } from "@/lib/types";
import type { z } from "zod";
import { toast } from "sonner";

type ListingFormData = z.infer<typeof listingSchema>;

interface ListingCreationWizardProps {
  categories: Category[];
  subcategories: Subcategory[];
  userId: string;
  nigerianStates: string[];
}

const STEPS = [
  { id: 1, name: "Category", description: "Choose a category" },
  { id: 2, name: "Details", description: "Add listing details" },
  { id: 3, name: "Media", description: "Upload photos/videos" },
  { id: 4, name: "Location", description: "Set your location" },
  { id: 5, name: "Review", description: "Review and publish" },
];

export function ListingCreationWizard({
  categories,
  subcategories,
  userId,
  nigerianStates,
}: ListingCreationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
  });

  const selectedCategoryId = watch("category_id");
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.category_id === selectedCategoryId,
  );

  // Convert MediaFile[] to GalleryMedia[] for preview
  const galleryMedia: GalleryMedia[] = mediaFiles
    .filter((m) => m.uploaded && m.url)
    .map((m) => ({
      id: m.id,
      url: m.url!,
      type: m.type,
      duration: m.duration,
      thumbnail: m.type === "video" ? m.preview : undefined,
    }));

  const handleMediaChange = (media: MediaFile[]) => {
    setMediaFiles(media);
    setError(null);
  };

  const onSubmit = async (data: ListingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Extract actual File objects from MediaFile
      const mediaFilesForUpload = mediaFiles.map((m) => m.file);

      // Create listing with media
      const listing = await createListing(
        {
          ...data,
          media: mediaFilesForUpload,
        },
        userId,
      );

      // Show success toast
      toast.success("Listing created successfully!", {
        description: "Your listing has been submitted for review",
      });

      // Redirect to listing page
      router.push(`/listing/${listing.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create listing";
      setError(errorMessage);
      setIsSubmitting(false);
      
      // Show error toast
      toast.error("Failed to create listing", {
        description: errorMessage,
      });
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return watch("category_id") && watch("subcategory_id");
      case 2:
        return watch("title") && watch("description") && watch("condition");
      case 3:
        return mediaFiles.length > 0;
      case 4:
        return watch("state");
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id === currentStep
                  ? "text-naija-green"
                  : step.id < currentStep
                    ? "text-neon-cyan"
                    : "text-gray-500"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                  step.id === currentStep
                    ? "border-naija-green bg-naija-green/20"
                    : step.id < currentStep
                      ? "border-neon-cyan bg-neon-cyan/20"
                      : "border-gray-500"
                }`}
              >
                {step.id}
              </div>
              <span className="text-xs font-medium hidden sm:block">
                {step.name}
              </span>
            </div>
          ))}
        </div>
        <Progress value={(currentStep / STEPS.length) * 100} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-8 rounded-xl"
        >
          <h2 className="text-2xl font-bold mb-2">
            {STEPS[currentStep - 1].name}
          </h2>
          <p className="text-gray-400 mb-6">
            {STEPS[currentStep - 1].description}
          </p>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step 1: Category */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category_id">Main Category *</Label>
                  <Select
                    value={watch("category_id")}
                    onValueChange={(value) => {
                      setValue("category_id", value);
                      setValue("subcategory_id", "");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category_id.message}
                    </p>
                  )}
                </div>

                {selectedCategoryId && (
                  <div>
                    <Label htmlFor="subcategory_id">Subcategory *</Label>
                    <Select
                      value={watch("subcategory_id")}
                      onValueChange={(value) =>
                        setValue("subcategory_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSubcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subcategory_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.subcategory_id.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="e.g., iPhone 13 Pro Max 256GB"
                    maxLength={100}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe your item in detail..."
                    rows={6}
                    maxLength={2000}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={watch("condition") || ""}
                    onValueChange={(value) =>
                      setValue(
                        "condition",
                        value as "new" | "used" | "refurbished",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="refurbished">Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.condition && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.condition.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Media */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Upload Photos/Videos (Max 10)</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Upload up to 10 images or videos. Drag to reorder. First item will be the cover.
                  </p>
                  <MediaUpload
                    maxFiles={10}
                    maxVideoSize={100}
                    maxImageSize={5}
                    maxVideoDuration={60}
                    onMediaChange={handleMediaChange}
                    initialMedia={mediaFiles}
                  />
                </div>

                {/* Gallery Preview */}
                {galleryMedia.length > 0 && (
                  <div className="mt-6">
                    <Label className="mb-2 block">Preview</Label>
                    <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                      <ImageGallery media={galleryMedia} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Location */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <StateSelector
                  value={watch("state")}
                  onValueChange={(value) => {
                    setValue("state", value);
                    // Reset area when state changes
                    setValue("area", undefined);
                  }}
                  label="State"
                  placeholder="Select a state"
                  required
                  error={errors.state?.message}
                />

                <AreaSelector
                  state={watch("state")}
                  value={watch("area")}
                  onValueChange={(value) => setValue("area", value)}
                  label="Area"
                  placeholder="Select an area (optional)"
                  error={errors.area?.message}
                />
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="bg-dark-bg p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Listing Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Title:</dt>
                      <dd className="font-medium">{watch("title")}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Price:</dt>
                      <dd className="font-medium">
                        {watch("price")
                          ? `₦${watch("price")}`
                          : "Not specified"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Condition:</dt>
                      <dd className="font-medium capitalize">
                        {watch("condition") || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Location:</dt>
                      <dd className="font-medium">
                        {watch("area") ? `${watch("area")}, ` : ""}
                        {watch("state")}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Media:</dt>
                      <dd className="font-medium">
                        {mediaFiles.length} file(s)
                      </dd>
                    </div>
                  </dl>
                </div>

                <p className="text-sm text-gray-400">
                  By publishing this listing, you agree to our terms of service
                  and confirm that all information provided is accurate.
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || isSubmitting}
              >
                Previous
              </Button>

              {currentStep < STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Publishing..." : "Publish Listing"}
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
