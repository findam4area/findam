"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getAllStates,
  getLGAsForState,
  getWardsForLGA,
} from "@/lib/utils/nigerianLocations";

interface LocationPickerProps {
  selectedState?: string;
  selectedLGA?: string;
  selectedWard?: string;
  onStateChange: (state: string) => void;
  onLGAChange: (lga: string) => void;
  onWardChange: (ward: string) => void;
  showWards?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LocationPicker({
  selectedState,
  selectedLGA,
  selectedWard,
  onStateChange,
  onLGAChange,
  onWardChange,
  showWards = true,
  required = false,
  disabled = false,
  className = "",
}: LocationPickerProps) {
  const [availableLGAs, setAvailableLGAs] = useState<string[]>([]);
  const [availableWards, setAvailableWards] = useState<string[]>([]);
  const allStates = getAllStates();

  // Update available LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      const lgas = getLGAsForState(selectedState);
      setAvailableLGAs(lgas);
    } else {
      setAvailableLGAs([]);
    }
  }, [selectedState]);

  // Update available wards when LGA changes
  useEffect(() => {
    if (selectedState && selectedLGA) {
      const wards = getWardsForLGA(selectedState, selectedLGA);
      setAvailableWards(wards);
    } else {
      setAvailableWards([]);
    }
  }, [selectedState, selectedLGA]);

  const handleStateChange = (state: string) => {
    onStateChange(state);
    // Reset LGA and Ward when state changes
    onLGAChange("");
    onWardChange("");
  };

  const handleLGAChange = (lga: string) => {
    onLGAChange(lga);
    // Reset Ward when LGA changes
    onWardChange("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* State Selector */}
      <div>
        <Label htmlFor="state" className="text-sm text-gray-300">
          State
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select
          value={selectedState}
          onValueChange={handleStateChange}
          disabled={disabled}
        >
          <SelectTrigger
            id="state"
            className="bg-dark-bg border-dark-border text-white"
          >
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {allStates.map((state) => (
              <SelectItem key={state} value={state}>
                {state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* LGA Selector */}
      {selectedState && availableLGAs.length > 0 && (
        <div>
          <Label htmlFor="lga" className="text-sm text-gray-300">
            LGA (Local Government Area)
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select
            value={selectedLGA}
            onValueChange={handleLGAChange}
            disabled={disabled}
          >
            <SelectTrigger
              id="lga"
              className="bg-dark-bg border-dark-border text-white"
            >
              <SelectValue placeholder="Select LGA" />
            </SelectTrigger>
            <SelectContent>
              {availableLGAs.map((lga) => (
                <SelectItem key={lga} value={lga}>
                  {lga}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Ward Selector */}
      {showWards && selectedLGA && availableWards.length > 0 && (
        <div>
          <Label htmlFor="ward" className="text-sm text-gray-300">
            Ward
          </Label>
          <Select
            value={selectedWard}
            onValueChange={onWardChange}
            disabled={disabled}
          >
            <SelectTrigger
              id="ward"
              className="bg-dark-bg border-dark-border text-white"
            >
              <SelectValue placeholder="Select ward (optional)" />
            </SelectTrigger>
            <SelectContent>
              {availableWards.map((ward) => (
                <SelectItem key={ward} value={ward}>
                  {ward}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
