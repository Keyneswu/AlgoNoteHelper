"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarDate, parseDate } from "@internationalized/date";
import {
  Button,
  Card,
  DateField,
  DateRangePicker,
  Input,
  Label,
  ListBox,
  Pagination,
  RangeCalendar,
  Select,
  TextField,
  toast,
} from "@heroui/react";
import { AppNav } from "@/components/AppNav";
import { DifficultyMultiSelect } from "@/components/DifficultyMultiSelect";
import { NoteCard } from "@/components/NoteCard";
import { TagPicker } from "@/components/TagPicker";
import { useRequireSession } from "@/hooks/useRequireSession";
import { ALL_DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/difficulty";
import type { PracticeNote } from "@/lib/types";

const PAGE_SIZE = 8;

type SortMode = "learning" | "difficulty" | "practiced";
type SortOrder = "asc" | "desc";

type DateRangeValue = {
  start: CalendarDate;
  end: CalendarDate;
} | null;

type CommittedQuery = {
  title: string;
  tags: string[];
  practicedFrom: string | null; // YYYY-MM-DD
  practicedTo: string | null;
};

type NotesListResponse = {
  items: PracticeNote[];
  total: number;
  page: number;
  page_size: number;
};

function calendarToYmd(date: CalendarDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

function ymdToCalendar(ymd: string): CalendarDate | null {
  try {
    return parseDate(ymd);
  } catch {
    return null;
  }
}

/** Local calendar day → UTC ISO bounds for API. */
function localDayStartIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 0, 0, 0, 0).toISOString();
}

function localDayEndIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 23, 59, 59, 999).toISOString();
}

function parseDifficultyParam(values: string[]): DifficultyLevel[] {
  const levels = values
    .map((value) => Number(value))
    .filter((value): value is DifficultyLevel => value === 1 || value === 2 || value === 3);
  return levels.length
    ? ALL_DIFFICULTY_LEVELS.filter((level) => levels.includes(level))
    : [...ALL_DIFFICULTY_LEVELS];
}

function parseSort(raw: string | null): SortMode {
  if (raw === "difficulty" || raw === "practiced") return raw;
  return "learning";
}

function parseOrder(raw: string | null): SortOrder {
  return raw === "desc" ? "desc" : "asc";
}

function rangeFromCommitted(committed: CommittedQuery): DateRangeValue {
  if (!committed.practicedFrom || !committed.practicedTo) return null;
  const start = ymdToCalendar(committed.practicedFrom);
  const end = ymdToCalendar(committed.practicedTo);
  if (!start || !end) return null;
  return { start, end };
}

function buildApiQuery(
  committed: CommittedQuery,
  difficulty: DifficultyLevel[],
  sort: SortMode,
  order: SortOrder,
  page: number,
) {
  const query = new URLSearchParams();
  const title = committed.title.trim();
  if (title) query.set("q", title);
  committed.tags.forEach((tag) => query.append("tags", tag));
  difficulty.forEach((level) => query.append("difficulty", String(level)));
  if (committed.practicedFrom) query.set("practiced_from", localDayStartIso(committed.practicedFrom));
  if (committed.practicedTo) query.set("practiced_to", localDayEndIso(committed.practicedTo));
  query.set("sort", sort);
  if (sort === "difficulty") query.set("order", order);
  query.set("page", String(page));
  return query;
}

function buildUrlQuery(
  committed: CommittedQuery,
  difficulty: DifficultyLevel[],
  sort: SortMode,
  order: SortOrder,
  page: number,
) {
  const query = new URLSearchParams();
  if (committed.title.trim()) query.set("q", committed.title.trim());
  committed.tags.forEach((tag) => query.append("tags", tag));
  const allSelected =
    difficulty.length === ALL_DIFFICULTY_LEVELS.length &&
    ALL_DIFFICULTY_LEVELS.every((level) => difficulty.includes(level));
  if (!allSelected) {
    difficulty.forEach((level) => query.append("difficulty", String(level)));
  }
  if (committed.practicedFrom) query.set("practiced_from", committed.practicedFrom);
  if (committed.practicedTo) query.set("practiced_to", committed.practicedTo);
  if (sort !== "learning") query.set("sort", sort);
  if (sort === "difficulty" && order !== "asc") query.set("order", order);
  if (sort === "difficulty" && order === "asc") query.set("order", "asc");
  if (page > 1) query.set("page", String(page));
  return query;
}

