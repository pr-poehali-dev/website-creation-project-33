import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

function toast(options: ToastOptions) {
  const { title, description, variant, duration = 1000 } = options
  const message = title || description || ''
  const opts = { duration, ...(description && title ? { description } : {}) }

  if (variant === 'destructive') {
    sonnerToast.error(message, opts)
  } else {
    sonnerToast.success(message, opts)
  }
}

function useToast() {
  return { toast }
}

export { useToast, toast }