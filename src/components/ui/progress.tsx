"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gold";
  className?: string;
}

const sizeClasses = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function Progress({
  value,
  max = 100,
  showLabel = false,
  label,
  size = "md",
  variant = "gold",
  className,
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const roundedPercentage = Math.round(percentage);
  const progressLabel = label || "Progresso";

  return (
    <div className={cn("w-full", className)}>
      {(showLabel || label) && (
        <div className="mb-2 flex items-center justify-between text-sm">
          {label && <span className="text-slate-600">{label}</span>}
          {showLabel && (
            <span className="font-medium text-slate-700">{roundedPercentage}%</span>
          )}
        </div>
      )}
      <div
        className={cn(
          "progress-track w-full overflow-hidden rounded-full bg-slate-200",
          sizeClasses[size]
        )}
      >
        <div
          className={cn(
            "progress-bar h-full rounded-full transition-all duration-500 ease-out",
            variant === "gold"
              ? "bg-gradient-to-r from-gold-400 to-gold-500"
              : "bg-slate-600"
          )}
          data-progress={roundedPercentage}
        />
      </div>
    </div>
  );
}

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showValue = true,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D9B256" />
            <stop offset="100%" stopColor="#C9A962" />
          </linearGradient>
        </defs>
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-2xl font-bold text-slate-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}
