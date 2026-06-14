export type RangeStatus =
  | "below"
  | "in-range"
  | "above"
  | "no-pitch"
  | "unvoiced";

export type DetectorAlgorithm = "yin" | "amdf" | "macleod";

export type PitchDetectionResult = {
  rawFrequencyHz: number | null;
  smoothedFrequencyHz: number | null;
  voiced: boolean;
  confidence: number;
  rms: number;
  zeroCrossingRate: number;
};

export type VoiceRange = {
  id: string;
  label: string;
  minHz: number;
  maxHz: number;
  isCustom: boolean;
};

export type PitchSample = {
  timeMs: number;
  rawFrequencyHz: number | null;
  smoothedFrequencyHz: number | null;
  frequencyHz: number | null;
  voiced: boolean;
  confidence: number;
  inRange: boolean;
  deviationFromCenter: number | null;
  status: RangeStatus;
};

export type RecordingSession = {
  audioBlob: Blob;
  audioUrl: string;
  durationMs: number;
  samples: PitchSample[];
  rangeSnapshot: VoiceRange;
  createdAt: number;
  readingMode: boolean;
};

export type SavedSession = {
  id: string;
  name: string;
  createdAt: number;
  durationMs: number;
  audioBlob: Blob;
  audioMimeType: string;
  samples: PitchSample[];
  rangeSnapshot: VoiceRange;
  tagIds: string[];
};

export type JournalTag = {
  id: string;
  label: string;
  color: string;
  createdAt: number;
};

export type PracticeItem = {
  id: string;
  text: string;
};

export type PracticeSet = {
  id: string;
  label: string;
  items: PracticeItem[];
  isBuiltIn?: boolean;
  createdAt: number;
};

export type PracticeSettings = {
  sets: PracticeSet[];
  activeSetIds: string[];
  autoAdvanceEnabled: boolean;
  autoAdvanceSeconds: number;
  shuffleEnabled: boolean;
  sentenceFeedbackEnabled: boolean;
};

export type ReadingTextSource = "user" | "import" | "module";

export type ReadingText = {
  id: string;
  title: string;
  body: string;
  source: ReadingTextSource;
  createdAt: number;
  updatedAt: number;
};

export type ReadingRangeGoal = "auto" | "both" | "above" | "below";

export type ReadingFeedbackSettings = {
  rangeGoal: ReadingRangeGoal;
  thresholdHz: number;
};

export type ReadingSettings = {
  texts: ReadingText[];
  activeTextId: string | null;
  feedback: ReadingFeedbackSettings;
};
