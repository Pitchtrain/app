import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useTranslation } from "react-i18next";
import type { PitchSample, VoiceRange } from "~/types";
import { CUSTOM_RANGE_ID, midpoint } from "~/ranges";

export type ChartMode = "full" | "detail";
export type ChartVariant = "standard" | "reading";

const MAX_DISPLAY_HZ = 400;
const MAX_BRIDGED_GAP_MS = 240;

type Props = {
  samples: PitchSample[];
  range: VoiceRange;
  playheadMs: number | null;
  timelineWindowSeconds: number;
  mode: ChartMode;
  highlightedRanges: VoiceRange[];
  fullRangeMs?: number;
  variant?: ChartVariant;
  onPrev?: () => void;
  onNext?: () => void;
  onScrub?: (timeMs: number) => void;
};

export const RANGE_PALETTE: Record<
  string,
  { fill: string; stroke: string; solid: string }
> = {
  male: {
    fill: "rgba(96, 165, 250, 0.22)",
    stroke: "rgba(59, 130, 246, 0.9)",
    solid: "#60a5fa",
  },
  androgynous: {
    fill: "rgba(148, 163, 184, 0.22)",
    stroke: "rgba(100, 116, 139, 0.9)",
    solid: "#94a3b8",
  },
  female: {
    fill: "rgba(244, 114, 182, 0.22)",
    stroke: "rgba(236, 72, 153, 0.9)",
    solid: "#f472b6",
  },
  [CUSTOM_RANGE_ID]: {
    fill: "rgba(52, 211, 153, 0.22)",
    stroke: "rgba(16, 185, 129, 0.9)",
    solid: "#34d399",
  },
};

