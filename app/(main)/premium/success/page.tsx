/**
 * Subscription Success Page
 * Displayed after successful subscription payment
 * Requirements: 16.7, 16.10
 */

import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Subscription Successful | FindAm",
  description: "Your subscription has been activated successfully.",
};

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
          <CardDescription>
            Welcome to premium! Your 7-day free trial has started.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Unlimited Listings</p>
                <p className="text-sm text-muted-foreground">
                  Create as many listings as you want
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Advanced Analytics</p>
                <p className="text-sm text-muted-foreground">
                  Track your performance with detailed insights
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Free Boosts</p>
                <p className="text-sm text-muted-foreground">
                  Get free listing boosts every month
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-center">
              You won't be charged until your 7-day trial ends. Cancel anytime
              during the trial with no charges.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/create">Create Your First Listing</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/analytics">View Analytics Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
