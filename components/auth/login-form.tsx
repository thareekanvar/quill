"use client";

import { useState, useRef } from "react";
import { SquaresFour, Upload } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useTranslation } from "@/contexts/translation-context";
import {
  handleImportFile,
  handleConnectAfterImport as connectAfterImport,
  formatImportedItems,
} from "@/lib/utils/login-helpers";
import type { LoginFormData } from "@/types/login";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const [isImporting, setIsImporting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [importedConnectionsCount, setImportedConnectionsCount] = useState(0);
  const [importPassword, setImportPassword] = useState("");
  const [hasImportedFile, setHasImportedFile] = useState(false);
  const { login } = useAuth();
  const { isValidating, login: loginWithConnectionId } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form and clear errors when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);
    setSuccessMessage(null);
    setImportedConnectionsCount(0);
    setImportPassword("");
    setHasImportedFile(false);
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<LoginFormData>({
    defaultValues: {
      url: "",
      password: "",
      name: "",
    },
  });

  const url = watch("url");

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      await login(data.url, data.password, data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.loginFailed);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    setSuccessMessage(null);
    setImportedConnectionsCount(0);
    setHasImportedFile(false);

    try {
      const result = await handleImportFile(file);

      if (result.success) {
        const importedItems = formatImportedItems({
          connections: result.imported.connections,
          dashboards: result.imported.dashboards,
          dashboardCards: result.imported.dashboardCards,
          dashboardCharts: result.imported.dashboardCharts,
        });

        if (result.imported.connections > 0) {
          setImportedConnectionsCount(result.imported.connections);
        }

        // Mark that file was successfully imported
        setHasImportedFile(true);

        const message =
          importedItems.length > 0
            ? t.auth.importSuccess.replace("{items}", importedItems.join(", "))
            : t.auth.importSuccessNoItems;

        setSuccessMessage(message);
      } else {
        setError(result.errors.join("; ") || t.auth.importFailed);
        // Reset file input on error
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.importFailed);
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleConnectAfterImport = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connectAfterImport(
        importPassword,
        importedConnectionsCount
      );

      if (result.success && result.connectionId) {
        // Login with this connection
        loginWithConnectionId(result.connectionId, importPassword);

        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        setError(result.error || t.auth.connectFailed);
        setIsConnecting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.connectFailed);
      setIsConnecting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col items-center gap-2 text-center mb-4">
          <a href="#" className="flex flex-col items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center rounded-md">
              <SquaresFour className="size-6" />
            </div>
            <span className="sr-only">Quill</span>
          </a>
          <h1 className="text-xl font-bold">{t.auth.welcome}</h1>
          <FieldDescription>{t.auth.connectToDatabase}</FieldDescription>
        </div>

        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="login">{t.auth.loginTab}</TabsTrigger>
          <TabsTrigger value="import">{t.auth.importTab}</TabsTrigger>
        </TabsList>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400 mb-4">
            {successMessage}
          </div>
        )}

        <TabsContent value="login">
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="url">{t.auth.postgresqlUrl}</FieldLabel>
                <Input
                  id="url"
                  type="text"
                  placeholder={t.auth.postgresqlUrlPlaceholder}
                  {...register("url", { required: t.auth.urlRequired })}
                  disabled={isValidating}
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
                <FieldLabel htmlFor="password">{t.auth.password}</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  {...register("password", {
                    required: t.auth.passwordRequired,
                  })}
                  disabled={isValidating}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
                <FieldDescription>
                  {t.auth.passwordDescription}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="name">{t.auth.connectionName}</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder={t.auth.connectionNamePlaceholder}
                  {...register("name")}
                  disabled={isValidating}
                />
                <FieldDescription>
                  {t.auth.connectionNameDescription}
                </FieldDescription>
              </Field>

              <Field>
                <Button
                  type="submit"
                  disabled={isValidating || !url}
                  className="w-full"
                >
                  {isValidating ? t.auth.connecting : t.auth.connect}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </TabsContent>

        <TabsContent value="import">
          <div className="space-y-4">
            <Field>
              <FieldLabel htmlFor="import-file">
                {t.auth.importBackupFile}
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  ref={fileInputRef}
                  id="import-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <Upload className="size-4" />
                </Button>
              </div>
              <FieldDescription>
                {t.auth.importBackupFileDescription}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="import-password">
                {t.auth.connectionPassword}
              </FieldLabel>
              <Input
                id="import-password"
                type="password"
                placeholder={t.auth.connectionPasswordPlaceholder}
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                disabled={isImporting || isConnecting}
              />
              <FieldDescription>
                {t.auth.connectionPasswordDescription}
              </FieldDescription>
            </Field>

            <Field>
              <Button
                type="button"
                onClick={handleConnectAfterImport}
                disabled={
                  isImporting ||
                  isConnecting ||
                  !hasImportedFile ||
                  !importPassword.trim()
                }
                className="w-full"
              >
                {isConnecting ? t.auth.connecting : t.auth.connect}
              </Button>
            </Field>
          </div>
        </TabsContent>
      </Tabs>

      <FieldDescription className="px-6 text-center">
        {t.auth.encryptionNotice}
      </FieldDescription>
    </div>
  );
}
