/**
 * Business Claim Service
 * Handles business ownership claim requests with verification workflows
 * Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6
 */

import { createClient } from "@/lib/supabase/server";

export type ClaimStatus = "pending" | "under_review" | "approved" | "rejected" | "expired";
export type VerificationMethod = "business_registration" | "tax_id" | "domain_verification";

export interface BusinessClaimRequest {
  id: string;
  business_profile_id: string;
  claimant_user_id: string;
  status: ClaimStatus;
  verification_methods: VerificationMethod[];
  business_registration_doc: string | null;
  tax_id_doc: string | null;
  additional_docs: string[];
  domain_to_verify: string | null;
  domain_verification_token: string | null;
  domain_verified: boolean;
  domain_verified_at: string | null;
  business_email: string | null;
  email_verification_token: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  claim_justification: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimableBusinessProfile {
  id: string;
  business_name: string;
  display_name: string | null;
  city: string;
  state: string;
  primary_category_id: string;
  average_rating: number;
  review_count: number;
  is_verified: boolean;
  created_at: string;
  pending_claim_count: number;
}

export class BusinessClaimService {
  /**
   * Get all claimable businesses
   * Requirements: 23.1
   */
  async getClaimableBusinesses(filters?: {
    city?: string;
    state?: string;
    category_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<ClaimableBusinessProfile[]> {
    const supabase = await createClient();

    let query = (supabase as any)
      .from("claimable_businesses")
      .select("*");

    if (filters?.city) {
      query = query.eq("city", filters.city);
    }
    if (filters?.state) {
      query = query.eq("state", filters.state);
    }
    if (filters?.category_id) {
      query = query.eq("primary_category_id", filters.category_id);
    }

    query = query
      .order("average_rating", { ascending: false })
      .limit(filters?.limit || 50)
      .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch claimable businesses: ${error.message}`);
    }

    return data as ClaimableBusinessProfile[];
  }

  /**
   * Get claimable business by ID
   * Requirements: 23.1
   */
  async getClaimableBusinessById(businessId: string): Promise<ClaimableBusinessProfile | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("claimable_businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch business: ${error.message}`);
    }

    return data as ClaimableBusinessProfile;
  }

  /**
   * Initiate a business claim
   * Requirements: 23.2, 23.4
   */
  async initiateClaim(params: {
    business_profile_id: string;
    claimant_user_id: string;
    claim_justification: string;
    business_email: string;
    domain?: string;
  }): Promise<BusinessClaimRequest> {
    const supabase = await createClient();

    // Call database function to initiate claim
    const { data, error } = await (supabase as any)
      .rpc("initiate_business_claim", {
        p_business_profile_id: params.business_profile_id,
        p_claimant_user_id: params.claimant_user_id,
        p_claim_justification: params.claim_justification,
        p_business_email: params.business_email,
        p_domain: params.domain || null,
      });

    if (error) {
      throw new Error(`Failed to initiate claim: ${error.message}`);
    }

    // Fetch the created claim
    const claim = await this.getClaimById(data);

    if (!claim) {
      throw new Error("Claim created but not found");
    }

    // Send email verification
    await this.sendEmailVerification(claim.id, params.business_email);

    return claim;
  }

  /**
   * Get claim by ID
   * Requirements: 23.2
   */
  async getClaimById(claimId: string): Promise<BusinessClaimRequest | null> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("business_claim_requests")
      .select("*")
      .eq("id", claimId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch claim: ${error.message}`);
    }

    return data as BusinessClaimRequest;
  }

  /**
   * Get user's claim requests
   * Requirements: 23.2
   */
  async getUserClaims(userId: string): Promise<BusinessClaimRequest[]> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("business_claim_requests")
      .select(`
        *,
        business_profiles:business_profile_id (
          business_name,
          city,
          state
        )
      `)
      .eq("claimant_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user claims: ${error.message}`);
    }

