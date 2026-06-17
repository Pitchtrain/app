import { useTranslation } from "react-i18next";
import type { JournalTag, SavedSession } from "../types";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { JournalPanel } from "./JournalPanel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function JournalDrawer({
  open,
  onOpenChange,
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
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{t("journal.drawerTitle")}</DrawerTitle>
          <DrawerDescription>
            {t("journal.drawerDescription")}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-2">
          <JournalPanel
            sessions={sessions}
            tags={tags}
            activeSessionId={activeSessionId}
            activeTagId={activeTagId}
            totalStorageBytes={totalStorageBytes}
            onLoad={(id) => {
              onLoad(id);
              onOpenChange(false);
            }}
            onRename={onRename}
            onTagChange={onTagChange}
            onCreateTag={onCreateTag}
            onUpdateTag={onUpdateTag}
            onDeleteTag={onDeleteTag}
            onTagFilterChange={onTagFilterChange}
            onDelete={onDelete}
            onDownload={onDownload}
            onExport={onExport}
            onImport={onImport}
            canExport={canExport}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
