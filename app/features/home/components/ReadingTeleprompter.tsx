import {Settings2Icon} from "lucide-react";
import {useTranslation} from "react-i18next";
import type {ReadingFeedbackDirection} from "~/pitch";
import {Button} from "~/components/ui/button";

type Props = {
    title: string;
    body: string;
    feedbackDirection: ReadingFeedbackDirection | null;
    onOpenOptions: () => void;
};

export function ReadingTeleprompter({
                                        title,
                                        body,
                                        feedbackDirection,
                                        onOpenOptions,
                                    }: Props) {
    const {t} = useTranslation();
    const hasText = body.trim().length > 0;
    const paragraphs = body.trim().split(/\n{2,}/);
    const feedbackFadeColor =
        feedbackDirection === "above"
            ? "rgba(215, 121, 97, 0.4)"
            : feedbackDirection === "below"
                ? "rgba(62, 124, 142, 0.38)"
                : "transparent";

    return (
        <div className="relative isolate flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-0 bottom-0 top-0 z-30 transition-opacity duration-500 ease-in-out ${
                    feedbackDirection ? "opacity-100" : "opacity-0"
                }`}
                style={{
                    boxShadow: [
                        `inset 0 0 18px 10px ${feedbackFadeColor}`,
                    ].join(", "),
                }}
            />
            <div
                className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-linear-to-b from-white/95 via-white/90 to-transparent px-4 pt-2 pb-12">
                <p className="truncate text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {title}
                </p>
            </div>
            <div
                className="relative z-10 min-h-0 flex-1 overflow-y-auto px-4 sm:px-8"
                style={{containerType: "size"}}
            >
                {hasText ? (
                    <div
                        className="mx-auto w-full max-w-3xl text-center text-2xl font-medium leading-relaxed text-ink sm:text-3xl"
                        style={{paddingBlock: "max(0px, calc(50cqh - 0.5lh))"}}
                    >
                        {paragraphs.map((paragraph, index) => (
                            <p
                                key={index}
                                className="whitespace-pre-wrap not-last:mb-8 sm:not-last:mb-10"
                            >
                                {paragraph}
                            </p>
                        ))}
                    </div>
                ) : (
                    <div
                        className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-3 py-[30vh] text-center">
                        <p className="text-lg font-medium text-slate-400">
                            {t("reading.emptyActiveText")}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOpenOptions}
                            className="h-9 gap-1.5 rounded-full"
                        >
                            <Settings2Icon className="size-4"/>
                            {t("reading.options")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
