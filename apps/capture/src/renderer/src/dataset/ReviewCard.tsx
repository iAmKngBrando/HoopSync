import { useState } from "react";
import type { CapturedImage } from "./imageUtils";
import { TagSelect } from "./TagSelect";
import type { ScreenTag, ScreenType } from "./types";

export interface PendingExample {
  image: CapturedImage;
  source: "live" | "upload";
  originalFilename?: string;
}

interface ReviewCardProps {
  pending: PendingExample;
  tags: ScreenTag[];
  onCreateTag: (name: string, description: string) => Promise<void>;
  onSave: (screenType: ScreenType) => void;
  onDiscard: () => void;
}

export function ReviewCard({ pending, tags, onCreateTag, onSave, onDiscard }: ReviewCardProps) {
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
          <TagSelect id="screen-type-select" tags={tags} value={screenType} onChange={setScreenType} onCreateTag={onCreateTag} />
          <div className="review-card__actions">
            <button onClick={() => onSave(screenType)}>Save to dataset</button>
            <button onClick={onDiscard}>Discard</button>
          </div>
        </div>
      </div>
    </section>
  );
}
