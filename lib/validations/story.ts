import { z } from "zod";

export const storyVideoSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("video/"), {
      message: "File must be a video",
    })
    .refine((file) => file.size <= 20 * 1024 * 1024, {
      message: "Video size must not exceed 20MB",
    }),
});

export const storyCreateSchema = z.object({
  video_url: z.string().url("Invalid video URL"),
  thumbnail_url: z.string().url("Invalid thumbnail URL").optional().nullable(),
});

export type StoryVideoInput = z.infer<typeof storyVideoSchema>;
export type StoryCreateInput = z.infer<typeof storyCreateSchema>;
