import { CalendarCheck } from "lucide-react"
import type { Daily, TaskStatus } from "@shared/types/daily"
import { formatDate } from "@renderer/lib/utils"
import { Badge } from "@renderer/components/ui/badge"

interface TodayTasksProps {
  dailies: Daily[]
  onOpenDaily: (daily: Daily) => void
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>
}

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: "todo", label: "Todo" },
  { status: "doing", label: "Doing" },
  { status: "done", label: "Done" }
]

export function TodayTasks({ dailies, onOpenDaily, onUpdateTaskStatus }: TodayTasksProps) {
  const tasks = dailies.flatMap((daily) =>
    daily.tasks.map((task) => ({
      ...task,
      daily
    }))
  )

  if (!tasks.length) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div>
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 text-xl font-semibold">Nenhuma task para hoje</h2>
          <p className="mt-2 text-sm text-muted-foreground">As tasks adicionadas nas dailys de hoje aparecem aqui.</p>
        </div>
      </div>
    )
  }

  return (
    <section className="h-full overflow-auto px-8 py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Hoje</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Board de tasks</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tasks.length} task(s) coletada(s) das dailys de hoje.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.status)

            return (
              <section
                key={column.status}
                className="min-h-96 rounded-md border border-border bg-muted/40 p-3"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  const taskId = event.dataTransfer.getData("text/plain")
                  if (taskId) {
                    void onUpdateTaskStatus(taskId, column.status)
                  }
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase text-muted-foreground">{column.label}</h2>
                  <Badge>{columnTasks.length}</Badge>
                </div>

                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <article
                      key={task.id}
                      draggable
                      className="cursor-grab rounded-md border border-border bg-card p-4 shadow-sm transition-colors active:cursor-grabbing"
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", task.id)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                    >
                      <button className="w-full text-left" onClick={() => onOpenDaily(task.daily)}>
                        <p className={`text-sm font-medium leading-6 ${task.status === "done" ? "text-muted-foreground line-through" : ""}`}>{task.title}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{task.daily.title}</span>
                          <span>{formatDate(task.daily.dailyDate)}</span>
                          {task.daily.project ? <Badge>{task.daily.project}</Badge> : null}
                        </div>
                      </button>
                    </article>
                  ))}

                  {!columnTasks.length ? (
                    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Arraste tasks para cá.</div>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
