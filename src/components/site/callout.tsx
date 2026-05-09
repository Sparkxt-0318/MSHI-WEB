import { cn } from '@/lib/utils';

interface CalloutProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

/** Bedrock-styled callout box for highlighting a key number or fact. */
export function Callout({ label, children, className }: CalloutProps) {
  return (
    <aside
      className={cn(
        'my-8 border-l-2 border-accent bg-cream/70 p-5 text-[0.95rem] leading-relaxed text-ink',
        className,
      )}
    >
      {label ? (
        <p className="meta-label mb-2 text-ink-soft">{label}</p>
      ) : null}
      {children}
    </aside>
  );
}
