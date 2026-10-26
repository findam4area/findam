"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CVUploadProps {
  currentCvUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function CVUpload({ currentCvUrl, onUpload, onDelete }: CVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Only PDF and Word documents are allowed");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload CV");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsUploading(true);
    setError(null);

    try {
      await onDelete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete CV");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">CV / Resume</h3>
        {currentCvUrl && (
          <a
            href={currentCvUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-naija-green hover:text-naija-green/80 text-sm flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
      </div>

      {currentCvUrl ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-card border border-dark-border rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-naija-green/10 rounded-lg p-3">
                <FileText className="w-6 h-6 text-naija-green" />
              </div>
              <div>
                <p className="text-white font-medium">CV Uploaded</p>
                <p className="text-sm text-gray-400">
                  Your CV is ready to share with employers
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isUploading}
              className="text-red-400 hover:text-red-300 border-red-400/50 hover:border-red-300/50"
            >
              {isUploading ? "Deleting..." : "Remove"}
            </Button>
          </div>
        </motion.div>
      ) : (
        <div>
          <label
            htmlFor="cv-upload"
            className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-lg p-8 cursor-pointer hover:border-naija-green transition-colors"
          >
            <div className="bg-naija-green/10 rounded-full p-4 mb-4">
              <Upload className="w-8 h-8 text-naija-green" />
            </div>
            <span className="text-white font-medium mb-1">
              Upload your CV / Resume
            </span>
            <span className="text-sm text-gray-400 text-center">
              PDF or Word document • Max 5MB
            </span>
          </label>
          <input
            id="cv-upload"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {isUploading && (
        <div className="text-center text-sm text-gray-400">
          {currentCvUrl ? "Removing CV..." : "Uploading CV..."}
        </div>
      )}
    </div>
  );
}
