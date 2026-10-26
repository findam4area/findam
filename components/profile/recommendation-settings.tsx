"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * RecommendationSettings Component
 * Requirements: 7.10
 *
 * Allows users to opt-out of personalized recommendations
 */
export function RecommendationSettings() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadSettings = async () => {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase
          .from("profiles")
          .select("personalized_recommendations_enabled")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setEnabled((data?.personalized_recommendations_enabled as any) ?? true);
      } catch (error) {
        console.error("Error loading recommendation settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleToggle = async (checked: boolean) => {
    if (!user) return;

    try {
      setIsSaving(true);
      const supabase = createClient() as any;

      const { error } = await supabase
        .from("profiles")
        .update({ personalized_recommendations_enabled: checked })
        .eq("id", user.id);

      if (error) throw error;

      setEnabled(checked);
      toast.success(
        checked
          ? "Personalized recommendations enabled"
          : "Personalized recommendations disabled",
      );
    } catch (error) {
      console.error("Error updating recommendation settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-naija-green" aria-hidden="true" />
          <CardTitle className="text-white">
            Personalized Recommendations
          </CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          Control how we personalize your feed based on your activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1 flex-1">
            <Label
              htmlFor="personalized-recommendations"
              className="text-white font-medium"
            >
              Enable Personalized Recommendations
            </Label>
            <p className="text-sm text-gray-400">
              Show listings tailored to your interests, browsing history, and
              preferences
            </p>
          </div>
          <Switch
            id="personalized-recommendations"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || isSaving}
            aria-label="Toggle personalized recommendations"
          />
        </div>

        {!enabled && (
          <Alert className="bg-gray-900/50 border-gray-700">
            <Info className="h-4 w-4 text-neon-cyan" aria-hidden="true" />
            <AlertDescription className="text-gray-300">
              When disabled, you&apos;ll see trending and popular items instead
              of personalized recommendations. We&apos;ll still track basic
              analytics for platform improvement.
            </AlertDescription>
          </Alert>
        )}

        {enabled && (
          <Alert className="bg-naija-green/10 border-naija-green/30">
            <Sparkles className="h-4 w-4 text-naija-green" aria-hidden="true" />
            <AlertDescription className="text-gray-300">
              We use your browsing history, searches, and interactions to show
              you relevant listings. You can provide feedback with thumbs
              up/down to improve recommendations.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