export function PitchTimelineChart({
  samples,
  range,
  playheadMs,
  timelineWindowSeconds,
  mode,
  highlightedRanges,
  fullRangeMs,
  variant = "standard",
  onPrev,
  onNext,
  onScrub,
}: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const { width, height } = useFilledContainerSize(containerRef);
  const isReadingVariant = variant === "reading";
  const padding = isReadingVariant
    ? { top: 12, right: 14, bottom: 12, left: 14 }
    : { top: 16, right: 16, bottom: 24, left: 16 };
  const chartWidth = Math.max(1, width - padding.left - padding.right);
  const chartHeight = Math.max(1, height - padding.top - padding.bottom);

  const isFullTimeline = fullRangeMs != null && fullRangeMs > 0;
  const windowDurationMs = Math.max(
    1,
    isFullTimeline ? fullRangeMs! : timelineWindowSeconds * 1000,
  );
  let effectiveStartMs: number;
  let windowEndMs: number;
  if (isFullTimeline) {
    effectiveStartMs = 0;
    windowEndMs = fullRangeMs!;
  } else if (playheadMs != null) {
    const totalMs = samples.length ? samples[samples.length - 1].timeMs : windowDurationMs;
    const half = windowDurationMs / 2;
    const desiredStart = playheadMs - half;
    const maxStart = Math.max(0, totalMs - windowDurationMs);
    effectiveStartMs = Math.min(Math.max(0, desiredStart), maxStart);
    windowEndMs = effectiveStartMs + windowDurationMs;
  } else {
    windowEndMs = samples.length
      ? samples[samples.length - 1].timeMs
      : timelineWindowSeconds * 1000;
    effectiveStartMs = Math.max(0, windowEndMs - windowDurationMs);
  }

  const { minHz, maxHz } = getChartBounds(
    isReadingVariant ? "detail" : mode,
    range,
  );
  const visibleSamples = samples.filter(
    (sample) =>
      sample.timeMs >= effectiveStartMs && sample.timeMs <= windowEndMs,
  );

  const toX = (timeMs: number) =>
    padding.left + ((timeMs - effectiveStartMs) / windowDurationMs) * chartWidth;
  const toY = (frequencyHz: number) =>
    padding.top +
    chartHeight -
    ((frequencyHz - minHz) / (maxHz - minHz)) * chartHeight;

  const curve = buildContinuousPath(visibleSamples, toX, toY, MAX_BRIDGED_GAP_MS);
  const lineOpacity = getPathOpacity(visibleSamples);
  const rawPoints = visibleSamples.filter(
    (sample) => sample.voiced && sample.rawFrequencyHz != null,
  );
  const yTicks = getTickValues(minHz, maxHz, 6, 50);
  const xTicks = Array.from(
    { length: 6 },
    (_, index) => effectiveStartMs + (windowDurationMs / 5) * index,
  );
  const playheadX =
    playheadMs == null
      ? null
      : toX(Math.min(Math.max(playheadMs, effectiveStartMs), windowEndMs));

  const fromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return effectiveStartMs;
    const rect = svg.getBoundingClientRect();
    const ratio = rect.width > 0 ? width / rect.width : 1;
    const x = (clientX - rect.left) * ratio;
    const t =
      effectiveStartMs +
      ((x - padding.left) / chartWidth) * windowDurationMs;
    return Math.min(Math.max(t, effectiveStartMs), windowEndMs);
  };

  const handlePointerDown = onScrub
    ? (event: ReactPointerEvent<SVGSVGElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onScrub(fromClientX(event.clientX));
      }
    : undefined;
  const handlePointerMove = onScrub
    ? (event: ReactPointerEvent<SVGSVGElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        onScrub(fromClientX(event.clientX));
      }
    : undefined;
  const handlePointerUp = onScrub
    ? (event: ReactPointerEvent<SVGSVGElement>) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }
    : undefined;
  const xTickAnchor = (index: number): "start" | "middle" | "end" => {
    if (index === 0) return "start";
    if (index === xTicks.length - 1) return "end";
    return "middle";
  };

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {!onScrub && (onPrev || onNext) && (
        <>
          <button
            className="absolute inset-y-0 left-0 z-10 w-1/2"
            onClick={onPrev}
            aria-label={t("practice.previousPrompt")}
          />
          <button
            className="absolute inset-y-0 right-0 z-10 w-1/2"
            onClick={onNext}
            aria-label={t("practice.nextPrompt")}
          />
        </>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={`block h-full w-full ${onScrub ? "cursor-ew-resize touch-none" : ""}`}
        preserveAspectRatio="none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <rect x="0" y="0" width={width} height={height} fill="var(--color-canvas)" />
        {highlightedRanges.map((highlightRange) => {
          const palette = RANGE_PALETTE[highlightRange.id];
          if (!palette || highlightRange.minHz <= 0 || highlightRange.maxHz <= 0) {
            return null;
          }
          const rangeTop = toY(Math.min(highlightRange.maxHz, maxHz));
          const rangeBottom = toY(Math.max(highlightRange.minHz, minHz));
          return (
            <g key={highlightRange.id}>
              <rect
                x={padding.left}
                y={rangeTop}
                width={chartWidth}
                height={Math.max(0, rangeBottom - rangeTop)}
                rx="14"
                fill={palette.fill}
              />
              <line
                x1={padding.left}
                x2={padding.left + chartWidth}
                y1={rangeTop}
                y2={rangeTop}
                stroke={palette.stroke}
                strokeDasharray="6 8"
              />
              <line
                x1={padding.left}
                x2={padding.left + chartWidth}
                y1={rangeBottom}
                y2={rangeBottom}
                stroke={palette.stroke}
                strokeDasharray="6 8"
              />
            </g>
          );
        })}

        {yTicks.map((tick, index) => (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={padding.left + chartWidth}
              y1={toY(tick)}
              y2={toY(tick)}
              stroke="#c7d5dd"
              strokeWidth={Math.abs(tick % 100) < 0.001 ? "1.5" : "1"}
              strokeDasharray={Math.abs(tick % 100) < 0.001 ? "none" : "4 6"}
            />
            {isReadingVariant && (index === 0 || index === yTicks.length - 1) ? null : (
              <text
                x={padding.left + 8}
                y={toY(tick) - 6}
                textAnchor="start"
                className="axis-label"
              >
                {Math.round(tick)} Hz
              </text>
            )}
          </g>
        ))}

        {xTicks.map((tick, index) => (
          <g key={tick}>
            <line
              x1={toX(tick)}
              x2={toX(tick)}
              y1={padding.top}
              y2={padding.top + chartHeight}
              stroke="#edf2f6"
            />
            {!isReadingVariant ? (
              <text
                x={toX(tick)}
                y={height - 8}
                textAnchor={xTickAnchor(index)}
                className="axis-label"
              >
                {((tick - effectiveStartMs) / 1000).toFixed(1)}s
              </text>
            ) : null}
          </g>
        ))}

        {rawPoints.map((sample) =>
          sample.rawFrequencyHz != null &&
          sample.rawFrequencyHz >= minHz &&
          sample.rawFrequencyHz <= maxHz ? (
            <circle
              key={`raw-${sample.timeMs}`}
              cx={toX(sample.timeMs)}
              cy={toY(sample.rawFrequencyHz)}
              r="2.6"
              fill="#102033"
              opacity={Math.min(1, 0.5 + sample.confidence * 0.35)}
            />
          ) : null,
        )}

        {curve ? (
          <path
            d={curve}
            fill="none"
            stroke="#3e7c8e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            opacity={lineOpacity}
          />
        ) : (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            className="fill-slate-400 text-sm font-medium"
          >
            {t("recording.tapToBegin")}
          </text>
        )}

        {playheadX != null ? (
          <line
            x1={playheadX}
            x2={playheadX}
            y1={padding.top}
            y2={padding.top + chartHeight}
            stroke="#102033"
            strokeWidth="2"
          />
        ) : null}

        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          rx="12"
          fill="none"
          stroke="#cdd7de"
        />
      </svg>
    </div>
  );
}

