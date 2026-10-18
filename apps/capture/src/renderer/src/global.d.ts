import type { CameraAccessStatus } from "./capture/types";
import type {
  AppendSessionFrameInput,
  DatasetExample,
  SaveDatasetExampleInput,
  ScreenTag,
  SessionFrame,
  SessionSummary,
} from "./dataset/types";

declare global {
  interface Window {
    hoopsync: {
      versions: { chrome: string; electron: string; node: string };
      getCameraAccessStatus: () => Promise<CameraAccessStatus>;
      openCameraPrivacySettings: () => Promise<void>;

      listDatasetExamples: () => Promise<DatasetExample[]>;
      saveDatasetExample: (input: SaveDatasetExampleInput) => Promise<DatasetExample>;
      deleteDatasetExample: (id: string) => Promise<void>;

      listTags: () => Promise<ScreenTag[]>;
      addTag: (name: string, description: string) => Promise<ScreenTag[]>;
      updateTagDescription: (name: string, description: string) => Promise<ScreenTag[]>;
      renameTag: (name: string, newName: string) => Promise<ScreenTag[]>;
      deleteTag: (name: string) => Promise<ScreenTag[]>;

      startSession: () => Promise<SessionSummary>;
      appendSessionFrame: (sessionId: string, input: AppendSessionFrameInput) => Promise<SessionFrame>;
      listSessions: () => Promise<SessionSummary[]>;
      listSessionFrames: (sessionId: string) => Promise<SessionFrame[]>;
      sessionFrameImage: (sessionId: string, frameId: string) => Promise<string | null>;
      discardSessionFrames: (sessionId: string, frameIds: string[]) => Promise<void>;
      discardSession: (sessionId: string) => Promise<void>;
      commitSessionFrames: (sessionId: string, frameIds: string[], screenType: string) => Promise<DatasetExample[]>;
    };
  }
}

export {};
