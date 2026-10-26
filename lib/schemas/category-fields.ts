import { z } from "zod";

/**
 * Category-Specific Field Schemas
 * 
 * This file defines Zod validation schemas for category-specific fields
 * that businesses can fill out based on their primary category selection.
 * 
 * Requirements: 18.1, 18.2, 18.3, 18.4
 */

/**
 * Food & Beverage Fields
 * 
 * Requirement 18.1: WHEN a Business_Profile selects "Food & Beverage" as Primary_Category,
 * THE system SHALL display fields for cuisine type, dietary options, and delivery radius
 */
export const FoodBeverageFieldsSchema = z.object({
  cuisine_types: z
    .array(z.string().min(1, "Cuisine type cannot be empty").max(50))
    .min(1, "At least one cuisine type is required")
    .max(10, "Maximum 10 cuisine types allowed")
    .describe("Types of cuisine offered (e.g., Nigerian, Chinese, Italian)"),
  
  dietary_options: z
    .array(
      z.string().min(1, "Dietary option cannot be empty").max(30)
    )
    .max(15, "Maximum 15 dietary options allowed")
    .default([])
    .describe("Dietary options available (e.g., vegan, vegetarian, halal, gluten-free, kosher)"),
  
  delivery_radius_km: z
    .number()
    .min(0, "Delivery radius must be non-negative")
    .max(100, "Delivery radius cannot exceed 100km")
    .optional()
    .describe("Maximum delivery radius in kilometers"),
}).strict();

export type FoodBeverageFields = z.infer<typeof FoodBeverageFieldsSchema>;

/**
 * Health & Medical Fields
 * 
 * Requirement 18.2: WHEN a Business_Profile selects "Health & Medical" as Primary_Category,
 * THE system SHALL display fields for specializations, accepted insurance, and appointment booking
 */
export const HealthMedicalFieldsSchema = z.object({
  specializations: z
    .array(z.string().min(1, "Specialization cannot be empty").max(100))
    .min(1, "At least one specialization is required")
    .max(20, "Maximum 20 specializations allowed")
    .describe("Medical specializations or services offered (e.g., General Practice, Cardiology, Dentistry)"),
  
  accepted_insurance: z
    .array(z.string().min(1, "Insurance provider cannot be empty").max(100))
    .max(30, "Maximum 30 insurance providers allowed")
    .default([])
    .describe("Insurance providers accepted (e.g., NHIS, Hygeia, AXA Mansard)"),
  
  appointment_booking_url: z
    .string()
    .url("Must be a valid URL")
    .max(500, "URL cannot exceed 500 characters")
    .optional()
    .describe("URL for online appointment booking system"),
}).strict();

export type HealthMedicalFields = z.infer<typeof HealthMedicalFieldsSchema>;

/**
 * Real Estate & Property Fields
 * 
 * Requirement 18.3: WHEN a Business_Profile selects "Real Estate & Property" as Primary_Category,
 * THE system SHALL display fields for property types, transaction types, and service areas
 */
export const RealEstateFieldsSchema = z.object({
  property_types: z
    .array(
      z.string().min(1, "Property type cannot be empty").max(50)
    )
    .min(1, "At least one property type is required")
    .max(15, "Maximum 15 property types allowed")
    .describe("Types of properties handled (e.g., residential, commercial, land, industrial)"),
  
  transaction_types: z
    .array(
      z.string().min(1, "Transaction type cannot be empty").max(50)
    )
    .min(1, "At least one transaction type is required")
    .max(10, "Maximum 10 transaction types allowed")
    .describe("Types of transactions supported (e.g., sale, rent, lease, short-let)"),
  
  service_areas: z
    .array(z.string().min(1, "Service area cannot be empty").max(100))
    .min(1, "At least one service area is required")
    .max(20, "Maximum 20 service areas allowed")
    .describe("Geographic areas serviced (e.g., Lekki, Victoria Island, Abuja Central)"),
}).strict();

export type RealEstateFields = z.infer<typeof RealEstateFieldsSchema>;

/**
 * Automotive Fields
 * 
 * Requirement 18.4: WHEN a Business_Profile selects "Automotive" as Primary_Category,
 * THE system SHALL display fields for brands serviced, certifications, and warranty information
 */
export const AutomotiveFieldsSchema = z.object({
  brands_serviced: z
    .array(z.string().min(1, "Brand name cannot be empty").max(50))
    .min(1, "At least one brand is required")
    .max(30, "Maximum 30 brands allowed")
    .describe("Vehicle brands serviced (e.g., Toyota, Mercedes-Benz, Honda, Innoson)"),
  
  certifications: z
    .array(z.string().min(1, "Certification cannot be empty").max(100))
    .max(20, "Maximum 20 certifications allowed")
    .default([])
    .describe("Professional certifications held (e.g., ASE Certified, Manufacturer Certified)"),
  
  warranty_offered: z
    .boolean()
    .describe("Whether warranty is offered on services/products"),
}).strict();

export type AutomotiveFields = z.infer<typeof AutomotiveFieldsSchema>;

/**
 * Union type for all category-specific fields
 */
export type CategorySpecificFields =
  | { category: "Food & Beverage"; fields: FoodBeverageFields }
  | { category: "Health & Medical"; fields: HealthMedicalFields }
  | { category: "Real Estate & Property"; fields: RealEstateFields }
  | { category: "Automotive"; fields: AutomotiveFields };

/**
 * Helper function to validate category-specific fields based on category name
 * 
 * @param categoryName - The primary category name
 * @param data - The fields data to validate
 * @returns Validation result
 */
export function validateCategoryFields(
  categoryName: string,
  data: unknown
): {
  success: boolean;
  data?: FoodBeverageFields | HealthMedicalFields | RealEstateFields | AutomotiveFields;
  error?: z.ZodError;
} {
  try {
    switch (categoryName) {
      case "Food & Beverage":
        const foodData = FoodBeverageFieldsSchema.parse(data);
        return { success: true, data: foodData };
      
      case "Health & Medical":
        const healthData = HealthMedicalFieldsSchema.parse(data);
        return { success: true, data: healthData };
      
      case "Real Estate & Property":
        const realEstateData = RealEstateFieldsSchema.parse(data);
        return { success: true, data: realEstateData };
      
      case "Automotive":
        const automotiveData = AutomotiveFieldsSchema.parse(data);
        return { success: true, data: automotiveData };
      
      default:
        throw new Error(`Unknown category: ${categoryName}`);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Helper function to get the appropriate schema for a category
 * 
 * @param categoryName - The primary category name
 * @returns The Zod schema for that category, or null if not found
 */
export function getCategorySchema(categoryName: string): z.ZodSchema | null {
  switch (categoryName) {
    case "Food & Beverage":
      return FoodBeverageFieldsSchema;
    
    case "Health & Medical":
      return HealthMedicalFieldsSchema;
    
    case "Real Estate & Property":
      return RealEstateFieldsSchema;
    
    case "Automotive":
      return AutomotiveFieldsSchema;
    
    default:
      return null;
  }
}
