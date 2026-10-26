/**
 * Create Live Session Page
 *
 * Allows verified sellers to create and start live streaming sessions.
 *
 * Requirements: 2.1
 * Task: 19.1
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateLiveSessionForm } from "./CreateLiveSessionForm";

export const metadata: Metadata = {
  title: "Start Live Session - FindAm",
  description: "Start a live streaming session to showcase your products",
};

export default async function CreateLiveSessionPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/live/create");
  }

  // Check if user is verified seller
  const { data: profile } = await supabase
    .from("users")
    .select("nin_verified, video_verified")
    .eq("id", user.id)
    .single();

  const isVerified = profile?.nin_verified || profile?.video_verified;

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Verification Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be a verified seller to start live sessions. Complete
            your verification to unlock this feature.
          </p>
          <a
            href="/profile/verification"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Verified
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Start Live Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create a live streaming session to showcase your products and engage
            with buyers in real-time.
          </p>
        </div>

        <CreateLiveSessionForm userId={user.id} />
      </div>
    </div>
  );
}
