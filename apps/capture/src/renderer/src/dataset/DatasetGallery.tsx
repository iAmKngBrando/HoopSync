import { useState } from "react";
import type { DatasetExample, ScreenTag } from "./types";

interface DatasetGalleryProps {
  examples: DatasetExample[];
  tags: ScreenTag[];
  onDelete: (id: string) => void;
}

export function DatasetGallery({ examples, tags, onDelete }: DatasetGalleryProps) {
  const [preview, setPreview] = useState<DatasetExample | null>(null);

  // Shows every known tag, including ones with zero examples so far - useful for
  // tracking dataset coverage across the taxonomy, which is the point of Phase 2.
  const grouped = tags.map((tag) => ({
    type: tag.name,
    items: examples.filter((e) => e.screenType === tag.name),
  }));

  return (
    <div className="gallery">
      {grouped.map((group) => (
        <div key={group.type} className="gallery__group">
          <h3>
            {group.type} <span className="muted">({group.items.length})</span>
          </h3>
          {group.items.length === 0 ? (
            <p className="muted">No examples yet.</p>
          ) : (
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
          )}
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
