import { useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

interface DropdownListPortalProps {
  open: boolean
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
  id?: string
}

export function DropdownListPortal({
  open,
  anchorRef,
  children,
  className,
  id,
}: DropdownListPortalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  const updatePosition = () => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return

    const onScrollOrResize = () => updatePosition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, anchorRef])

  if (!open) return null

  return createPortal(
    <ul
      id={id}
      role="listbox"
      style={{ top: position.top, left: position.left, width: position.width }}
      className={cn(
        'fixed z-[200] max-h-60 overflow-auto rounded-lg border border-border bg-surface-elevated py-1 shadow-lg',
        className,
      )}
    >
      {children}
    </ul>,
    document.body,
  )
}
