"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { parseHardWordsFromExcel, HARD_WORDS_TEMPLATE_URL } from "@/lib/hard-words-import";
import { importHardWordsFromExcel } from "@/lib/hard-word-actions";
import { HARD_WORD_TOPICS } from "@/lib/hard-word-constants";
import { cn } from "@/lib/utils";

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; count: number; sample: string; warnings: string[]; file: File }
  | { status: "error"; messages: string[] };

export function HardWordsBulkImport({
  onClose,
}: {
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      setPreview({
        status: "error",
        messages: ["Поддерживаются только файлы .xlsx и .xls"],
      });
      return;
    }

    setPreview({ status: "loading" });
    setImportError(null);

    try {
      const buffer = await file.arrayBuffer();
      const { words, errors } = parseHardWordsFromExcel(buffer);

      if (words.length === 0) {
        setPreview({
          status: "error",
          messages: errors.length ? errors : ["Файл пустой"],
        });
        return;
      }

      setPreview({
        status: "ok",
        count: words.length,
        sample: words[0].word,
        warnings: errors.filter(Boolean),
        file,
      });
    } catch {
      setPreview({
        status: "error",
        messages: ["Не удалось прочитать файл. Убедитесь, что это корректный Excel-документ"],
      });
    }
  }, []);

  function clearFile() {
    setPreview({ status: "idle" });
    setImportError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleImport() {
    if (preview.status !== "ok") return;

    setImportError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("excelFile", preview.file);
      const result = await importHardWordsFromExcel(fd);

      if (result?.error) {
        setImportError(result.error);
        return;
      }

      onClose();
      router.refresh();
    });
  }

  return (
    <div className="mb-6 space-y-4 rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Импорт из Excel</h3>
            <p className="mt-0.5 text-sm text-text-secondary">
              Добавьте сразу много слов — каждая строка файла это одно слово
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-muted hover:bg-bg-elevated hover:text-text-primary"
          title="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {[
          { step: "1", title: "Скачайте шаблон", description: "Заполните колонки в Excel" },
          { step: "2", title: "Загрузите файл", description: "Перетащите или выберите .xlsx" },
          { step: "3", title: "Импортируйте", description: "Слова появятся в словаре" },
        ].map(({ step, title, description }) => (
          <li
            key={step}
            className="flex gap-3 rounded-xl border border-border/80 bg-bg-elevated/50 px-3 py-3"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
              {step}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
          </li>
        ))}
      </ol>

      <a
        href={HARD_WORDS_TEMPLATE_URL}
        className="flex items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-accent/15"
      >
        <Download className="h-4 w-4" />
        Скачать шаблон Excel (.xlsx)
      </a>

      <div className="rounded-xl border border-border bg-bg-elevated/30 px-4 py-3 text-xs text-text-muted">
        <p className="mb-2 font-medium text-text-secondary">Колонки в файле</p>
        <ul className="space-y-1">
          <li>
            <span className="font-mono text-accent">слово</span> — обязательно
          </li>
          <li>
            <span className="font-mono text-accent">тема</span> — обязательно (
            {HARD_WORD_TOPICS.map((t) => t.label).join(", ")})
          </li>
          <li>
            <span className="font-mono text-accent">значение</span> — обязательно
          </li>
          <li>
            <span className="font-mono text-accent">пример</span> — необязательно
          </li>
        </ul>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void processFile(file);
        }}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors",
          dragOver ? "border-accent bg-accent/5" : "border-border bg-bg-elevated/50",
          pending && "pointer-events-none opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
            else clearFile();
          }}
          disabled={pending}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Загрузить Excel файл со словами"
        />
        <div className="pointer-events-none flex flex-col items-center px-4 py-8 text-center">
          <Upload className="mb-3 h-8 w-8 text-accent/70" />
          {preview.status === "ok" ? (
            <>
              <p className="text-sm font-medium">{preview.file.name}</p>
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

      {preview.status === "loading" && (
        <p className="text-sm text-text-muted">Проверяем файл…</p>
      )}

      {preview.status === "ok" && (
        <div className="space-y-2 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-400">
                Готово к импорту: {preview.count}{" "}
                {preview.count === 1 ? "слово" : preview.count < 5 ? "слова" : "слов"}
              </p>
              <p className="mt-1 text-xs text-text-muted">Первое слово: «{preview.sample}»</p>
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
            <ul className="ml-6 max-h-32 space-y-1 overflow-y-auto text-xs text-yellow-400">
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
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-red-400">
              {preview.messages.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {importError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{importError}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleImport}
          disabled={pending || preview.status !== "ok"}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Импорт…" : "Импортировать"}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
