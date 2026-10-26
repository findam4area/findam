/**
 * Profile Edit Modal Component
 * 
 * This Client Component provides a modal dialog for editing user profile:
 * - Full name field with validation
 * - Phone field with validation
 * - Avatar upload via ImageUploader (2MB max, single image)
 * - Real-time form validation
 * - Success message after update
 * 
 * Requirements: 2.7, 13.13
 * Task: 10.6 Create user profile edit functionality
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/shared/image-uploader';
import { updateProfileAction } from '@/lib/actions/user-actions';
import type { User } from '@/lib/types/core';

interface ProfileEditModalProps {
  user: User;
}

export function ProfileEditModal({ user }: ProfileEditModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url);

  // Validation state
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Handle avatar upload
  const handleAvatarUploaded = (urls: string[]) => {
    if (urls.length > 0) {
      setAvatarUrl(urls[0]);
    }
  };

  // Validate full name
  const validateName = (name: string): boolean => {
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

  // Validate phone (Nigerian format)
  const validatePhone = (phoneNumber: string): boolean => {
    if (!phoneNumber) {
      setPhoneError(null);
      return true; // Phone is optional
    }

    const nigerianPhoneRegex = /^(\+?234|0)[789]\d{9}$/;
    if (!nigerianPhoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      setPhoneError('Please enter a valid Nigerian phone number');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset states
    setError(null);
    setSuccess(false);

    // Validate form
    const isNameValid = validateName(fullName);
    const isPhoneValid = validatePhone(phone);

    if (!isNameValid || !isPhoneValid) {
      return;
    }

    setLoading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('phone', phone.trim());
      if (avatarUrl && avatarUrl !== user.avatar_url) {
        formData.append('avatar_url', avatarUrl);
      }

      // Call Server Action
      const result = await updateProfileAction(formData);

      if (result.success) {
        setSuccess(true);
        // Wait a moment to show success message
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          // Refresh the page to show updated data
          router.refresh();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update profile. Please try again.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form to original values
      setFullName(user.full_name);
      setPhone(user.phone || '');
      setAvatarUrl(user.avatar_url);
      setError(null);
      setSuccess(false);
      setNameError(null);
      setPhoneError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information and avatar. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <ImageUploader
              onImagesUploaded={handleAvatarUploaded}
              maxImages={1}
              maxSizeMB={2}
              existingImages={avatarUrl ? [avatarUrl] : []}
              bucket="avatars"
              className="max-w-full"
            />
            <p className="text-sm text-gray-500">
              Maximum file size: 2MB. Formats: JPG, PNG, WebP
            </p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={() => validateName(fullName)}
              placeholder="Enter your full name"
              className={nameError ? 'border-red-500' : ''}
              disabled={loading}
              required
            />
            {nameError && (
              <p className="text-sm text-red-600">{nameError}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneError) validatePhone(e.target.value);
              }}
              onBlur={() => validatePhone(phone)}
              placeholder="+234 801 234 5678"
              className={phoneError ? 'border-red-500' : ''}
              disabled={loading}
            />
            {phoneError && (
              <p className="text-sm text-red-600">{phoneError}</p>
            )}
            <p className="text-sm text-gray-500">
              Optional. Format: +234 or 0 followed by 10 digits
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                Profile updated successfully!
              </p>
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : success ? (
                'Saved!'
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
