import { FeedSkeleton, StoryRingSkeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-6">
      {/* Stories skeleton */}
      <StoryRingSkeleton />

      {/* Feed skeleton */}
      <FeedSkeleton />
    </div>
  );
}