function getPageNumbers(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "ellipsis")[] = [1];
  if (page > 3) pages.push("ellipsis");
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (page < totalPages - 2) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
}

function NotesPageContent() {
  const t = useTranslations("notes.list");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isPending } = useRequireSession();

  const initial = useMemo(() => {
    const title = searchParams.get("q")?.trim() ?? "";
    const tags = searchParams.getAll("tags").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
    const practicedFrom = searchParams.get("practiced_from");
    const practicedTo = searchParams.get("practiced_to");
    const difficulty = parseDifficultyParam(searchParams.getAll("difficulty"));
    const sort = parseSort(searchParams.get("sort"));
    const order = parseOrder(searchParams.get("order"));
    const pageRaw = Number(searchParams.get("page") || "1");
    const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
    const committed: CommittedQuery = {
      title,
      tags,
      practicedFrom: practicedFrom && ymdToCalendar(practicedFrom) ? practicedFrom : null,
      practicedTo: practicedTo && ymdToCalendar(practicedTo) ? practicedTo : null,
    };
    return { committed, difficulty, sort, order, page };
  }, [searchParams]);

  const [notes, setNotes] = useState<PracticeNote[]>([]);
  const [total, setTotal] = useState(0);
  const [draftTitle, setDraftTitle] = useState(initial.committed.title);
  const [draftTags, setDraftTags] = useState(initial.committed.tags);
  const [draftRange, setDraftRange] = useState<DateRangeValue>(rangeFromCommitted(initial.committed));
  const [committed, setCommitted] = useState(initial.committed);
  const [difficulty, setDifficulty] = useState(initial.difficulty);
  const [sort, setSort] = useState(initial.sort);
  const [order, setOrder] = useState(initial.order);
  const [page, setPage] = useState(initial.page);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const skipUrlWriteRef = useRef(true);
  /** Skip the committed/page effect fetch once (explicit search or our own URL write bounce). */
  const skipEffectFetchRef = useRef(false);
  /** True while we are writing the browse URL ourselves (not browser back/forward). */
  const applyingUrlRef = useRef(false);

  // Keep drafts/committed in sync when URL changes (back/forward).
  useEffect(() => {
    // URL navigation is the external source of truth for the complete browse form.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraftTitle(initial.committed.title);
    setDraftTags(initial.committed.tags);
    setDraftRange(rangeFromCommitted(initial.committed));
    setCommitted(initial.committed);
    setDifficulty(initial.difficulty);
    setSort(initial.sort);
    setOrder(initial.order);
    setPage(initial.page);
    if (applyingUrlRef.current) {
      // Our replaceBrowseUrl — don't refetch (would abort the in-flight announced search).
      applyingUrlRef.current = false;
      skipEffectFetchRef.current = true;
      skipUrlWriteRef.current = true;
    } else {
      skipUrlWriteRef.current = true;
    }
  }, [initial]);

  function replaceBrowseUrl(
    nextCommitted: CommittedQuery,
    nextDifficulty: DifficultyLevel[],
    nextSort: SortMode,
    nextOrder: SortOrder,
    nextPage: number,
  ) {
    const query = buildUrlQuery(nextCommitted, nextDifficulty, nextSort, nextOrder, nextPage);
    const qs = query.toString();
    const nextUrl = qs ? `/notes?${qs}` : "/notes";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl === nextUrl) {
      return;
    }
    applyingUrlRef.current = true;
    router.replace(nextUrl);
  }

  async function loadNotes(
    nextCommitted: CommittedQuery,
    nextDifficulty: DifficultyLevel[],
    nextSort: SortMode,
    nextOrder: SortOrder,
    nextPage: number,
    options?: { announce?: boolean },
  ) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    const shouldAnnounce = Boolean(options?.announce);

    setLoading(true);
    setError("");
    const query = buildApiQuery(nextCommitted, nextDifficulty, nextSort, nextOrder, nextPage);
    try {
      const response = await fetch(`/api/bff/notes?${query.toString()}`, {
        signal: controller.signal,
      });
      const data = (await response.json()) as NotesListResponse | { error?: string };
      if (requestId !== requestIdRef.current) return;
      if (!response.ok) {
        const message = (data as { error?: string }).error ?? t("errors.couldNotLoad");
        setError(message);
        if (shouldAnnounce) {
          toast.danger(message, { timeout: 4000 });
        }
        return;
      }
      const list = data as NotesListResponse;
      const items = list.items ?? [];
      const nextTotal = list.total ?? 0;
      setNotes(items);
      setTotal(nextTotal);
      if (shouldAnnounce) {
        if (nextTotal === 0) {
          toast.danger(t("toast.none"), { timeout: 4000 });
        } else {
          toast.success(t("toast.found", { count: nextTotal }), { timeout: 4000 });
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      setError(t("errors.couldNotLoad"));
      if (shouldAnnounce) {
        toast.danger(t("errors.couldNotLoad"), { timeout: 4000 });
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!session) return;
    if (skipEffectFetchRef.current) {
      skipEffectFetchRef.current = false;
      return;
    }
    // Fetching is the intended external synchronization for committed browse state.
    void loadNotes(committed, difficulty, sort, order, page);
    if (skipUrlWriteRef.current) {
      skipUrlWriteRef.current = false;
    } else {
      replaceBrowseUrl(committed, difficulty, sort, order, page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, committed, difficulty, sort, order, page]);

  function commitSearch() {
    const next: CommittedQuery = {
      title: draftTitle.trim(),
      tags: draftTags,
      practicedFrom: draftRange ? calendarToYmd(draftRange.start) : null,
      practicedTo: draftRange ? calendarToYmd(draftRange.end) : null,
    };
    const nextPage = 1;
    // Avoid the committed/page effect starting a second fetch that aborts this one.
    skipEffectFetchRef.current = true;
    setPage(nextPage);
    setCommitted(next);
    void loadNotes(next, difficulty, sort, order, nextPage, { announce: true });
    replaceBrowseUrl(next, difficulty, sort, order, nextPage);
  }

  function onSortChange(value: string) {
    setPage(1);
    if (value === "difficulty_asc") {
      setSort("difficulty");
      setOrder("asc");
    } else if (value === "difficulty_desc") {
      setSort("difficulty");
      setOrder("desc");
    } else if (value === "practiced") {
      setSort("practiced");
      setOrder("asc");
    } else {
      setSort("learning");
      setOrder("asc");
    }
  }

  function onDifficultyChange(next: DifficultyLevel[]) {
    setPage(1);
    setDifficulty(next);
  }

  const sortSelectValue =
    sort === "difficulty"
      ? order === "desc"
        ? "difficulty_desc"
        : "difficulty_asc"
      : sort === "practiced"
        ? "practiced"
        : "learning";

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(page * PAGE_SIZE, total);

  if (isPending || !session) return null;
  return (
    <div className="min-h-screen bg-canvas">
      <AppNav />
      <main className="mx-auto max-w-6xl space-y-6 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-accent">{tCommon("practiceArchive")}</p>
            <h1 className="text-3xl font-semibold text-foreground">{t("heading")}</h1>
          </div>
          <Link
            href="/notes/new"
            className="rounded-md bg-accent-emphasis px-3 py-2 text-sm font-medium text-accent-foreground hover:bg-accent"
          >
            {t("newNote")}
          </Link>
        </div>
        <Card className="border border-border bg-surface">
          <Card.Content>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                commitSearch();
              }}
            >
              <TextField name="title" value={draftTitle} onChange={setDraftTitle}>
                <Label>{t("filters.title")}</Label>
                <Input placeholder={t("filters.titlePlaceholder")} />
              </TextField>
              <TagPicker
                variant="filter"
                value={draftTags}
                onChange={setDraftTags}
                label={t("filters.tags")}
              />
              <DateRangePicker
                className="w-full"
                value={draftRange}
                onChange={(value) => {
                  setDraftRange(
                    value?.start && value?.end
                      ? { start: value.start as CalendarDate, end: value.end as CalendarDate }
                      : null,
                  );
                }}
              >
                <Label>{t("filters.practicedRange")}</Label>
                <DateField.Group fullWidth>
                  <DateField.Input slot="start">
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateRangePicker.RangeSeparator />
                  <DateField.Input slot="end">
                    {(segment) => <DateField.Segment segment={segment} />}
                  </DateField.Input>
                  <DateField.Suffix>
                    <DateRangePicker.Trigger>
                      <DateRangePicker.TriggerIndicator />
                    </DateRangePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DateRangePicker.Popover>
                  <RangeCalendar aria-label={t("filters.practicedRange")}>
                    <RangeCalendar.Header>
                      <RangeCalendar.YearPickerTrigger>
                        <RangeCalendar.YearPickerTriggerHeading />
                        <RangeCalendar.YearPickerTriggerIndicator />
                      </RangeCalendar.YearPickerTrigger>
                      <RangeCalendar.NavButton slot="previous" />
                      <RangeCalendar.NavButton slot="next" />
                    </RangeCalendar.Header>
                    <RangeCalendar.Grid>
                      <RangeCalendar.GridHeader>
                        {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
                      </RangeCalendar.GridHeader>
                      <RangeCalendar.GridBody>
                        {(date) => <RangeCalendar.Cell date={date} />}
                      </RangeCalendar.GridBody>
                    </RangeCalendar.Grid>
                    <RangeCalendar.YearPickerGrid>
                      <RangeCalendar.YearPickerGridBody>
                        {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                      </RangeCalendar.YearPickerGridBody>
                    </RangeCalendar.YearPickerGrid>
                  </RangeCalendar>
                </DateRangePicker.Popover>
              </DateRangePicker>
              <DifficultyMultiSelect
                value={difficulty}
                onChange={onDifficultyChange}
                legend={t("filters.difficulty")}
              />
              <Select
                className="w-full"
                value={sortSelectValue}
                onChange={(value) => {
                  if (typeof value === "string") onSortChange(value);
                }}
              >
                <Label>{t("filters.sort")}</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {(
                      [
                        ["learning", "sortLearning"],
                        ["difficulty_asc", "sortDifficultyAsc"],
                        ["difficulty_desc", "sortDifficultyDesc"],
                        ["practiced", "sortPracticed"],
                      ] as const
                    ).map(([id, labelKey]) => (
                      <ListBox.Item key={id} id={id} textValue={t(`filters.${labelKey}`)}>
                        {t(`filters.${labelKey}`)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <div className="flex items-end">
                <Button type="submit" isDisabled={loading}>
                  {t("filters.search")}
                </Button>
              </div>
            </form>
          </Card.Content>
        </Card>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="grid gap-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} href={`/notes/${note.id}`} />
          ))}
          {!loading && !notes.length && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted">
              {t("empty")}
            </p>
          )}
        </div>
        {total > 0 && (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <Pagination.Summary className="text-sm text-muted">
              {t("filters.pageSummary", { from: pageFrom, to: pageTo, total })}
            </Pagination.Summary>
            <Pagination className="justify-center">
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <Pagination.PreviousIcon />
                  </Pagination.Previous>
                </Pagination.Item>
                {getPageNumbers(page, totalPages).map((item, index) =>
                  item === "ellipsis" ? (
                    <Pagination.Item key={`e-${index}`}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  ) : (
                    <Pagination.Item key={item}>
                      <Pagination.Link isActive={item === page} onPress={() => setPage(item)}>
                        {item}
                      </Pagination.Link>
                    </Pagination.Item>
                  ),
                )}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        )}
      </main>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesPageContent />
    </Suspense>
  );
}
