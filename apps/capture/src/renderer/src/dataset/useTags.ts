import { useCallback, useEffect, useState } from "react";
import type { ScreenTag } from "./types";

export function useTags() {
  const [tags, setTags] = useState<ScreenTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.hoopsync) return; // renderer opened outside Electron (e.g. dev-server smoke test)
    setLoading(true);
    try {
      setTags(await window.hoopsync.listTags());
    } finally {
      setLoading(false);
    }
  }, []);

  const addTag = useCallback(async (name: string, description: string) => {
    if (!window.hoopsync) return;
    setError(null);
    try {
      setTags(await window.hoopsync.addTag(name, description));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }, []);

  const updateDescription = useCallback(async (name: string, description: string) => {
    if (!window.hoopsync) return;
    setTags(await window.hoopsync.updateTagDescription(name, description));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tags, loading, error, addTag, updateDescription, refresh };
}
