import { Card, CardContent } from "@/components/ui/card";

interface TableEmptyStateProps {
  message?: string;
}

export function TableEmptyState({
  message = "No data found in this table.",
}: TableEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground text-center">{message}</p>
      </CardContent>
    </Card>
  );
}

