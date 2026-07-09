"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Copy, Check, Trash2, KeyRound } from "lucide-react";
import { createStudent, deleteStudent, resetStudentAccessKey } from "@/lib/student-actions";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { btnPrimary } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

type Student = {
  id: string;
  fullName: string;
  accessKey: string;
};

type Group = {
  id: string;
  name: string;
  students: Student[];
};

type CreatedStudent = {
  fullName: string;
  accessKey: string;
};

type PendingCreate = {
  fullName: string;
  accessKey: string;
};

type CreateStudentResult = Awaited<ReturnType<typeof createStudent>>;

function normalizeStudentName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function findDuplicateInGroup(students: Student[], fullName: string) {
  const normalized = normalizeStudentName(fullName);
  return students.find(
    (student) => normalizeStudentName(student.fullName) === normalized
  );
}

function applyCreateResult(
  result: CreateStudentResult | undefined,
  onSuccess: (created: CreatedStudent) => void
): "success" | "duplicate" | "error" {
  if (!result) {
    return "error";
  }

  if ("error" in result && result.error) {
    return "error";
  }

  if ("duplicateName" in result && result.duplicateName) {
    return "duplicate";
  }

  if ("accessKey" in result && result.accessKey && "fullName" in result && result.fullName) {
    onSuccess({ fullName: result.fullName, accessKey: result.accessKey });
    return "success";
  }

  return "error";
}

