import { Fragment, useMemo, useRef, useState } from "react";
import {
  DownloadIcon,
  ImportIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SettingsIcon,
  TagsIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { JournalTag, SavedSession } from "../types";
import { Button } from "./ui/button";
import { formatBytes, formatClockMs } from "../lib/format";
import { getTagSessionCounts, tagPillStyle } from "../journal/tags";
import { JournalTagPicker } from "./JournalTagPicker";
import { JournalTagManager } from "./JournalTagManager";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type Props = {
  sessions: SavedSession[];
  tags: JournalTag[];
  activeSessionId?: string | null;
  activeTagId: string | null;
  totalStorageBytes: number;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onTagChange: (id: string, tagIds: string[]) => void;
  onCreateTag: (label: string, color: string) => JournalTag | null;
  onUpdateTag: (id: string, label: string, color: string) => void;
  onDeleteTag: (id: string) => void;
  onTagFilterChange: (tagId: string | null) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  canExport?: boolean;
};

export function JournalPanel({
  sessions,
  tags,
  activeSessionId,
  activeTagId,
  totalStorageBytes,
  onLoad,
  onRename,
  onTagChange,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  onTagFilterChange,
  onDelete,
  onDownload,
  onExport,
  onImport,
  canExport,
}: Props) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const tagCounts = useMemo(() => getTagSessionCounts(sessions), [sessions]);
  const visibleSessions = useMemo(
    () =>
      activeTagId
        ? sessions.filter((session) => session.tagIds.includes(activeTagId))
        : sessions,
    [activeTagId, sessions],
  );
  const sessionsByDay = useMemo(() => groupSessionsByDay(visibleSessions), [visibleSessions]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 p-4">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("journal.sessions", { count: sessions.length })}
            {sessions.length > 0 && (
              <span className="ml-1 font-normal normal-case tracking-normal">
                · {formatBytes(totalStorageBytes)}
              </span>
            )}
          </p>
          <div className="grid w-full grid-cols-2 gap-1 sm:flex sm:w-auto sm:items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  onImport(file);
                }
                event.currentTarget.value = "";
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex sm:inline-flex">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-full justify-center gap-1.5 rounded-full px-2 text-xs sm:px-3 lg:w-8 lg:px-0"
                    aria-label={t("journal.importJournal")}
                  >
                    <ImportIcon className="size-3.5" />
                    <span className="hidden min-[360px]:inline lg:sr-only">
                      {t("journal.import")}
                    </span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="hidden lg:inline-flex">
                {t("journal.importJournal")}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex sm:inline-flex">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onExport}
                    disabled={!(canExport ?? sessions.length > 0)}
                    className="h-8 w-full justify-center gap-1.5 rounded-full px-2 text-xs sm:px-3 lg:w-8 lg:px-0"
                    aria-label={t("journal.exportJournal")}
                  >
                    <DownloadIcon className="size-3.5" />
                    <span className="hidden min-[360px]:inline lg:sr-only">
                      {t("journal.export")}
                    </span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="hidden lg:inline-flex">
                {t("journal.exportJournal")}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onTagFilterChange(null)}
            className={`h-8 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors ${
              activeTagId == null
                ? "border-slate-700 bg-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
            aria-pressed={activeTagId == null}
          >
            {t("journal.allTags")} · {sessions.length}
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => onTagFilterChange(tag.id)}
              className="h-8 max-w-[12rem] shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors"
              style={tagPillStyle(tag, activeTagId === tag.id)}
              aria-pressed={activeTagId === tag.id}
              title={tag.label}
            >
              <span className="truncate">
                {tag.label} · {tagCounts.get(tag.id) ?? 0}
              </span>
            </button>
          ))}
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setTagManagerOpen(true)}
            aria-label={t("journal.manageTags")}
            className="size-8 shrink-0 rounded-full"
          >
            <SettingsIcon className="size-3.5" />
          </Button>
        </div>
      </div>
      <JournalTagManager
        open={tagManagerOpen}
        onOpenChange={setTagManagerOpen}
        tags={tags}
        sessions={sessions}
        onUpdateTag={onUpdateTag}
        onDeleteTag={onDeleteTag}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("journal.noSessions")}
          </p>
        ) : visibleSessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {t("journal.noTaggedSessions")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sessionsByDay.map((group) => (
              <Fragment key={group.key}>
                <li className="sticky top-0 z-10 bg-white/95 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 backdrop-blur">
                  {formatDayLabel(group.date, t)}
                </li>
                {group.sessions.map((session) => (
                  <JournalRow
                    key={session.id}
                    session={session}
                    tags={tags}
                    active={session.id === activeSessionId}
                    audioSizeBytes={session.audioBlob.size}
                    onLoad={() => onLoad(session.id)}
                    onRename={(name) => onRename(session.id, name)}
                    onTagChange={(tagIds) => onTagChange(session.id, tagIds)}
                    onCreateTag={onCreateTag}
                    onDelete={() => onDelete(session.id)}
                    onDownload={() => onDownload(session.id)}
                  />
                ))}
              </Fragment>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function JournalRow({
  session,
  tags,
  active,
  audioSizeBytes,
  onLoad,
  onRename,
  onTagChange,
  onCreateTag,
  onDelete,
  onDownload,
}: {
  session: SavedSession;
  tags: JournalTag[];
  active: boolean;
  audioSizeBytes: number;
  onLoad: () => void;
  onRename: (name: string) => void;
  onTagChange: (tagIds: string[]) => void;
  onCreateTag: (label: string, color: string) => JournalTag | null;
  onDelete: () => void;
  onDownload: () => void;
}) {
  const { t } = useTranslation();
  const [actionsOpen, setActionsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [draft, setDraft] = useState(session.name);
  const sessionTags = tags.filter((tag) => session.tagIds.includes(tag.id));
  const dateLabel = new Date(session.createdAt).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  function commitRename() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(trimmed);
    } else {
      setDraft(session.name);
    }
    setEditDialogOpen(false);
  }

  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        active
          ? "border-slate-400 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onLoad}
            className="w-full truncate text-left font-medium text-slate-800"
            title={session.name}
          >
            {session.name}
          </button>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {dateLabel} · {formatClockMs(session.durationMs)} · {formatBytes(audioSizeBytes)}
          </p>
          {sessionTags.length > 0 && (
            <div className="mt-1 flex gap-1 overflow-x-auto pb-0.5">
              {sessionTags.map((tag) => (
                <span
                  key={tag.id}
                  className="max-w-[7rem] shrink-0 truncate rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold"
                  style={tagPillStyle(tag)}
                  title={tag.label}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={() => setActionsOpen((v) => !v)}
          aria-label={t("journal.sessionActions")}
          aria-expanded={actionsOpen}
        >
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </div>
      {actionsOpen && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => {
              setDraft(session.name);
              setEditDialogOpen(true);
              setActionsOpen(false);
            }}
          >
            <PencilIcon className="size-3.5" />
            {t("journal.rename")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={() => {
              setDraft(session.name);
              setEditDialogOpen(true);
              setActionsOpen(false);
            }}
          >
            <TagsIcon className="size-3.5" />
            {t("journal.editTags")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full text-xs"
            onClick={onDownload}
          >
            <DownloadIcon className="size-3.5" />
            {t("journal.downloadAudio")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 rounded-full border-coral/30 text-xs text-coral hover:bg-coral/10"
            onClick={onDelete}
          >
            <Trash2Icon className="size-3.5" />
            {t("journal.delete")}
          </Button>
        </div>
      )}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(next) => {
          if (!next) {
            const trimmed = draft.trim();
            if (trimmed && trimmed !== session.name) {
              onRename(trimmed);
            }
          }
          setEditDialogOpen(next);
        }}
      >
        <DialogContent className="sm:h-[min(85vh,34rem)] sm:w-[min(92vw,30rem)]">
          <DialogHeader>
            <DialogTitle>{t("journal.sessionActions")}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6">
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("journal.sessionName")}
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRename();
                  } else if (event.key === "Escape") {
                    setDraft(session.name);
                    setEditDialogOpen(false);
                  }
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-sea"
              />
            </label>
            <div className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("journal.tags")}
              <JournalTagPicker
                tags={tags}
                selectedTagIds={session.tagIds}
                onChange={onTagChange}
                onCreateTag={onCreateTag}
              />
            </div>
          </div>
          <DialogFooter className="sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={commitRename}
              className="h-11 rounded-full bg-ink text-white hover:bg-ink/90"
            >
              {t("common.done")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function groupSessionsByDay(sessions: SavedSession[]) {
  const groups: { key: string; date: Date; sessions: SavedSession[] }[] = [];
  for (const session of sessions) {
    const date = new Date(session.createdAt);
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const last = groups.at(-1);
    if (last?.key === key) {
      last.sessions.push(session);
    } else {
      groups.push({ key, date, sessions: [session] });
    }
  }
  return groups;
}

function formatDayLabel(date: Date, t: (key: string) => string) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return t("journal.today");
  if (diffDays === 1) return t("journal.yesterday");
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
