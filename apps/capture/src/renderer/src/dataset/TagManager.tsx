import { useState } from "react";
import type { ScreenTag } from "./types";

interface TagManagerProps {
  tags: ScreenTag[];
  onUpdateDescription: (name: string, description: string) => Promise<void>;
}

export function TagManager({ tags, onUpdateDescription }: TagManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  function startEdit(tag: ScreenTag) {
    setEditing(tag.name);
    setDraft(tag.description);
  }

  async function save(name: string) {
    await onUpdateDescription(name, draft);
    setEditing(null);
  }

  return (
    <table className="tag-table">
      <thead>
        <tr>
          <th>Tag</th>
          <th>Description / where to look</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {tags.map((tag) => (
          <tr key={tag.name}>
            <td className="tag-table__name">
              {tag.name}
              {!tag.builtin && <span className="tag-table__custom"> custom</span>}
            </td>
            <td>
              {editing === tag.name ? (
                <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
              ) : (
                <span className={tag.description ? "" : "muted"}>{tag.description || "No description yet."}</span>
              )}
            </td>
            <td>
              {editing === tag.name ? (
                <>
                  <button onClick={() => save(tag.name)}>Save</button>
                  <button onClick={() => setEditing(null)}>Cancel</button>
                </>
              ) : (
                <button onClick={() => startEdit(tag)}>Edit</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
