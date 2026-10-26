'use client';

/**
 * Privacy Settings Component
 * Requirements: 18.9, 30.10, 31.6, 31.7, 31.8
 * 
 * Provides comprehensive GDPR compliance controls:
 * - Cookie consent management
 * - Data export (Right to Data Portability - Article 20)
 * - Data deletion (Right to be Forgotten - Article 17)
 * - Privacy preferences management
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Trash2, Shield, Cookie, AlertTriangle, CheckCircle } from 'lucide-react';
import { getCookieConsent, setCookieConsent, type CookieConsentPreferences } from '@/lib/gdpr/cookie-consent';
import { toast } from 'sonner';

interface PrivacySettingsProps {
  userId: string;
  userEmail: string;
  deletionScheduledAt: string | null;
  accountStatus: string;
}

export function PrivacySettings({
  userId,
  userEmail,
  deletionScheduledAt,
  accountStatus,
}: PrivacySettingsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSchedulingDeletion, setIsSchedulingDeletion] = useState(false);
  const [isCancellingDeletion, setIsCancellingDeletion] = useState(false);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  
  // Get current cookie preferences
  const currentConsent = getCookieConsent() || {
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  };
  
  const [cookiePreferences, setCookiePreferences] = useState<CookieConsentPreferences>(currentConsent);

  const handleExportData = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      // Open the export endpoint in a new window to trigger download
      window.open(`/api/gdpr/export?format=${format}`, '_blank');
      
      toast.success('Data Export Started', {
        description: `Your data is being prepared for download in ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      toast.error('Export Failed', {
        description: 'Failed to export your data. Please try again.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleDeletion = async () => {
    setIsSchedulingDeletion(true);
    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule', gracePeriodDays: 30 }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule deletion');
      }

      const data = await response.json();

      toast.success('Deletion Scheduled', {
        description: `Your account will be permanently deleted on ${new Date(data.scheduledDate).toLocaleDateString()}. You have 30 days to cancel this request.`,
      });

      // Reload the page to show updated status
      window.location.reload();
    } catch (error) {
      toast.error('Deletion Failed', {
        description: 'Failed to schedule account deletion. Please try again.',
      });
    } finally {
      setIsSchedulingDeletion(false);
      setShowDeletionConfirm(false);
    }
  };

  const handleCancelDeletion = async () => {
    setIsCancellingDeletion(true);
    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel deletion');
      }

      toast.success('Deletion Cancelled', {
        description: 'Your account deletion request has been cancelled successfully.',
      });

      // Reload the page to show updated status
      window.location.reload();
    } catch (error) {
      toast.error('Cancellation Failed', {
        description: 'Failed to cancel account deletion. Please try again.',
      });
    } finally {
      setIsCancellingDeletion(false);
    }
  };

  const handleUpdateCookiePreferences = () => {
    setCookieConsent(cookiePreferences);
    toast.success('Preferences Saved', {
      description: 'Your cookie preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Deletion Scheduled Alert */}
      {deletionScheduledAt && accountStatus === 'deletion_scheduled' && (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Account Deletion Scheduled</AlertTitle>
          <AlertDescription>
            Your account is scheduled for deletion on {new Date(deletionScheduledAt).toLocaleDateString()}.
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDeletion}
                disabled={isCancellingDeletion}
              >
                {isCancellingDeletion ? 'Cancelling...' : 'Cancel Deletion'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            <CardTitle>Cookie Preferences</CardTitle>
          </div>
          <CardDescription>
            Manage your cookie and tracking preferences. Changes take effect immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Necessary Cookies</p>
                <p className="text-xs text-muted-foreground">
                  Required for basic site functionality (always enabled)
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePreferences.necessary}
                disabled
                className="h-4 w-4"
                aria-label="Necessary cookies (required)"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Analytics Cookies</p>
                <p className="text-xs text-muted-foreground">
                  Help us improve by tracking site usage
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePreferences.analytics}
                onChange={(e) =>
                  setCookiePreferences({ ...cookiePreferences, analytics: e.target.checked })
                }
                className="h-4 w-4"
                aria-label="Analytics cookies"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Marketing Cookies</p>
                <p className="text-xs text-muted-foreground">
                  Used for personalized advertising
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePreferences.marketing}
                onChange={(e) =>
                  setCookiePreferences({ ...cookiePreferences, marketing: e.target.checked })
                }
                className="h-4 w-4"
                aria-label="Marketing cookies"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Functional Cookies</p>
                <p className="text-xs text-muted-foreground">
                  Enable enhanced functionality and personalization
                </p>
              </div>
              <input
                type="checkbox"
                checked={cookiePreferences.functional}
                onChange={(e) =>
                  setCookiePreferences({ ...cookiePreferences, functional: e.target.checked })
                }
                className="h-4 w-4"
                aria-label="Functional cookies"
              />
            </div>
          </div>

          <Button onClick={handleUpdateCookiePreferences} className="w-full">
            Save Cookie Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <CardTitle>Export Your Data</CardTitle>
          </div>
          <CardDescription>
            Download all your personal data in a portable format (GDPR Article 20: Right to Data Portability)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Your data export includes:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Profile information</li>
              <li>Listings you've created</li>
              <li>Reviews you've written</li>
              <li>Saved items and interactions</li>
              <li>Message history</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleExportData('json')}
              disabled={isExporting}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export as JSON'}
            </Button>
            <Button
              onClick={() => handleExportData('csv')}
              disabled={isExporting}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export as CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Deletion */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            <CardTitle>Delete Your Account</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account and all associated data (GDPR Article 17: Right to be Forgotten)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showDeletionConfirm ? (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Deleting your account will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove all your personal information</li>
                    <li>Delete all your listings (soft delete)</li>
                    <li>Remove your reviews and interactions</li>
                    <li>Delete all your messages</li>
                  </ul>
                  <p className="mt-2 font-medium">
                    You will have a 30-day grace period to cancel this request.
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                variant="destructive"
                onClick={() => setShowDeletionConfirm(true)}
                className="w-full"
                disabled={accountStatus === 'deletion_scheduled'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {accountStatus === 'deletion_scheduled' ? 'Deletion Already Scheduled' : 'Delete My Account'}
              </Button>
            </>
          ) : (
            <>
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Final Confirmation</AlertTitle>
                <AlertDescription>
                  Are you absolutely sure you want to delete your account? This action cannot be undone after the 30-day grace period.
                  <p className="mt-2 font-medium">Account email: {userEmail}</p>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeletionConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleScheduleDeletion}
                  disabled={isSchedulingDeletion}
                  className="flex-1"
                >
                  {isSchedulingDeletion ? 'Scheduling...' : 'Yes, Delete My Account'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Privacy Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Your Privacy Rights</CardTitle>
          </div>
          <CardDescription>
            We respect your privacy and comply with GDPR regulations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Right to Access</p>
              <p className="text-xs text-muted-foreground">
                You can export all your personal data at any time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Right to be Forgotten</p>
              <p className="text-xs text-muted-foreground">
                You can request deletion of your account and all data
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Right to Object</p>
              <p className="text-xs text-muted-foreground">
                You can opt out of cookies and tracking at any time
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Data Portability</p>
              <p className="text-xs text-muted-foreground">
                Export your data in JSON or CSV format for use elsewhere
              </p>
            </div>
          </div>

          <div className="pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              For more information, read our{' '}
              <a href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </a>
              {' '}or{' '}
              <a href="/terms" className="underline hover:text-foreground">
                Terms of Service
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
