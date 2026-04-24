import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      duration={3000}
      closeButton={false}
      expand={false}
      richColors
      toastOptions={{
        style: {
          borderRadius: '16px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          border: 'none',
          backdropFilter: 'blur(12px)',
        },
        classNames: {
          toast: 'font-sans',
          success: '!bg-[#111] !text-white',
          error: '!bg-red-500 !text-white',
          warning: '!bg-amber-500 !text-white',
          info: '!bg-[#001f54] !text-white',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
