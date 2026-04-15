import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const DialogContext = React.createContext(null)

function Dialog({ open, defaultOpen = false, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : internalOpen

  const setOpen = React.useCallback((nextOpen) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }, [isControlled, onOpenChange])

  return <DialogContext.Provider value={{ open: currentOpen, setOpen }}>{children}</DialogContext.Provider>
}

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog')
  }
  return context
}

function DialogTrigger({ asChild = false, children, ...props }) {
  const { setOpen } = useDialogContext()
  const handleClick = () => setOpen(true)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (event) => {
        children.props?.onClick?.(event)
        handleClick()
      },
    })
  }

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

function DialogPortal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

function DialogOverlay({ className, ...props }) {
  return (
    <div
      className={cn('fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]', className)}
      {...props}
    />
  )
}

function DialogContent({ className, children, onPointerDownOutside, ...props }) {
  const { open, setOpen } = useDialogContext()
  if (!open) return null

  return (
    <DialogPortal>
      <DialogOverlay
        onClick={(event) => {
          onPointerDownOutside?.(event)
          setOpen(false)
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[12px] border border-slate-200/60 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]',
          className,
        )}
        {...props}
      >
        <button
          type="button"
          aria-label="Close dialog"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center text-2xl leading-none text-slate-500 transition hover:text-slate-800"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        {children}
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 px-5 pb-2 pt-5 sm:px-6', className)} {...props} />
}

function DialogFooter({ className, ...props }) {
  return <div className={cn('flex flex-col-reverse gap-2 px-5 pb-5 pt-2 sm:flex-row sm:justify-end sm:px-6', className)} {...props} />
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn('pr-10 text-[20px] font-bold leading-none tracking-[-0.01em] text-slate-800 sm:text-[22px]', className)} {...props} />
}

function DialogDescription({ className, ...props }) {
  return <p className={cn('text-sm text-slate-500', className)} {...props} />
}

function DialogClose({ asChild = false, children, ...props }) {
  const { setOpen } = useDialogContext()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: (event) => {
        children.props?.onClick?.(event)
        setOpen(false)
      },
    })
  }

  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
