"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps
  extends BaseFieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  as?: "input";
}

interface TextareaFieldProps
  extends BaseFieldProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  as: "textarea";
}

type FormFieldProps = InputFieldProps | TextareaFieldProps;

export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  FormFieldProps
>(function FormField(props, ref) {
  const { label, error, hint, required, className, ...rest } = props;
  const isTextarea = "as" in props && props.as === "textarea";
  const id = props.id || props.name || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={id}
        className={cn(
          "text-sm font-medium",
          error ? "text-destructive" : "text-foreground"
        )}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      {isTextarea ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={id}
          className={cn(
            "flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-3",
            "text-sm placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          id={id}
          className={cn(
            "rounded-xl px-4 py-3 h-auto",
            "transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {(error || hint) && (
        <p
          className={cn(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
});

export default FormField;
