"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { StateSelector, AreaSelector } from "@/components/location";
import { Category } from "@/lib/types/category";
import { FoodBeverageFields, HealthMedicalFields, RealEstateFields, AutomotiveFields } from "@/lib/types/business-profile";
import { motion } from "framer-motion";
import { Plus, X, Check, Clock } from "lucide-react";

// Validation schema
const businessProfileSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  business_type: z.enum(["product", "service", "both"]),
  primary_category_id: z.string().min(1, "Please select a primary category"),
  primary_subcategory_ids: z.array(z.string()).min(1, "Select at least one subcategory"),
  secondary_categories: z.array(z.object({
    category_id: z.string(),
    subcategory_ids: z.array(z.string()),
  })).optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  business_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
  })).optional(),
  service_attributes: z.object({
    delivery_available: z.boolean().optional(),
    online_service: z.boolean().optional(),
    in_person_service: z.boolean().optional(),
    availability_24_7: z.boolean().optional(),
    emergency_service: z.boolean().optional(),
  }).optional(),
  price_range: z.enum(["$", "$$", "$$$", "$$$$"]).optional(),
  category_specific_fields: z.record(z.any()).optional(),
});

type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;

interface BusinessProfileFormProps {
  categories: Category[];
  initialData?: Partial<BusinessProfileFormData>;
  onSubmit: (data: BusinessProfileFormData) => Promise<void>;
  isEditing?: boolean;
}

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const PRICE_RANGES = [
  { value: "$", label: "Budget ($)" },
  { value: "$$", label: "Moderate ($$)" },
  { value: "$$$", label: "Premium ($$$)" },
  { value: "$$$$", label: "Luxury ($$$$)" },
];

