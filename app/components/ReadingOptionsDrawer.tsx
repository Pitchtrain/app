import { useEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { toast } from "sonner";
import {
  CheckIcon,
  ImportIcon,
  PencilIcon,
  PlusIcon,
  ShuffleIcon,
  TrashIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReadingSettings, ReadingText } from "~/types";
import {
  createReadingText,
  titleFromFileName,
  updateReadingText,
} from "~/reading";
import {
  READING_LIBRARY_TEXTS,
  type ReadingLibraryText,
  type ReadingSample,
} from "~/readingSamples";
import {
  filterLibraryTexts,
  loadLibraryFilters,
  saveLibraryFilters,
  type LibraryKindFilter,
  type LibraryLocaleFilter,
} from "~/readingLibraryFilters";
import { Button } from "./ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ReadingSettings;
  onChange: (settings: ReadingSettings) => void;
};

type ReadingOptionsPanelProps = Omit<Props, "open" | "onOpenChange"> & {
  className?: string;
};

export function ReadingOptionsPanel({
  settings,
  onChange,
  className,
}: ReadingOptionsPanelProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const personalTexts = settings.texts.filter((text) => text.source !== "module");

  function setActiveTextId(activeTextId: string) {
    onChange({ ...settings, activeTextId });
  }

  function addText() {
    const title = window.prompt(t("reading.namePromptForNewText"))?.trim();
    if (!title) return;
    const text = createReadingText(title, "", "user");
    onChange({
      ...settings,
      texts: [...settings.texts, text],
      activeTextId: text.id,
    });
  }

  function saveText(next: ReadingText) {
    onChange({
      ...settings,
      texts: settings.texts.map((text) => (text.id === next.id ? next : text)),
      activeTextId: next.id,
    });
  }

  function deleteText(target: ReadingText) {
    if (!window.confirm(t("reading.deleteConfirm", { title: target.title }))) {
      return;
    }
    const texts = settings.texts.filter((text) => text.id !== target.id);
    const nextPersonalText = texts.find((text) => text.source !== "module") ?? null;
    const activeTextId =
      settings.activeTextId === target.id
        ? nextPersonalText?.id ?? READING_LIBRARY_TEXTS[0]?.id ?? null
        : settings.activeTextId;
    onChange({ ...settings, texts, activeTextId });
    setEditingTextId((current) => (current === target.id ? null : current));
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    const created: ReadingText[] = [];
    for (const file of Array.from(files)) {
      try {
        const body = await file.text();
        if (!body.trim()) {
          toast.error(t("reading.noTextFound", { name: file.name }));
          continue;
        }
        created.push(
          createReadingText(titleFromFileName(file.name), body, "import"),
        );
      } catch {
        toast.error(t("reading.couldNotReadFile", { name: file.name }));
      }
    }
    if (created.length === 0) return;
    onChange({
      ...settings,
      texts: [...settings.texts, ...created],
      activeTextId: created[0].id,
    });
    toast.success(t("reading.imported", { count: created.length }));
  }

  function showLibraryText(text: ReadingLibraryText) {
    onChange({ ...settings, activeTextId: text.id });
  }

  function importLibraryText(text: ReadingLibraryText) {
    const imported = createReadingText(text.title, text.body, "user");
    onChange({
      ...settings,
      texts: [...settings.texts, imported],
      activeTextId: imported.id,
    });
    toast.success(t("reading.importedToPersonal", { title: text.title }));
  }

  function showRandomLibraryText(texts: ReadingLibraryText[]) {
    if (texts.length === 0) return;
    const text = texts[Math.floor(Math.random() * texts.length)];
    onChange({ ...settings, activeTextId: text.id });
    toast.success(t("reading.randomShown", { title: text.title }));
  }

  const editingText = personalTexts.find((text) => text.id === editingTextId) ?? null;

  return (
    <>
      <Tabs
        defaultValue="personal"
        className={`flex min-h-0 flex-col gap-0 ${className ?? ""}`}
      >
        <div className="px-4 pb-2">
          <TabsList className="grid h-8 w-full grid-cols-2 rounded-xl p-1">
            <TabsTrigger
              value="personal"
              className="h-full rounded-lg px-2 py-0 text-xs data-active:shadow-sm"
            >
              {t("reading.personal")}
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="h-full rounded-lg px-2 py-0 text-xs data-active:shadow-sm"
            >
              {t("reading.library")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="personal" className="min-h-0 flex-1">
          <PersonalTextsSection
            texts={personalTexts}
            activeTextId={settings.activeTextId}
            editingTextId={editingTextId}
            fileInputRef={fileInputRef}
            onAdd={addText}
            onSelect={setActiveTextId}
            onEdit={(text) => {
              setActiveTextId(text.id);
              setEditingTextId(text.id);
            }}
            onDelete={deleteText}
            onFilesSelected={onFilesSelected}
          />
        </TabsContent>

        <TabsContent value="library" className="min-h-0 flex-1">
          <LibraryTextsSection
            activeTextId={settings.activeTextId}
            onShow={showLibraryText}
            onImport={importLibraryText}
            onRandom={showRandomLibraryText}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={editingText != null} onOpenChange={(next) => !next && setEditingTextId(null)}>
        <DialogContent className="sm:h-[min(82vh,42rem)] sm:w-[min(92vw,42rem)]">
          <DialogHeader className="pr-14 text-left">
            <DialogTitle>{editingText?.title ?? t("reading.drawerTitle")}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 px-4 pb-6">
            {editingText ? (
              <ReadingEditor
                key={editingText.id}
                text={editingText}
                onSave={(next) => {
                  saveText(next);
                  setEditingTextId(null);
                }}
                onDelete={() => deleteText(editingText)}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PersonalTextsSection({
  texts,
  activeTextId,
  editingTextId,
  fileInputRef,
  onAdd,
  onSelect,
  onEdit,
  onDelete,
  onFilesSelected,
}: {
  texts: ReadingText[];
  activeTextId: string | null;
  editingTextId: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onEdit: (text: ReadingText) => void;
  onDelete: (text: ReadingText) => void;
  onFilesSelected: (files: FileList | null) => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-4 pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="h-8 gap-1.5 rounded-full text-xs"
        >
          <PlusIcon className="size-3.5" />
          {t("reading.newText")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-8 gap-1.5 rounded-full text-xs"
        >
          <ImportIcon className="size-3.5" />
          {t("reading.importTxt")}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          className="hidden"
          onChange={(event) => {
            void onFilesSelected(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {texts.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {texts.map((text) => (
              <ReadingTextRow
                key={text.id}
                text={text}
                active={text.id === activeTextId}
                editing={text.id === editingTextId}
                onSelect={() => onSelect(text.id)}
                onEdit={() => onEdit(text)}
                onDelete={() => onDelete(text)}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
            {t("reading.noPersonalTextsYet")}
          </div>
        )}
      </div>
    </div>
  );
}

function LibraryTextsSection({
  activeTextId,
  onShow,
  onImport,
  onRandom,
}: {
  activeTextId: string | null;
  onShow: (text: ReadingLibraryText) => void;
  onImport: (text: ReadingLibraryText) => void;
  onRandom: (texts: ReadingLibraryText[]) => void;
}) {
  const { t } = useTranslation();
  const [localeFilter, setLocaleFilter] = useState<LibraryLocaleFilter>(
    () => loadLibraryFilters().locale,
  );
  const [kindFilter, setKindFilter] = useState<LibraryKindFilter>(
    () => loadLibraryFilters().kind,
  );

  useEffect(() => {
    saveLibraryFilters({ locale: localeFilter, kind: kindFilter });
  }, [localeFilter, kindFilter]);

  const filteredTexts = filterLibraryTexts({
    locale: localeFilter,
    kind: kindFilter,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 px-4 pb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRandom(filteredTexts)}
          disabled={filteredTexts.length === 0}
          className="h-8 gap-1.5 rounded-full text-xs"
        >
          <ShuffleIcon className="size-3.5" />
          {t("reading.randomText")}
        </Button>
        <div className="flex flex-wrap gap-1.5">
          <LibraryFilterPill
            active={localeFilter === "all"}
            onClick={() => setLocaleFilter("all")}
          >
            {t("reading.libraryFilters.all")}
          </LibraryFilterPill>
          <LibraryFilterPill
            active={localeFilter === "en"}
            onClick={() => setLocaleFilter("en")}
          >
            {t("reading.libraryLocales.en")}
          </LibraryFilterPill>
          <LibraryFilterPill
            active={localeFilter === "de"}
            onClick={() => setLocaleFilter("de")}
          >
            {t("reading.libraryLocales.de")}
          </LibraryFilterPill>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <LibraryFilterPill
            active={kindFilter === "all"}
            onClick={() => setKindFilter("all")}
          >
            {t("reading.libraryFilters.allTypes")}
          </LibraryFilterPill>
          <LibraryFilterPill
            active={kindFilter === "dialog"}
            onClick={() => setKindFilter("dialog")}
          >
            {t("reading.libraryKinds.dialog")}
          </LibraryFilterPill>
          <LibraryFilterPill
            active={kindFilter === "text"}
            onClick={() => setKindFilter("text")}
          >
            {t("reading.libraryKinds.text")}
          </LibraryFilterPill>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {filteredTexts.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {filteredTexts.map((text) => (
              <LibraryTextRow
                key={text.id}
                text={text}
                active={text.id === activeTextId}
                onShow={() => onShow(text)}
                onImport={() => onImport(text)}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
            {t("reading.noLibraryTextsForFilter")}
          </div>
        )}
      </div>
    </div>
  );
}

export function ReadingOptionsDrawer({
  open,
  onOpenChange,
  settings,
  onChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("reading.drawerTitle")}</DrawerTitle>
          <DrawerDescription>{t("reading.drawerDescription")}</DrawerDescription>
        </DrawerHeader>

        {open ? (
          <ReadingOptionsPanel
            settings={settings}
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

function ReadingTextRow({
  text,
  active,
  editing,
  onSelect,
  onEdit,
  onDelete,
}: {
  text: ReadingText;
  active: boolean;
  editing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const wordCount = getWordCount(text.body);

  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        editing
          ? "border-slate-500 bg-slate-50"
          : active
            ? "border-slate-400 bg-slate-50"
            : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left"
        >
          <ReadingTextSummary text={text} wordCount={wordCount} />
        </button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onEdit}
          aria-label={t("reading.editText", { title: text.title })}
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onDelete}
          aria-label={t("reading.deleteText", { title: text.title })}
          className="text-slate-400 hover:text-destructive"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </li>
  );
}

function LibraryTextRow({
  text,
  active,
  onShow,
  onImport,
}: {
  text: ReadingLibraryText;
  active: boolean;
  onShow: () => void;
  onImport: () => void;
}) {
  const { t } = useTranslation();
  const wordCount = getWordCount(text.body);

  return (
    <li
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
        active
          ? "border-slate-400 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onShow}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-slate-800" title={text.title}>
              {text.title}
            </span>
            <LanguagePill locale={text.locale} />
          </span>
          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {t(`reading.libraryKinds.${text.kind}`)} · {t("reading.words", { count: wordCount })}
          </span>
        </button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onImport}
          aria-label={t("reading.importToPersonalLabel", { title: text.title })}
          className="h-8 shrink-0 gap-1.5 rounded-full px-2.5 text-xs"
        >
          <ImportIcon className="size-4" />
          {t("reading.importToPersonal")}
        </Button>
      </div>
    </li>
  );
}

function LibraryFilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-slate-800 bg-slate-800 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function LanguagePill({ locale }: { locale: ReadingSample["locale"] }) {
  return (
    <span className="shrink-0 rounded-full bg-sea/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sea">
      {locale}
    </span>
  );
}

function ReadingTextSummary({
  text,
  wordCount,
  meta,
}: {
  text: ReadingText;
  wordCount: number;
  meta?: string;
}) {
  const { t } = useTranslation();

  return (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium text-slate-800" title={text.title}>
          {text.title}
        </span>
      </span>
      <span className="mt-0.5 block truncate text-xs text-slate-500">
        {meta ? `${meta} · ` : ""}
        {t("reading.words", { count: wordCount })}
      </span>
    </>
  );
}

function ReadingEditor({
  text,
  onSave,
  onDelete,
}: {
  text: ReadingText;
  onSave: (text: ReadingText) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const [titleDraft, setTitleDraft] = useState(text.title);
  const [bodyDraft, setBodyDraft] = useState(text.body);

  useEffect(() => {
    setTitleDraft(text.title);
    setBodyDraft(text.body);
  }, [text]);

  function commit() {
    onSave(updateReadingText(text, { title: titleDraft, body: bodyDraft }));
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <input
        type="text"
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="min-w-0 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-sea"
        aria-label={t("reading.titleLabel")}
      />
      <textarea
        value={bodyDraft}
        onChange={(event) => setBodyDraft(event.target.value)}
        className="min-h-0 flex-1 resize-none rounded-lg border border-slate-200 bg-white p-3 text-base leading-relaxed text-ink outline-none focus:border-sea/50"
        placeholder={t("reading.bodyPlaceholder")}
        aria-label={t("reading.bodyLabel")}
      />
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          onClick={commit}
          className="h-8 gap-1.5 rounded-full bg-ink text-xs text-white hover:bg-ink/90"
        >
          <CheckIcon className="size-3.5" />
          {t("common.save")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="h-8 gap-1.5 rounded-full border-coral/30 text-xs text-coral hover:bg-coral/10"
        >
          <TrashIcon className="size-3.5" />
          {t("reading.delete")}
        </Button>
      </div>
    </div>
  );
}

function getWordCount(body: string) {
  return body.trim() ? body.trim().split(/\s+/).length : 0;
}
