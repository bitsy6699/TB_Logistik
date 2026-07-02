import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SectionCard({ title, description, action, children, className = '' }) {
  return (
    <Card className={`border rounded-xl shadow-card ${className}`}>
      {(title || description || action) && (
        <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div className="space-y-1">
            {title && <CardTitle className="font-display text-base font-semibold">{title}</CardTitle>}
            {description && <CardDescription className="text-sm text-muted-foreground mt-0.5">{description}</CardDescription>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </CardHeader>
      )}
      <CardContent className={`p-6 ${title || description ? 'pt-5' : ''}`}>{children}</CardContent>
    </Card>
  );
}
