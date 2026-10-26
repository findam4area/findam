"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
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
import { createBusiness } from "@/lib/services/business";
import { MapPin, Building2, Phone, Mail, Globe } from "lucide-react";

// Requirements: 21.1, 21.2, 21.6
// Business creation form with verification support

const businessSchema = z.object({
  name: z.string().min(3, "Business name must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category_id: z.string().min(1, "Please select a category"),
  state: z.string().min(1, "Please select a state"),
  lga: z.string().min(1, "Please select an LGA"),
  ward: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  website: z.string().url("Valid URL required").optional().or(z.literal("")),
  whatsapp: z.string().optional(),
});

type BusinessFormData = z.infer<typeof businessSchema>;

interface BusinessCreationFormProps {
  categories: Array<{ id: string; name: string }>;
  nigerianStates: string[];
}

const STEPS = [
  { id: 1, name: "Basic Info", description: "Business details" },
  { id: 2, name: "Location", description: "Set your location" },
  { id: 3, name: "Contact", description: "Contact information" },
  { id: 4, name: "Review", description: "Review and create" },
];

export function BusinessCreationForm({
  categories,
  nigerianStates,
}: BusinessCreationFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessFormData>({
    resolver: zodResolver(businessSchema),
  });

  const selectedState = watch("state");

  const onSubmit = async (data: BusinessFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const business = await createBusiness({
        name: data.name,
        description: data.description,
        category_id: data.category_id,
        state: data.state,
        lga: data.lga,
        ward: data.ward,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website || undefined,
        whatsapp: data.whatsapp,
      });

      // Redirect to business profile page
      router.push(`/business-profiles/${business.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create business");
      setIsSubmitting(false);
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
        return watch("name") && watch("description") && watch("category_id");
      case 2:
        return watch("state") && watch("lga");
      case 3:
        return watch("phone") && watch("email");
      default:
        return true;
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

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
                    ? "text-naija-green/70"
                    : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step.id === currentStep
                    ? "bg-naija-green text-white"
                    : step.id < currentStep
                      ? "bg-naija-green/70 text-white"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {step.id}
              </div>
              <p className="text-sm font-medium">{step.name}</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Enter your business name"
                      className="pl-10"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category_id">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("category_id", value)}
                    defaultValue={watch("category_id")}
                  >
                    <SelectTrigger className="mt-1">
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
                  {errors.category_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.category_id.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe your business, products, and services..."
                    rows={5}
                    className="mt-1"
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="state">
                    State <span className="text-red-500">*</span>
                  </Label>
                  <StateSelector
                    value={watch("state")}
                    onChange={(value) => setValue("state", value)}
                    states={nigerianStates}
                  />
                  {errors.state && (
                    <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lga">
                    Local Government Area <span className="text-red-500">*</span>
                  </Label>
                  <AreaSelector
                    state={selectedState}
                    value={watch("lga")}
                    onChange={(value) => setValue("lga", value)}
                  />
                  {errors.lga && (
                    <p className="text-sm text-red-500 mt-1">{errors.lga.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="ward">Ward (Optional)</Label>
                  <Input
                    id="ward"
                    {...register("ward")}
                    placeholder="Enter ward name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Street Address (Optional)</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="123 Business Street"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Contact */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone")}
                      placeholder="08012345678 (will be formatted as +234)"
                      className="pl-10"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Phone numbers will be formatted to +234 format
                  </p>
                </div>

                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="business@example.com"
                      className="pl-10"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      {...register("whatsapp")}
                      placeholder="08012345678"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website (Optional)</Label>
                  <div className="relative mt-1">
                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="website"
                      type="url"
                      {...register("website")}
                      placeholder="https://www.yourbusiness.com"
                      className="pl-10"
                    />
                  </div>
                  {errors.website && (
                    <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Review Your Business</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="text-base font-medium">{watch("name")}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="text-base font-medium">
                      {
                        categories.find((c) => c.id === watch("category_id"))
                          ?.name
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-base">{watch("description")}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-base">
                      {watch("lga")}, {watch("state")}
                      {watch("ward") && `, ${watch("ward")}`}
                    </p>
                    {watch("address") && (
                      <p className="text-sm text-gray-600">{watch("address")}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Contact</p>
                    <p className="text-base">Phone: {watch("phone")}</p>
                    <p className="text-base">Email: {watch("email")}</p>
                    {watch("whatsapp") && (
                      <p className="text-base">WhatsApp: {watch("whatsapp")}</p>
                    )}
                    {watch("website") && (
                      <p className="text-base">Website: {watch("website")}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Next Steps:</strong> After creating your business profile, you
                    can submit verification documents to get a "Verified Business" badge
                    and access enhanced features.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
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
              disabled={!canProceed()}
              className="bg-naija-green hover:bg-naija-green/90"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-naija-green hover:bg-naija-green/90"
            >
              {isSubmitting ? "Creating..." : "Create Business"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