function useFilledContainerSize(containerRef: {
  current: HTMLDivElement | null;
}) {
  const [size, setSize] = useState({ width: 960, height: 560 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.max(320, Math.round(rect.width || 960));
      const nextHeight = Math.max(96, Math.round(rect.height || 560));
      setSize((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(element);
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
    };
  }, [containerRef]);

  return size;
}

function getChartBounds(mode: ChartMode, range: VoiceRange) {
  if (mode === "full" || range.minHz <= 0 || range.maxHz <= 0) {
    return { minHz: 50, maxHz: MAX_DISPLAY_HZ };
  }
  const center = midpoint(range);
  const span = Math.max(120, range.maxHz - range.minHz + 60);
  let minHz = Math.max(50, center - span / 2);
  let maxHz = Math.min(MAX_DISPLAY_HZ, center + span / 2);
  if (maxHz - minHz < 120) {
    if (minHz === 50) {
      maxHz = Math.min(MAX_DISPLAY_HZ, minHz + 120);
    } else {
      minHz = Math.max(50, maxHz - 120);
    }
  }
  return { minHz, maxHz };
}

function buildContinuousPath(
  samples: PitchSample[],
  toX: (timeMs: number) => number,
  toY: (frequencyHz: number) => number,
  maxBridgedGapMs: number,
): string {
  type Pt = { x: number; y: number };
  const runs: Pt[][] = [];
  let current: Pt[] = [];
  let lastVoicedTimeMs: number | null = null;
  for (const sample of samples) {
    if (!sample.voiced || sample.frequencyHz == null) continue;
    const pt = { x: toX(sample.timeMs), y: toY(sample.frequencyHz) };
    const shouldBridge =
      lastVoicedTimeMs != null &&
      sample.timeMs - lastVoicedTimeMs <= maxBridgedGapMs;
    if (!shouldBridge) {
      if (current.length) runs.push(current);
      current = [];
    }
    current.push(pt);
    lastVoicedTimeMs = sample.timeMs;
  }
  if (current.length) runs.push(current);

  let path = "";
  for (const run of runs) {
    if (run.length === 1) {
      path += ` M ${run[0].x} ${run[0].y}`;
      continue;
    }
    path += ` M ${run[0].x} ${run[0].y}`;
    for (let i = 0; i < run.length - 1; i++) {
      const p0 = run[i - 1] ?? run[i];
      const p1 = run[i];
      const p2 = run[i + 1];
      const p3 = run[i + 2] ?? run[i + 1];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
    }
  }
  return path.trim();
}

function getPathOpacity(samples: PitchSample[]) {
  const voicedSamples = samples.filter((sample) => sample.voiced);
  if (voicedSamples.length === 0) return 1;
  const averageConfidence =
    voicedSamples.reduce((total, sample) => total + sample.confidence, 0) /
    voicedSamples.length;
  return 0.32 + averageConfidence * 0.42;
}

function getTickValues(
  minHz: number,
  maxHz: number,
  count: number,
  preferredStep?: number,
) {
  if (maxHz <= minHz) return [minHz];
  const targetStep =
    preferredStep ??
    (count <= 1 ? maxHz - minHz : (maxHz - minHz) / (count - 1));
  const magnitude = 10 ** Math.floor(Math.log10(targetStep));
  const normalizedStep = targetStep / magnitude;
  const niceStep = preferredStep
    ? targetStep / magnitude
    : normalizedStep <= 1
      ? 1
      : normalizedStep <= 2
        ? 2
        : normalizedStep <= 2.5
          ? 2.5
          : normalizedStep <= 5
            ? 5
            : 10;
  const step = niceStep * magnitude;
  const firstTick = Math.ceil(minHz / step) * step;
  const ticks: number[] = [];
  for (let tick = firstTick; tick < maxHz; tick += step) {
    ticks.push(Number(tick.toFixed(2)));
  }
  if (ticks[0] !== minHz) ticks.unshift(minHz);
  if (ticks[ticks.length - 1] !== maxHz) ticks.push(maxHz);
  return ticks;
}
