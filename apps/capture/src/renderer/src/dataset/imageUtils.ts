import { THUMBNAIL_WIDTH } from "../capture/constants";

export interface CapturedImage {
  fullDataUrl: string;
  thumbnailDataUrl: string;
  width: number;
  height: number;
}

function toCapturedImage(
  source: CanvasImageSource,
  width: number,
  height: number,
  mimeType: "image/jpeg" | "image/png",
): CapturedImage | null {
  const full = document.createElement("canvas");
  full.width = width;
  full.height = height;
  const fullCtx = full.getContext("2d");
  if (!fullCtx) return null;
  fullCtx.drawImage(source, 0, 0, width, height);

  const thumb = document.createElement("canvas");
  const scale = THUMBNAIL_WIDTH / width;
  thumb.width = THUMBNAIL_WIDTH;
  thumb.height = Math.round(height * scale);
  const thumbCtx = thumb.getContext("2d");
  if (!thumbCtx) return null;
  thumbCtx.drawImage(source, 0, 0, thumb.width, thumb.height);

  return {
    fullDataUrl: full.toDataURL(mimeType, 0.9),
    thumbnailDataUrl: thumb.toDataURL("image/jpeg", 0.7),
    width,
    height,
  };
}

/** Grabs a full-resolution still from the currently playing video element (brief Section 17/18 "Capture stills"). */
export function captureFromVideo(video: HTMLVideoElement): CapturedImage | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null;
  return toCapturedImage(video, video.videoWidth, video.videoHeight, "image/jpeg");
}

/** Loads a user-provided image file (brief Section 17/18 "Upload stills"). */
export function loadImageFile(file: File): Promise<CapturedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
        const result = toCapturedImage(img, img.naturalWidth, img.naturalHeight, mimeType);
        if (!result) throw new Error("Canvas unavailable");
        resolve(result);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}
