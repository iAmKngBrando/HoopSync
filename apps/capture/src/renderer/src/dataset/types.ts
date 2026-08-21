/** Screen type is an open string - see useTags(). Mirrors src/main/dataset.ts. */
export type ScreenType = string;

/** Mirrors DatasetExample in src/main/dataset.ts. */
export interface DatasetExample {
  id: string;
  screenType: ScreenType;
  source: "live" | "upload";
  filename: string;
  width: number;
  height: number;
  capturedAt: string;
  thumbnailDataUrl: string;
  originalFilename?: string;
}

/** Mirrors SaveDatasetExampleInput in src/main/dataset.ts. */
export interface SaveDatasetExampleInput {
  imageDataUrl: string;
  thumbnailDataUrl: string;
  screenType: ScreenType;
  source: "live" | "upload";
  width: number;
  height: number;
  originalFilename?: string;
}

/** Mirrors ScreenTag in src/main/tags.ts. */
export interface ScreenTag {
  name: string;
  description: string;
  builtin: boolean;
}

/** Mirrors SessionFrame in src/main/sessionRecording.ts. */
export interface SessionFrame {
  id: string;
  sequence: number;
  timestamp: number;
  filename: string;
  width: number;
  height: number;
  thumbnailDataUrl: string;
}

/** Mirrors SessionSummary in src/main/sessionRecording.ts. */
export interface SessionSummary {
  id: string;
  startedAt: string;
  frameCount: number;
}

/** Mirrors AppendSessionFrameInput in src/main/sessionRecording.ts. */
export interface AppendSessionFrameInput {
  imageDataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
}
