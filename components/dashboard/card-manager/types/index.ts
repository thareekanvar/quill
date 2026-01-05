import type { DashboardCard } from "@/lib/db";

/**
 * Query types available for dashboard cards
 */
export type QueryType = "rowCount" | "sum" | "avg" | "min" | "max" | "countDistinct" | "custom";

/**
 * Form data structure for card creation/editing
 */
export interface CardFormData {
  title: string;
  description: string;
  queryType: QueryType;
  tableName: string;
  schemaName: string;
  query: string;
  valueColumn: string;
  aggregateColumn: string;
  footerText: string;
  dateColumn: string;
}

/**
 * Props for CardManager component
 */
export interface CardManagerProps {
  onCardChange?: () => void;
  externalEditCard?: DashboardCard | null;
  externalDeleteCardId?: string | null;
  onExternalEditChange?: (card: DashboardCard | null) => void;
  onExternalDeleteChange?: (cardId: string | null) => void;
}

/**
 * Props for CardForm component
 */
export interface CardFormProps {
  editingCard: DashboardCard | null;
  onSubmit: (data: CardFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  tables: Array<{ tableName: string; schemaName: string }>;
}

/**
 * Props for ExistingCardsList component
 */
export interface ExistingCardsListProps {
  cards: DashboardCard[];
  onEdit: (card: DashboardCard) => void;
  onDelete: (cardId: string) => void;
}

/**
 * Props for DeleteCardDialog component
 */
export interface DeleteCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Result of query generation
 */
export interface QueryGenerationResult {
  query: string;
  valueColumn: string;
}

