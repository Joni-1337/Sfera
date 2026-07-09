"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending?: boolean;
  tone?: "default" | "warning";
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Подтвердить",
  cancelLabel = "Отмена",
  onConfirm,
  onCancel,
  pending = false,
  tone = "default",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="overlay-enter fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/70"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="panel-enter-down relative w-full max-w-md rounded-2xl border border-border bg-bg-card p-6 shadow-2xl shadow-black/50"
      >
        <h2
          id="confirm-dialog-title"
          className={cn(
            "text-lg font-semibold",
            tone === "warning" ? "text-amber-200" : "text-text-primary"
          )}
        >
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed text-text-secondary">{description}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary hover:bg-bg-elevated disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50",
              tone === "warning"
                ? "bg-amber-500 hover:bg-amber-400"
                : "bg-accent hover:bg-accent-hover"
            )}
          >
            {pending ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
