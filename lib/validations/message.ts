import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message must be at most 1000 characters"),
  media_url: z.string().url("Invalid media URL").optional(),
});

export const conversationSchema = z.object({
  listing_id: z.string().uuid("Invalid listing").optional(),
  participant_id: z.string().uuid("Invalid participant"),
});

export type MessageInput = z.infer<typeof messageSchema>;
export type ConversationInput = z.infer<typeof conversationSchema>;
