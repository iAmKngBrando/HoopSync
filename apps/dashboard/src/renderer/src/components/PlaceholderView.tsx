import type { LucideIcon } from 'lucide-react';
import { Card } from './ui/Card';

interface PlaceholderViewProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlaceholderView({ icon: Icon, title, description }: PlaceholderViewProps) {
  return (
    <div className="flex h-full items-center justify-center p-10">
      <Card className="max-w-md items-center gap-3 py-10 text-center">
        <Icon size={28} className="text-primary" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-foreground-secondary">{description}</p>
      </Card>
    </div>
  );
}
