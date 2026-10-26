"use client";

/**
 * Guide Card Component
 * Displays buying guide preview in category browsing
 * Requirements: 22.3
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Eye, Bookmark } from "lucide-react";
import { format } from "date-fns";

interface GuideCardProps {
  guide: {
    id: string;
    title: string;
    content: string;
    view_count: number;
    bookmark_count: number;
    last_updated_at: Date;
  };
  onClick?: () => void;
}

export function GuideCard({ guide, onClick }: GuideCardProps) {
  const preview = guide.content.slice(0, 150) + "...";

  return (
    <Card
      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 rounded-lg p-3">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg mb-2">{guide.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {preview}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              <span>{guide.view_count} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Bookmark className="h-3 w-3" />
              <span>{guide.bookmark_count} bookmarks</span>
            </div>
            <span>Updated {format(guide.last_updated_at, "PP")}</span>
          </div>
        </div>
        <Button size="sm" variant="outline">
          Read Guide
        </Button>
      </div>
    </Card>
  );
}
