import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react";

interface TableErrorStateProps {
  message?: string;
}

export function TableErrorState({ message }: TableErrorStateProps) {
  return (
    <Alert variant="destructive">
      <WarningCircle />
      <AlertTitle>Error loading table</AlertTitle>
      <AlertDescription>
        {message || "An error occurred while loading the table data."}
      </AlertDescription>
    </Alert>
  );
}

