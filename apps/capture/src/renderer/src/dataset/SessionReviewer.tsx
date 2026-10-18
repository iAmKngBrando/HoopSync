import { useCallback, useEffect, useState } from "react";
import { TagSelect } from "./TagSelect";
import type { ScreenTag, SessionFrame, SessionSummary } from "./types";

interface SessionReviewerProps {
  tags: ScreenTag[];
  onCreateTag: (name: string, description: string) => Promise<void>;
  /** Most recently completed recording, if any - auto-selected for review. */
  activeSessionId: string | null;
  /** Called after frames are committed so the dataset gallery can refresh. */
  onCommitted?: () => Promise<void> | void;
}

export function SessionReviewer({ tags, onCreateTag, activeSessionId, onCommitted }: SessionReviewerProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [frames, setFrames] = useState<SessionFrame[]>([]);
  const [selectedFrameIds, setSelectedFrameIds] = useState<Set<string>>(new Set());
  const [labelType, setLabelType] = useState("other");
  const [loading, setLoading] = useState(false);

  const refreshSessions = useCallback(async () => {
    if (!window.hoopsync) return;
    setSessions(await window.hoopsync.listSessions());
  }, []);

  const refreshFrames = useCallback(async (sessionId: string) => {
    if (!window.hoopsync) return;
    setLoading(true);
    try {
      setFrames(await window.hoopsync.listSessionFrames(sessionId));
      setSelectedFrameIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  useEffect(() => {
    if (activeSessionId) {
      setSelectedSessionId(activeSessionId);
      refreshSessions(); // the sessions list was only ever fetched once, on mount - a just-finished session needs a re-fetch to appear at all
    }
  }, [activeSessionId, refreshSessions]);

  useEffect(() => {
    if (selectedSessionId) refreshFrames(selectedSessionId);
    else setFrames([]);
  }, [selectedSessionId, refreshFrames]);

  function toggleFrame(id: string) {
    setSelectedFrameIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function commitSelected() {
    if (!window.hoopsync || !selectedSessionId || selectedFrameIds.size === 0) return;
    await window.hoopsync.commitSessionFrames(selectedSessionId, [...selectedFrameIds], labelType);
    await refreshFrames(selectedSessionId);
    await refreshSessions();
    await onCommitted?.();
  }

  async function discardSelected() {
    if (!window.hoopsync || !selectedSessionId || selectedFrameIds.size === 0) return;
    await window.hoopsync.discardSessionFrames(selectedSessionId, [...selectedFrameIds]);
    await refreshFrames(selectedSessionId);
    await refreshSessions();
  }

  async function discardRest() {
    if (!window.hoopsync || !selectedSessionId) return;
    await window.hoopsync.discardSession(selectedSessionId);
    setSelectedSessionId(null);
    await refreshSessions();
  }

  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <h2>Review recorded sessions</h2>
      <div className="panel__row">
        <label htmlFor="session-select">Session</label>
        <select id="session-select" value={selectedSessionId ?? ""} onChange={(e) => setSelectedSessionId(e.target.value || null)}>
          <option value="" disabled>
            Select a session…
          </option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.startedAt).toLocaleString()} · {s.frameCount} frames
            </option>
          ))}
        </select>
      </div>

      {selectedSessionId && (
        <>
          {loading && <p className="muted">Loading…</p>}

          {!loading && frames.length === 0 && <p className="muted">Nothing left to review in this session.</p>}

          {!loading && frames.length > 0 && (
            <>
              <div className="panel__row">
                <button onClick={() => setSelectedFrameIds(new Set(frames.map((f) => f.id)))}>Select all</button>
                <button onClick={() => setSelectedFrameIds(new Set())}>Select none</button>
                <span className="muted">{selectedFrameIds.size} selected</span>
              </div>

              <div className="gallery__grid gallery__grid--selectable">
                {frames.map((frame) => (
                  <label key={frame.id} className={`session-frame${selectedFrameIds.has(frame.id) ? " session-frame--selected" : ""}`}>
                    <input type="checkbox" checked={selectedFrameIds.has(frame.id)} onChange={() => toggleFrame(frame.id)} />
                    <img src={frame.thumbnailDataUrl} alt={`Session frame ${frame.sequence}`} />
                  </label>
                ))}
              </div>

              <div className="panel__row session-reviewer__actions">
                <TagSelect tags={tags} value={labelType} onChange={setLabelType} onCreateTag={onCreateTag} />
                <button onClick={commitSelected} disabled={selectedFrameIds.size === 0}>
                  Label &amp; keep selected
                </button>
                <button onClick={discardSelected} disabled={selectedFrameIds.size === 0}>
                  Discard selected
                </button>
                <button onClick={discardRest}>Discard everything left</button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
