import type { CSSProperties } from "react";
import type { RangeStatus } from "../types";

type Metric = {
    label: string;
    value: string;
    tone: RangeStatus;
    palette?: { fill: string; solid: string } | null;
};

type Props = {
    metrics: Metric[];
    dense?: boolean;
};

export function MetricRow({ metrics, dense = false }: Props) {
    return (
        <div
            className={`flex w-full gap-2 overflow-x-auto px-4 py-3 ${dense ? "text-xs" : "text-sm"} bg-canvas`}
        >
            {metrics.map((metric) => {
                const style: CSSProperties | undefined = metric.palette
                    ? { backgroundColor: metric.palette.fill }
                    : undefined;
                const labelStyle: CSSProperties | undefined = metric.palette
                    ? { color: metric.palette.solid }
                    : undefined;
                const classes = metric.palette
                    ? "flex min-w-0 flex-1 shrink-0 flex-col rounded-xl px-3 py-1.5 text-slate-700"
                    : `flex min-w-0 flex-1 shrink-0 flex-col rounded-xl px-3 py-1.5 bg-slate-100 text-slate-600`;
                return (
                    <div key={metric.label} className={classes} style={style}>
                        <span
                            className="truncate text-[10px] font-medium uppercase tracking-wide opacity-80"
                            style={labelStyle}
                        >
                            {metric.label}
                        </span>
                        <span className="truncate font-semibold tabular-nums">
                            {metric.value}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
