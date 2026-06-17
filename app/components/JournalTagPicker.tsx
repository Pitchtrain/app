import { useState } from "react";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { JournalTag } from "../types";
import { TAG_COLORS, tagPillStyle } from "../journal/tags";
import { Button } from "./ui/button";

type Props = {
  tags: JournalTag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  onCreateTag: (label: string, color: string) => JournalTag | null;
};

export function JournalTagPicker({
  tags,
  selectedTagIds,
  onChange,
  onCreateTag,
}: Props) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  }

  function createTag() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const tag = onCreateTag(trimmed, color);
    if (!tag) return;
    setLabel("");
    onChange([...new Set([...selectedTagIds, tag.id])]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <p className="text-xs font-normal normal-case tracking-normal text-slate-500">
            {t("journal.noTags")}
          </p>
        ) : (
          tags.map((tag) => {
            const selected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="inline-flex h-8 max-w-full items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors"
                style={tagPillStyle(tag, selected)}
                aria-pressed={selected}
              >
                {selected && <CheckIcon className="size-3.5" />}
                <span className="truncate">{tag.label}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-2">
        <div className="flex gap-2">
          <input
            value={label}
            onChange={(event) => setLabel(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createTag();
              }
            }}
            placeholder={t("journal.newTagPlaceholder")}
            className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm font-normal normal-case tracking-normal text-slate-800 outline-none focus:border-sea"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            onClick={createTag}
            disabled={!label.trim()}
            aria-label={t("journal.createTag")}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 px-0.5 py-1">
          {TAG_COLORS.map((tagColor) => {
            const selected = color === tagColor;
            return (
              <button
                key={tagColor}
                type="button"
                onClick={() => setColor(tagColor)}
                className={`grid size-7 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-black/10 transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-sea ${
                  selected
                    ? "outline outline-2 outline-offset-2 outline-sea"
                    : ""
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
    </div>
  );
}
