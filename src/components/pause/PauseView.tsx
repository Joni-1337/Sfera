"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pause, Trash2, ClipboardList, FlaskConical, BookMarked } from "lucide-react";
import { AccentIcon3D } from "@/components/ui/AccentIcon3D";
import { removeFromPause } from "@/lib/pause-actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PauseItem = {
  id: string;
  type: string;
  assignmentId: string | null;
  testId: string | null;
  hardWordId: string | null;
  title: string;
  note: string;
  createdAt: Date | string;
};

const typeLabels: Record<string, string> = {
  assignment: "Задание",
  test: "Тест",
  hard_word: "Сложное слово",
};

function typeIcon(type: string) {
  switch (type) {
    case "assignment":
      return ClipboardList;
    case "test":
      return FlaskConical;
    case "hard_word":
      return BookMarked;
    default:
      return Pause;
  }
}

function actionLink(item: PauseItem) {
  if (item.type === "assignment" && item.assignmentId) {
    return { href: `/tasks/${item.assignmentId}`, label: "Выполнить задание →" };
  }
  if (item.type === "test" && item.testId) {
    return { href: `/tests/${item.testId}/take`, label: "Пройти тест →" };
  }
  if (item.type === "hard_word") {
    return { href: "/hard-words", label: "Изучить слово →" };
  }
  return null;
}

export function PauseView({
  items: initialItems,
  studentId,
}: {
  items: PauseItem[];
  studentId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(id: string) {
    const snapshot = items;
    setRemovingId(id);
    setItems((current) => current.filter((item) => item.id !== id));

    startTransition(async () => {
      const result = await removeFromPause(id, studentId);
      if (result?.error) {
        setItems(snapshot);
      }
      setRemovingId(null);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Пауза</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Отложенные задания, тесты и слова для повторения
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-bg-card/50 py-16 text-center">
          <AccentIcon3D icon={Pause} size="lg" variant="violet" className="mb-4" />
          <p className="font-medium">Список паузы пуст</p>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            Откладывайте задания, тесты и сложные слова сюда, чтобы вернуться к ним
            позже. Добавить элемент можно из карточки задания, теста или словаря.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = typeIcon(item.type);
            const link = actionLink(item);

            return (
              <li
                key={item.id}
                className={cn(
                  "rounded-xl border border-border bg-bg-card p-4 transition-opacity",
                  removingId === item.id && "opacity-50"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0 text-accent" />
                      <span className="text-xs text-text-muted">
                        {typeLabels[item.type] ?? item.type}
                      </span>
                    </div>
                    <p className="mt-1 font-medium">{item.title}</p>
                    {item.note && (
                      <p className="mt-1 text-sm text-text-secondary">{item.note}</p>
                    )}
                    <p className="mt-2 text-xs text-text-muted">
                      Добавлено {formatDateTime(item.createdAt)}
                    </p>
                    {link && (
                      <Link
                        href={link.href}
                        className="mt-2 inline-block text-sm text-accent hover:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                    title="Убрать из паузы"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Убрать
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
