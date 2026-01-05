"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { useAuthStore } from "@/lib/stores/auth-store"
import { verifyPassword } from "@/lib/db"
import type { PasswordModalProps } from "@/types"
import { useTranslation } from "@/contexts/translation-context"

interface PasswordFormData {
  password: string
}

export function PasswordModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: PasswordModalProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const { connectionId } = useAuthStore()
  
  const modalTitle = title || t.table.confirmPassword
  const modalDescription = description || t.table.confirmPasswordDescription

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<PasswordFormData>({
    defaultValues: {
      password: "",
    },
  })

  const password = watch("password")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      reset()
      setError(null)
    }
  }, [open, reset])

  const onSubmit = async (data: PasswordFormData) => {
    if (!connectionId) {
      setError(t.table.noActiveConnection)
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const isValid = await verifyPassword(connectionId, data.password)
      
      if (!isValid) {
        setError(t.table.invalidPassword)
        setIsVerifying(false)
        return
      }

      // Password is valid, execute the action and wait for it to complete
      await onConfirm()
      
      // Only reset and close on success (onConfirm didn't throw)
      reset()
      setError(null)
      onOpenChange(false)
    } catch (err: any) {
      // Show error in modal, don't close
      setError(err.message || t.table.verificationFailed)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCancel = () => {
    reset()
    setError(null)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>{modalTitle}</AlertDialogTitle>
          <AlertDialogDescription>{modalDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="pt-2 pb-4">
            <Field>
              <FieldLabel htmlFor="password">{t.auth.password}</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder={t.table.passwordRequired}
                {...register("password", { required: t.table.passwordRequired })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isVerifying) {
                    e.preventDefault()
                    handleSubmit(onSubmit)()
                  }
                }}
                disabled={isVerifying}
                autoFocus
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-2">{errors.password.message}</p>
              )}
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </Field>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isVerifying}>
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              type="submit"
              disabled={isVerifying || !password}
            >
              {isVerifying ? t.table.verifying : t.common.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}

