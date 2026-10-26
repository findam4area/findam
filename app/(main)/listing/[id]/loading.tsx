import { ListingDetailSkeleton } from "@/components/ui/skeleton";

export default function ListingDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <ListingDetailSkeleton />
    </div>
  );
}
