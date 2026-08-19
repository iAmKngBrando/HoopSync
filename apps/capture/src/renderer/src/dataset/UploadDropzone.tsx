import { useRef, useState, type DragEvent } from "react";

interface UploadDropzoneProps {
  onFilesSelected: (files: FileList) => void;
}

export function UploadDropzone({ onFilesSelected }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) onFilesSelected(e.dataTransfer.files);
  }

  return (
    <div
      className={`dropzone${isDragging ? " dropzone--active" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <p>Drag & drop a screenshot here, or click to browse</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) onFilesSelected(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
