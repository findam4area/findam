import { z } from "zod";

// Profile update validation schema
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    )
    .optional(),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
  phone: z
    .string()
    .regex(
      /^\+234[0-9]{10}$/,
      "Phone must be a valid Nigerian number (+234XXXXXXXXXX)",
    )
    .optional()
    .nullable(),
  avatar_url: z.string().url().optional().nullable(),
});

// Avatar upload validation
export const avatarUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 2 * 1024 * 1024,
      "Avatar must be less than 2MB",
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Avatar must be JPEG, PNG, or WebP",
    ),
});

// Social links schema
export const socialLinksSchema = z.object({
  facebook: z.string().url().optional().nullable(),
  twitter: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;
