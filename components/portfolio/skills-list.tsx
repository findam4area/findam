"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SkillsListProps {
  skills: string[];
  editable?: boolean;
  onUpdate?: (skills: string[]) => Promise<void>;
}

export function SkillsList({
  skills: initialSkills,
  editable = false,
  onUpdate,
}: SkillsListProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [newSkill, setNewSkill] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    const trimmedSkill = newSkill.trim();

    if (!trimmedSkill) return;

    if (skills.length >= 20) {
      setError("Maximum 20 skills allowed");
      return;
    }

    if (skills.includes(trimmedSkill)) {
      setError("Skill already added");
      return;
    }

    if (trimmedSkill.length > 50) {
      setError("Skill name must be less than 50 characters");
      return;
    }

    setSkills([...skills, trimmedSkill]);
    setNewSkill("");
    setError(null);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((skill) => skill !== skillToRemove));
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    setIsSaving(true);
    setError(null);

    try {
      await onUpdate(skills);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skills");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSkills(initialSkills);
    setNewSkill("");
    setError(null);
    setIsEditing(false);
  };

  if (!editable && skills.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Skills</h3>
        {editable && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            Edit Skills
          </Button>
        )}
      </div>

      {/* Skills Display */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {skills.map((skill) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-naija-green/10 border border-naija-green/30 rounded-full px-4 py-2 flex items-center gap-2"
            >
              <span className="text-naija-green text-sm font-medium">
                {skill}
              </span>
              {isEditing && (
                <button
                  onClick={() => handleRemoveSkill(skill)}
                  aria-label={`Remove ${skill}`}
                  className="text-naija-green/70 hover:text-naija-green transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {skills.length === 0 && !isEditing && (
          <p className="text-gray-400 text-sm">No skills added yet</p>
        )}
      </div>

      {/* Add Skill Input (Edit Mode) */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add a skill (e.g., React, Node.js)"
              maxLength={50}
              disabled={isSaving}
              className="flex-1"
            />
            <Button
              onClick={handleAddSkill}
              disabled={!newSkill.trim() || isSaving}
              size="icon"
              aria-label="Add skill"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? "Saving..." : "Save Skills"}
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            {skills.length}/20 skills • Press Enter to add
          </p>
        </motion.div>
      )}
    </div>
  );
}
