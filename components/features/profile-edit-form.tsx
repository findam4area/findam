/**
 * ProfileEditForm Component
 * 
 * Client Component for editing user profile information
 * Handles full_name, phone, and avatar upload with real-time validation
 * 
 * Requirements: 2.7, 13.13
 * Task: 10.6 Create user profile edit functionality
 */

'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Loader2, Upload, Check, X } from 'lucide-react';
import { updateProfileAction } from '@/lib/actions/user-actions';
import { uploadAvatarAction } from '@/app/actions/profile';
import type { User } from '@/lib/types/core';

interface ProfileEditFormProps {
  user: User;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditForm({ user, onSuccess, onCancel }: ProfileEditFormProps) {
  // Form state
  const [fullName, setFullName] = useState(user.full_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Validation state
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  
  // Preview state for avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate full name in real-time
   * Requirement: 2.7 - Real-time validation
   */
  const validateFullName = (value: string): boolean => {
    if (!value || value.trim().length < 2) {
      setFullNameError('Full name must be at least 2 characters');
      return false;
    }
    setFullNameError(null);
    return true;
  };

  /**
   * Validate Nigerian phone number in real-time
   * Requirement: 2.7 - Real-time validation
   */
  const validatePhone = (value: string): boolean => {
    if (!value || value.trim() === '') {
      setPhoneError(null);
      return true; // Phone is optional
    }
    
    const nigerianPhoneRegex = /^(\+?234|0)[789]\d{9}$/;
    const cleanPhone = value.replace(/\s/g, '');
    
    if (!nigerianPhoneRegex.test(cleanPhone)) {
      setPhoneError('Please enter a valid Nigerian phone number (e.g., +2348012345678)');
      return false;
    }
    
    setPhoneError(null);
    return true;
  };

  /**
   * Handle full name change with validation
   */
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFullName(value);
    validateFullName(value);
  };

  /**
   * Handle phone change with validation
   */
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    validatePhone(value);
  };

  /**
   * Handle avatar file selection and upload
   * Requirement: 13.13 - Avatar upload with 2MB limit
   */
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Avatar must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Avatar must be JPEG, PNG, or WebP');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar immediately
    setIsUploadingAvatar(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatarAction(user.id, formData);

      if (result.error) {
        setAvatarError(result.error);
        setAvatarPreview(avatarUrl); // Revert preview
      } else if (result.data?.url) {
        setAvatarUrl(result.data.url);
        setAvatarPreview(result.data.url);
      }
    } catch (err) {
      setAvatarError('Failed to upload avatar. Please try again.');
      setAvatarPreview(avatarUrl); // Revert preview
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  /**
   * Handle form submission
   * Requirement: 2.7 - Update profile with validation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Validate all fields
    const isFullNameValid = validateFullName(fullName);
    const isPhoneValid = validatePhone(phone);

    if (!isFullNameValid || !isPhoneValid) {
      setError('Please fix the validation errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('phone', phone.trim());
      if (avatarUrl) {
        formData.append('avatar_url', avatarUrl);
      }

      const result = await updateProfileAction(formData);

      if (result.success) {
        setSuccess('Profile updated successfully!');
        
        // Call success callback after a brief delay to show success message
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
        }, 1500);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Trigger file input click
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Profile Picture
            </label>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative h-20 w-20 flex-shrink-0">
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile avatar"
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-2xl font-bold">
                      {fullName.charAt(0).toUpperCase() || user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                {/* Upload Loading Overlay */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Button and Info */}
              <div className="flex-1 min-w-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  className="hidden"
                  aria-label="Upload avatar"
                />
                
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                </button>
                
                <p className="mt-2 text-xs text-gray-500">
                  Max 2MB. JPEG, PNG, or WebP format.
                </p>
                
                {avatarError && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {avatarError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              value={fullName}
              onChange={handleFullNameChange}
              onBlur={() => validateFullName(fullName)}
              disabled={isSubmitting}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              placeholder="Enter your full name"
              aria-invalid={!!fullNameError}
              aria-describedby={fullNameError ? 'full_name-error' : undefined}
            />
            {fullNameError && (
              <p id="full_name-error" className="text-sm text-red-600" role="alert">
                {fullNameError}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={() => validatePhone(phone)}
              disabled={isSubmitting}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              placeholder="+234XXXXXXXXXX"
              aria-invalid={!!phoneError}
              aria-describedby={phoneError ? 'phone-error phone-help' : 'phone-help'}
            />
            <p id="phone-help" className="text-xs text-gray-500">
              Format: +234 followed by 10 digits (e.g., +2348012345678)
            </p>
            {phoneError && (
              <p id="phone-error" className="text-sm text-red-600" role="alert">
                {phoneError}
              </p>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-50 border border-green-200 p-4" role="status">
              <div className="flex items-center">
                <Check className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4" role="alert">
              <div className="flex items-start">
                <X className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAvatar}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
