import { cn } from '@/lib/utils'

function Card({ className, ...props }) {
  return <div className={cn('rounded-[14px] border border-slate-200/70 bg-white text-slate-800 shadow-[0_1px_4px_rgba(15,23,42,0.06)]', className)} {...props} />
}

function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 px-5 py-5 sm:px-6', className)} {...props} />
}

function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-[22px] font-bold leading-none tracking-[-0.01em]', className)} {...props} />
}

function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function CardContent({ className, ...props }) {
  return <div className={cn('px-5 pb-5 pt-0 sm:px-6', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
