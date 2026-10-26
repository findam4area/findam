"use client";

/**
 * Buying Guide Viewer Component
 * Displays comprehensive buying guides with checklists and price ranges
 * Requirements: 22.2, 22.4, 22.5, 22.6, 22.8, 22.9
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  DollarSign,
  Bookmark,
  BookmarkCheck,
  Video,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

interface BuyingGuide {
  id: string;
  title: string;
  content: string;
  checklist: ChecklistItem[];
  price_ranges: PriceRanges;
  video_url?: string;
  comparison_chart: ComparisonItem[];
  common_scams: string[];
  key_features: string[];
  market_prices: MarketPrices;
  is_bookmarked?: boolean;
  last_updated_at: Date;
}

interface ChecklistItem {
  id: string;
  text: string;
  category: string;
}

interface PriceRanges {
  new?: { min: number; max: number };
  excellent?: { min: number; max: number };
  good?: { min: number; max: number };
  fair?: { min: number; max: number };
}

interface ComparisonItem {
  name: string;
  specs: Record<string, string | number>;
  price_range: { min: number; max: number };
  rating?: number;
}

interface MarketPrices {
  [itemName: string]: {
    average: number;
    range: { min: number; max: number };
    last_updated: string;
  };
}

interface BuyingGuideViewerProps {
  guide: BuyingGuide;
  onBookmark?: () => void;
}

export function BuyingGuideViewer({
  guide,
  onBookmark,
}: BuyingGuideViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["content"]),
  );
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const toggleChecklistItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "physical":
        return "text-blue-600";
      case "functional":
        return "text-green-600";
      case "documentation":
        return "text-purple-600";
      case "safety":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getConditionLabel = (condition: string) => {
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{guide.title}</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {format(guide.last_updated_at, "PPP")}
          </p>
        </div>
        <Button
          variant={guide.is_bookmarked ? "default" : "outline"}
          onClick={onBookmark}
        >
          {guide.is_bookmarked ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-2" />
              Bookmarked
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </>
          )}
        </Button>
      </div>

      {/* Video Tutorial */}
      {guide.video_url && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Video Tutorial</h2>
          </div>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <iframe
              src={guide.video_url}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Card className="p-6">
        <button
          onClick={() => toggleSection("content")}
          className="w-full flex items-center justify-between mb-4"
        >
          <h2 className="text-xl font-semibold">Buying Guide</h2>
          {expandedSections.has("content") ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>
        {expandedSections.has("content") && (
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap">{guide.content}</p>
          </div>
        )}
      </Card>

      {/* Key Features */}
      {guide.key_features && guide.key_features.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("features")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold">Key Features to Check</h2>
            {expandedSections.has("features") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {expandedSections.has("features") && (
            <ul className="space-y-2">
              {guide.key_features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Inspection Checklist */}
      {guide.checklist && guide.checklist.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("checklist")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold">Inspection Checklist</h2>
            {expandedSections.has("checklist") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {expandedSections.has("checklist") && (
            <div className="space-y-3">
              {guide.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleChecklistItem(item.id)}
                >
                  {checkedItems.has(item.id) ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p
                      className={
                        checkedItems.has(item.id)
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {item.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${getCategoryColor(item.category)}`}
                    >
                      {item.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Price Ranges */}
      {guide.price_ranges && Object.keys(guide.price_ranges).length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("prices")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold">Price Ranges by Condition</h2>
            {expandedSections.has("prices") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {expandedSections.has("prices") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(guide.price_ranges).map(([condition, range]) => (
                <div key={condition} className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">
                      {getConditionLabel(condition)}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold">
                    ₦{range.min.toLocaleString()} - ₦
                    {range.max.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Market Prices */}
      {guide.market_prices && Object.keys(guide.market_prices).length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("market")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold">Market Price Estimates</h2>
            {expandedSections.has("market") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {expandedSections.has("market") && (
            <div className="space-y-3">
              {Object.entries(guide.market_prices).map(([item, data]) => (
                <div
                  key={item}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item}</p>
                    <p className="text-xs text-muted-foreground">
                      Updated: {format(new Date(data.last_updated), "PP")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ₦{data.average.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ₦{data.range.min.toLocaleString()} - ₦
                      {data.range.max.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Comparison Chart */}
      {guide.comparison_chart && guide.comparison_chart.length > 0 && (
        <Card className="p-6">
          <button
            onClick={() => toggleSection("comparison")}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold">Model Comparison</h2>
            {expandedSections.has("comparison") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {expandedSections.has("comparison") && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Model</th>
                    {guide.comparison_chart[0] &&
                      Object.keys(guide.comparison_chart[0].specs).map(
                        (spec) => (
                          <th key={spec} className="text-left p-3">
                            {spec}
                          </th>
                        ),
                      )}
                    <th className="text-left p-3">Price Range</th>
                  </tr>
                </thead>
                <tbody>
                  {guide.comparison_chart.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-3 font-medium">{item.name}</td>
                      {Object.values(item.specs).map((value, i) => (
                        <td key={i} className="p-3">
                          {value}
                        </td>
                      ))}
                      <td className="p-3">
                        ₦{item.price_range.min.toLocaleString()} - ₦
                        {item.price_range.max.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Common Scams */}
      {guide.common_scams && guide.common_scams.length > 0 && (
        <Card className="p-6 border-2 border-red-200 bg-red-50/50">
          <button
            onClick={() => toggleSection("scams")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold text-red-900">
                Common Scams to Avoid
              </h2>
            </div>
            {expandedSections.has("scams") ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </button>
          {expandedSections.has("scams") && (
            <ul className="space-y-3">
              {guide.common_scams.map((scam, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-red-900">{scam}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
