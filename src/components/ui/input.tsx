import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    // BUG-002 FIX: Auto-set autocomplete for password fields
    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = { ...props };

    if (!inputProps.autoComplete) {
      if (type === "password") {
        inputProps.autoComplete = "current-password";
      } else if (type === "email") {
        inputProps.autoComplete = "email";
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            "flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg transition-all duration-200",
            "placeholder:text-slate-400",
            "focus:border-gold-500 focus:outline-none focus:ring-4 focus:ring-gold-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          ref={ref}
          {...inputProps}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface PhoneInputProps extends Omit<InputProps, "type" | "onChange"> {
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, "");
      
      if (value.length > 11) value = value.slice(0, 11);
      
      if (value.length > 6) {
        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
      } else if (value.length > 0) {
        value = `(${value}`;
      }
      
      e.target.value = value;
      onChange?.(value);
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        placeholder="(11) 99999-9999"
        onChange={handleChange}
        className={cn("text-center text-xl tracking-wider", className)}
        {...props}
      />
    );
  }
);
PhoneInput.displayName = "PhoneInput";

export { Input, PhoneInput };
