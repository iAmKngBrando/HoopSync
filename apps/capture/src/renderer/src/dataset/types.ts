import type { ScreenType } from "./screenTypes";

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
