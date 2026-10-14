import type { ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface ScreenshotFrameProps {
  /** Captured frame to display; a placeholder scene is rendered when absent */
  src?: string;
  alt: string;
  /** Placeholder backdrop style */
  scene?: 'arena' | 'court';
  /** Tailwind aspect-ratio class; keeps the container stable for any image size */
  aspectClassName?: string;
  /** Overlay content (name plates, scores, status bars) */
  children?: ReactNode;
  className?: string;
}

/**
 * Fixed-ratio container for a captured gameplay frame. Real frames are cropped
 * with object-fit; without one it shows a clearly marked placeholder.
 */
export function ScreenshotFrame({
  src,
  alt,
  scene = 'arena',
  aspectClassName = 'aspect-video',
  children,
  className,
}: ScreenshotFrameProps) {
  return (
    <div
      className={cn(
        '@container relative isolate w-full overflow-hidden rounded-inset border border-border-muted bg-background-secondary',
        aspectClassName,
        className,
      )}
    >
      {src ? (
        <>
          <img src={src} alt={alt} className="absolute inset-0 size-full object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent"
          />
        </>
      ) : (
        <div
          role="img"
          aria-label={`${alt} (placeholder, no frame captured)`}
          className={cn('absolute inset-0', scene === 'court' ? 'scene-court' : 'scene')}
        >
          <div className="scene-hatch absolute inset-0" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/80 to-transparent" />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-background/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground-secondary">
            <ImageOff className="size-3" aria-hidden="true" />
            Placeholder
          </span>
        </div>
      )}
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}

interface FrameCaptionProps {
  capturedAt?: string;
  label: string;
}

export function FrameCaption({ capturedAt, label }: FrameCaptionProps) {
  return (
    <p className="mt-2 text-xs text-foreground-secondary">
      <span className="text-primary/90">Captured {capturedAt ?? '--:--'}</span>
      <span className="mx-1.5 text-muted-foreground">–</span>
      {label}
    </p>
  );
}
