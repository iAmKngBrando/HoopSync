import { useState } from "react";
import type { ScreenTag } from "./types";

const NEW_TAG_VALUE = "__new__";

interface TagSelectProps {
  tags: ScreenTag[];
  value: string;
  onChange: (name: string) => void;
  onCreateTag: (name: string, description: string) => Promise<void>;
  id?: string;
}

export function TagSelect({ tags, value, onChange, onCreateTag, id }: TagSelectProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const selectedTag = tags.find((t) => t.name === value);

  async function handleCreate() {
    setCreateError(null);
    try {
      await onCreateTag(newName, newDescription);
      onChange(newName.trim());
      setCreating(false);
      setNewName("");
      setNewDescription("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="tag-select">
      <select
        id={id}
        value={creating ? NEW_TAG_VALUE : value}
        onChange={(e) => {
          if (e.target.value === NEW_TAG_VALUE) {
            setCreating(true);
          } else {
            setCreating(false);
            onChange(e.target.value);
          }
        }}
      >
        {tags.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
        <option value={NEW_TAG_VALUE}>+ Add new tag…</option>
      </select>

      {!creating && selectedTag?.description && <p className="tag-select__hint">{selectedTag.description}</p>}

      {creating && (
        <div className="tag-select__create">
          <input
            type="text"
            placeholder="TAG_NAME"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />
          <textarea
            placeholder="What does this look like, where in the frame? (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            rows={2}
          />
          <div className="tag-select__create-actions">
            <button onClick={handleCreate} disabled={!newName.trim()}>
              Create tag
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setCreateError(null);
              }}
            >
              Cancel
            </button>
          </div>
          {createError && <p className="error">{createError}</p>}
        </div>
      )}
    </div>
  );
}
