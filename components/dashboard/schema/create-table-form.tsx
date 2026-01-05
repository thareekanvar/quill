"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldGroup } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/contexts/translation-context";
import { PasswordModal } from "@/components/dashboard/password-modal";
import { useCreateTable } from "@/hooks/use-schema";
import type { CreateTableParams } from "@/lib/helpers/schema-helpers";

const columnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
  type: z.string().min(1, "Column type is required"),
  nullable: z.boolean().default(true),
  defaultValue: z.string().optional(),
  primaryKey: z.boolean().default(false),
});

const createTableSchema = z.object({
  schemaName: z.string().min(1, "Schema name is required"),
  tableName: z.string().min(1, "Table name is required"),
  columns: z.array(columnSchema).min(1, "At least one column is required"),
});

type CreateTableFormData = z.infer<typeof createTableSchema>;

interface CreateTableFormProps {
  onTableCreated?: (tableName: string, schemaName: string) => void;
}

const POSTGRES_DATA_TYPES = [
  "VARCHAR",
  "TEXT",
  "INTEGER",
  "BIGINT",
  "SMALLINT",
  "DECIMAL",
  "NUMERIC",
  "REAL",
  "DOUBLE PRECISION",
  "BOOLEAN",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "TIMESTAMPTZ",
  "JSON",
  "JSONB",
  "UUID",
  "BYTEA",
];

export function CreateTableForm({ onTableCreated }: CreateTableFormProps) {
  const { t } = useTranslation();
  const { connectionId } = useAuthStore();
  const createTableMutation = useCreateTable();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateTableFormData>({
    resolver: zodResolver(createTableSchema),
    defaultValues: {
      schemaName: "public",
      tableName: "",
      columns: [
        {
          name: "",
          type: "VARCHAR",
          nullable: true,
          primaryKey: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "columns",
  });

  const columns = watch("columns");

  const onSubmit = async (data: CreateTableFormData) => {
    if (!connectionId || !password) {
      toast.error(t.schema.noConnection);
      return;
    }

    setPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (confirmedPassword: string) => {
    if (!connectionId) {
      toast.error(t.schema.noConnection);
      return;
    }

    setPasswordModalOpen(false);

    try {
      const formData = watch();
      const params: CreateTableParams = {
        schemaName: formData.schemaName,
        tableName: formData.tableName,
        columns: formData.columns.map((col) => ({
          name: col.name,
          type: col.type,
          nullable: col.nullable,
          defaultValue: col.defaultValue || undefined,
          primaryKey: col.primaryKey,
        })),
      };

      await createTableMutation.mutateAsync({
        ...params,
        password: confirmedPassword,
      });

      toast.success(t.schema.tableCreatedSuccess);
      reset();
      if (onTableCreated) {
        onTableCreated(formData.tableName, formData.schemaName);
      }
    } catch (error: any) {
      toast.error(error.message || t.schema.createTableFailed);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FieldGroup>
          <Field>
            <Label htmlFor="schemaName">{t.schema.schemaName}</Label>
            <Input
              id="schemaName"
              {...register("schemaName")}
              placeholder="public"
            />
            {errors.schemaName && (
              <p className="text-sm text-destructive mt-1">
                {errors.schemaName.message}
              </p>
            )}
          </Field>

          <Field>
            <Label htmlFor="tableName">{t.schema.tableName}</Label>
            <Input
              id="tableName"
              {...register("tableName")}
              placeholder="users"
            />
            {errors.tableName && (
              <p className="text-sm text-destructive mt-1">
                {errors.tableName.message}
              </p>
            )}
          </Field>
        </FieldGroup>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t.schema.columns}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  name: "",
                  type: "VARCHAR",
                  nullable: true,
                  primaryKey: false,
                })
              }
            >
              <Plus className="size-4 mr-2" />
              {t.schema.addColumn}
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-4 border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    {t.schema.column} {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor={`columns.${index}.name`}>
                      {t.schema.columnName}
                    </Label>
                    <Input
                      {...register(`columns.${index}.name`)}
                      placeholder="id"
                    />
                    {errors.columns?.[index]?.name && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.columns[index]?.name?.message}
                      </p>
                    )}
                  </Field>

                  <Field>
                    <Label htmlFor={`columns.${index}.type`}>
                      {t.schema.columnType}
                    </Label>
                    <Controller
                      name={`columns.${index}.type`}
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {POSTGRES_DATA_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.columns?.[index]?.type && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.columns[index]?.type?.message}
                      </p>
                    )}
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor={`columns.${index}.defaultValue`}>
                      {t.schema.defaultValue}
                    </Label>
                    <Input
                      {...register(`columns.${index}.defaultValue`)}
                      placeholder="NULL"
                    />
                  </Field>

                  <div className="flex items-center gap-4 pt-6">
                    <Controller
                      name={`columns.${index}.nullable`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`columns.${index}.nullable`}
                            checked={field.value ?? true}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked && columns[index]?.primaryKey) {
                                // Can't have nullable primary key
                                return;
                              }
                            }}
                          />
                          <Label
                            htmlFor={`columns.${index}.nullable`}
                            className="font-normal cursor-pointer"
                          >
                            {t.schema.nullable}
                          </Label>
                        </div>
                      )}
                    />

                    <Controller
                      name={`columns.${index}.primaryKey`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`columns.${index}.primaryKey`}
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked) {
                                // Primary keys can't be nullable
                                const currentColumns = watch("columns");
                                currentColumns[index].nullable = false;
                              }
                            }}
                          />
                          <Label
                            htmlFor={`columns.${index}.primaryKey`}
                            className="font-normal cursor-pointer"
                          >
                            {t.schema.primaryKey}
                          </Label>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={createTableMutation.isPending}>
            {createTableMutation.isPending ? t.common.loading : t.schema.createTable}
          </Button>
        </div>
      </form>

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

