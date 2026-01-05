"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "@phosphor-icons/react"
import { useTranslation } from "@/contexts/translation-context"

interface ImportStatusAlertProps {
  status: {
    type: 'success' | 'error' | null;
    message: string;
  }
}

export function ImportStatusAlert({ status }: ImportStatusAlertProps) {
  const { t } = useTranslation()

  if (!status.type) return null

  return (
    <Alert
      variant={status.type === 'error' ? 'destructive' : 'default'}
    >
      {status.type === 'success' ? (
        <CheckCircle className="size-3.5" />
      ) : (
        <XCircle className="size-3.5" />
      )}
      <div>
        <AlertTitle>
          {status.type === 'success' ? t.common.success : t.common.error}
        </AlertTitle>
        <AlertDescription>{status.message}</AlertDescription>
      </div>
    </Alert>
  )
}

