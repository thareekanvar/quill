"use client";

import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "@phosphor-icons/react";
import type { DashboardCard } from "@/lib/db";
import type { ExistingCardsListProps } from "../types";

export function ExistingCardsList({
  cards,
  onEdit,
  onDelete,
}: ExistingCardsListProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4 px-6 pb-6">
      <h3 className="text-sm font-medium">Existing Cards</h3>
      <div className="space-y-2">
        {cards.map((card) => (
          <div
            key={card.id}
            className="group flex items-center justify-between p-3 border rounded-md hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-medium">{card.title}</p>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onEdit(card)}
                className="h-7 w-7"
              >
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onDelete(card.id)}
                className="h-7 w-7"
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

