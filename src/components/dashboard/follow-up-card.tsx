"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Radar } from "lucide-react"

export function FollowUpCard() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/radar")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        setCount(Array.isArray(json.items) ? json.items.length : 0)
      })
      .catch(() => {
        if (!cancelled) setCount(0)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (count === null || count === 0) return null

  return (
    <Link
      href="/radar"
      className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 transition-colors hover:bg-amber-500/15"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-500">
          <Radar className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {count} conversa{count === 1 ? "" : "s"} esfriando
          </p>
          <p className="text-xs text-muted-foreground">
            Sem resposta no prazo do radar — abra para retomar.
          </p>
        </div>
      </div>
      <span className="text-sm font-medium text-amber-500">Ver radar</span>
    </Link>
  )
}
