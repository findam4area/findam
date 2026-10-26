/**
 * GDPR Data Deletion API Route
 * Requirements: 31.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scheduleDataDeletion, cancelDataDeletion } from '@/lib/gdpr/data-deletion';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, gracePeriodDays } = body;

    if (action === 'schedule') {
      // Schedule data deletion with grace period
      const result = await scheduleDataDeletion(
        user.id,
        gracePeriodDays || 30
      );

      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to schedule data deletion' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Data deletion scheduled successfully',
        scheduledDate: result.scheduledDate,
      });
    } else if (action === 'cancel') {
      // Cancel scheduled deletion
      const success = await cancelDataDeletion(user.id);

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to cancel data deletion' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Data deletion cancelled successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "schedule" or "cancel".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Data deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to process data deletion request' },
      { status: 500 }
    );
  }
}
