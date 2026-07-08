import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { TFunction } from "i18next";
import type {
  JournalTag,
  PracticeSettings,
  ReadingSettings,
  RecordingSession,
  SavedSession,
} from "~/types";
import { buildReadingArchive, mergeReadingArchive } from "~/reading";
import { buildPracticeArchive, mergePracticeSets } from "~/practice";
import {
  loadLibraryFilters,
  sanitizeLibraryFilters,
  saveLibraryFilters,
} from "~/readingLibraryFilters";
import {
  bulkPut,
  bulkPutTags,
  clearSessions,
  deleteSession,
  deleteTag,
  getSession,
  listSessions,
  listTags,
  putSession,
  putTag,
} from "~/journal/db";
import {
  exportJournal,
  extensionForMimeType,
  importJournal,
} from "~/journal/zip";
import {
  createJournalTag,
  mergeImportedTags,
  READING_SESSION_TAG_COLOR,
  READING_SESSION_TAG_LABEL,
} from "~/journal/tags";
import { buildSessionStamp } from "../sessionStamp";

type Args = {
  t: TFunction;
  recordingSession: RecordingSession | null;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  loadSavedSession: (session: SavedSession) => void;
  readingSettings: ReadingSettings;
  setReadingSettings: Dispatch<SetStateAction<ReadingSettings>>;
  practiceSettings: PracticeSettings;
  setPracticeSettings: Dispatch<SetStateAction<PracticeSettings>>;
};