export function StudentsManager({ group }: { group: Group }) {
  const [showForm, setShowForm] = useState(false);
  const [created, setCreated] = useState<CreatedStudent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateDialog, setDuplicateDialog] = useState<PendingCreate | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return group.students;
    const query = search.trim().toLowerCase();
    return group.students.filter((student) =>
      student.fullName.toLowerCase().includes(query)
    );
  }, [group.students, search]);

  function onCreateSuccess(next: CreatedStudent) {
    setCreated(next);
    setShowForm(false);
    setDuplicateDialog(null);
    router.refresh();
  }

  function runCreate(data: PendingCreate, allowDuplicate: boolean) {
    const formData = new FormData();
    formData.set("groupId", group.id);
    formData.set("fullName", data.fullName);
    if (data.accessKey) {
      formData.set("accessKey", data.accessKey);
    }
    if (allowDuplicate) {
      formData.set("allowDuplicate", "true");
    }

    startTransition(async () => {
      try {
        const result = await createStudent(formData);
        const outcome = applyCreateResult(result, onCreateSuccess);

        if (outcome === "duplicate") {
          setDuplicateDialog({
            fullName:
              (result && "fullName" in result && result.fullName) || data.fullName,
            accessKey: data.accessKey,
          });
          return;
        }

        if (outcome === "error") {
          const message =
            result && "error" in result && typeof result.error === "string"
              ? result.error
              : "Не удалось создать учётную запись. Попробуйте ещё раз.";
          setError(message);
        }
      } catch {
        setError("Не удалось создать учётную запись. Попробуйте ещё раз.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("fullName") ?? "").trim();
    const accessKey = String(formData.get("accessKey") ?? "").trim();

    if (!fullName) {
      setError("Введите ФИО ученика");
      return;
    }

    const pending: PendingCreate = { fullName, accessKey };

    if (findDuplicateInGroup(group.students, fullName)) {
      setDuplicateDialog(pending);
      return;
    }

    runCreate(pending, false);
  }

  function handleDuplicateConfirm() {
    if (!duplicateDialog) return;
    runCreate(duplicateDialog, true);
  }

  function handleDelete(studentId: string) {
    if (!confirm("Удалить учётную запись ученика?")) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", studentId);
      formData.set("groupId", group.id);
      const result = await deleteStudent(formData);
      if (result?.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleResetKey(studentId: string) {
    if (!confirm("Сгенерировать новый ключ доступа? Старый ключ перестанет работать.")) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("studentId", studentId);
      formData.set("groupId", group.id);
      const result = await resetStudentAccessKey(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.accessKey && result?.fullName) {
        setCreated({ fullName: result.fullName, accessKey: result.accessKey });
        router.refresh();
      }
    });
  }

  function copyAccessKey(accessKey: string) {
    navigator.clipboard.writeText(accessKey);
    setCopied(accessKey);
    setTimeout(() => setCopied(null), 2000);
  }

  function copyCredentials(fullName: string, accessKey: string) {
    navigator.clipboard.writeText(
      `Имя: ${fullName}\nКлюч доступа: ${accessKey}\nВход: ${window.location.origin}/login`
    );
    setCopied(accessKey);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <ConfirmDialog
        open={duplicateDialog !== null}
        tone="warning"
        title="Ученик уже есть в группе"
        description={
          duplicateDialog ? (
            <>
              <p>
                Ученик <strong className="text-text-primary">«{duplicateDialog.fullName}»</strong>{" "}
                уже есть в группе.
              </p>
              <p className="mt-2">
                Создать повторную учётную запись с отдельным ключом доступа?
              </p>
              <p className="mt-2 text-xs text-text-muted">
                У каждой записи будет свой ключ — при входе ученик указывает имя и свой ключ.
              </p>
            </>
          ) : null
        }
        confirmLabel="Создать повторную учётную запись"
        cancelLabel="Отмена"
        pending={pending}
        onConfirm={handleDuplicateConfirm}
        onCancel={() => setDuplicateDialog(null)}
      />

      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад к дашборду
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ученики</h1>
          <p className="text-text-secondary">{group.name}</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setCreated(null);
            setError(null);
            setDuplicateDialog(null);
          }}
          className={btnPrimary}
        >
          <Plus className="h-4 w-4" />
          Добавить ученика
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-bg-card/50 p-4 text-sm text-text-secondary">
        Ученик входит на странице входа: указывает <strong className="text-text-primary">точное ФИО</strong> и{" "}
        <strong className="text-text-primary">ключ доступа</strong>, который вы ему выдаёте.
      </div>

      {created && (
        <div className="mb-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="mb-2 text-sm font-medium text-accent">
            Учётная запись создана — передайте ученику:
          </p>
          <div className="space-y-1 font-mono text-sm">
            <p>ФИО: {created.fullName}</p>
            <p>Ключ: {created.accessKey}</p>
          </div>
          <button
            onClick={() => copyCredentials(created.fullName, created.accessKey)}
            className="mt-3 inline-flex items-center gap-2 text-sm text-accent hover:underline"
          >
            {copied === created.accessKey ? (
              <>
                <Check className="h-4 w-4" /> Скопировано
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Скопировать данные для ученика
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 space-y-3 rounded-2xl border border-border bg-bg-card p-4"
        >
          <input type="hidden" name="groupId" value={group.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              name="fullName"
              type="text"
              required
              autoFocus
              placeholder="ФИО ученика (как при входе)"
              className="rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <input
              name="accessKey"
              type="text"
              placeholder="Свой ключ (необязательно)"
              className="rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm uppercase outline-none focus:border-accent"
            />
          </div>
          <p className="text-xs text-text-muted">
            Если ключ не указан — сгенерируется автоматически (8 символов).
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "..." : "Создать учётную запись"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setDuplicateDialog(null);
              }}
              className="rounded-xl border border-border px-4 py-2.5 text-sm text-text-secondary"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {group.students.length > 0 && (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени…"
          className="mb-4 max-w-md"
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-bg-card">
        {group.students.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">
            В группе пока нет учеников. Нажмите «Добавить ученика».
          </p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-8 text-center text-sm text-text-muted">Ничего не найдено</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-muted">
                <th className="px-5 py-3">Имя</th>
                <th className="px-5 py-3">Ключ доступа</th>
                <th className="w-32 px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border/50 transition-colors hover:bg-bg-elevated/50"
                >
                  <td className="px-5 py-3.5 text-sm">
                    <Link
                      href={`/dashboard/group/${group.id}/students/${student.id}`}
                      className="font-medium hover:text-accent hover:underline"
                    >
                      {student.fullName}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => copyAccessKey(student.accessKey)}
                      title="Нажмите, чтобы скопировать ключ"
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-sm transition-colors",
                        copied === student.accessKey
                          ? "text-green-400"
                          : "text-accent hover:bg-accent/10 hover:underline"
                      )}
                    >
                      {copied === student.accessKey ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          {student.accessKey}
                        </>
                      ) : (
                        student.accessKey
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          copyCredentials(student.fullName, student.accessKey)
                        }
                        className="text-text-muted hover:text-accent"
                        title="Скопировать данные"
                      >
                        {copied === student.accessKey ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleResetKey(student.id)}
                        disabled={pending}
                        className="text-text-muted hover:text-accent"
                        title="Сбросить ключ доступа"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        disabled={pending}
                        className="text-text-muted hover:text-red-400"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
