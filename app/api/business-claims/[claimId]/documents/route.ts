/**
 * Business Claim Documents Upload API
 * Handles document uploads for claim verification
 * Requirements: 23.2, 23.3
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { businessClaimService } from "@/lib/services/business-claim";

/**
 * POST /api/business-claims/[claimId]/documents
 * Upload verification document for a claim
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId } = await params;
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("document_type") as
      | "business_registration"
      | "tax_id"
      | "additional";

    if (!file || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields: file, document_type" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, JPEG, and PNG are allowed" },
        { status: 400 }
      );
    }

    // Upload document
    const documentUrl = await businessClaimService.uploadVerificationDocument({
      claim_id: claimId,
      user_id: user.id,
      document_type: documentType,
      file,
    });

    return NextResponse.json({
      document_url: documentUrl,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload document" },
      { status: 500 }
    );
  }
}
