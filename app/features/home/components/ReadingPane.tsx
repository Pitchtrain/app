import type { ReactNode } from "react";
import { Settings2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReadingFeedbackDirection } from "~/pitch";
import type { ReadingText } from "~/types";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Button } from "~/components/ui/button";
import { ReadingTeleprompter } from "./ReadingTeleprompter";

type Props = {
  chartPanel: ReactNode;
  activeReadingText: ReadingText | null;
  feedbackDirection: ReadingFeedbackDirection | null;
  onOpenOptions: () => void;
};

export function ReadingPane({
  chartPanel,
  activeReadingText,
  feedbackDirection,
  onOpenOptions,
}: Props) {
  const { t } = useTranslation();

  return (
    <>
      <ResizablePanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel
          id="reading-chart"
          defaultSize="32%"
          minSize="8rem"
          maxSize="70%"
          className="min-h-0"
        >
          {chartPanel}
        </ResizablePanel>
        <ResizableHandle
          withHandle
          className="z-20 border-y border-slate-200/80 bg-white/90"
        />
        <ResizablePanel
          id="reading-text"
          defaultSize="68%"
          minSize="12rem"
          className="min-h-0"
        >
          <ReadingTeleprompter
            title={activeReadingText?.title ?? t("reading.noActiveTitle")}
            body={activeReadingText?.body ?? t("reading.noActiveBody")}
            feedbackDirection={feedbackDirection}
            onOpenOptions={onOpenOptions}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenOptions}
        aria-label={t("reading.options")}
        className="absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+0.375rem)] left-[max(0.75rem,env(safe-area-inset-left))] z-30 size-14 rounded-full border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white lg:hidden"
      >
        <Settings2Icon className="size-5.5" />
      </Button>
    </>
  );
}
