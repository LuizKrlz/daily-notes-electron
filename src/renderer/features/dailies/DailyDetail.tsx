import { Edit, Trash2 } from "lucide-react"
import type { Daily } from "@shared/types/daily"
import { formatDate } from "@renderer/lib/utils"
import { Badge } from "@renderer/components/ui/badge"
import { Button } from "@renderer/components/ui/button"

interface DailyDetailProps {
  daily?: Daily
  onEdit: () => void
  onDelete: () => void
}

const sections: Array<[keyof Daily, string]> = [
  ["yesterday", "O que fiz ontem"],
  ["today", "O que farei hoje"],
  ["blockers", "Blockers"],
  ["discussions", "Discussões importantes"],
  ["notes", "Observações"]
]

const toDisplayHtml = (value: string) => (value.includes("<") ? value : value.replace(/\n/g, "<br>"))

export function DailyDetail({ daily, onEdit, onDelete }: DailyDetailProps) {
  if (!daily) {
    return (
      <div className="flex h-full items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="text-lg font-medium text-foreground">Nenhuma daily selecionada</p>
          <p className="mt-2 text-sm">Crie uma daily para começar a registrar o histórico do time.</p>
        </div>
      </div>
    )
  }

  return (
    <article className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-border px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">{daily.project || "Sem projeto"}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{daily.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{formatDate(daily.dailyDate)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={onEdit} title="Editar daily">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onDelete} title="Excluir daily">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {daily.participants.map((participant) => (
            <Badge key={participant} className="bg-secondary">
              {participant}
            </Badge>
          ))}
          {daily.tags.map((tag) => (
            <Badge key={tag} className="bg-primary/10 text-primary">
              #{tag}
            </Badge>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="grid gap-5">
          {sections.map(([key, label]) => {
            const value = daily[key]
            if (!value || Array.isArray(value)) {
              return null
            }
            return (
              <section key={key} className="rounded-md border border-border bg-card p-5">
                <h2 className="text-sm font-semibold uppercase text-muted-foreground">{label}</h2>
                <div className="mt-3 text-sm leading-7 text-card-foreground" dangerouslySetInnerHTML={{ __html: toDisplayHtml(value) }} />
              </section>
            )
          })}
          {daily.tasks.length ? (
            <section className="rounded-md border border-border bg-card p-5">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Tasks</h2>
              <ul className="mt-3 space-y-2">
                {daily.tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2 text-sm text-card-foreground">
                    <span className={`h-4 w-4 shrink-0 rounded border ${task.status === "done" ? "border-primary bg-primary" : "border-primary bg-background"}`} />
                    <span className={task.status === "done" ? "text-muted-foreground line-through" : ""}>{task.title}</span>
                    <span className="ml-auto rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{task.status}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  )
}
