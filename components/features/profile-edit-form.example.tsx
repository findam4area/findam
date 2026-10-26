/**
 * ProfileEditForm Usage Examples
 * 
 * This file demonstrates various ways to integrate the ProfileEditForm component
 * 
 * Task: 10.6 Create user profile edit functionality
 * Requirements: 2.7, 13.13
 */

import { ProfileEditForm } from './profile-edit-form';
import type { User } from '@/lib/types/core';

// ============================================================================
// Example 1: Basic usage in a profile page
// ============================================================================

export function BasicProfileEditPage({ user }: { user: User }) {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Profile</h1>
      <ProfileEditForm user={user} />
    </div>
  );
}

// ============================================================================
// Example 2: Usage with callbacks
// ============================================================================

'use client';

export function ProfileEditWithCallbacks({ user }: { user: User }) {
  const handleSuccess = () => {
    console.log('Profile updated successfully!');
    // You could:
    // - Show a toast notification
    // - Redirect to profile view page
    // - Refresh the page data
    // - Close a modal
    alert('Profile updated successfully!');
  };

  const handleCancel = () => {
    console.log('User cancelled editing');
    // You could:
    // - Navigate back to previous page
    // - Close a modal
    // - Reset form to original values
    window.history.back();
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <ProfileEditForm 
        user={user}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}

// ============================================================================
// Example 3: Usage in a modal
// ============================================================================

'use client';

import { useState } from 'react';

export function ProfileEditModal({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Edit Profile
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Background Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Form */}
              <div className="p-6">
                <ProfileEditForm
                  user={user}
                  onSuccess={() => {
                    setIsOpen(false);
                    // Optionally refresh the page or show a success message
                  }}
                  onCancel={() => setIsOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ============================================================================
// Example 4: Usage with Server Component wrapper
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function ProfileEditPageWithAuth() {
  // Fetch user in Server Component
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect('/login');
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    redirect('/login');
  }

  // Pass to Client Component
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-2 text-gray-600">
            Update your personal information and profile picture
          </p>
        </div>

        {/* Form */}
        <ProfileEditForm user={user as User} />
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: Usage with custom styling wrapper
// ============================================================================

export function StyledProfileEdit({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12">
      <div className="container mx-auto max-w-3xl px-4">
        {/* Custom Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Your Profile
          </h1>
          <p className="text-lg text-gray-600">
            Keep your information up to date
          </p>
        </div>

        {/* Form with custom wrapper */}
        <div className="shadow-2xl rounded-2xl overflow-hidden">
          <ProfileEditForm user={user} />
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Your information is secure and never shared without your consent
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: Usage with tabs (combining view and edit modes)
// ============================================================================

'use client';

import { useState } from 'react';

type TabMode = 'view' | 'edit';

export function ProfileWithTabs({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<TabMode>('view');

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('view')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'view' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            View Profile
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'edit' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            Edit Profile
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'view' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Profile Information</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-lg text-gray-900">{user.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-lg text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-lg text-gray-900">{user.phone || 'Not provided'}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <ProfileEditForm 
          user={user}
          onSuccess={() => {
            setActiveTab('view');
            // Optionally refresh data
          }}
          onCancel={() => setActiveTab('view')}
        />
      )}
    </div>
  );
}
