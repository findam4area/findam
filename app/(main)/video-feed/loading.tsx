/**
 * Video Feed Loading State
 */

import { Loader2 } from "lucide-react";

export default function VideoFeedLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <Loader2 className="w-12 h-12 text-white animate-spin" />
    </div>
  );
}