export function useJournalLibrary({
  t,
  recordingSession,
  activeSessionId,
  setActiveSessionId,
  loadSavedSession,
  readingSettings,
  setReadingSettings,
  practiceSettings,
  setPracticeSettings,
}: Args) {
  const [journalSessions, setJournalSessions] = useState<SavedSession[]>([]);
  const [journalTags, setJournalTags] = useState<JournalTag[]>([]);
  const [journalDrawerOpen, setJournalDrawerOpen] = useState(false);
  const [saveDialogSession, setSaveDialogSession] =
    useState<SavedSession | null>(null);
  const [activeJournalTagId, setActiveJournalTagId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listSessions(), listTags()])
      .then(([sessions, tags]) => {
        if (!cancelled) {
          setJournalSessions(sessions);
          setJournalTags(tags);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(t("journal.couldNotLoad"));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function ensureReadingSessionTag() {
    const existing = journalTags.find(
      (tag) => tag.label.trim() === READING_SESSION_TAG_LABEL,
    );
    if (existing) return existing;

    const tag = createJournalTag(
      READING_SESSION_TAG_LABEL,
      READING_SESSION_TAG_COLOR,
    );
    await putTag(tag);
    setJournalTags((prev) =>
      prev.some((item) => item.label.trim() === READING_SESSION_TAG_LABEL)
        ? prev
        : [...prev, tag],
    );
    return tag;
  }

  async function handleSave() {
    if (!recordingSession) return;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const defaultName = t("journal.defaultSessionName", {
      stamp: buildSessionStamp(recordingSession.createdAt),
    });
    try {
      const tagIds = recordingSession.readingMode
        ? [(await ensureReadingSessionTag()).id]
        : [];
      const saved: SavedSession = {
        id,
        name: defaultName,
        createdAt: recordingSession.createdAt,
        durationMs: recordingSession.durationMs,
        audioBlob: recordingSession.audioBlob,
        audioMimeType: recordingSession.audioBlob.type || "audio/webm",
        samples: recordingSession.samples,
        rangeSnapshot: recordingSession.rangeSnapshot,
        tagIds,
      };
      await putSession(saved);
      setJournalSessions((prev) => [saved, ...prev]);
      setSaveDialogSession(saved);
      setActiveSessionId(saved.id);
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotSave"));
    }
  }

  function handleCreateJournalTag(label: string, color: string) {
    const existing = journalTags.find(
      (tag) => tag.label.trim().toLowerCase() === label.trim().toLowerCase(),
    );
    if (existing) return existing;

    const tag = createJournalTag(label.trim(), color);
    setJournalTags((prev) => [...prev, tag]);
    void putTag(tag).catch((error) => {
      console.error(error);
      setJournalTags((prev) => prev.filter((item) => item.id !== tag.id));
      toast.error(t("journal.couldNotSaveTag"));
    });
    return tag;
  }

  async function handleSessionTagChange(id: string, tagIds: string[]) {
    const existing = journalSessions.find((s) => s.id === id);
    if (!existing) return;
    const uniqueTagIds = [...new Set(tagIds)];
    const updated: SavedSession = { ...existing, tagIds: uniqueTagIds };
    setJournalSessions((prev) => prev.map((s) => (s.id === id ? updated : s)));
    setSaveDialogSession((current) =>
      current && current.id === id ? updated : current,
    );
    try {
      await putSession(updated);
    } catch (error) {
      console.error(error);
      setJournalSessions((prev) =>
        prev.map((s) => (s.id === id ? existing : s)),
      );
      setSaveDialogSession((current) =>
        current && current.id === id ? existing : current,
      );
      toast.error(t("journal.couldNotSaveTags"));
    }
  }

  function handleUpdateJournalTag(id: string, label: string, color: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const existing = journalTags.find((tag) => tag.id === id);
    if (!existing) return;
    const duplicate = journalTags.find(
      (tag) =>
        tag.id !== id &&
        tag.label.trim().toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      toast.error(t("journal.duplicateTag"));
      return;
    }
    if (existing.label === trimmed && existing.color === color) return;
    const updated: JournalTag = { ...existing, label: trimmed, color };
    setJournalTags((prev) => prev.map((tag) => (tag.id === id ? updated : tag)));
    void putTag(updated).catch((error) => {
      console.error(error);
      setJournalTags((prev) =>
        prev.map((tag) => (tag.id === id ? existing : tag)),
      );
      toast.error(t("journal.couldNotSaveTag"));
    });
  }

  async function handleDeleteJournalTag(id: string) {
    const prevTags = journalTags;
    const prevSessions = journalSessions;
    setJournalTags((prev) => prev.filter((tag) => tag.id !== id));
    setJournalSessions((prev) =>
      prev.map((session) =>
        session.tagIds.includes(id)
          ? { ...session, tagIds: session.tagIds.filter((t) => t !== id) }
          : session,
      ),
    );
    if (activeJournalTagId === id) setActiveJournalTagId(null);
    try {
      await deleteTag(id);
    } catch (error) {
      console.error(error);
      setJournalTags(prevTags);
      setJournalSessions(prevSessions);
      toast.error(t("journal.couldNotDeleteTag"));
    }
  }

  async function handleLoadSession(id: string) {
    try {
      const saved = await getSession(id);
      if (!saved) {
        toast.error(t("journal.sessionNotFound"));
        return;
      }
      loadSavedSession(saved);
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotLoadSession"));
    }
  }

  async function handleRenameSession(id: string, name: string) {
    const existing = journalSessions.find((s) => s.id === id);
    if (!existing) return;
    const updated: SavedSession = { ...existing, name };
    try {
      await putSession(updated);
      setJournalSessions((prev) =>
        prev.map((s) => (s.id === id ? updated : s)),
      );
      setSaveDialogSession((current) =>
        current && current.id === id ? updated : current,
      );
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotRename"));
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await deleteSession(id);
      setJournalSessions((prev) => prev.filter((s) => s.id !== id));
      setActiveSessionId(activeSessionId === id ? null : activeSessionId);
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotDelete"));
    }
  }

  async function handleDownloadSessionById(id: string) {
    const existing = journalSessions.find((s) => s.id === id);
    if (existing) {
      downloadSession(existing);
      return;
    }
    const fetched = await getSession(id);
    if (fetched) downloadSession(fetched);
  }

  async function handleExportJournal() {
    const reading = {
      ...buildReadingArchive(readingSettings),
      libraryFilters: loadLibraryFilters(),
    };
    const practiceSets = buildPracticeArchive(practiceSettings);
    if (
      journalSessions.length === 0 &&
      reading.texts.length === 0 &&
      practiceSets.length === 0
    )
      return;
    try {
      const blob = await exportJournal(
        journalSessions,
        journalTags,
        reading,
        practiceSets,
      );
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pitchtrain-journal-${stamp}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotExport"));
    }
  }

  async function handleImportJournal(file: File) {
    try {
      const imported = await importJournal(file);
      const readingTextCount = Array.isArray(imported.reading?.texts)
        ? imported.reading.texts.length
        : 0;
      const practiceSetCount = imported.practiceSets?.length ?? 0;
      if (
        imported.sessions.length === 0 &&
        readingTextCount === 0 &&
        practiceSetCount === 0
      ) {
        toast.info(t("journal.archiveEmpty"));
        return;
      }

      if (imported.reading) {
        setReadingSettings((prev) =>
          mergeReadingArchive(prev, imported.reading),
        );
        if (imported.reading.libraryFilters != null) {
          saveLibraryFilters(
            sanitizeLibraryFilters(imported.reading.libraryFilters),
          );
        }
      }

      if (imported.practiceSets) {
        setPracticeSettings((prev) =>
          mergePracticeSets(prev, imported.practiceSets),
        );
      }

      const { tags: mergedTagList, idRemap } = mergeImportedTags(
        journalTags,
        imported.tags,
      );
      const newTags = mergedTagList.filter(
        (tag) => !journalTags.some((existing) => existing.id === tag.id),
      );
      const remappedSessions = idRemap.size
        ? imported.sessions.map((session) => ({
            ...session,
            tagIds: session.tagIds.map((id) => idRemap.get(id) ?? id),
          }))
        : imported.sessions;

      await bulkPutTags(newTags);
      await bulkPut(remappedSessions);
      const [mergedSessions, mergedTags] = await Promise.all([
        listSessions(),
        listTags(),
      ]);
      setJournalSessions(mergedSessions);
      setJournalTags(mergedTags);
      toast.success(
        t("journal.importedSessions", { count: imported.sessions.length }),
      );
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotImport"));
    }
  }

  async function handleClearAllSessions() {
    if (
      !window.confirm(
        t("journal.clearAllConfirm", { count: journalSessions.length }),
      )
    ) {
      return;
    }
    try {
      await clearSessions();
      setJournalSessions([]);
      setActiveSessionId(null);
      toast.success(t("journal.cleared"));
    } catch (error) {
      console.error(error);
      toast.error(t("journal.couldNotClearAll"));
    }
  }

  const canExportJournal =
    journalSessions.length > 0 ||
    buildReadingArchive(readingSettings).texts.length > 0 ||
    buildPracticeArchive(practiceSettings).length > 0;

  return {
    canExportJournal,
    journalSessions,
    journalTags,
    journalDrawerOpen,
    setJournalDrawerOpen,
    saveDialogSession,
    setSaveDialogSession,
    activeJournalTagId,
    setActiveJournalTagId,
    handleSave,
    handleCreateJournalTag,
    handleUpdateJournalTag,
    handleDeleteJournalTag,
    handleSessionTagChange,
    handleLoadSession,
    handleRenameSession,
    handleDeleteSession,
    handleDownloadSessionById,
    handleExportJournal,
    handleImportJournal,
    handleClearAllSessions,
  };
}

function downloadSession(session: SavedSession) {
  const extension = extensionForMimeType(session.audioMimeType);
  const url = URL.createObjectURL(session.audioBlob);
  const safeName = session.name.replace(/[^a-z0-9\-_.]+/gi, "_") || "session";
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeName}.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
