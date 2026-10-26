/**
 * CheckboxField Component
 * 
 * Accessible checkbox with label providing minimum 44x44px touch target
 * 
 * Requirements: 11.3 - Minimum touch target size
 * Task: 10.1
 */

import * as React from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { cn } from "@/lib/utils";

export interface CheckboxFieldProps {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function CheckboxField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: CheckboxFieldProps) {
  return (
    <div className={cn("flex items-start gap-3 min-h-[44px]", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="mt-1"
      />
      <div className="grid gap-1 flex-1">
        <Label
          htmlFor={id}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer",
            disabled && "cursor-not-allowed opacity-70"
          )}
        >
          {label}
        </Label>
        {description && (
          <p className="text-xs text-gray-400 leading-snug">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
