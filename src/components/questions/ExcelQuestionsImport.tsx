"use client";

import { useCallback, useRef, useState } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  X,
} from "lucide-react";
import { parseQuestionsFromExcel } from "@/lib/excel-import";
import {
  EXCEL_COLUMNS,
  EXCEL_IMPORT_STEPS,
  EXCEL_TEMPLATE_URL,
  EXCEL_TYPE_HINTS,
} from "@/lib/excel-columns";
import { cn } from "@/lib/utils";
import { sourceTabClass } from "@/lib/form-styles";

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; count: number; sample: string; warnings: string[] }
  | { status: "error"; messages: string[] };

export function ExcelQuestionsImport({
  inputName = "excelFile",
  disabled = false,
}: {
  inputName?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [showColumns, setShowColumns] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setPreview({
        status: "error",
        messages: ["Поддерживаются только файлы .xlsx и .xls"],
      });
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setPreview({ status: "loading" });

    try {
      const buffer = await file.arrayBuffer();
      const { questions, errors } = parseQuestionsFromExcel(buffer);

      if (questions.length === 0) {
        setPreview({ status: "error", messages: errors.length ? errors : ["Файл пустой"] });
        return;
      }

      const warnings = errors.filter(Boolean);
      setPreview({
        status: "ok",
        count: questions.length,
        sample: questions[0].prompt,
        warnings,
      });
    } catch {
      setPreview({
        status: "error",
        messages: ["Не удалось прочитать файл. Убедитесь, что это корректный Excel-документ"],
      });
    }
  }, []);

  function clearFile() {
    setFileName(null);
    setPreview({ status: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    else clearFile();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
      void processFile(file);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <FileSpreadsheet className="h-5 w-5 text-accent" />
        </div>
        <div>
          <h3 className="font-semibold">Импорт из Excel</h3>
          <p className="mt-0.5 text-sm text-text-secondary">
            Загрузите список вопросов одним файлом — быстрее, чем вводить вручную
          </p>
        </div>
      </div>

      {/* Шаги */}
      <ol className="grid gap-2 sm:grid-cols-3 sm:items-stretch">
        {EXCEL_IMPORT_STEPS.map(({ step, title, description }) => (
          <li
            key={step}
            className="flex h-full gap-3 rounded-xl border border-border/80 bg-bg-elevated/50 px-3 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {step}
            </span>
            <div className="flex min-h-[3.25rem] flex-1 flex-col">
              <p className="text-sm font-medium leading-snug">{title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-text-muted">{description}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-xl border border-border/80 bg-bg-elevated/40 px-4 py-3 text-xs leading-relaxed text-text-secondary">
        <p className="font-medium text-text-primary">С чего начать в Excel?</p>
        <ul className="mt-2 space-y-1.5 text-text-muted">
          <li>
            <span className="text-text-secondary">Строка 1</span> — заголовки колонок, не удаляйте и
            не переименовывайте.
          </li>
          <li>
            <span className="text-text-secondary">Строки 2–5</span> — примеры. Замените их своими
            заданиями или удалите, иначе они попадут в тест.
          </li>
          <li>
            <span className="text-text-secondary">Строки 6 и ниже</span> — пустые ячейки для новых
            заданий. Можно копировать строку-пример и менять текст.
          </li>
          <li>Шпаргалка справа — только подсказка, импорт её не читает.</li>
        </ul>
      </div>

      {/* Скачать шаблон */}
      <a
        href={EXCEL_TEMPLATE_URL}
        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/50 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25"
      >
        <Download className="h-4 w-4" />
        Скачать шаблон Excel (.xlsx)
      </a>

      {/* Справка по колонкам */}
      <div className="rounded-xl border border-border bg-bg-elevated/30">
        <button
          type="button"
          onClick={() => setShowColumns(!showColumns)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        >
          <span>Какие колонки нужны в файле</span>
          <ChevronDown
            className={cn("h-4 w-4 text-text-muted transition-transform", showColumns && "rotate-180")}
          />
        </button>
        {showColumns && (
          <div className="border-t border-border px-4 pb-4">
            <div className="mb-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead>
                  <tr className="text-text-muted">
                    <th className="pb-2 pr-3 font-medium">Колонка</th>
                    <th className="pb-2 pr-3 font-medium">Обязательно</th>
                    <th className="pb-2 font-medium">Что писать</th>
                  </tr>
                </thead>
                <tbody className="text-text-secondary">
                  {EXCEL_COLUMNS.map((col) => (
                    <tr key={col.key} className="border-t border-border/50">
                      <td className="py-2 pr-3 font-mono text-accent">
                        {col.key}
                        <span className="ml-1 font-sans text-text-muted">({col.alt})</span>
                      </td>
                      <td className="py-2 pr-3">{col.required ? "да" : "нет"}</td>
                      <td className="py-2">
                        {col.hint}
                        <span className="mt-0.5 block text-text-muted">
                          Пример: {col.example}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 border-t border-border/50 pt-3">
              <p className="text-xs font-medium text-text-secondary">Типы вопросов</p>
              {EXCEL_TYPE_HINTS.map((t) => (
                <p key={t.id} className="text-xs text-text-muted">
                  <span className="font-mono text-accent">{t.id}</span> — {t.label}. Правильный
                  ответ: {t.correctExample}
                  {!t.optionsNeeded && " (колонку «варианты_ответов» оставьте пустой)"}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Зона загрузки */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors",
          dragOver ? "border-accent bg-accent/5" : "border-border bg-bg-elevated/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          name={inputName}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={onInputChange}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Загрузить Excel файл с вопросами"
        />
        <div className="pointer-events-none flex flex-col items-center px-4 py-8 text-center">
          <Upload className="mb-3 h-8 w-8 text-accent/70" />
          {fileName ? (
            <>
              <p className="text-sm font-medium">{fileName}</p>
              <p className="mt-1 text-xs text-text-muted">Нажмите или перетащите другой файл</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">Перетащите файл сюда</p>
              <p className="mt-1 text-xs text-text-muted">или нажмите для выбора .xlsx / .xls</p>
            </>
          )}
        </div>
      </div>

      {/* Предпросмотр */}
      {preview.status === "loading" && (
        <p className="text-sm text-text-muted">Проверяем файл…</p>
      )}

      {preview.status === "ok" && (
        <div className="space-y-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-emerald-100">
                Готово к импорту: {preview.count}{" "}
                {preview.count === 1
                  ? "вопрос"
                  : preview.count < 5
                    ? "вопроса"
                    : "вопросов"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Первый вопрос: «{preview.sample.length > 80 ? preview.sample.slice(0, 80) + "…" : preview.sample}»
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="ml-auto shrink-0 rounded-lg p-1 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
              title="Убрать файл"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {preview.warnings.length > 0 && (
            <ul className="ml-6 space-y-1 text-xs text-yellow-400">
              {preview.warnings.map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {preview.status === "error" && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <ul className="space-y-1 text-sm text-red-400">
              {preview.messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="text-xs text-text-muted">
        В шаблоне подсказка на листе: примеры в строках 2–5 можно заменить или удалить, новые задания —
        в пустых строках ниже.
      </p>
    </div>
  );
}

export type QuestionSourceMode = "template" | "manual" | "excel";

export function QuestionSourceTabs({
  mode,
  onChange,
  templateLabel,
  templateHint,
  templateContent,
}: {
  mode: QuestionSourceMode;
  onChange: (mode: QuestionSourceMode) => void;
  templateLabel: string;
  templateHint?: string;
  templateContent?: React.ReactNode;
}) {
  const tabs = [
    { id: "template" as const, label: templateLabel, hint: "Готовый набор" },
    { id: "manual" as const, label: "Вручную", hint: "По одному" },
    { id: "excel" as const, label: "Из Excel", hint: "Много сразу" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={sourceTabClass(mode === tab.id)}
          >
            <span className="block text-sm font-medium">{tab.label}</span>
            <span className="mt-0.5 block text-[10px] text-text-muted sm:text-xs">{tab.hint}</span>
          </button>
        ))}
      </div>
      {mode === "template" && (templateContent ?? templateHint) && (
        <div className="rounded-xl border border-border bg-bg-elevated/50 px-4 py-3 text-sm text-text-secondary">
          {templateContent ?? templateHint}
        </div>
      )}
    </div>
  );
}