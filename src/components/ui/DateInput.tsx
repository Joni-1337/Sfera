"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = [
  { label: "Пн", weekend: false },
  { label: "Вт", weekend: false },
  { label: "Ср", weekend: false },
  { label: "Чт", weekend: false },
  { label: "Пт", weekend: false },
  { label: "Сб", weekend: true },
  { label: "Вс", weekend: true },
];

function parseDateValue(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toInputValue(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateInputValue(date: Date | null | undefined) {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
}

type DateInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue"
> & {
  defaultValue?: string;
  disablePast?: boolean;
};

export function DateInput({
  name,
  defaultValue = "",
  className,
  disablePast = true,
  disabled,
  ...props
}: DateInputProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const initial =
    typeof defaultValue === "string" && defaultValue
      ? parseDateValue(defaultValue)
      : null;

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | null>(initial);
  const [viewMonth, setViewMonth] = useState<Date>(initial ?? today);
  const containerRef = useRef<HTMLDivElement>(null);

  const valueStr = selected ? toInputValue(selected) : "";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) setViewMonth(selected ?? today);
  }, [open, selected, today]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  function isWeekend(date: Date) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  function isPast(date: Date) {
    return disablePast && isBefore(startOfDay(date), today);
  }

  function selectDate(date: Date) {
    if (isPast(date) || disabled) return;
    setSelected(date);
    setOpen(false);
  }

  function clearDate(e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(null);
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block w-full max-w-[13.5rem]", className)}
    >
      <input type="hidden" name={name} value={valueStr} />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex w-full items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm outline-none transition-all",
          "hover:border-accent/40 focus:border-accent",
          open && "border-accent ring-2 ring-accent/20",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-accent" />
        <span className={cn("min-w-0 flex-1 truncate text-left", !selected && "text-text-muted")}>
          {selected ? format(selected, "d MMM yyyy", { locale: ru }) : "Выберите дату"}
        </span>
        {selected && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Очистить дату"
            onClick={clearDate}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                clearDate(e as unknown as React.MouseEvent);
              }
            }}
            className="rounded-md p-0.5 text-text-muted transition-colors hover:bg-bg-card hover:text-text-primary"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
      </button>

      {open && !disabled && (
        <div
          role="dialog"
          aria-label="Календарь"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-[18rem] rounded-2xl border border-border bg-bg-card p-3 shadow-2xl shadow-black/30"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold capitalize">
              {format(viewMonth, "LLLL yyyy", { locale: ru })}
            </p>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map(({ label, weekend }) => (
              <div
                key={label}
                className={cn(
                  "py-1 text-center text-[10px] font-medium uppercase tracking-wide",
                  weekend ? "text-accent/80" : "text-text-muted"
                )}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const weekend = isWeekend(day);
              const past = isPast(day);
              const todayDay = isToday(day);
              const selectedDay = selected ? isSameDay(day, selected) : false;
              const clickable = inMonth && !past;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={!clickable}
                  onClick={() => selectDate(day)}
                  className={cn(
                    "relative flex h-9 w-full items-center justify-center rounded-lg text-sm transition-all",
                    !inMonth && "pointer-events-none opacity-0",
                    inMonth && past && !selectedDay && "cursor-not-allowed text-text-muted/35 line-through decoration-text-muted/30",
                    inMonth &&
                      !past &&
                      !selectedDay &&
                      weekend &&
                      "bg-accent/5 text-text-secondary hover:bg-accent/10",
                    inMonth &&
                      !past &&
                      !selectedDay &&
                      !weekend &&
                      "text-text-primary hover:bg-bg-elevated",
                    todayDay &&
                      !selectedDay &&
                      !past &&
                      "font-semibold ring-2 ring-inset ring-accent/50",
                    todayDay && past && "ring-1 ring-inset ring-border/60",
                    selectedDay &&
                      "bg-accent font-semibold text-white shadow-md shadow-accent/25 hover:bg-accent-hover"
                  )}
                >
                  {format(day, "d")}
                  {todayDay && !selectedDay && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-2 border-t border-border/60 pt-2 text-center text-[10px] text-text-muted">
            Сегодня: {format(today, "d MMMM", { locale: ru })}
          </p>
        </div>
      )}
    </div>
  );
}
