"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> & {
  size?: "sm" | "md";
};

export function Checkbox({ className, size = "md", ...props }: CheckboxProps) {
  const boxSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const iconSize = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";

  return (
    <div className={cn("relative inline-flex shrink-0", boxSize, className)}>
      <input
        type="checkbox"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...props}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[7px] border-2 transition-all duration-200",
          "border-white/15 bg-bg-elevated/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
          "peer-hover:border-accent/40 peer-hover:bg-bg-elevated",
          "peer-checked:border-accent peer-checked:bg-accent peer-checked:shadow-[0_0_16px_-4px] peer-checked:shadow-accent/45",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-accent/45 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-primary",
          "peer-disabled:opacity-50"
        )}
      />
      <Check
        strokeWidth={3}
        className={cn(
          "pointer-events-none absolute inset-0 m-auto text-white",
          iconSize,
          "scale-75 opacity-0 transition-all duration-200",
          "peer-checked:scale-100 peer-checked:opacity-100"
        )}
      />
    </div>
  );
}

export function CheckboxField({
  children,
  className,
  ...props
}: CheckboxProps & { children: React.ReactNode }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 text-sm text-text-secondary transition-colors hover:text-text-primary",
        className
      )}
    >
      <Checkbox className="mt-0.5" {...props} />
      <span className="min-w-0 leading-relaxed">{children}</span>
    </label>
  );
}

export function CheckboxCard({
  title,
  description,
  className,
  children,
  ...props
}: Omit<CheckboxProps, "title" | "size"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex w-full min-w-0 cursor-pointer items-center gap-3.5 rounded-xl border p-4 transition-all duration-200",
        "border-border/80 bg-bg-card hover:border-accent/25 hover:bg-bg-elevated/50",
        "has-[:checked]:border-accent/45 has-[:checked]:bg-accent/[0.08]",
        "has-[:checked]:shadow-[inset_0_0_0_1px_rgba(45,212,191,0.14)]",
        className
      )}
    >
      <Checkbox {...props} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{description}</p>
        )}
        {children}
      </div>
    </label>
  );
}

export function CheckboxOption({
  checked,
  className,
  children,
  ...props
}: CheckboxProps & {
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200",
        "border-border/70 bg-bg-elevated/40 hover:border-accent/25 hover:bg-bg-elevated/80",
        checked &&
          "border-accent/45 bg-accent/10 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.12)]",
        "has-[:checked]:border-accent/45 has-[:checked]:bg-accent/10",
        "has-[:checked]:shadow-[inset_0_0_0_1px_rgba(45,212,191,0.12)]",
        className
      )}
    >
      <Checkbox checked={checked} {...props} />
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
    </label>
  );
}

export function CheckboxRow({
  title,
  description,
  className,
  ...props
}: Omit<CheckboxProps, "title" | "size"> & {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3.5 rounded-xl transition-colors hover:bg-bg-elevated/40",
        className
      )}
    >
      <Checkbox {...props} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-text-muted">{description}</p>
        )}
      </div>
    </label>
  );
}

export function CheckboxFilterItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-all duration-150",
        checked
          ? "bg-accent/10 text-text-primary"
          : "text-text-secondary hover:bg-bg-elevated/70 hover:text-text-primary"
      )}
    >
      <Checkbox size="sm" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="truncate">{label}</span>
    </label>
  );
}
