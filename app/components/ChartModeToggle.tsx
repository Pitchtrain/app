import {Maximize2, ZoomIn} from "lucide-react";
import {useTranslation} from "react-i18next";
import {Button} from "./ui/button";
import type {ChartMode} from "./PitchTimelineChart";

type Props = {
    value: ChartMode;
    onChange: (value: ChartMode) => void;
};

export function ChartModeToggle({value, onChange}: Props) {
    const {t} = useTranslation();
    const next: { value: ChartMode; label: string; Icon: React.ElementType } =
        value === "full"
            ? {value: "detail", label: t("chart.detail"), Icon: ZoomIn}
            : {value: "full", label: t("chart.full"), Icon: Maximize2};
    return (
        <div className="rounded-full bg-white/80 p-0.5 shadow-sm backdrop-blur-sm">
            <Button
                type="button"
                variant="ghost"
                onClick={() => onChange(next.value)}
                aria-label={next.label}
                className="size-11 rounded-full"
            >
                <next.Icon className="size-4"/>
            </Button>
        </div>
    );
}
