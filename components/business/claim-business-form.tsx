"use client";

/**
 * Claim Business Form Component
 * Form for submitting business ownership claim with verification
 * Requirements: 23.2, 23.3, 23.4
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle } from "lucide-react";

const claimFormSchema = z.object({
  claim_justification: z.string().min(50, "Please provide at least 50 characters explaining why you're claiming this business"),
  business_email: z.string().email("Please enter a valid business email address"),
  domain: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(val);
  }, "Please enter a valid domain (e.g., example.com)"),
});

type ClaimFormValues = z.infer<typeof claimFormSchema>;

interface ClaimBusinessFormProps {
  businessId: string;
  businessName: string;
  onSuccess?: () => void;
}

export function ClaimBusinessForm({
  businessId,
  businessName,
  onSuccess,
}: ClaimBusinessFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<{
    business_registration?: File;
    tax_id?: File;
  }>({});

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      claim_justification: "",
      business_email: "",
      domain: "",
    },
  });

  const handleDocumentUpload = (type: "business_registration" | "tax_id") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only PDF, JPEG, and PNG files are allowed");
        return;
      }

      setUploadedDocs((prev) => ({ ...prev, [type]: file }));
      toast.success(`${type === "business_registration" ? "Business registration" : "Tax ID"} document uploaded`);
    }
  };

  const onSubmit = async (values: ClaimFormValues) => {
    setLoading(true);

    try {
      // Submit claim request
      const response = await fetch("/api/business-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_profile_id: businessId,
          claim_justification: values.claim_justification,
          business_email: values.business_email,
          domain: values.domain || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit claim");
      }

      const { claim } = await response.json();

      // Upload documents if provided
      if (uploadedDocs.business_registration || uploadedDocs.tax_id) {
        const uploads = [];

        if (uploadedDocs.business_registration) {
          uploads.push(
            fetch(`/api/business-claims/${claim.id}/documents`, {
              method: "POST",
              body: (() => {
                const formData = new FormData();
                formData.append("document_type", "business_registration");
                formData.append("file", uploadedDocs.business_registration);
                return formData;
              })(),
            })
          );
        }

        if (uploadedDocs.tax_id) {
          uploads.push(
            fetch(`/api/business-claims/${claim.id}/documents`, {
              method: "POST",
              body: (() => {
                const formData = new FormData();
                formData.append("document_type", "tax_id");
                formData.append("file", uploadedDocs.tax_id);
                return formData;
              })(),
            })
          );
        }

        await Promise.all(uploads);
      }

      toast.success(
        "Claim submitted successfully! Check your email to verify ownership.",
        { duration: 5000 }
      );

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Claim submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit claim"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="business_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Email *</FormLabel>
              <FormControl>
                <Input
                  placeholder="contact@example.com"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                We'll send a verification email to this address
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Website (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="example.com"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Your business domain for additional verification
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="claim_justification"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Why are you claiming this business? *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="I am the owner/manager of this business and can provide verification documents..."
                  rows={5}
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>
                Explain your relationship to this business (minimum 50 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3">
              Verification Documents (Optional but recommended)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Business Registration Document
                </label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload("business_registration")}
                  disabled={loading}
                  className="cursor-pointer"
                />
                {uploadedDocs.business_registration && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {uploadedDocs.business_registration.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Tax ID Document
                </label>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload("tax_id")}
                  disabled={loading}
                  className="cursor-pointer"
                />
                {uploadedDocs.tax_id && (
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {uploadedDocs.tax_id.name}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Accepted formats: PDF, JPEG, PNG (max 5MB per file)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Claim
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
          <p className="font-medium">What happens next?</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>We'll send a verification email to your business email</li>
            <li>Our team will review your claim and documents</li>
            <li>You'll be notified within 3-5 business days</li>
            <li>Once approved, you'll have full control of this profile</li>
          </ol>
        </div>
      </form>
    </Form>
  );
}
