"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getLGAsForState } from "@/lib/utils/nigerianLocations";

interface AreaSelectorProps {
  state?: string;
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function AreaSelector({
  state,
  value,
  onValueChange,
  label = "LGA (Local Government Area)",
  placeholder = "Select an LGA",
  required = false,
  error,
  disabled = false,
  className = "",
}: AreaSelectorProps) {
  const lgas = state ? getLGAsForState(state) : [];
  const isDisabled = disabled || !state || lgas.length === 0;

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="area" className="text-sm text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
        <SelectTrigger
          id="area"
          className="bg-dark-bg border-dark-border text-white"
        >
          <SelectValue
            placeholder={
              !state
                ? "Select a state first"
                : lgas.length === 0
                  ? "No LGAs available"
                  : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent>
          {lgas.map((lga) => (
            <SelectItem key={lga} value={lga}>
              {lga}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      {!state && (
        <p className="text-gray-500 text-xs mt-1">
          Please select a state first
        </p>
      )}
    </div>
  );
}
