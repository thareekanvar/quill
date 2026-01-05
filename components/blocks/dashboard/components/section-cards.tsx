"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/translation-context";
import {
  TrendDown,
  TrendUp,
  DotsSixVertical,
  WarningCircle,
  PencilIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DateRange } from "@/components/dashboard/date-filter-picker";
import {
  useDashboardCards,
  useExecuteCardQueries,
  useReorderDashboardCards,
} from "@/hooks/use-dashboard-cards";
import { useUIStore } from "@/lib/stores/ui-store";
import type { DashboardCard } from "@/lib/db";

interface CardData {
  cardId: string;
  value: string;
  trendValue?: string;
  trendType?: "up" | "down" | "neutral";
  success: boolean;
  error?: string;
}

function SortableCard({
  card,
  cardData,
  onEdit,
  onDelete,
}: {
  card: {
    id: string;
    description: string;
    footerText?: string;
  };
  cardData?: CardData;
  onEdit?: (card: DashboardCard) => void;
  onDelete?: (cardId: string) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const trendType = cardData?.trendType || "neutral";
  const TrendIcon = trendType === "down" ? TrendDown : TrendUp;
  const trendValue = cardData?.trendValue;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="@container/card relative group"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <DotsSixVertical className="size-4 text-muted-foreground" />
      </div>
      {(onEdit || onDelete) && (
        <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card as DashboardCard);
              }}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          )}
        </div>
      )}
      <CardHeader>
        <CardDescription>{card.description}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {cardData?.success !== false ? (
            cardData?.value || t.common.loading
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-2 text-destructive cursor-help">
                  <WarningCircle className="size-5" />
                  {t.common.error}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  {cardData?.error || t.sidebar.queryExecutionFailed}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </CardTitle>
        {trendValue && trendType !== "neutral" && (
          <CardAction>
            <Badge
              variant="outline"
              className={
                trendType === "up"
                  ? "border-green-500 text-green-700 bg-green-50 dark:border-green-400 dark:text-green-300 dark:bg-green-950"
                  : trendType === "down"
                  ? "border-red-500 text-red-700 bg-red-50 dark:border-red-400 dark:text-red-300 dark:bg-red-950"
                  : "border-gray-500 text-gray-700 bg-gray-50 dark:border-gray-400 dark:text-gray-300 dark:bg-gray-950"
              }
            >
              <TrendIcon
                className={`size-4 ${
                  trendType === "up"
                    ? "text-green-600 dark:text-green-400"
                    : trendType === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />
              {trendValue}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      {card.footerText && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {card.footerText}
            {trendType !== "neutral" && (
              <TrendIcon
                className={`size-4 ${
                  trendType === "up"
                    ? "text-green-600 dark:text-green-400"
                    : trendType === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              />
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export interface SectionCardsProps {
  dateRange: DateRange;
}

export function SectionCards({ dateRange }: SectionCardsProps) {
  const { t } = useTranslation();
  const { data: cardsData, isLoading: cardsLoading } = useDashboardCards();
  const executeQueries = useExecuteCardQueries();
  const reorderCards = useReorderDashboardCards();
  const [cardResults, setCardResults] = useState<Record<string, CardData>>({});
  const { setEditingCard, setDeleteCardId } = useUIStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const cards = cardsData?.cards || [];

  // Execute queries when cards change or date range changes
  useEffect(() => {
    if (cards.length > 0) {
      executeQueries.mutate(
        {
          cardIds: cards.map((c) => c.id),
          dateRange:
            dateRange.from || dateRange.to
              ? {
                  from: dateRange.from?.toISOString(),
                  to: dateRange.to?.toISOString(),
                }
              : undefined,
        },
        {
          onSuccess: (data) => {
            const results: Record<string, CardData> = {};
            data.results.forEach((result: CardData) => {
              results[result.cardId] = result;
            });
            setCardResults(results);
          },
          onError: (error) => {
            console.error("Error executing card queries:", error);
          },
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, dateRange.from, dateRange.to]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);

      const newCards = arrayMove(cards, oldIndex, newIndex);
      const cardIds = newCards.map((c) => c.id);

      try {
        await reorderCards.mutateAsync(cardIds);
      } catch (error) {
        console.error("Error reordering cards:", error);
      }
    }
  };

  const handleEdit = (card: DashboardCard) => {
    setEditingCard(card);
  };

  const handleDelete = (cardId: string) => {
    setDeleteCardId(cardId);
  };

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">{t.sidebar.loadingCards}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cards.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-4">
            {t.sidebar.noDashboardCards}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={cards.map((c) => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              {cards.map((card) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  cardData={cardResults[card.id]}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
