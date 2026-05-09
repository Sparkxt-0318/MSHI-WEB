import { cn } from '@/lib/utils';

interface SectionLabelProps {
  number: string;
  label: string;
  className?: string;
}

export function SectionLabel({ number, label, className }: SectionLabelProps) {
  return (
    <p className={cn('meta-label', className)}>
      <span aria-hidden="true">{number}</span>
      <span className="mx-2 text-rule" aria-hidden="true">
        ·
      </span>
      <span>{label}</span>
    </p>
  );
}
