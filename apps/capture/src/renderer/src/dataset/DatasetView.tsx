import { useState, type RefObject } from "react";
import type { DeviceStatus } from "../capture/types";
import { DatasetGallery } from "./DatasetGallery";
import { captureFromVideo, loadImageFile } from "./imageUtils";
import { ReviewCard, type PendingExample } from "./ReviewCard";
import type { ScreenType } from "./screenTypes";
import { UploadDropzone } from "./UploadDropzone";
import { useDataset } from "./useDataset";

interface DatasetViewProps {
  videoRef: RefObject<HTMLVideoElement>;
  captureStatus: DeviceStatus;
}

export function DatasetView({ videoRef, captureStatus }: DatasetViewProps) {
  const dataset = useDataset();
  const [pending, setPending] = useState<PendingExample | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

      {pending && <ReviewCard pending={pending} onSave={handleSave} onDiscard={() => setPending(null)} />}

      <section className="panel">
        <h2>Dataset {dataset.loading ? "(loading…)" : `(${dataset.examples.length} examples)`}</h2>
        <DatasetGallery examples={dataset.examples} onDelete={dataset.remove} />
      </section>
    </>
  );
}
