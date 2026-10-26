/**
 * GDPR Data Export API Route
 * Requirements: 31.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  exportUserData,
  generateDataExportJSON,
  convertDataExportToCSV,
} from '@/lib/gdpr/data-export';

export async function GET(request: NextRequest) {
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

    // Get format from query params
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';

    if (format === 'json') {
      // Export as JSON
      const jsonData = await generateDataExportJSON(user.id);

      return new NextResponse(jsonData, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="findam-data-export-${Date.now()}.json"`,
        },
      });
    } else if (format === 'csv') {
      // Export as CSV
      const data = await exportUserData(user.id);
      const csvData = convertDataExportToCSV(data);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="findam-data-export-${Date.now()}.csv"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Use json or csv.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
