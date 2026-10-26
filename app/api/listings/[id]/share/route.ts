import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateShareLink,
  generateWhatsAppShareLink,
} from "@/lib/api/interactions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get listing details for Open Graph metadata
    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, title, description, price, thumbnail_url")
      .eq("id", id)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const shareLink = await generateShareLink(id);
    const whatsappLink = await generateWhatsAppShareLink(id);

    return NextResponse.json({
      shareLink,
      whatsappLink,
      listing: {
        title: listing.title,
        description: listing.description,
        price: listing.price,
        image: listing.thumbnail_url,
      },
    });
  } catch (error: any) {
    console.error("Error generating share link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate share link" },
      { status: 500 },
    );
  }
}
