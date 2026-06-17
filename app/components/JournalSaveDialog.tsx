import { useEffect, useState } from "react";
import { DownloadIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { JournalTag, SavedSession } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { JournalTagPicker } from "./JournalTagPicker";

type Props = {
  session: SavedSession | null;
  tags: JournalTag[];
  onClose: () => void;
  onRename: (id: string, name: string) => void;
  onDownload: (id: string) => void;
  onTagChange: (id: string, tagIds: string[]) => void;
  onCreateTag: (label: string, color: string) => JournalTag | null;
};

export function JournalSaveDialog({
  session,
  tags,
  onClose,
  onRename,
  onDownload,
  onTagChange,
  onCreateTag,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");

  useEffect(() => {
    if (session) {
      setName(session.name);
    }
  }, [session]);

  function commit() {
    if (!session) return;
    const trimmed = name.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(session.id, trimmed);
    }
  }

  return (
    <Dialog
      open={session != null}
      onOpenChange={(next) => {
        if (!next) {
          commit();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:w-[min(92vw,28rem)]">
        <DialogHeader>
          <DialogTitle>{t("journal.saveDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("journal.saveDialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="px-6">
          <div className="space-y-5">
            <label className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("journal.sessionName")}
              <input
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commit();
                    onClose();
                  }
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-sea"
              />
            </label>
            {session && (
              <div className="flex flex-col gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("journal.tags")}
                <JournalTagPicker
                  tags={tags}
                  selectedTagIds={session.tagIds}
                  onChange={(tagIds) => onTagChange(session.id, tagIds)}
                  onCreateTag={onCreateTag}
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="lg"
            className="h-14 rounded-full text-base font-semibold"
            onClick={() => {
              if (session) onDownload(session.id);
            }}
            disabled={!session}
          >
            <DownloadIcon />
            {t("journal.downloadAudio")}
          </Button>
          <Button
            size="lg"
            className="h-14 rounded-full text-base font-semibold"
            onClick={() => {
              commit();
              onClose();
            }}
          >
            {t("common.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