    return data as BusinessClaimRequest[];
  }

  /**
   * Upload verification document
   * Requirements: 23.2, 23.3
   */
  async uploadVerificationDocument(params: {
    claim_id: string;
    user_id: string;
    document_type: "business_registration" | "tax_id" | "additional";
    file: File;
  }): Promise<string> {
    const supabase = await createClient();

    // Verify claim belongs to user
    const claim = await this.getClaimById(params.claim_id);
    if (!claim || claim.claimant_user_id !== params.user_id) {
      throw new Error("Unauthorized");
    }

    if (claim.status !== "pending") {
      throw new Error("Cannot upload documents for non-pending claims");
    }

    // Upload to Supabase Storage
    const fileName = `${params.claim_id}/${params.document_type}_${Date.now()}.${params.file.name.split(".").pop()}`;
    const { data: uploadData, error: uploadError } = await (supabase as any)
      .storage
      .from("verification_documents")
      .upload(fileName, params.file);

    if (uploadError) {
      throw new Error(`Failed to upload document: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = (supabase as any)
      .storage
      .from("verification_documents")
      .getPublicUrl(fileName);

    const documentUrl = urlData.publicUrl;

    // Update claim with document URL
    const updateField =
      params.document_type === "business_registration"
        ? "business_registration_doc"
        : params.document_type === "tax_id"
        ? "tax_id_doc"
        : null;

    if (updateField) {
      const { error: updateError } = await (supabase as any)
        .from("business_claim_requests")
        .update({
          [updateField]: documentUrl,
          verification_methods: (supabase as any).raw(
            `array_append(verification_methods, '${params.document_type}')`
          ),
        })
        .eq("id", params.claim_id);

      if (updateError) {
        console.error("Failed to update claim with document:", updateError);
      }
    } else {
      // Additional document - append to array
      const { error: updateError } = await (supabase as any)
        .from("business_claim_requests")
        .update({
          additional_docs: (supabase as any).raw(
            `array_append(additional_docs, '${documentUrl}')`
          ),
        })
        .eq("id", params.claim_id);

      if (updateError) {
        console.error("Failed to update claim with additional document:", updateError);
      }
    }

    return documentUrl;
  }

  /**
   * Send email verification
   * Requirements: 23.4
   */
  async sendEmailVerification(claimId: string, businessEmail: string): Promise<void> {
    const claim = await this.getClaimById(claimId);
    if (!claim) {
      throw new Error("Claim not found");
    }

    // In a real implementation, this would send an email with the verification link
    // For now, we'll log it
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claims/verify-email?claim_id=${claimId}&token=${claim.email_verification_token}`;
    
    console.log(`Email verification URL for ${businessEmail}: ${verificationUrl}`);

    // TODO: Integrate with email service (e.g., SendGrid, Postmark)
    // await emailService.send({
    //   to: businessEmail,
    //   subject: "Verify your business ownership claim",
    //   body: `Click this link to verify: ${verificationUrl}`
    // });
  }

  /**
   * Verify business email
   * Requirements: 23.4
   */
  async verifyEmail(claimId: string, token: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .rpc("verify_business_email", {
        p_claim_id: claimId,
        p_email_token: token,
      });

    if (error) {
      throw new Error(`Failed to verify email: ${error.message}`);
    }

    return data as boolean;
  }

  /**
   * Verify domain ownership
   * Requirements: 23.3
   */
  async verifyDomain(claimId: string, token: string): Promise<boolean> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .rpc("verify_business_domain", {
        p_claim_id: claimId,
        p_domain_token: token,
      });

    if (error) {
      throw new Error(`Failed to verify domain: ${error.message}`);
    }

    return data as boolean;
  }

  /**
   * Approve claim (admin only)
   * Requirements: 23.5
   */
  async approveClaim(params: {
    claim_id: string;
    admin_user_id: string;
    review_notes?: string;
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .rpc("approve_business_claim", {
        p_claim_id: params.claim_id,
        p_admin_user_id: params.admin_user_id,
        p_review_notes: params.review_notes || null,
      });

    if (error) {
      throw new Error(`Failed to approve claim: ${error.message}`);
    }
  }

  /**
   * Reject claim (admin only)
   * Requirements: 23.5
   */
  async rejectClaim(params: {
    claim_id: string;
    admin_user_id: string;
    rejection_reason: string;
    review_notes?: string;
  }): Promise<void> {
    const supabase = await createClient();

    const { error } = await (supabase as any)
      .rpc("reject_business_claim", {
        p_claim_id: params.claim_id,
        p_admin_user_id: params.admin_user_id,
        p_rejection_reason: params.rejection_reason,
        p_review_notes: params.review_notes || null,
      });

    if (error) {
      throw new Error(`Failed to reject claim: ${error.message}`);
    }
  }

  /**
   * Get claim history
   * Requirements: 23.2
   */
  async getClaimHistory(claimId: string): Promise<Array<{
    id: string;
    previous_status: string | null;
    new_status: string;
    changed_by: string | null;
    change_reason: string | null;
    created_at: string;
  }>> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("business_claim_history")
      .select("*")
      .eq("claim_id", claimId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch claim history: ${error.message}`);
    }

    return data;
  }

  /**
   * Get pending claims for admin review
   * Requirements: 23.2
   */
  async getPendingClaims(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<Array<BusinessClaimRequest & { business_name: string }>> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .from("business_claim_requests")
      .select(`
        *,
        business_profiles:business_profile_id (
          business_name,
          city,
          state
        ),
        claimant:claimant_user_id (
          email,
          raw_user_meta_data
        )
      `)
      .in("status", ["pending", "under_review"])
      .order("created_at", { ascending: true })
      .limit(filters?.limit || 50)
      .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1);

    if (error) {
      throw new Error(`Failed to fetch pending claims: ${error.message}`);
    }

    return data;
  }

  /**
   * Expire old claims (cron job)
   * Requirements: 23.6
   */
  async expireOldClaims(): Promise<number> {
    const supabase = await createClient();

    const { data, error } = await (supabase as any)
      .rpc("expire_old_claims");

    if (error) {
      throw new Error(`Failed to expire old claims: ${error.message}`);
    }

    return data as number;
  }
}

// Export singleton instance
export const businessClaimService = new BusinessClaimService();
