import { useEffect, useState, type RefObject } from "react";
import type { DeviceStatus } from "../capture/types";
import { DatasetGallery } from "./DatasetGallery";
import { captureFromVideo, loadImageFile } from "./imageUtils";
import { ReviewCard, type PendingExample } from "./ReviewCard";
import { SessionRecorderControls } from "./SessionRecorderControls";
import { SessionReviewer } from "./SessionReviewer";
import { TagManager } from "./TagManager";
import type { ScreenType } from "./types";
import { UploadDropzone } from "./UploadDropzone";
import { useDataset } from "./useDataset";
import { useSessionRecording } from "./useSessionRecording";
import { useTags } from "./useTags";

interface DatasetViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  captureStatus: DeviceStatus;
}

export function DatasetView({ videoRef, captureStatus }: DatasetViewProps) {
  const dataset = useDataset();
  const tagsState = useTags();
  const recording = useSessionRecording(videoRef);
  const [pending, setPending] = useState<PendingExample | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [justFinishedSessionId, setJustFinishedSessionId] = useState<string | null>(null);

  function captureStill() {
    const video = videoRef.current;
    if (!video) return;
    const image = captureFromVideo(video);
    if (!image) return;
    setPending({ image, source: "live" });
  }

  async function handleFilesSelected(files: FileList) {
    setUploadError(null);
    const file = files[0];
    if (!file) return;
    try {
      const image = await loadImageFile(file);
      setPending({ image, source: "upload", originalFilename: file.name });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSave(screenType: ScreenType) {
    if (!pending) return;
    await dataset.save({
      imageDataUrl: pending.image.fullDataUrl,
      thumbnailDataUrl: pending.image.thumbnailDataUrl,
      screenType,
      source: pending.source,
      width: pending.image.width,
      height: pending.image.height,
      originalFilename: pending.originalFilename,
    });
    setPending(null);
  }

  function handleStopRecording() {
    const finishedId = recording.sessionId;
    recording.stop();
    setJustFinishedSessionId(finishedId);
  }

  // If recording auto-stopped on save failures, open whatever was captured for review.
  useEffect(() => {
    if (recording.error && recording.sessionId) setJustFinishedSessionId(recording.sessionId);
  }, [recording.error, recording.sessionId]);

  return (
    <>
      <section className="panel">
        <div className="panel__row">
          <button onClick={captureStill} disabled={captureStatus !== "CONNECTED"}>
            Capture still from live feed
          </button>
          {captureStatus !== "CONNECTED" && <span className="muted">Connect a device on the Capture tab first.</span>}
        </div>
      </section>

      <section className="panel">
        <h2>Upload stills</h2>
        <UploadDropzone onFilesSelected={handleFilesSelected} />
        {uploadError && <p className="error">{uploadError}</p>}
      </section>

      {pending && (
        <ReviewCard
          pending={pending}
          tags={tagsState.tags}
          onCreateTag={(name, description) => tagsState.addTag(name, description)}
          onSave={handleSave}
          onDiscard={() => setPending(null)}
        />
      )}

      <SessionRecorderControls
        isRecording={recording.isRecording}
        frameCount={recording.frameCount}
        error={recording.error}
        captureStatus={captureStatus}
        onStart={recording.start}
        onStop={handleStopRecording}
      />

      <SessionReviewer
        tags={tagsState.tags}
        onCreateTag={(name, description) => tagsState.addTag(name, description)}
        activeSessionId={justFinishedSessionId}
      />

      <section className="panel">
        <div className="panel__row">
          <h2>Tags</h2>
          <button onClick={() => setShowTagManager((v) => !v)}>{showTagManager ? "Hide" : "Manage tags"}</button>
        </div>
        {showTagManager && (
          <TagManager
            tags={tagsState.tags}
            onUpdateDescription={tagsState.updateDescription}
            onRenameTag={tagsState.renameTag}
            onDeleteTag={tagsState.deleteTag}
            onAddTag={tagsState.addTag}
          />
        )}
      </section>

      <section className="panel">
        <h2>Dataset {dataset.loading ? "(loading…)" : `(${dataset.examples.length} examples)`}</h2>
        <DatasetGallery examples={dataset.examples} tags={tagsState.tags} onDelete={dataset.remove} />
      </section>
    </>
  );
}
