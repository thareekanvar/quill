"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  useCreateDashboardCard,
  useUpdateDashboardCard,
  useDeleteDashboardCard,
} from "@/hooks/use-dashboard-cards";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { GearIcon } from "@phosphor-icons/react";
import { CardForm } from "./components/card-form";
import { DeleteCardDialog } from "./components/delete-card-dialog";
import type { CardFormData, CardManagerProps } from "./types";
import { formDataToCardData } from "./helpers/query-generator";
import { useUIStore } from "@/lib/stores/ui-store";
import { useTranslation } from "@/contexts/translation-context";

export function CardManager({
  onCardChange,
  externalEditCard,
  externalDeleteCardId,
  onExternalEditChange,
  onExternalDeleteChange,
}: CardManagerProps) {
  const {
    cardManagerOpen,
    editingCard,
    deleteCardId,
    openCardManager,
    closeCardManager,
    setEditingCard: setStoreEditingCard,
    setDeleteCardId: setStoreDeleteCardId,
  } = useUIStore();

  // Use external state if provided, otherwise use store state
  const currentEditingCard =
    externalEditCard !== undefined ? externalEditCard : editingCard;
  const currentDeleteCardId =
    externalDeleteCardId !== undefined ? externalDeleteCardId : deleteCardId;

  const setEditingCardState = (card: typeof currentEditingCard) => {
    if (onExternalEditChange) {
      onExternalEditChange(card);
    } else {
      setStoreEditingCard(card);
    }
  };

  const setDeleteCardIdState = (cardId: string | null) => {
    if (onExternalDeleteChange) {
      onExternalDeleteChange(cardId);
    } else {
      setStoreDeleteCardId(cardId);
    }
  };

  const { tables } = useSidebarStore();
  const createCard = useCreateDashboardCard();
  const updateCard = useUpdateDashboardCard();
  const deleteCard = useDeleteDashboardCard();
  const isSubmitting = createCard.isPending || updateCard.isPending;
  const { t } = useTranslation();

  // Determine if Sheet should be open
  const sheetOpen =
    externalEditCard !== undefined
      ? externalEditCard !== null
      : cardManagerOpen;

  const handleSubmit = async (data: CardFormData) => {
    const cardData = formDataToCardData(data);

    try {
      if (currentEditingCard) {
        await updateCard.mutateAsync({
          id: currentEditingCard.id,
          updates: cardData,
        });
      } else {
        await createCard.mutateAsync(cardData);
      }
      closeCardManager();
      setEditingCardState(null);
      onCardChange?.();
    } catch (error) {
      console.error("Error saving card:", error);
    }
  };

  const handleCancel = () => {
    closeCardManager();
    setEditingCardState(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (externalEditCard === undefined) {
      if (open) {
        openCardManager();
      } else {
        closeCardManager();
      }
    }
    if (!open) {
      setEditingCardState(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (currentDeleteCardId) {
      try {
        await deleteCard.mutateAsync(currentDeleteCardId);
        setDeleteCardIdState(null);
        onCardChange?.();
      } catch (error) {
        console.error("Error deleting card:", error);
      }
    }
  };

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild onClick={openCardManager}>
          <Button variant="outline" size="sm">
            <GearIcon className="size-4" />
            {t.card.manageCards}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto space-y-0"
        >
          <SheetHeader className="pb-2">
            <SheetTitle>
              {currentEditingCard
                ? t.card.editDashboardCard
                : t.card.createDashboardCard}
            </SheetTitle>
            <SheetDescription>
              {t.card.cardDescription}
            </SheetDescription>
          </SheetHeader>

          <CardForm
            editingCard={currentEditingCard}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
            tables={tables}
          />
        </SheetContent>
      </Sheet>

      <DeleteCardDialog
        open={currentDeleteCardId !== null}
        onOpenChange={(open) => !open && setDeleteCardIdState(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
