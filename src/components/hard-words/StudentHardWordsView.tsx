"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Lock,
} from "lucide-react";
import { HARD_WORD_TOPICS, hardWordTopicLabel } from "@/lib/hard-word-constants";
import { DailyWordChallenge } from "@/components/hard-words/DailyWordChallenge";
import { WordContentBlocks } from "@/components/hard-words/WordContentBlocks";
import type { DailyWordState } from "@/lib/daily-words-shared";
import {
  filterWordsBySearch,
  getAvailableLetters,
  groupWordsByLetter,
  sortWords,
  type WordSort,
} from "@/lib/hard-words-utils";
import { cn } from "@/lib/utils";

type WordItem = {
  id: string;
  topic: string;
  word: string;
  definition: string;
  example: string;
};

export function StudentHardWordsView({
  words,
  dailyState,
  studentId,
}: {
  words: WordItem[];
  dailyState?: DailyWordState;
  studentId: string;
}) {
  const [topicFilter, setTopicFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<WordSort>("alpha-asc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [challengeActive, setChallengeActive] = useState(false);

  const filtered = useMemo(() => {
    const byTopic =
      topicFilter === "all" ? words : words.filter((w) => w.topic === topicFilter);
    const bySearch = filterWordsBySearch(byTopic, search);
    return sortWords(bySearch, sort);
  }, [words, topicFilter, search, sort]);

  const letterGroups = useMemo(() => groupWordsByLetter(filtered), [filtered]);
  const availableLetters = useMemo(() => getAvailableLetters(filtered), [filtered]);

  function scrollToLetter(letter: string) {
    document.getElementById(`word-letter-${letter}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div>
      <Link
        href="/results"
        className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent"
      >
        <ArrowLeft className="h-4 w-4" />
        К результатам
      </Link>

      <h1 className="mb-1 text-2xl font-bold">Словарь</h1>
      <p className="mb-4 text-sm text-text-secondary">
        Справочник по сложным словам. Прогресс и повторение — в ударном режиме выше.
      </p>

      {dailyState && dailyState.totalWords > 0 && (
        <DailyWordChallenge
          state={dailyState}
          onDictionaryHidden={setChallengeActive}
        />
      )}

      {challengeActive ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/40 px-6 py-12 text-center">
          <Lock className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="font-medium text-text-secondary">Словарь временно скрыт</p>
          <p className="mt-1 text-sm text-text-muted">
            Справочник скрыт во время ударного режима, чтобы не подсматривать
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-3 text-lg font-semibold">Все слова</h2>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по слову, правилу или примеру..."
            className="w-full rounded-xl border border-border bg-bg-elevated py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent"
          />
        </div>
        <button
          type="button"
          onClick={() =>
            setSort((current) => (current === "alpha-asc" ? "alpha-desc" : "alpha-asc"))
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text-secondary hover:border-accent/30 hover:text-accent"
        >
          {sort === "alpha-asc" ? (
            <ArrowDownAZ className="h-4 w-4" />
          ) : (
            <ArrowUpAZ className="h-4 w-4" />
          )}
          {sort === "alpha-asc" ? "А → Я" : "Я → А"}
        </button>
      </div>

      {words.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <TopicChip
            active={topicFilter === "all"}
            onClick={() => setTopicFilter("all")}
            label="Все темы"
          />
          {HARD_WORD_TOPICS.filter((t) => words.some((w) => w.topic === t.id)).map((t) => (
            <TopicChip
              key={t.id}
              active={topicFilter === t.id}
              onClick={() => setTopicFilter(t.id)}
              label={t.label}
            />
          ))}
        </div>
      )}

      {filtered.length > 0 && availableLetters.length > 1 && !search && (
        <div className="sticky top-16 z-10 mb-4 overflow-x-auto rounded-xl border border-border bg-bg-card/95 p-2 backdrop-blur">
          <div className="flex min-w-max gap-1">
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => scrollToLetter(letter)}
                className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium text-text-secondary transition-colors hover:bg-accent/10 hover:text-accent"
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-bg-card/50 py-16 text-center">
          <p className="text-text-secondary">
            {search
              ? "Ничего не найдено — попробуйте другой запрос"
              : "Преподаватель ещё не добавил слова."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {letterGroups.map(({ letter, items }) => (
            <section key={letter} id={`word-letter-${letter}`} className="scroll-mt-28">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-lg font-bold text-accent">
                  {letter}
                </span>
                <span className="text-sm text-text-muted">
                  {items.length}{" "}
                  {items.length === 1 ? "слово" : items.length < 5 ? "слова" : "слов"}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    studentId={studentId}
                    expanded={expandedId === word.id}
                    onToggleExpand={() =>
                      setExpandedId((current) => (current === word.id ? null : word.id))
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="mt-6 text-center text-xs text-text-muted">
          {filtered.length === words.length
            ? `${words.length} слов в словаре`
            : `Показано ${filtered.length} из ${words.length} слов`}
        </p>
      )}
        </>
      )}
    </div>
  );
}

function WordCard({
  word,
  studentId,
  expanded,
  onToggleExpand,
}: {
  word: WordItem;
  studentId: string;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-bg-card transition-colors",
        expanded ? "border-accent/30" : "border-border"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-muted transition-transform",
              expanded && "rotate-180"
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold sm:text-lg">{word.word}</p>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {hardWordTopicLabel(word.topic)}
              {!expanded && word.definition ? ` · ${word.definition}` : ""}
            </p>
          </div>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3 sm:px-5">
          <WordContentBlocks definition={word.definition} example={word.example} compact />
        </div>
      )}
    </article>
  );
}

function TopicChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-accent/20 text-accent ring-1 ring-accent/30"
          : "bg-bg-elevated text-text-secondary hover:text-text-primary"
      )}
    >
      {label}
    </button>
  );
}
