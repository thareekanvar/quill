"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAddConnection } from "@/hooks/use-add-connection";
import { useTranslation } from "@/contexts/translation-context";

interface AddConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (connectionId: string) => void;
}

interface ConnectionFormData {
  url: string;
  name: string;
  password: string;
  useExistingPassword: boolean;
}

export function AddConnectionModal({
  open,
  onOpenChange,
  onSuccess,
}: AddConnectionModalProps) {
  const { t } = useTranslation();
  const { password: existingPassword } = useAuthStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ConnectionFormData>({
    defaultValues: {
      url: "",
      name: "",
      password: "",
      useExistingPassword: !!existingPassword,
    },
  });

  const useExistingPassword = watch("useExistingPassword");
  const url = watch("url");
  const password = watch("password");

  // Hook for adding connection
  const addConnectionMutation = useAddConnection();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset({
        url: "",
        name: "",
        password: "",
        useExistingPassword: !!existingPassword,
      });
      // Reset mutation state when opening
      addConnectionMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset, existingPassword]);

  // Update password field when useExistingPassword changes
  useEffect(() => {
    if (useExistingPassword && existingPassword) {
      setValue("password", existingPassword, { shouldValidate: false });
    } else if (!useExistingPassword) {
      setValue("password", "", { shouldValidate: false });
    }
  }, [useExistingPassword, existingPassword, setValue]);

  const onSubmit = async (data: ConnectionFormData) => {
    // Determine which password to use
    const passwordToUse =
      useExistingPassword && existingPassword
        ? existingPassword
        : data.password;

    if (!passwordToUse) {
      // Don't submit if password is missing
      console.error("Password is required");
      return;
    }

    if (!data.url) {
      console.error("URL is required");
      return;
    }

    console.log("Submitting form with:", {
      url: data.url,
      hasPassword: !!passwordToUse,
      name: data.name,
    });

    // Use mutation to add connection
    addConnectionMutation.mutate(
      {
        url: data.url,
        password: passwordToUse,
        name: data.name || undefined,
      },
      {
        onSuccess: async (connectionId) => {
          // Reset form on success
          reset();

          // Call success callback if provided
          if (onSuccess) {
            await onSuccess(connectionId);
          }

          // Close modal only after success
          onOpenChange(false);
        },
        onError: (error) => {
          // Error is handled by mutation.error, modal stays open
          console.error("Failed to add connection:", error);
        },
      }
    );
  };

  const isConnecting = addConnectionMutation.isPending;
  const error = addConnectionMutation.error;

  const handleCancel = () => {
    if (isConnecting) {
      return; // Don't allow canceling while connecting
    }
    reset();
    addConnectionMutation.reset();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // If trying to open, allow it (this shouldn't normally happen, but handle it)
    if (newOpen) {
      onOpenChange(true);
      return;
    }

    // If trying to close, prevent it if we're connecting
    if (isConnecting) {
      return; // Prevent closing while connecting
    }

    // Otherwise, allow closing (user clicked cancel or outside)
    // But use handleCancel to properly reset state
    if (!newOpen) {
      handleCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.auth.addConnection}</DialogTitle>
          <DialogDescription>
            {t.auth.addConnectionDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="pt-2 pb-4 space-y-4">
            <Field>
              <FieldLabel htmlFor="url">{t.auth.connectionUrl}</FieldLabel>
              <Input
                id="url"
                type="text"
                placeholder={t.auth.postgresqlUrlPlaceholder}
                {...register("url", {
                  required: t.auth.connectionUrlRequired,
                })}
                disabled={isConnecting}
                autoFocus
              />
              {errors.url && (
                <p className="text-sm text-destructive mt-1">
                  {errors.url.message}
                </p>
              )}
              <FieldDescription>
                {t.auth.postgresqlUrlDescription}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="name">{t.auth.connectionName}</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder={t.auth.connectionNamePlaceholder}
                {...register("name")}
                disabled={isConnecting}
              />
              <FieldDescription>
                {t.auth.connectionNameDescription}
              </FieldDescription>
            </Field>

            {existingPassword && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useExistingPassword"
                  checked={useExistingPassword}
                  onCheckedChange={(checked) => {
                    setValue("useExistingPassword", checked === true);
                  }}
                  disabled={isConnecting}
                />
                <label
                  htmlFor="useExistingPassword"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {t.auth.useExistingPassword}
                </label>
              </div>
            )}

            {(!useExistingPassword || !existingPassword) && (
              <Field>
                <FieldLabel htmlFor="password">{t.auth.password}</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  {...register("password", {
                    required:
                      !useExistingPassword || !existingPassword
                        ? t.auth.passwordRequired
                        : false,
                  })}
                  disabled={
                    isConnecting || (useExistingPassword && !!existingPassword)
                  }
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
                <FieldDescription>
                  {t.auth.passwordDescriptionAdd}
                </FieldDescription>
              </Field>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : t.auth.failedToAddConnection}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isConnecting}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={
                isConnecting ||
                !url ||
                (!useExistingPassword && !password) ||
                (useExistingPassword && !existingPassword)
              }
            >
              {isConnecting ? t.auth.connecting : t.auth.addConnectionButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
