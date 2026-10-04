import { useEffect, useState } from "react";
import {
  type FeatureToggles,
  loadFeatureToggles,
  saveFeatureToggles,
} from "~/featureToggles";

export function useFeatureToggles() {
  const [featureToggles, setFeatureToggles] =
    useState<FeatureToggles>(loadFeatureToggles);

  useEffect(() => {
    saveFeatureToggles(featureToggles);
  }, [featureToggles]);

  return { featureToggles, setFeatureToggles };
}
