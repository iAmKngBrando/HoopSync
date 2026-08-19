import { useState } from "react";
import { SCREEN_TYPES } from "./screenTypes";
import type { DatasetExample } from "./types";

interface DatasetGalleryProps {
  examples: DatasetExample[];
  onDelete: (id: string) => void;
}

export function DatasetGallery({ examples, onDelete }: DatasetGalleryProps) {
  const [preview, setPreview] = useState<DatasetExample | null>(null);
  const grouped = SCREEN_TYPES.map((type) => ({
    type,
    items: examples.filter((e) => e.screenType === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="gallery">
      {grouped.length === 0 && <p className="muted">No labeled examples yet.</p>}
      {grouped.map((group) => (
        <div key={group.type} className="gallery__group">
          <h3>
            {group.type} <span className="muted">({group.items.length})</span>
          </h3>
          <div className="gallery__grid">
            {group.items.map((item) => (
              <div key={item.id} className="gallery__item">
                <img src={item.thumbnailDataUrl} alt={item.screenType} onClick={() => setPreview(item)} />
                <button className="gallery__delete" onClick={() => onDelete(item.id)} title="Delete example">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {preview && (
        <div className="lightbox" onClick={() => setPreview(null)}>
          <img src={preview.thumbnailDataUrl} alt={preview.screenType} />
          <div className="lightbox__caption">
            {preview.screenType} · {preview.width}x{preview.height} · {preview.source} ·{" "}
            {new Date(preview.capturedAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