export function BusinessProfileForm({
  categories,
  initialData,
  onSubmit,
  isEditing = false,
}: BusinessProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubcategories, setSelectedSubcategories] = useState<Set<string>>(
    new Set(initialData?.primary_subcategory_ids || [])
  );
  const [secondaryCategories, setSecondaryCategories] = useState<
    Array<{ category_id: string; subcategory_ids: string[] }>
  >(initialData?.secondary_categories || []);
  const [completeness, setCompleteness] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: initialData || {
      business_type: "both",
      primary_subcategory_ids: [],
      secondary_categories: [],
      service_attributes: {},
    },
  });

  const watchedFields = watch();
  const primaryCategoryId = watch("primary_category_id");
  const primaryCategory = categories.find((c) => c.id === primaryCategoryId);

  // Calculate profile completeness
  useEffect(() => {
    let score = 0;
    const weights = {
      business_name: 10,
      description: 10,
      primary_category_id: 10,
      primary_subcategory_ids: 10,
      city: 5,
      state: 5,
      phone: 10,
      email: 10,
      business_hours: 10,
      address: 5,
      website: 5,
      price_range: 5,
      service_attributes: 5,
    };

    if (watchedFields.business_name) score += weights.business_name;
    if (watchedFields.description && watchedFields.description.length >= 50) score += weights.description;
    if (watchedFields.primary_category_id) score += weights.primary_category_id;
    if (watchedFields.primary_subcategory_ids?.length) score += weights.primary_subcategory_ids;
    if (watchedFields.city) score += weights.city;
    if (watchedFields.state) score += weights.state;
    if (watchedFields.phone) score += weights.phone;
    if (watchedFields.email) score += weights.email;
    if (watchedFields.business_hours && Object.keys(watchedFields.business_hours).length > 0) score += weights.business_hours;
    if (watchedFields.address) score += weights.address;
    if (watchedFields.website) score += weights.website;
    if (watchedFields.price_range) score += weights.price_range;
    if (watchedFields.service_attributes && Object.values(watchedFields.service_attributes).some(v => v)) score += weights.service_attributes;

    setCompleteness(score);
  }, [watchedFields]);

  const handleFormSubmit = async (data: BusinessProfileFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubcategory = (subcategoryId: string) => {
    const newSet = new Set(selectedSubcategories);
    if (newSet.has(subcategoryId)) {
      newSet.delete(subcategoryId);
    } else {
      newSet.add(subcategoryId);
    }
    setSelectedSubcategories(newSet);
    setValue("primary_subcategory_ids", Array.from(newSet));
  };

  const addSecondaryCategory = () => {
    setSecondaryCategories([...secondaryCategories, { category_id: "", subcategory_ids: [] }]);
  };

  const removeSecondaryCategory = (index: number) => {
    const updated = secondaryCategories.filter((_, i) => i !== index);
    setSecondaryCategories(updated);
    setValue("secondary_categories", updated);
  };

  const updateSecondaryCategory = (index: number, categoryId: string) => {
    const updated = [...secondaryCategories];
    updated[index] = { category_id: categoryId, subcategory_ids: [] };
    setSecondaryCategories(updated);
    setValue("secondary_categories", updated);
  };

  const toggleSecondarySubcategory = (catIndex: number, subcategoryId: string) => {
    const updated = [...secondaryCategories];
    const subcats = new Set(updated[catIndex].subcategory_ids);
    if (subcats.has(subcategoryId)) {
      subcats.delete(subcategoryId);
    } else {
      subcats.add(subcategoryId);
    }
    updated[catIndex].subcategory_ids = Array.from(subcats);
    setSecondaryCategories(updated);
    setValue("secondary_categories", updated);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Completeness Indicator */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Profile Completeness</h3>
          <span className="text-2xl font-bold text-blue-600">{completeness}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {completeness < 100 && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Complete your profile to improve visibility in search results
          </p>
        )}
      </Card>

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              {...register("business_name")}
              placeholder="Enter your business name"
            />
            {errors.business_name && (
              <p className="text-sm text-red-500 mt-1">{errors.business_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Describe your business (minimum 50 characters)"
              rows={5}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {watchedFields.description?.length || 0} / 50 characters
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="business_type">Business Type *</Label>
            <Select
              value={watchedFields.business_type}
              onValueChange={(value) => setValue("business_type", value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Products Only</SelectItem>
                <SelectItem value="service">Services Only</SelectItem>
                <SelectItem value="both">Both Products & Services</SelectItem>
              </SelectContent>
            </Select>
            {errors.business_type && (
              <p className="text-sm text-red-500 mt-1">{errors.business_type.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Categories */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Categories *</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="primary_category">Primary Category *</Label>
            <Select
              value={primaryCategoryId}
              onValueChange={(value) => {
                setValue("primary_category_id", value);
                setSelectedSubcategories(new Set());
                setValue("primary_subcategory_ids", []);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select primary category" />
              </SelectTrigger>
              <SelectContent>
                {categories.filter(c => !c.parent_id).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.primary_category_id && (
              <p className="text-sm text-red-500 mt-1">{errors.primary_category_id.message}</p>
            )}
          </div>

          {primaryCategoryId && primaryCategory?.subcategories && (
            <div>
              <Label>Subcategories * (select at least one)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {primaryCategory.subcategories.map((subcat) => (
                  <Badge
                    key={subcat.id}
                    variant={selectedSubcategories.has(subcat.id) ? "default" : "outline"}
                    className="cursor-pointer justify-center py-2"
                    onClick={() => toggleSubcategory(subcat.id)}
                  >
                    {selectedSubcategories.has(subcat.id) && <Check className="w-3 h-3 mr-1" />}
                    {subcat.name}
                  </Badge>
                ))}
              </div>
              {errors.primary_subcategory_ids && (
                <p className="text-sm text-red-500 mt-1">{errors.primary_subcategory_ids.message}</p>
              )}
            </div>
          )}

          {/* Secondary Categories */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Secondary Categories (Optional)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addSecondaryCategory}>
                <Plus className="w-4 h-4 mr-1" /> Add Category
              </Button>
            </div>
            
            {secondaryCategories.map((secCat, index) => {
              const secCategory = categories.find(c => c.id === secCat.category_id);
              return (
                <Card key={index} className="p-4 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Select
                      value={secCat.category_id}
                      onValueChange={(value) => updateSecondaryCategory(index, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select secondary category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => !c.parent_id && c.id !== primaryCategoryId).map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSecondaryCategory(index)}
                      className="ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {secCategory?.subcategories && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {secCategory.subcategories.map((subcat) => (
                        <Badge
                          key={subcat.id}
                          variant={secCat.subcategory_ids.includes(subcat.id) ? "default" : "outline"}
                          className="cursor-pointer justify-center py-2"
                          onClick={() => toggleSecondarySubcategory(index, subcat.id)}
                        >
                          {secCat.subcategory_ids.includes(subcat.id) && <Check className="w-3 h-3 mr-1" />}
                          {subcat.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Location */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Location *</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="state">State *</Label>
            <StateSelector
              value={watchedFields.state || ""}
              onValueChange={(value: string) => setValue("state", value)}
            />
            {errors.state && (
              <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="city">City/Area *</Label>
            <AreaSelector
              state={watchedFields.state || ""}
              value={watchedFields.city || ""}
              onValueChange={(value: string) => setValue("city", value)}
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Enter street address"
            />
          </div>

          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              {...register("postal_code")}
              placeholder="Enter postal code"
            />
          </div>
        </div>
      </Card>

      {/* Contact Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+234 XXX XXX XXXX"
              type="tel"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register("email")}
              placeholder="business@example.com"
              type="email"
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register("website")}
              placeholder="https://example.com"
              type="url"
            />
            {errors.website && (
              <p className="text-sm text-red-500 mt-1">{errors.website.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Business Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Business Hours
        </h2>
        
        <div className="space-y-3">
          {WEEKDAYS.map((day) => (
            <div key={day} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <Label className="capitalize">{day}</Label>
              <Input
                type="time"
                placeholder="Opening"
                {...register(`business_hours.${day}.open`)}
              />
              <Input
                type="time"
                placeholder="Closing"
                {...register(`business_hours.${day}.close`)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Service Attributes */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Service Attributes</h2>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="delivery_available"
              {...register("service_attributes.delivery_available")}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="delivery_available" className="ml-2">Delivery Available</Label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="online_service"
              {...register("service_attributes.online_service")}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="online_service" className="ml-2">Online Service</Label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="in_person_service"
              {...register("service_attributes.in_person_service")}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="in_person_service" className="ml-2">In-Person Service</Label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="availability_24_7"
              {...register("service_attributes.availability_24_7")}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="availability_24_7" className="ml-2">24/7 Availability</Label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="emergency_service"
              {...register("service_attributes.emergency_service")}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="emergency_service" className="ml-2">Emergency Service</Label>
          </div>
        </div>
      </Card>

      {/* Price Range */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Price Range</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRICE_RANGES.map((range) => (
            <Badge
              key={range.value}
              variant={watchedFields.price_range === range.value ? "default" : "outline"}
              className="cursor-pointer justify-center py-3 text-base"
              onClick={() => setValue("price_range", range.value as any)}
            >
              {range.label}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="min-w-[200px]"
        >
          {isSubmitting ? "Saving..." : isEditing ? "Update Profile" : "Create Profile"}
        </Button>
      </div>
    </form>
  );
}
