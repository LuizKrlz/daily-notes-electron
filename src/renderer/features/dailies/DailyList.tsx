import type { Daily } from "@shared/types/daily"
import { formatDate } from "@renderer/lib/utils"
import { Badge } from "@renderer/components/ui/badge"

interface DailyListProps {
  dailies: Daily[]
  selectedId?: string
  onSelect: (daily: Daily) => void
}

export function DailyList({ dailies, selectedId, onSelect }: DailyListProps) {
  if (!dailies.length) {
    return <div className="px-4 py-8 text-sm text-muted-foreground">Nenhuma daily encontrada.</div>
  }

  return (
    <div className="flex-1 space-y-3 overflow-auto px-3 py-4">
      {dailies.map((daily) => (
        <button
          key={daily.id}
          className={`w-full rounded-md border p-4 text-left transition-colors ${
            selectedId === daily.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
          }`}
          onClick={() => onSelect(daily)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{daily.title}</h3>
              <p className="mt-1 truncate text-xs text-muted-foreground">{daily.project || "Sem projeto"} · {formatDate(daily.dailyDate)}</p>
            </div>
          </div>
          {daily.summary ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{daily.summary}</p> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {daily.tags.slice(0, 3).map((tag) => (
              <Badge key={tag}>#{tag}</Badge>
            ))}
          </div>
        </button>
      ))}
    </div>
  )
}
