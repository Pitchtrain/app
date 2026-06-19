import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  CheckIcon,
  ImportIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import type { PracticeSet } from "~/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  createSetFromLines,
  parsePracticeTextFile,
  replaceSetItems,
} from "~/practice";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sets: PracticeSet[];
  activeSetIds: string[];
  onChange: (sets: PracticeSet[], activeSetIds: string[]) => void;
};

type PracticeSetsPanelProps = Omit<Props, "open" | "onOpenChange"> & {
  className?: string;
  autoAdvanceEnabled?: boolean;
  onAutoAdvanceToggle?: (enabled: boolean) => void;
  autoAdvanceSeconds?: number;
  onAutoAdvanceSecondsChange?: (seconds: number) => void;
  sentenceFeedbackEnabled?: boolean;
  onSentenceFeedbackToggle?: (enabled: boolean) => void;
};

export function PracticeSetsPanel({
  sets,
  activeSetIds,
  onChange,
  className,
  autoAdvanceEnabled,
  onAutoAdvanceToggle,
  autoAdvanceSeconds,
  onAutoAdvanceSecondsChange,
  sentenceFeedbackEnabled,
  onSentenceFeedbackToggle,
}: PracticeSetsPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  function addSet() {
    const label = window.prompt(t("practice.namePromptForNewSet"))?.trim();
    if (!label) return;
    const set = createSetFromLines(label, []);
    onChange([...sets, set], [...activeSetIds, set.id]);
  }

  function deleteSet(id: string) {
    const target = sets.find((s) => s.id === id);
    if (!target || target.isBuiltIn) return;
    if (!window.confirm(t("practice.deleteSetConfirm", { label: target.label }))) return;
    onChange(
      sets.filter((s) => s.id !== id),
      activeSetIds.filter((a) => a !== id),
    );
    setEditingSetId((current) => (current === id ? null : current));
  }

  function saveSet(next: PracticeSet) {
    onChange(
      sets.map((set) => (set.id === next.id ? next : set)),
      activeSetIds,
    );
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const created: PracticeSet[] = [];
    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        const lines = parsePracticeTextFile(text);
        if (lines.length === 0) {
          toast.error(t("practice.noItemsFound", { name: file.name }));
          continue;
        }
        const label = file.name.replace(/\.[^.]+$/, "") || t("practice.importedFallback");
        created.push(createSetFromLines(label, lines));
      } catch {
        toast.error(t("practice.couldNotReadFile", { name: file.name }));
      }
    }
    if (created.length === 0) return;
    const newIds = created.map((s) => s.id);
    onChange([...sets, ...created], [...activeSetIds, ...newIds]);
    toast.success(t("practice.imported", { count: created.length }));
  }

  const editingSet = sets.find((set) => set.id === editingSetId) ?? null;

  return (
    <>
      <div className={`flex min-h-0 flex-col ${className ?? ""}`}>
        <div className="flex items-center gap-2 px-4 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addSet}
            className="h-8 gap-1.5 rounded-full text-xs"
          >
            <PlusIcon className="size-3.5" />
            {t("practice.newSet")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 gap-1.5 rounded-full text-xs"
          >
            <ImportIcon className="size-3.5" />
            {t("practice.importTxt")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            multiple
            className="hidden"
            onChange={(e) => {
              void onFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
          {onAutoAdvanceToggle &&
          autoAdvanceSeconds != null &&
          onAutoAdvanceSecondsChange &&
          onSentenceFeedbackToggle &&
          sentenceFeedbackEnabled != null ? (
            <PracticeOptionsBlock
              autoAdvanceEnabled={autoAdvanceEnabled === true}
              onAutoAdvanceToggle={onAutoAdvanceToggle}
              autoAdvanceSeconds={autoAdvanceSeconds}
              onAutoAdvanceSecondsChange={onAutoAdvanceSecondsChange}
              sentenceFeedbackEnabled={sentenceFeedbackEnabled}
              onSentenceFeedbackToggle={onSentenceFeedbackToggle}
            />
          ) : null}

          <div className="flex flex-col gap-2">
            {sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                editing={set.id === editingSetId}
                onEdit={() => setEditingSetId(set.id)}
                onDelete={() => deleteSet(set.id)}
              />
            ))}
            {sets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
                {t("practice.noSetsYet")}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={editingSet != null} onOpenChange={(next) => !next && setEditingSetId(null)}>
        <DialogContent className="sm:h-[min(82vh,42rem)] sm:w-[min(92vw,42rem)]">
          <DialogHeader className="pr-14 text-left">
            <DialogTitle>{editingSet?.label ?? t("practice.drawerTitle")}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 px-4 pb-6">
            {editingSet ? (
              <SetEditor
                key={editingSet.id}
                set={editingSet}
                onSave={(next) => {
                  saveSet(next);
                  setEditingSetId(null);
                }}
                onDelete={() => deleteSet(editingSet.id)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PracticeOptionsBlock({
  autoAdvanceEnabled,
  onAutoAdvanceToggle,
  autoAdvanceSeconds,
  onAutoAdvanceSecondsChange,
  sentenceFeedbackEnabled,
  onSentenceFeedbackToggle,
}: {
  autoAdvanceEnabled: boolean;
  onAutoAdvanceToggle: (enabled: boolean) => void;
  autoAdvanceSeconds: number;
  onAutoAdvanceSecondsChange: (seconds: number) => void;
  sentenceFeedbackEnabled: boolean;
  onSentenceFeedbackToggle: (enabled: boolean) => void;
}) {
  const { t } = useTranslation();
  const step = (delta: number) => {
    onAutoAdvanceSecondsChange(Math.min(120, Math.max(1, autoAdvanceSeconds + delta)));
  };

  return (
    <section className="mb-4 space-y-3 border-b border-slate-200/70 pb-4">
      <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-sm text-ink">{t("practice.sentenceFeedback")}</span>
        <input
          type="checkbox"
          checked={sentenceFeedbackEnabled}
          onChange={(event) => onSentenceFeedbackToggle(event.target.checked)}
          className="size-5 accent-sea"
        />
      </label>

      <label className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
        <span className="text-sm text-ink">{t("practice.autoAdvanceNext")}</span>
        <input
          type="checkbox"
          checked={autoAdvanceEnabled}
          onChange={(event) => onAutoAdvanceToggle(event.target.checked)}
          className="size-5 accent-sea"
        />
      </label>

      <div
        className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 ${
          autoAdvanceEnabled ? "" : "opacity-50"
        }`}
      >
        <span className="text-sm text-ink">{t("practice.interval")}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => step(-1)}
            disabled={!autoAdvanceEnabled || autoAdvanceSeconds <= 1}
            aria-label={t("practice.decreaseSeconds")}
          >
            <MinusIcon className="size-4" />
          </Button>
          <span className="min-w-12 text-center text-sm tabular-nums text-ink">
            {autoAdvanceSeconds}s
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => step(1)}
            disabled={!autoAdvanceEnabled || autoAdvanceSeconds >= 120}
            aria-label={t("practice.increaseSeconds")}
          >
            <PlusIcon className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PracticeSetsDrawer({
  open,
  onOpenChange,
  sets,
  activeSetIds,
  onChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("practice.drawerTitle")}</DrawerTitle>
          <DrawerDescription>
            {t("practice.drawerDescription")}
          </DrawerDescription>
        </DrawerHeader>

        {open ? (
          <PracticeSetsPanel
            sets={sets}
            activeSetIds={activeSetIds}
            onChange={onChange}
            className="flex-1"
          />
        ) : null}

        <DrawerFooter className="border-t border-slate-200/60 bg-white/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full gap-2 rounded-full bg-ink text-white hover:bg-ink/90"
          >
            <CheckIcon className="size-4" />
            {t("common.done")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

type SetRowProps = {
  set: PracticeSet;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function SetRow({
  set,
  editing,
  onEdit,
  onDelete,
}: SetRowProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        editing
          ? "border-slate-500 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-800" title={set.label}>
            {set.label}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs tabular-nums text-slate-500">
              {t("practice.items", { count: set.items.length })}
            </span>
            {set.isBuiltIn ? (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {t("practice.default")}
              </Badge>
            ) : null}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={t("practice.editSet", { label: set.label })}
        >
          <PencilIcon className="size-4" />
        </Button>
        {!set.isBuiltIn ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label={t("practice.deleteSet", { label: set.label })}
            className="text-slate-400 hover:text-destructive"
          >
            <TrashIcon className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type SetEditorProps = {
  set: PracticeSet;
  onSave: (set: PracticeSet) => void;
  onDelete: () => void;
};

function SetEditor({
  set,
  onSave,
  onDelete,
}: SetEditorProps) {
  const { t } = useTranslation();
  const [labelDraft, setLabelDraft] = useState(set.label);
  const [textDraft, setTextDraft] = useState(
    set.items.map((item) => item.text).join("\n"),
  );

  useEffect(() => {
    setLabelDraft(set.label);
    setTextDraft(set.items.map((item) => item.text).join("\n"));
  }, [set]);

  function commit() {
    const label = labelDraft.trim() || set.label;
    const next = replaceSetItems({ ...set, label }, parsePracticeTextFile(textDraft));
    onSave(next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <input
        type="text"
        value={labelDraft}
        onChange={(event) => setLabelDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-sea"
        aria-label={t("practice.setName")}
      />
      <textarea
        value={textDraft}
        onChange={(event) => setTextDraft(event.target.value)}
        className="min-h-0 flex-1 resize-none rounded-lg border border-slate-200 bg-white p-3 text-base leading-relaxed text-ink outline-none focus:border-sea/50"
        placeholder={t("practice.eachLineHint")}
        aria-label={t("practice.itemsEditor")}
      />
      <div className="flex flex-wrap gap-1.5">
        <Button
          onClick={commit}
          className="h-11 gap-1.5 rounded-full bg-ink text-white hover:bg-ink/90"
        >
          <CheckIcon className="size-4" />
          {t("common.save")}
        </Button>
        {!set.isBuiltIn ? (
          <Button
            variant="outline"
            onClick={onDelete}
            className="h-11 gap-1.5 rounded-full border-coral/30 text-coral hover:bg-coral/10"
          >
            <TrashIcon className="size-4" />
            {t("practice.delete")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
