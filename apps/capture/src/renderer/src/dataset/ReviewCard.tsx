import { useState } from "react";
import { SCREEN_TYPES, type ScreenType } from "./screenTypes";
import type { CapturedImage } from "./imageUtils";

export interface PendingExample {
  image: CapturedImage;
  source: "live" | "upload";
  originalFilename?: string;
}

interface ReviewCardProps {
  pending: PendingExample;
  onSave: (screenType: ScreenType) => void;
  onDiscard: () => void;
}

export function ReviewCard({ pending, onSave, onDiscard }: ReviewCardProps) {
  const [screenType, setScreenType] = useState<ScreenType>("UNKNOWN");

  return (
    <section className="panel panel--review">
      <h2>Label this frame</h2>
      <div className="review-card">
        <img src={pending.image.thumbnailDataUrl} alt="Pending capture" />
        <div className="review-card__fields">
          <div className="review-card__meta">
            {pending.image.width}x{pending.image.height} · {pending.source}
            {pending.originalFilename ? ` · ${pending.originalFilename}` : ""}
          </div>
          <label htmlFor="screen-type-select">Screen type</label>
          <select id="screen-type-select" value={screenType} onChange={(e) => setScreenType(e.target.value as ScreenType)}>
            {SCREEN_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <div className="review-card__actions">
            <button onClick={() => onSave(screenType)}>Save to dataset</button>
            <button onClick={onDiscard}>Discard</button>
          </div>
        </div>
      </div>
    </section>
  );
}
