"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState(0);

  const displayValue = hoverValue || value;

  return (
    <div className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className={cn(
            sizeClasses[size],
            "transition-all duration-200",
            !readonly && "hover:scale-110 cursor-pointer",
            readonly && "cursor-default",
            "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded-full"
          )}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          <span
            className={cn(
              star <= displayValue ? "text-gold-500" : "text-slate-300",
              "transition-colors duration-150"
            )}
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

interface RatingDisplayProps {
  value: number;
  total?: number;
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function RatingDisplay({
  value,
  total,
  size = "sm",
  showValue = true,
  className,
}: RatingDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StarRating value={Math.round(value)} readonly size={size} />
      {showValue && (
        <span className="text-sm text-slate-600">
          {value.toFixed(1)}
          {total !== undefined && ` (${total})`}
        </span>
      )}
    </div>
  );
}
