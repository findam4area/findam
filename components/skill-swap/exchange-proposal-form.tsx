"use client";

import { useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { ProposeExchangeData } from "@/lib/services/skill-swap";

interface ExchangeProposalFormProps {
  providerId: string;
  providerSkill: string;
  onSubmit: (data: ProposeExchangeData) => Promise<void>;
  onCancel?: () => void;
}

export function ExchangeProposalForm({
  providerId,
  providerSkill,
  onSubmit,
  onCancel,
}: ExchangeProposalFormProps) {
  const [formData, setFormData] = useState<ProposeExchangeData>({
    provider_id: providerId,
    requester_skill: "",
    provider_skill: providerSkill,
    description: "",
    agreed_hours_requester: 1,
    agreed_hours_provider: 1,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Propose Skill Exchange
        </h3>

        <div className="space-y-4">
          {/* What you offer */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              What skill will you provide?{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.requester_skill}
              onChange={(e) =>
                setFormData({ ...formData, requester_skill: e.target.value })
              }
              placeholder="e.g., Web Development"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* What you want */}
          <div>
            <label
              htmlFor="provider-skill"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              What skill do you want?
            </label>
            <input
              id="provider-skill"
              type="text"
              value={formData.provider_skill}
              onChange={(e) =>
                setFormData({ ...formData, provider_skill: e.target.value })
              }
              title="Skill you want to receive"
              placeholder="e.g., Graphic Design"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Project Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              placeholder="Describe what you need help with and what you can offer in return..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Hours Exchange */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="mb-3 flex items-center space-x-2 text-sm font-medium text-gray-900">
              <Clock className="h-4 w-4" />
              <span>Hours Exchange</span>
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="hours-provide"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Hours you'll provide
                </label>
                <input
                  id="hours-provide"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.agreed_hours_requester}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agreed_hours_requester: Number(e.target.value),
                    })
                  }
                  title="Hours you will provide"
                  placeholder="e.g., 5"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="hours-need"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Hours you need
                </label>
                <input
                  id="hours-need"
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.agreed_hours_provider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agreed_hours_provider: Number(e.target.value),
                    })
                  }
                  title="Hours you need"
                  placeholder="e.g., 5"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-gray-600">
              <span>{formData.agreed_hours_requester} hours of your skill</span>
              <ArrowRight className="h-4 w-4" />
              <span>{formData.agreed_hours_provider} hours of their skill</span>
            </div>
          </div>
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
          {submitting ? "Proposing..." : "Propose Exchange"}
        </button>
      </div>
    </form>
  );
}
