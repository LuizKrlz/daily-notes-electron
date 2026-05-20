import { FormEvent, useEffect, useState } from "react"
import { Plus, Save, Trash2, X } from "lucide-react"
import type { Daily, DailyInput, DailyTaskInput } from "@shared/types/daily"
import { splitTokens } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { Textarea } from "@renderer/components/ui/textarea"

const emptyForm: DailyInput = {
  title: "",
  dailyDate: new Date().toISOString().slice(0, 10),
  project: "",
  participants: [],
  summary: "",
  yesterday: "",
  today: "",
  blockers: "",
  discussions: "",
  decisions: "",
  nextSteps: "",
  notes: "",
  tasks: [],
  tags: []
}

interface DailyFormProps {
  daily?: Daily
  projects: string[]
  tags: string[]
  onCancel: () => void
  onSave: (daily: DailyInput) => Promise<void>
}

const contentSections: Array<{
  key: keyof Pick<DailyInput, "yesterday" | "today" | "blockers" | "discussions" | "notes">
  label: string
  placeholder: string
}> = [
  {
    key: "yesterday",
    label: "O que fiz ontem",
    placeholder: "Itens concluídos, progresso e contexto vindo do dia anterior."
  },
  {
    key: "today",
    label: "O que farei hoje",
    placeholder: "Prioridades, próximos focos e entregas esperadas."
  },
  {
    key: "blockers",
    label: "Blockers",
    placeholder: "Impedimentos, dependências ou riscos que precisam de atenção."
  },
  {
    key: "discussions",
    label: "Discussões importantes",
    placeholder: "Pontos debatidos, alternativas consideradas e contexto relevante."
  },
  {
    key: "notes",
    label: "Observações",
    placeholder: "Qualquer detalhe útil que não coube nas outras seções."
  }
]

export function DailyForm({ daily, projects, tags, onCancel, onSave }: DailyFormProps) {
  const [form, setForm] = useState<DailyInput>(emptyForm)
  const [participantsText, setParticipantsText] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState("")
  const [tasks, setTasks] = useState<DailyTaskInput[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!daily) {
      setForm({
        ...emptyForm,
        dailyDate: new Date().toISOString().slice(0, 10),
        title: `Daily ${new Intl.DateTimeFormat("pt-PT").format(new Date())}`
      })
      setParticipantsText("")
      setSelectedTags([])
      setTagDraft("")
      setTasks([])
      setNewTaskTitle("")
      return
    }

    setForm({
      title: daily.title,
      dailyDate: daily.dailyDate,
      project: daily.project ?? "",
      participants: daily.participants,
      summary: daily.summary ?? "",
      yesterday: daily.yesterday ?? "",
      today: daily.today ?? "",
      blockers: daily.blockers ?? "",
      discussions: daily.discussions ?? "",
      decisions: daily.decisions ?? "",
      nextSteps: daily.nextSteps ?? "",
      notes: daily.notes ?? "",
      tasks: daily.tasks,
      tags: daily.tags
    })
    setParticipantsText(daily.participants.join(", "))
    setSelectedTags(daily.tags)
    setTagDraft("")
    setTasks(daily.tasks)
    setNewTaskTitle("")
  }, [daily])

  const updateText = (key: keyof DailyInput, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    await onSave({
      ...form,
      participants: splitTokens(participantsText),
      tasks: tasks.map((task) => ({ ...task, title: task.title.trim() })).filter((task) => task.title),
      tags: selectedTags
    })
    setIsSaving(false)
  }

  const addTask = () => {
    const title = newTaskTitle.trim()
    if (!title) {
      return
    }
    setTasks((current) => [...current, { title, status: "todo" }])
    setNewTaskTitle("")
  }

  const updateTaskTitle = (index: number, title: string) => {
    setTasks((current) => current.map((task, taskIndex) => (taskIndex === index ? { ...task, title } : task)))
  }

  const removeTask = (index: number) => {
    setTasks((current) => current.filter((_task, taskIndex) => taskIndex !== index))
  }

  const addTag = (value = tagDraft) => {
    const tag = value.trim().toLowerCase()
    if (!tag) {
      return
    }

    setSelectedTags((current) => (current.includes(tag) ? current : [...current, tag]))
    setTagDraft("")
  }

  const removeTag = (tag: string) => {
    setSelectedTags((current) => current.filter((item) => item !== tag))
  }

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between border-b border-border px-8 py-4">
        <div>
          <h2 className="text-lg font-semibold">{daily ? "Editar daily" : "Nova daily"}</h2>
          <p className="text-sm text-muted-foreground">Escreva no mesmo formato em que a daily será consultada.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="mx-auto max-w-4xl space-y-5">
          <header className="rounded-md border border-border bg-card p-5">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <label className="block">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Projeto</span>
                <Input
                  list="daily-projects"
                  className="mt-2 h-9 border-0 bg-muted px-3 text-sm shadow-none focus-visible:ring-1"
                  value={form.project}
                  onChange={(event) => updateText("project", event.target.value)}
                  placeholder="Nome do projeto"
                />
                <datalist id="daily-projects">
                  {projects.map((project) => (
                    <option key={project} value={project} />
                  ))}
                </datalist>
              </label>

              <label className="block">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Data</span>
                <Input
                  className="mt-2 h-9 border-0 bg-muted px-3 text-sm shadow-none focus-visible:ring-1"
                  type="date"
                  value={form.dailyDate}
                  onChange={(event) => updateText("dailyDate", event.target.value)}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="sr-only">Título</span>
              <Input
                className="h-auto border-0 bg-transparent px-0 py-1 text-3xl font-semibold tracking-tight shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                value={form.title}
                onChange={(event) => updateText("title", event.target.value)}
                placeholder="Título da daily"
                autoFocus
                required
              />
            </label>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Participantes</span>
                <Input value={participantsText} onChange={(event) => setParticipantsText(event.target.value)} placeholder="Ana, Bruno, Carla" />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Tags</span>
                <div className="flex gap-2">
                  <Input
                    list="daily-tags"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === ",") {
                        event.preventDefault()
                        addTag()
                      }
                    }}
                    placeholder="Digite ou selecione uma tag"
                  />
                  <Button type="button" variant="outline" onClick={() => addTag()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <datalist id="daily-tags">
                  {tags.map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
                </datalist>
                <div className="flex min-h-7 flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {contentSections.map((section) => (
            <label key={section.key} className="block rounded-md border border-border bg-card p-5">
              <span className="text-sm font-semibold uppercase text-muted-foreground">{section.label}</span>
              <Textarea
                className="mt-3 min-h-28 border-0 bg-transparent px-0 py-0 text-sm leading-7 shadow-none focus-visible:ring-0"
                value={form[section.key]}
                onChange={(event) => updateText(section.key, event.target.value)}
                placeholder={section.placeholder}
              />
            </label>
          ))}

          <section className="rounded-md border border-border bg-card p-5">
            <span className="text-sm font-semibold uppercase text-muted-foreground">Tasks</span>
            <div className="mt-4 space-y-2">
              {tasks.map((task, index) => (
                <div key={`${task.id ?? "new"}-${index}`} className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
                  <span className="h-4 w-4 shrink-0 rounded border border-primary bg-background" />
                  <Input
                    className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
                    value={task.title}
                    onChange={(event) => updateTaskTitle(index, event.target.value)}
                    placeholder="Descreva a task"
                  />
                  <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{task.status ?? "todo"}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(index)} title="Remover task">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    addTask()
                  }
                }}
                placeholder="Nova task"
              />
              <Button type="button" variant="outline" onClick={addTask}>
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </section>
        </div>
      </div>
    </form>
  )
}
