// window.hoopsync only exists when running inside the Electron app (via
// preload); it's absent in the plain-browser dev mode (vite.browser.config.ts),
// so any usage must check for it first, same as apps/capture does.
type CameraAccessStatus = "not-determined" | "granted" | "denied" | "restricted" | "unknown";

type BoardColumn = "todo" | "doing" | "done";

interface BoardTagDef {
  name: string;
  builtin: boolean;
}

interface BoardCard {
  id: string;
  title: string;
  note?: string;
  column: BoardColumn;
  tag?: string;
  author?: string;
  createdAt: string;
}

declare global {
  interface Window {
    hoopsync?: {
      versions: { chrome: string; electron: string; node: string };
      getCameraAccessStatus: () => Promise<CameraAccessStatus>;
      openCameraPrivacySettings: () => Promise<void>;
      devBoard: {
        list: () => Promise<BoardCard[]>;
        addCard: (title: string, note: string | undefined, tag: string | undefined, author: string | undefined) => Promise<BoardCard[]>;
        moveCard: (id: string, column: BoardColumn) => Promise<BoardCard[]>;
        deleteCard: (id: string) => Promise<BoardCard[]>;
        listTags: () => Promise<BoardTagDef[]>;
        addTag: (name: string) => Promise<BoardTagDef[]>;
        renameTag: (name: string, newName: string) => Promise<BoardTagDef[]>;
        deleteTag: (name: string) => Promise<BoardTagDef[]>;
      };
    };
  }
}

export {};
