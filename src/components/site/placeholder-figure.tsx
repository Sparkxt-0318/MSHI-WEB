import { cn } from '@/lib/utils';

interface PlaceholderFigureProps {
  /** Filename the user is expected to drop in. */
  expectedPath: string;
  /** Short note describing the figure. */
  note?: string;
  /** Aspect ratio class (e.g. "aspect-[16/9]"). Default 16:9. */
  aspect?: string;
  className?: string;
}

/**
 * Visible placeholder for figures the user will supply.
 * Never renders fake content — the diagonal hatching and label make it
 * unmistakable that the asset has not been provided yet.
 */
export function PlaceholderFigure({
  expectedPath,
  note,
  aspect = 'aspect-[16/9]',
  className,
}: PlaceholderFigureProps) {
  return (
    <figure className={cn('w-full', className)}>
      <div className={cn('placeholder-tile w-full', aspect)}>
        <div className="space-y-2 px-6 py-4">
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-accent">
            PLACEHOLDER · USER TO SUPPLY
          </p>
          <p className="text-[0.7rem] text-ink-soft normal-case tracking-normal">
            {expectedPath}
          </p>
          {note ? (
            <p className="max-w-md text-[0.7rem] text-ink-soft normal-case tracking-normal">
              {note}
            </p>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
