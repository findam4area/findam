import { describe, it, expect } from "vitest";
import {
  FoodBeverageFieldsSchema,
  HealthMedicalFieldsSchema,
  RealEstateFieldsSchema,
  AutomotiveFieldsSchema,
  validateCategoryFields,
  getCategorySchema,
} from "./category-fields";

describe("Category-Specific Field Schemas", () => {
  describe("FoodBeverageFieldsSchema", () => {
    it("should validate valid food & beverage fields", () => {
      const validData = {
        cuisine_types: ["Nigerian", "Chinese", "Continental"],
        dietary_options: ["vegan", "vegetarian", "halal"],
        delivery_radius_km: 15,
      };

      const result = FoodBeverageFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cuisine_types).toEqual(["Nigerian", "Chinese", "Continental"]);
        expect(result.data.dietary_options).toEqual(["vegan", "vegetarian", "halal"]);
        expect(result.data.delivery_radius_km).toBe(15);
      }
    });

    it("should require at least one cuisine type", () => {
      const invalidData = {
        cuisine_types: [],
        dietary_options: [],
      };

      const result = FoodBeverageFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative delivery radius", () => {
      const invalidData = {
        cuisine_types: ["Nigerian"],
        dietary_options: [],
        delivery_radius_km: -5,
      };

      const result = FoodBeverageFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should allow optional delivery_radius_km", () => {
      const validData = {
        cuisine_types: ["Nigerian"],
        dietary_options: ["halal"],
      };

      const result = FoodBeverageFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("HealthMedicalFieldsSchema", () => {
    it("should validate valid health & medical fields", () => {
      const validData = {
        specializations: ["General Practice", "Cardiology"],
        accepted_insurance: ["NHIS", "Hygeia"],
        appointment_booking_url: "https://example.com/book",
      };

      const result = HealthMedicalFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.specializations).toEqual(["General Practice", "Cardiology"]);
        expect(result.data.accepted_insurance).toEqual(["NHIS", "Hygeia"]);
        expect(result.data.appointment_booking_url).toBe("https://example.com/book");
      }
    });

    it("should require at least one specialization", () => {
      const invalidData = {
        specializations: [],
        accepted_insurance: [],
      };

      const result = HealthMedicalFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should validate appointment booking URL format", () => {
      const invalidData = {
        specializations: ["General Practice"],
        accepted_insurance: [],
        appointment_booking_url: "not-a-url",
      };

      const result = HealthMedicalFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("RealEstateFieldsSchema", () => {
    it("should validate valid real estate fields", () => {
      const validData = {
        property_types: ["residential", "commercial"],
        transaction_types: ["sale", "rent"],
        service_areas: ["Lekki", "Victoria Island"],
      };

      const result = RealEstateFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.property_types).toEqual(["residential", "commercial"]);
        expect(result.data.transaction_types).toEqual(["sale", "rent"]);
        expect(result.data.service_areas).toEqual(["Lekki", "Victoria Island"]);
      }
    });

    it("should require all three field arrays", () => {
      const invalidData = {
        property_types: ["residential"],
      };

      const result = RealEstateFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should require at least one item in each array", () => {
      const invalidData = {
        property_types: [],
        transaction_types: ["sale"],
        service_areas: ["Lekki"],
      };

      const result = RealEstateFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("AutomotiveFieldsSchema", () => {
    it("should validate valid automotive fields", () => {
      const validData = {
        brands_serviced: ["Toyota", "Honda", "Mercedes-Benz"],
        certifications: ["ASE Certified"],
        warranty_offered: true,
      };

      const result = AutomotiveFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.brands_serviced).toEqual(["Toyota", "Honda", "Mercedes-Benz"]);
        expect(result.data.certifications).toEqual(["ASE Certified"]);
        expect(result.data.warranty_offered).toBe(true);
      }
    });

    it("should require warranty_offered boolean", () => {
      const invalidData = {
        brands_serviced: ["Toyota"],
        certifications: [],
      };

      const result = AutomotiveFieldsSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should allow empty certifications array", () => {
      const validData = {
        brands_serviced: ["Toyota"],
        certifications: [],
        warranty_offered: false,
      };

      const result = AutomotiveFieldsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("validateCategoryFields helper", () => {
    it("should validate Food & Beverage category fields", () => {
      const data = {
        cuisine_types: ["Nigerian"],
        dietary_options: ["halal"],
      };

      const result = validateCategoryFields("Food & Beverage", data);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should validate Health & Medical category fields", () => {
      const data = {
        specializations: ["General Practice"],
        accepted_insurance: ["NHIS"],
      };

      const result = validateCategoryFields("Health & Medical", data);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should return error for invalid data", () => {
      const data = {
        cuisine_types: [], // Invalid: requires at least one
        dietary_options: [],
      };

      const result = validateCategoryFields("Food & Beverage", data);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should throw error for unknown category", () => {
      const data = { test: "data" };
      
      expect(() => {
        validateCategoryFields("Unknown Category", data);
      }).toThrow("Unknown category");
    });
  });

  describe("getCategorySchema helper", () => {
    it("should return correct schema for Food & Beverage", () => {
      const schema = getCategorySchema("Food & Beverage");
      expect(schema).toBe(FoodBeverageFieldsSchema);
    });

    it("should return correct schema for Health & Medical", () => {
      const schema = getCategorySchema("Health & Medical");
      expect(schema).toBe(HealthMedicalFieldsSchema);
    });

    it("should return correct schema for Real Estate & Property", () => {
      const schema = getCategorySchema("Real Estate & Property");
      expect(schema).toBe(RealEstateFieldsSchema);
    });

    it("should return correct schema for Automotive", () => {
      const schema = getCategorySchema("Automotive");
      expect(schema).toBe(AutomotiveFieldsSchema);
    });

    it("should return null for unknown category", () => {
      const schema = getCategorySchema("Unknown Category");
      expect(schema).toBeNull();
    });
  });
});
