import { useCallback, useEffect, useState } from "react";
import type { DatasetExample, SaveDatasetExampleInput } from "./types";

export function useDataset() {
  const [examples, setExamples] = useState<DatasetExample[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!window.hoopsync) return; // renderer opened outside Electron (e.g. dev-server smoke test)
    setLoading(true);
    try {
      setExamples(await window.hoopsync.listDatasetExamples());
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(
    async (input: SaveDatasetExampleInput) => {
      if (!window.hoopsync) return;
      await window.hoopsync.saveDatasetExample(input);
      await refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!window.hoopsync) return;
      await window.hoopsync.deleteDatasetExample(id);
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { examples, loading, save, remove, refresh };
}
