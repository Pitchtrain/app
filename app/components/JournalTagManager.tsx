import { useState } from "react";
import { CheckIcon, Trash2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { JournalTag, SavedSession } from "../types";
import { TAG_COLORS, getTagSessionCounts, tagPillStyle } from "../journal/tags";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: JournalTag[];
  sessions: SavedSession[];
  onUpdateTag: (id: string, label: string, color: string) => void;
  onDeleteTag: (id: string) => void;
};

export function JournalTagManager({
  open,
  onOpenChange,
  tags,
  sessions,
  onUpdateTag,
  onDeleteTag,
}: Props) {
  const { t } = useTranslation();
  const counts = getTagSessionCounts(sessions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:h-[min(85vh,34rem)] sm:w-[min(92vw,30rem)]">
        <DialogHeader>
          <DialogTitle>{t("journal.manageTags")}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-6">
          {tags.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              {t("journal.noTags")}
            </p>
          ) : (
            tags.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                count={counts.get(tag.id) ?? 0}
                onUpdate={onUpdateTag}
                onDelete={onDeleteTag}
              />
            ))
          )}
        </div>
        <DialogFooter className="sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-full bg-ink text-white hover:bg-ink/90"
          >
            {t("common.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagRow({
  tag,
  count,
  onUpdate,
  onDelete,
}: {
  tag: JournalTag;
  count: number;
  onUpdate: (id: string, label: string, color: string) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(tag.label);

  function commitLabel() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === tag.label) {
      setDraft(tag.label);
      return;
    }
    onUpdate(tag.id, trimmed, tag.color);
  }

  function handleDelete() {
    if (window.confirm(t("journal.deleteTagConfirm", { label: tag.label, count }))) {
      onDelete(tag.id);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
      <div className="flex items-center gap-2">
        <span
          className="size-3.5 shrink-0 rounded-full border"
          style={tagPillStyle(tag, true)}
          aria-hidden
        />
        <input
          value={draft}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={commitLabel}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              setDraft(tag.label);
              event.currentTarget.blur();
            }
          }}
          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-sea"
        />
        <span className="shrink-0 text-xs text-slate-400">{count}</span>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleDelete}
          aria-label={t("journal.deleteTag")}
          className="text-coral hover:bg-coral/10"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 px-0.5 py-1">
        {TAG_COLORS.map((tagColor) => {
          const selected = tag.color === tagColor;
          return (
            <button
              key={tagColor}
              type="button"
              onClick={() => onUpdate(tag.id, tag.label, tagColor)}
              className={`grid size-7 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-black/10 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sea ${
                selected ? "outline outline-2 outline-offset-2 outline-sea" : ""
              }`}
              style={{ backgroundColor: tagColor }}
              aria-label={t("journal.selectTagColor")}
              aria-pressed={selected}
            >
              {selected && <CheckIcon className="size-4 text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
