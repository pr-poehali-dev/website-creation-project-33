import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

function toast(options: ToastOptions) {
  const { title, description, variant, duration = 3000 } = options

  if (variant === 'destructive') {
    sonnerToast.error(description || title || '', {
      duration,
      ...(description && title ? { description } : {}),
    })
  } else {
    sonnerToast.success(description || title || '', {
      duration,
      ...(description && title ? { description } : {}),
    })
  }
}

function useToast() {
  return { toast }
}

export { useToast, toast }
