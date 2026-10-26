import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InventoryManager } from "@/components/inventory/inventory-manager";

export const metadata: Metadata = {
  title: "Inventory Management | FindAm",
  description: "Manage your inventory and stock levels",
  robots: "noindex",
};

export default async function InventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <InventoryManager userId={user.id} />
    </div>
  );
}
