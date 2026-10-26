import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductListingForm } from "@/components/business";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
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

  // Get products
  const { data: products } = await supabase
    .from("product_listings")
    .select("*")
    .eq("business_profile_id", id)
    .order("created_at", { ascending: false });

  return {
    profile,
    products: products || [],
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
    title: profile ? `${profile.business_name} - Products | FindAm` : "Products | FindAm",
  };
}

export default async function BusinessProductsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { action } = await searchParams;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const data = await getBusinessProfile(id, user?.id);

  if (!data) {
    notFound();
  }

  const { profile, products, isOwner } = data;

  // Only owners can see the create form
  const showCreateForm = isOwner && action === "create";

  const handleCreateProduct = async (formData: any, images: File[]) => {
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
        .from("product-images")
        .upload(`${user.id}/${fileName}`, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      imageUrls.push(publicUrl);
    }

    // Create product listing
    const { error } = await supabase
      .from("product_listings")
      .insert({
        business_profile_id: id,
        title: formData.title,
        description: formData.description,
        product_type: formData.product_type,
        price: formData.price,
        currency: formData.currency,
        stock_quantity: formData.stock_quantity || 0,
        low_stock_threshold: formData.low_stock_threshold || 5,
        image_urls: imageUrls,
        primary_image_url: imageUrls[0],
      });

    if (error) {
      throw error;
    }

    redirect(`/business-profiles/${id}/products`);
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
            <h1 className="text-3xl font-bold mb-2">Products</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {products.length} product{products.length !== 1 ? 's' : ''} available
            </p>
          </div>
          {isOwner && !showCreateForm && (
            <Link href={`/business-profiles/${id}/products?action=create`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Create New Product</h2>
          <ProductListingForm
            onSubmit={handleCreateProduct}
            onCancel={() => redirect(`/business-profiles/${id}/products`)}
          />
        </Card>
      )}

      {/* Products Grid */}
      {!showCreateForm && (
        <>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition">
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                    <Image
                      src={product.primary_image_url}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    {!product.is_in_stock && (
                      <Badge className="absolute top-2 left-2 bg-red-600">
                        Out of Stock
                      </Badge>
                    )}
                    {product.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-amber-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl font-bold">₦{product.price.toLocaleString()}</span>
                      <Badge variant="outline">
                        {product.product_type === "physical" ? "Physical" : "Digital"}
                      </Badge>
                    </div>
                    {product.product_type === "physical" && product.is_in_stock && (
                      <p className="text-xs text-gray-500">
                        {product.stock_quantity} in stock
                      </p>
                    )}
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
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Products Yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {isOwner
                  ? "Start showcasing your products to attract customers"
                  : "This business hasn't added any products yet"}
              </p>
              {isOwner && (
                <Link href={`/business-profiles/${id}/products?action=create`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
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
