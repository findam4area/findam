/**
 * Saved Searches Page
 * Displays user's saved searches and match feed
 * Requirements: 13.1, 13.2, 13.10
 */

import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SavedSearchManager } from "@/components/search/saved-search-manager";
import { MatchFeed } from "@/components/search/match-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Saved Searches | FindAm",
  description: "Manage your saved searches and view new matches",
};

export default async function SavedSearchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Tabs defaultValue="searches" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="searches">Saved Searches</TabsTrigger>
          <TabsTrigger value="matches">Match Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="searches">
          <SavedSearchManager userId={user.id} />
        </TabsContent>

        <TabsContent value="matches">
          <MatchFeed userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
