/**
 * Component-related type definitions
 */

export interface PasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
}

export interface PageProps {
  params: Promise<{
    tableName: string;
  }>;
}

