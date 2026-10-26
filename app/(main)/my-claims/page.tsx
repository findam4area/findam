/**
 * My Claims Page
 * Displays user's business claim requests with status tracking
 * Requirements: 23.2
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { businessClaimService } from "@/lib/services/business-claim";
import { ClaimsList } from "@/components/business/claims-list";

export default async function MyClaimsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/my-claims");
  }

  // Fetch user's claims
  const claims = await businessClaimService.getUserClaims(user.id);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Business Claims</h1>
        <p className="mt-2 text-gray-600">
          Track the status of your business ownership claim requests
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <h2 className="text-xl font-semibold text-gray-900">No claims yet</h2>
          <p className="mt-2 text-gray-600">
            You haven't claimed any businesses yet. Browse businesses and claim the ones you own.
          </p>
          <a
            href="/businesses"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Browse Businesses
          </a>
        </div>
      ) : (
        <ClaimsList claims={claims} />
      )}
    </div>
  );
}
