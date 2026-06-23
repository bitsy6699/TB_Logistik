import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <Card className={className}>
      {(title || description || action) && (
        <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={title || description ? 'pt-5' : ''}>{children}</CardContent>
    </Card>
  );
}
