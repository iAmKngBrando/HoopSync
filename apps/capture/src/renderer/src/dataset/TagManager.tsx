import { useState } from "react";
import type { ScreenTag } from "./types";

interface TagManagerProps {
  tags: ScreenTag[];
  onUpdateDescription: (name: string, description: string) => Promise<void>;
  onRenameTag: (name: string, newName: string) => Promise<void>;
  onDeleteTag: (name: string) => Promise<void>;
  onAddTag: (name: string, description: string) => Promise<void>;
}

export function TagManager({ tags, onUpdateDescription, onRenameTag, onDeleteTag, onAddTag }: TagManagerProps) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [draftName, setDraftName] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function startEdit(tag: ScreenTag) {
    setEditing(tag.name);
    setDraft(tag.description);
    setDraftName(tag.name);
    setError(null);
  }

  async function save(tag: ScreenTag) {
    setError(null);
    try {
      if (!tag.builtin && draftName.trim() !== tag.name) {
        await onRenameTag(tag.name, draftName);
      }
      if (draft !== tag.description) {
        await onUpdateDescription(tag.builtin ? tag.name : draftName.trim(), draft);
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function remove(name: string) {
    setError(null);
    try {
      await onDeleteTag(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function create() {
    setError(null);
    try {
      await onAddTag(newName, newDescription);
      setAdding(false);
      setNewName("");
      setNewDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <>
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
                {editing === tag.name && !tag.builtin ? (
                  <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} autoFocus />
                ) : (
                  <>
                    {tag.name}
                    {!tag.builtin && <span className="tag-table__custom"> custom</span>}
                  </>
                )}
              </td>
              <td>
                {editing === tag.name ? (
                  <textarea rows={2} value={draft} onChange={(e) => setDraft(e.target.value)} />
                ) : (
                  <span className={tag.description ? "" : "muted"}>{tag.description || "No description yet."}</span>
                )}
              </td>
              <td>
                {editing === tag.name ? (
                  <>
                    <button onClick={() => save(tag)}>Save</button>
                    <button onClick={() => setEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(tag)}>Edit</button>
                    {!tag.builtin && <button onClick={() => remove(tag.name)}>Delete</button>}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {adding ? (
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
            <button onClick={create} disabled={!newName.trim()}>
              Create tag
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewName("");
                setNewDescription("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}>+ Add Tag</button>
      )}
      {error && <p className="error">{error}</p>}
    </>
  );
}
