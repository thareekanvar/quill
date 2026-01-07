"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTables } from "@/hooks/use-postgres-query";
import {
  useTableIndexes,
  useCreateIndex,
  useDeleteIndex,
  useTableColumnsForSchema,
} from "@/hooks/use-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useTranslation } from "@/contexts/translation-context";
import { PasswordModal } from "@/components/dashboard/password-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEFAULT_SCHEMA } from "@/lib/constants";
import { TableSkeleton } from "./table-skeleton";

interface IndexManagerProps {
  selectedTable: { tableName: string; schemaName: string } | null;
  onTableSelect: (table: { tableName: string; schemaName: string } | null) => void;
}

export function IndexManager({ selectedTable, onTableSelect }: IndexManagerProps) {
  const { t } = useTranslation();
  const { connectionId, password } = useAuthStore();
  const { data: tablesData } = useTables();
  const createIndexMutation = useCreateIndex();
  const deleteIndexMutation = useDeleteIndex();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [createIndexDialogOpen, setCreateIndexDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "create" | "delete";
    data?: any;
  } | null>(null);

  const [newIndex, setNewIndex] = useState({
    name: "",
    columns: [] as string[],
    unique: false,
  });

  const tableName = selectedTable?.tableName;
  const schemaName = selectedTable?.schemaName || DEFAULT_SCHEMA;

  const { data: indexesData, isLoading: isLoadingIndexes } = useTableIndexes(tableName, schemaName);
  const indexes = indexesData?.indexes || [];

  // Get columns for the selected table
  const { data: columnsData } = useTableColumnsForSchema(tableName, schemaName);
  const columns = columnsData?.columns || [];

  const handleCreateIndex = () => {
    if (!selectedTable) {
      toast.error(t.schema.selectTableFirst);
      return;
    }
    setCreateIndexDialogOpen(true);
  };

  const handleSubmitCreateIndex = () => {
    if (!newIndex.name || newIndex.columns.length === 0) {
      toast.error(t.schema.indexNameAndColumnsRequired);
      return;
    }
    setPendingAction({ type: "create", data: newIndex });
    setPasswordModalOpen(true);
  };

  const handleDeleteIndex = (indexName: string) => {
    setPendingAction({ type: "delete", data: { indexName } });
    setPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async () => {
    if (!connectionId || !password || !selectedTable) {
      toast.error(t.schema.noConnection);
      return;
    }

    try {
      if (pendingAction?.type === "create") {
        await createIndexMutation.mutateAsync({
          schemaName: selectedTable.schemaName,
          tableName: selectedTable.tableName,
          index: pendingAction.data,
          password: password,
        });

        toast.success(t.schema.indexCreatedSuccess);
        setCreateIndexDialogOpen(false);
        setNewIndex({ name: "", columns: [], unique: false });
        setPasswordModalOpen(false);
        setPendingAction(null);
      } else if (pendingAction?.type === "delete") {
        await deleteIndexMutation.mutateAsync({
          schemaName: selectedTable.schemaName,
          indexName: pendingAction.data.indexName,
          password: password,
        });

        toast.success(t.schema.indexDeletedSuccess);
        setPasswordModalOpen(false);
        setPendingAction(null);
      }
    } catch (error: any) {
      toast.error(error.message || t.schema.operationFailed);
      setPasswordModalOpen(false);
      setPendingAction(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="mb-2 block">{t.schema.selectTable}</Label>
            <Select
              value={selectedTable ? `${selectedTable.schemaName}.${selectedTable.tableName}` : ""}
              onValueChange={(value) => {
                if (value) {
                  const [schema, table] = value.split(".");
                  onTableSelect({ schemaName: schema, tableName: table });
                } else {
                  onTableSelect(null);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t.schema.selectTablePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {tablesData?.tables.map((table) => (
                  <SelectItem
                    key={`${table.schemaName}.${table.tableName}`}
                    value={`${table.schemaName}.${table.tableName}`}
                  >
                    {table.schemaName}.{table.tableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTable && (
            <Button onClick={handleCreateIndex} disabled={createIndexMutation.isPending}>
              <Plus className="size-4 mr-2" />
              {t.schema.createIndex}
            </Button>
          )}
        </div>

        {selectedTable && isLoadingIndexes && (
          <TableSkeleton
            headers={[
              t.schema.indexName,
              t.schema.columns,
              t.schema.unique,
              t.schema.primary,
              t.common.actions,
            ]}
            columnConfigs={[
              { width: "w-32" },
              { width: "w-40" },
              { width: "w-12" },
              { width: "w-12" },
              {},
            ]}
          />
        )}

        {selectedTable && !isLoadingIndexes && indexes.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.schema.indexName}</TableHead>
                  <TableHead>{t.schema.columns}</TableHead>
                  <TableHead>{t.schema.unique}</TableHead>
                  <TableHead>{t.schema.primary}</TableHead>
                  <TableHead className="w-24">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indexes.map((index: any) => (
                  <TableRow key={index.indexName}>
                    <TableCell>{index.indexName}</TableCell>
                    <TableCell>{index.columns.join(", ")}</TableCell>
                    <TableCell>{index.isUnique ? t.common.yes : t.common.no}</TableCell>
                    <TableCell>{index.isPrimary ? t.common.yes : t.common.no}</TableCell>
                    <TableCell>
                      {!index.isPrimary && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteIndex(index.indexName)}
                          disabled={deleteIndexMutation.isPending}
                        >
                          <Trash className="size-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedTable && !isLoadingIndexes && indexes.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            {t.schema.noIndexesFound}
          </p>
        )}
      </div>

      <Dialog open={createIndexDialogOpen} onOpenChange={setCreateIndexDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.schema.createIndex}</DialogTitle>
            <DialogDescription>{t.schema.createIndexDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field>
              <Label>{t.schema.indexName}</Label>
              <Input
                value={newIndex.name}
                onChange={(e) => setNewIndex({ ...newIndex, name: e.target.value })}
                placeholder="idx_users_email"
              />
            </Field>
            <Field>
              <Label>{t.schema.columns}</Label>
              <div className="space-y-2">
                {columns.map((column: any) => (
                  <div key={column.columnName} className="flex items-center gap-2">
                    <Checkbox
                      checked={newIndex.columns.includes(column.columnName)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewIndex({
                            ...newIndex,
                            columns: [...newIndex.columns, column.columnName],
                          });
                        } else {
                          setNewIndex({
                            ...newIndex,
                            columns: newIndex.columns.filter((c) => c !== column.columnName),
                          });
                        }
                      }}
                    />
                    <Label className="font-normal">{column.columnName}</Label>
                  </div>
                ))}
              </div>
            </Field>
            <Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={newIndex.unique}
                  onCheckedChange={(checked) =>
                    setNewIndex({ ...newIndex, unique: checked as boolean })
                  }
                />
                <Label className="font-normal">{t.schema.unique}</Label>
              </div>
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateIndexDialogOpen(false);
                  setNewIndex({ name: "", columns: [], unique: false });
                }}
              >
                {t.common.cancel}
              </Button>
              <Button onClick={handleSubmitCreateIndex} disabled={createIndexMutation.isPending}>
                {t.schema.createIndex}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        title={t.schema.confirmPassword}
        description={t.schema.confirmPasswordDescription}
      />
    </>
  );
}

