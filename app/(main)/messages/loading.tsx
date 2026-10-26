import { MessageListSkeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="glass-card rounded-xl h-full p-4">
        <div className="animate-pulse h-8 w-48 bg-gray-800/50 rounded-lg mb-6" />
        <MessageListSkeleton />
      </div>
    </div>
  );
}
