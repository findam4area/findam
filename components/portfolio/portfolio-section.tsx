"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PortfolioGrid } from "./portfolio-grid";
import { PortfolioUploadModal } from "./portfolio-upload-modal";
import { PortfolioLightbox } from "./portfolio-lightbox";
import { CVUpload } from "./cv-upload";
import { SkillsList } from "./skills-list";
import { PortfolioItem, User } from "@/lib/types";
import { toast } from "sonner";

interface PortfolioSectionProps {
  user: User;
  isOwner?: boolean;
}

export function PortfolioSection({
  user,
  isOwner = false,
}: PortfolioSectionProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch portfolio items
  useEffect(() => {
    fetchPortfolioItems();
  }, [user.id]);

  const fetchPortfolioItems = async () => {
    try {
      const response = await fetch(`/api/portfolio?user_id=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch portfolio");

      const { data } = await response.json();
      setPortfolioItems(data || []);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast.error("Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (data: {
    title: string;
    description: string;
    file: File;
  }) => {
    try {
      // Upload media first
      const formData = new FormData();
      formData.append("file", data.file);

      const uploadResponse = await fetch("/api/portfolio/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload media");

      const { url, media_type } = await uploadResponse.json();

      // Create portfolio item
      const createResponse = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          media_url: url,
          media_type,
          display_order: portfolioItems.length,
        }),
      });

      if (!createResponse.ok)
        throw new Error("Failed to create portfolio item");

      const { data: newItem } = await createResponse.json();
      setPortfolioItems([...portfolioItems, newItem]);
      toast.success("Portfolio item added successfully");
    } catch (error) {
      console.error("Error uploading portfolio item:", error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio item?"))
      return;

    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete portfolio item");

      setPortfolioItems(portfolioItems.filter((item) => item.id !== id));
      toast.success("Portfolio item deleted");
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast.error("Failed to delete portfolio item");
    }
  };

  const handleCVUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/portfolio/cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload CV");

      const { url } = await response.json();
      toast.success("CV uploaded successfully");

      // Update local user state (you might want to refresh user data)
      window.location.reload();
    } catch (error) {
      console.error("Error uploading CV:", error);
      throw error;
    }
  };

  const handleCVDelete = async () => {
    try {
      const response = await fetch("/api/portfolio/cv", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete CV");

      toast.success("CV deleted");
      window.location.reload();
    } catch (error) {
      console.error("Error deleting CV:", error);
      throw error;
    }
  };

  const handleSkillsUpdate = async (skills: string[]) => {
    try {
      const response = await fetch("/api/portfolio/skills", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills }),
      });

      if (!response.ok) throw new Error("Failed to update skills");

      toast.success("Skills updated successfully");
    } catch (error) {
      console.error("Error updating skills:", error);
      throw error;
    }
  };

  // Don't show portfolio section if user is not a service provider or job seeker
  if (!isOwner && !user.is_service_provider && !user.is_job_seeker) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Service Provider Portfolio */}
      {(user.is_service_provider || isOwner) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-card border border-dark-border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-naija-green/10 rounded-lg p-3">
                <Briefcase className="w-6 h-6 text-naija-green" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Portfolio</h2>
                <p className="text-sm text-gray-400">Showcase your best work</p>
              </div>
            </div>

            {isOwner && (
              <Button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400">
              Loading portfolio...
            </div>
          ) : (
            <PortfolioGrid
              items={portfolioItems}
              onItemClick={(item) => {
                const index = portfolioItems.findIndex((i) => i.id === item.id);
                setLightboxIndex(index);
              }}
              editable={isOwner}
              onDelete={handleDelete}
            />
          )}
        </motion.div>
      )}

      {/* Job Seeker CV and Skills */}
      {(user.is_job_seeker || isOwner) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-dark-card border border-dark-border rounded-lg p-6 space-y-6"
        >
          {isOwner && (
            <CVUpload
              currentCvUrl={user.cv_url ?? undefined}
              onUpload={handleCVUpload}
              onDelete={handleCVDelete}
            />
          )}

          {!isOwner && user.cv_url && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                CV / Resume
              </h3>
              <a
                href={user.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-naija-green hover:bg-naija-green/80 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Download CV
              </a>
            </div>
          )}

          <SkillsList
            skills={user.skills || []}
            editable={isOwner}
            onUpdate={handleSkillsUpdate}
          />
        </motion.div>
      )}

      {/* Upload Modal */}
      <PortfolioUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PortfolioLightbox
          items={portfolioItems}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
