import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ServiceListingForm } from "@/components/business";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Plus, Briefcase, Edit, Trash2, Clock } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ action?: string }>;
}

async function getBusinessProfile(id: string, userId?: string) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !profile) {
    return null;
  }

  // Check if user is owner
  const isOwner = userId === profile.user_id;

  // Get services
  const { data: services } = await supabase
    .from("service_listings")
    .select("*")
    .eq("business_profile_id", id)
    .order("created_at", { ascending: false });

  return {
    profile,
    services: services || [],
    isOwner,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("business_name")
    .eq("id", id)
    .single();

  return {
    title: profile ? `${profile.business_name} - Services | FindAm` : "Services | FindAm",
  };
}

export default async function BusinessServicesPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { action } = await searchParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const data = await getBusinessProfile(id, user?.id);

  if (!data) {
    notFound();
  }

  const { profile, services, isOwner } = data;

  // Only owners can see the create form
  const showCreateForm = isOwner && action === "create";

  const handleCreateService = async (formData: any, images: File[]) => {
    "use server";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Upload images to Supabase Storage
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = `${Date.now()}-${i}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("service-images")
        .upload(`${user.id}/${fileName}`, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("service-images")
        .getPublicUrl(uploadData.path);

      imageUrls.push(publicUrl);
    }

    // Create service listing
    const { error } = await supabase
      .from("service_listings")
      .insert({
        business_profile_id: id,
        title: formData.title,
        description: formData.description,
        pricing_model: formData.pricing_model,
        price: formData.price,
        currency: formData.currency,
        duration_text: formData.duration_text,
        image_urls: imageUrls,
        primary_image_url: imageUrls[0],
      });

    if (error) {
      throw error;
    }

    redirect(`/business-profiles/${id}/services`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/business-profiles/${id}`} className="text-sm text-blue-600 hover:underline mb-2 inline-block">
          ← Back to {profile.business_name}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Services</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {services.length} service{services.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {isOwner && !showCreateForm && (
            <Link href={`/business-profiles/${id}/services?action=create`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Service
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Create New Service</h2>
          <ServiceListingForm
            onSubmit={handleCreateService}
            onCancel={() => redirect(`/business-profiles/${id}/services`)}
          />
        </Card>
      )}

      {/* Services Grid */}
      {!showCreateForm && (
        <>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden group hover:shadow-lg transition">
                  <div className="flex gap-4 p-6">
                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
                      <Image
                        src={service.primary_image_url}
                        alt={service.title}
                        fill
                        className="object-cover"
                      />
                      {service.is_featured && (
                        <Badge className="absolute top-2 left-2 bg-amber-600 text-xs">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-xl mb-2">{service.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                        {service.description}
                      </p>
                      {service.duration_text && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration_text}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {service.pricing_model === "custom"
                            ? "Contact for Quote"
                            : service.pricing_model === "hourly"
                            ? `₦${service.price?.toLocaleString()}/hr`
                            : `₦${service.price?.toLocaleString()}`}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {service.pricing_model}
                        </Badge>
                      </div>
                      {isOwner && (
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Services Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isOwner
                  ? "Start showcasing your services to attract customers"
                  : "This business hasn't added any services yet"}
              </p>
              {isOwner && (
                <Link href={`/business-profiles/${id}/services?action=create`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Service
                  </Button>
                </Link>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
