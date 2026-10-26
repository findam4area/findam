"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getAllStates } from "@/lib/utils/nigerianLocations";

interface StateSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function StateSelector({
  value,
  onValueChange,
  label = "State",
  placeholder = "Select a state",
  required = false,
  error,
  disabled = false,
  className = "",
}: StateSelectorProps) {
  const allStates = getAllStates();

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="state" className="text-sm text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id="state"
          className="bg-dark-bg border-dark-border text-white"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allStates.map((state) => (
            <SelectItem key={state} value={state}>
              {state}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
