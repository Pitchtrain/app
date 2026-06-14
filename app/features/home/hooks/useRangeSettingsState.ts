import { useEffect, useMemo, useState } from "react";
import type { DetectorAlgorithm, VoiceRange } from "~/types";
import { clampRangeValue, CUSTOM_RANGE_ID, DEFAULT_RANGES } from "~/ranges";
import { loadRangeSettings, saveRangeSettings } from "~/storage";

export function useRangeSettingsState() {
  const initialSettings = useMemo(() => loadRangeSettings(), []);
  const [selectedRangeId, setSelectedRangeId] = useState(
    initialSettings.selectedRangeId,
  );
  const [customRange, setCustomRange] = useState<VoiceRange>(
    initialSettings.customRange,
  );
  const [customRangeInputs, setCustomRangeInputs] = useState({
    minHz: String(initialSettings.customRange.minHz),
    maxHz: String(initialSettings.customRange.maxHz),
  });
  const [detectorAlgorithm, setDetectorAlgorithm] = useState<DetectorAlgorithm>(
    initialSettings.detectorAlgorithm,
  );
  const [presetsHighlighted, setPresetsHighlighted] = useState(true);
  const [customHighlighted, setCustomHighlighted] = useState(false);

  const ranges = useMemo(() => [...DEFAULT_RANGES, customRange], [customRange]);
  const highlightedRanges = useMemo(() => {
    const result: VoiceRange[] = [];
    if (presetsHighlighted) result.push(...DEFAULT_RANGES);
    if (customHighlighted && customRange.minHz > 0 && customRange.maxHz > 0) {
      result.push(customRange);
    }
    return result;
  }, [customHighlighted, customRange, presetsHighlighted]);
  const selectedRange = useMemo(() => {
    return (
      ranges.find((range) => range.id === selectedRangeId) ?? DEFAULT_RANGES[1]
    );
  }, [ranges, selectedRangeId]);

  useEffect(() => {
    saveRangeSettings({ selectedRangeId, customRange, detectorAlgorithm });
  }, [customRange, detectorAlgorithm, selectedRangeId]);

  useEffect(() => {
    setCustomRangeInputs({
      minHz: String(customRange.minHz),
      maxHz: String(customRange.maxHz),
    });
  }, [customRange.minHz, customRange.maxHz]);

  function handleCustomRangeChange(field: "minHz" | "maxHz", value: string) {
    setCustomRangeInputs((previous) => ({ ...previous, [field]: value }));
    if (value.trim() === "") {
      setSelectedRangeId(CUSTOM_RANGE_ID);
      return;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      setSelectedRangeId(CUSTOM_RANGE_ID);
      return;
    }

    if (parsedValue > 0 && parsedValue < 50) {
      setSelectedRangeId(CUSTOM_RANGE_ID);
      return;
    }

    const numericValue =
      parsedValue <= 0 ? 0 : clampRangeValue(parsedValue, customRange[field]);
    setCustomRange((previous) =>
      normalizeCustomRange(previous, field, numericValue),
    );
    setSelectedRangeId(CUSTOM_RANGE_ID);
  }

  function handleCustomRangeBlur(field: "minHz" | "maxHz") {
    const rawValue = customRangeInputs[field];
    if (rawValue.trim() === "") {
      setCustomRangeInputs((previous) => ({
        ...previous,
        [field]: String(customRange[field]),
      }));
      return;
    }

    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) {
      setCustomRangeInputs((previous) => ({
        ...previous,
        [field]: String(customRange[field]),
      }));
      return;
    }

    const normalizedValue =
      parsedValue <= 0 ? 0 : clampRangeValue(parsedValue, customRange[field]);
    setCustomRange((previous) =>
      normalizeCustomRange(previous, field, normalizedValue),
    );
    setSelectedRangeId(CUSTOM_RANGE_ID);
  }

  return {
    ranges,
    highlightedRanges,
    selectedRange,
    selectedRangeId,
    setSelectedRangeId,
    customRange,
    customRangeInputs,
    handleCustomRangeChange,
    handleCustomRangeBlur,
    detectorAlgorithm,
    setDetectorAlgorithm,
    presetsHighlighted,
    setPresetsHighlighted,
    customHighlighted,
    setCustomHighlighted,
  };
}

function normalizeCustomRange(
  previous: VoiceRange,
  field: "minHz" | "maxHz",
  value: number,
) {
  const next = { ...previous, [field]: value };
  if (next.minHz > 0 && next.maxHz > 0 && next.maxHz <= next.minHz) {
    if (field === "minHz") next.maxHz = next.minHz + 1;
    else next.minHz = next.maxHz - 1;
  }
  return next;
}
