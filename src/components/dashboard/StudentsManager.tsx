"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Copy, Check, Trash2, KeyRound } from "lucide-react";
import { createStudent, deleteStudent, resetStudentAccessKey } from "@/lib/student-actions";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/SearchInput";

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

function normalizeStudentName(name: string) {
  return name.trim().toLowerCase();
}

function findDuplicateInGroup(students: Student[], fullName: string) {
  const normalized = normalizeStudentName(fullName);
  return students.find((student) => normalizeStudentName(student.fullName) === normalized);
}

export function StudentsManager({ group }: { group: Group }) {
  const [showForm, setShowForm] = useState(false);
  const [created, setCreated] = useState<CreatedStudent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    fullName: string;
    message: string;
  } | null>(null);
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

  function handleSubmit(formData: FormData, allowDuplicate = false) {
    setError(null);

    const fullName = String(formData.get("fullName") ?? "").trim();
    if (!allowDuplicate && findDuplicateInGroup(group.students, fullName)) {
      setDuplicatePrompt({
        fullName,
        message:
          "Ученик с таким именем уже есть в группе. Создать повторную учётную запись с отдельным ключом доступа?",
      });
      return;
    }

    setDuplicatePrompt(null);
    if (allowDuplicate) {
      formData.set("allowDuplicate", "true");
    }

    startTransition(async () => {
      const result = await createStudent(formData);
      if (result?.error) {
        setError(result.error);
      } else if ("duplicateName" in result && result.duplicateName) {
        setDuplicatePrompt({
          fullName: result.fullName ?? fullName,
          message:
            result.message ??
            "Ученик с таким именем уже есть в группе. Создать повторную учётную запись с отдельным ключом доступа?",
        });
      } else if (result?.accessKey && result?.fullName) {
        setCreated({ fullName: result.fullName, accessKey: result.accessKey });
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function onFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget), false);
  }

  function confirmDuplicateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    handleSubmit(new FormData(e.currentTarget), true);
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

  function copyCredentials(fullName: string, accessKey: string) {
    navigator.clipboard.writeText(
      `Имя: ${fullName}\nКлюч доступа: ${accessKey}\nВход: ${window.location.origin}/login`
    );
    setCopied(accessKey);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
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
            setDuplicatePrompt(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
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
          onSubmit={duplicatePrompt ? confirmDuplicateSubmit : onFormSubmit}
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
              onChange={() => setDuplicatePrompt(null)}
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

          {duplicatePrompt && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <p className="font-medium">Ученик «{duplicatePrompt.fullName}» уже есть в группе</p>
              <p className="mt-1 text-amber-100/90">{duplicatePrompt.message}</p>
              <p className="mt-2 text-xs text-amber-100/75">
                У каждой учётной записи будет свой ключ — при входе ученик указывает имя и свой ключ.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {pending
                ? "..."
                : duplicatePrompt
                  ? "Создать повторную учётную запись"
                  : "Создать учётную запись"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setDuplicatePrompt(null);
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
                  <td className="px-5 py-3.5 font-mono text-sm text-accent">
                    {student.accessKey}
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
