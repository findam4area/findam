"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, uploadAvatarAction } from "@/app/actions/profile";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/validations/profile";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProfileEditorProps {
  user: User;
  onSuccess?: (user: User) => void;
  onCancel?: () => void;
  className?: string;
}

export function ProfileEditor({
  user,
  onSuccess,
  onCancel,
  className,
}: ProfileEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatar_url || null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user.username,
      bio: user.bio || "",
      phone: user.phone || "",
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be less than 2MB");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Avatar must be JPEG, PNG, or WebP");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    setIsUploadingAvatar(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const result = await uploadAvatarAction(user.id, formData);

      if (result.error) {
        setError(result.error);
        setAvatarPreview(user.avatar_url || null);
      } else {
        setSuccess("Avatar updated successfully!");
        if (result.data && onSuccess) {
          onSuccess(result.data.user);
        }
      }
    } catch (err) {
      setError("Failed to upload avatar");
      setAvatarPreview(user.avatar_url || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateProfile(user.id, data);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        setSuccess("Profile updated successfully!");
        if (onSuccess) {
          onSuccess(result.data);
        }
      }
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className={cn(
        "glass-card rounded-2xl border border-dark-border p-6",
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="mb-6 text-2xl font-bold text-white">Edit Profile</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label htmlFor="avatar" className="text-white">
            Profile Picture
          </Label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-dark-border">
              {avatarPreview ? (
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-naija-green to-neon-cyan text-2xl font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                type="file"
                id="avatar"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploadingAvatar}
              />
              <label htmlFor="avatar">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploadingAvatar}
                  onClick={() => document.getElementById("avatar")?.click()}
                  asChild
                >
                  <span className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Avatar
                  </span>
                </Button>
              </label>
              <p className="mt-1 text-xs text-gray-400">
                Max 2MB. JPEG, PNG, or WebP.
              </p>
            </div>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-white">
            Username
          </Label>
          <Input
            id="username"
            {...register("username")}
            placeholder="Enter username"
            disabled={isSubmitting}
          />
          {errors.username && (
            <p className="text-xs text-red-400">{errors.username.message}</p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-white">
            Bio
          </Label>
          <textarea
            id="bio"
            {...register("bio")}
            placeholder="Tell us about yourself..."
            rows={4}
            disabled={isSubmitting}
            className="flex w-full rounded-md border border-dark-border bg-dark-card px-3 py-2 text-sm text-white ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-naija-green focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {errors.bio && (
            <p className="text-xs text-red-400">{errors.bio.message}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white">
            Phone Number
          </Label>
          <Input
            id="phone"
            {...register("phone")}
            placeholder="+234XXXXXXXXXX"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-xs text-red-400">{errors.phone.message}</p>
          )}
          <p className="text-xs text-gray-400">
            Format: +234 followed by 10 digits
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            className="rounded-lg bg-naija-green/10 border border-naija-green/20 p-3 text-sm text-naija-green"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {success}
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="neon"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}
