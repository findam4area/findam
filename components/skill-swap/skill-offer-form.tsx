"use client";

import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { CreateSkillOfferData } from "@/lib/services/skill-swap";

interface SkillOfferFormProps {
  onSubmit: (data: CreateSkillOfferData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<CreateSkillOfferData>;
}

const SKILL_CATEGORIES = [
  { value: "graphic_design", label: "Graphic Design" },
  { value: "tutoring", label: "Tutoring" },
  { value: "photography", label: "Photography" },
  { value: "tech_support", label: "Tech Support" },
  { value: "writing", label: "Writing" },
  { value: "translation", label: "Translation" },
  { value: "video_editing", label: "Video Editing" },
  { value: "music", label: "Music" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

const COMMON_SKILLS = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Logo Design",
  "Content Writing",
  "Copywriting",
  "Video Editing",
  "Photo Editing",
  "Social Media Management",
  "SEO",
  "Data Analysis",
  "Tutoring",
  "Translation",
  "Voice Over",
  "Animation",
];

export function SkillOfferForm({
  onSubmit,
  onCancel,
  initialData,
}: SkillOfferFormProps) {
  const [formData, setFormData] = useState<CreateSkillOfferData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
    skill_tags: initialData?.skill_tags || [],
    open_to_exchange: initialData?.open_to_exchange ?? true,
    hourly_rate: initialData?.hourly_rate,
    exchange_preferences: initialData?.exchange_preferences || {
      preferred_skills: [],
      max_hours: 10,
      min_hours: 1,
    },
    portfolio_items: initialData?.portfolio_items || [],
    availability: initialData?.availability || {
      days: [],
      hours: "",
      timezone: "WAT",
    },
  });

  // Ensure portfolio_items is always an array
  const portfolioItems = formData.portfolio_items || [];

  const [newTag, setNewTag] = useState("");
  const [newPortfolioItem, setNewPortfolioItem] = useState({
    title: "",
    url: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const addSkillTag = () => {
    if (newTag.trim() && !formData.skill_tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        skill_tags: [...formData.skill_tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeSkillTag = (tag: string) => {
    setFormData({
      ...formData,
      skill_tags: formData.skill_tags.filter((t) => t !== tag),
    });
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title && newPortfolioItem.url) {
      setFormData({
        ...formData,
        portfolio_items: [...portfolioItems, newPortfolioItem],
      });
      setNewPortfolioItem({ title: "", url: "", description: "" });
    }
  };

  const removePortfolioItem = (index: number) => {
    setFormData({
      ...formData,
      portfolio_items: portfolioItems.filter((_, i) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Basic Information
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Professional Logo Design Services"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="skill-category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="skill-category"
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              title="Select skill category"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              placeholder="Describe your skills and what you can offer..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Skills & Tags */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Skills & Tags
        </h3>

        {/* Common Skills */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Quick Add
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => {
                  if (!formData.skill_tags.includes(skill)) {
                    setFormData({
                      ...formData,
                      skill_tags: [...formData.skill_tags, skill],
                    });
                  }
                }}
                disabled={formData.skill_tags.includes(skill)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm transition-colors hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Tags */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Add Custom Skills
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addSkillTag())
              }
              placeholder="Enter a skill..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addSkillTag}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
              aria-label="Add skill tag"
              title="Add skill tag"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Selected Tags */}
        {formData.skill_tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {formData.skill_tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center space-x-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => removeSkillTag(tag)}
                  className="hover:text-blue-900"
                  aria-label={`Remove ${tag} tag`}
                  title={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Exchange Preferences */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Exchange Preferences
        </h3>

        <div className="space-y-4">
          {/* Open to Exchange */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.open_to_exchange}
              onChange={(e) =>
                setFormData({ ...formData, open_to_exchange: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Open to skill exchange (swap services)
            </span>
          </label>

          {/* Hourly Rate */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Hourly Rate (₦) - Optional
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={formData.hourly_rate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  hourly_rate: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="Leave empty if only exchanging"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Hours Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="min-hours"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Min Hours
              </label>
              <input
                id="min-hours"
                type="number"
                min="1"
                value={formData.exchange_preferences?.min_hours || 1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exchange_preferences: {
                      ...formData.exchange_preferences,
                      min_hours: Number(e.target.value),
                    },
                  })
                }
                title="Minimum hours for exchange"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="max-hours"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Max Hours
              </label>
              <input
                id="max-hours"
                type="number"
                min="1"
                value={formData.exchange_preferences?.max_hours || 10}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    exchange_preferences: {
                      ...formData.exchange_preferences,
                      max_hours: Number(e.target.value),
                    },
                  })
                }
                title="Maximum hours for exchange"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Portfolio (Optional)
        </h3>

        <div className="space-y-4">
          {/* Add Portfolio Item */}
          <div className="space-y-2">
            <input
              type="text"
              value={newPortfolioItem.title}
              onChange={(e) =>
                setNewPortfolioItem({
                  ...newPortfolioItem,
                  title: e.target.value,
                })
              }
              placeholder="Project title"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="url"
              value={newPortfolioItem.url}
              onChange={(e) =>
                setNewPortfolioItem({
                  ...newPortfolioItem,
                  url: e.target.value,
                })
              }
              placeholder="Project URL"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <textarea
              value={newPortfolioItem.description}
              onChange={(e) =>
                setNewPortfolioItem({
                  ...newPortfolioItem,
                  description: e.target.value,
                })
              }
              placeholder="Brief description"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addPortfolioItem}
              className="flex items-center space-x-2 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
            >
              <Upload className="h-4 w-4" />
              <span>Add Portfolio Item</span>
            </button>
          </div>

          {/* Portfolio Items List */}
          {portfolioItems.length > 0 && (
            <div className="space-y-2">
              {portfolioItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {item.url}
                    </a>
                    {item.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removePortfolioItem(index)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label={`Remove ${item.title} from portfolio`}
                    title={`Remove ${item.title}`}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
        >
          {submitting ? "Creating..." : "Create Skill Offer"}
        </button>
      </div>
    </form>
  );
}
