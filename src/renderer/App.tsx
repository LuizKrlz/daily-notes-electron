import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, CalendarDays, ChevronsLeft, ChevronsRight, Columns3, Folder, List, Moon, PanelTop, Plus, Search, Sun, Tag } from "lucide-react"
import type { DailyInput } from "@shared/types/daily"
import { Button } from "@renderer/components/ui/button"
import { Input } from "@renderer/components/ui/input"
import { DailyDetail } from "@renderer/features/dailies/DailyDetail"
import { DailyForm } from "@renderer/features/dailies/DailyForm"
import { DailyList } from "@renderer/features/dailies/DailyList"
import { TodayTasks } from "@renderer/features/tasks/TodayTasks"
import { cn, formatDate } from "@renderer/lib/utils"
import { useDailyStore } from "@renderer/store/daily-store"

type Mode = "view" | "create" | "edit"
type Page = "dailies" | "tasks"
type Theme = "light" | "dark"
type LayoutMode = "default" | "vertical"

const themeStorageKey = "daily-notes-theme"
const layoutStorageKey = "daily-notes-layout"
const listPanelStorageKey = "daily-notes-list-panel-open"

function readStoredTheme(): Theme {
  return window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light"
}

function readStoredLayout(): LayoutMode {
  return window.localStorage.getItem(layoutStorageKey) === "vertical" ? "vertical" : "default"
}

function readStoredListPanelOpen() {
  return window.localStorage.getItem(listPanelStorageKey) !== "false"
}

export function App() {
  const {
    dailies,
    selectedDaily,
    projects,
    people,
    projectParticipants,
    tags,
    filters,
    loadDailies,
    selectDaily,
    createDaily,
    updateDaily,
    deleteDaily,
    updateTaskStatus
  } = useDailyStore()
  const [mode, setMode] = useState<Mode>("view")
  const [page, setPage] = useState<Page>("dailies")
  const [query, setQuery] = useState("")
  const [theme, setTheme] = useState<Theme>(readStoredTheme)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(readStoredLayout)
  const [isListPanelOpen, setIsListPanelOpen] = useState(readStoredListPanelOpen)

  useEffect(() => {
    void loadDailies()
  }, [loadDailies])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(themeStorageKey, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(layoutStorageKey, layoutMode)
  }, [layoutMode])

  useEffect(() => {
    window.localStorage.setItem(listPanelStorageKey, String(isListPanelOpen))
  }, [isListPanelOpen])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDailies({ ...filters, query })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [query])

  const currentProject = filters.project
  const currentTag = filters.tag
  const currentPeriod = filters.period
  const currentDate = filters.date
  const todayDate = new Date().toISOString().slice(0, 10)
  const activeFilterKey = currentPeriod === "today" ? "today" : currentDate ? `date:${currentDate}` : currentProject ? `project:${currentProject}` : currentTag ? `tag:${currentTag}` : "all"

  const sidebarItems = useMemo(
    () => [
      { key: "today", label: "Hoje", icon: CalendarDays, action: () => { setPage("dailies"); void loadDailies({ query, period: "today" }) } },
      { key: "tasks", label: "Tasks de hoje", icon: CalendarCheck, action: () => { setPage("tasks"); setMode("view"); void loadDailies({ query, period: "today" }) } },
      ...projects.map((project) => ({ key: `project:${project}`, label: project, icon: Folder, action: () => { setPage("dailies"); void loadDailies({ query, project }) } })),
      ...tags.map((tag) => ({ key: `tag:${tag}`, label: `#${tag}`, icon: Tag, action: () => { setPage("dailies"); void loadDailies({ query, tag }) } }))
    ],
    [loadDailies, projects, query, tags]
  )

  const saveDaily = async (data: DailyInput) => {
    if (mode === "edit" && selectedDaily) {
      await updateDaily(selectedDaily.id, data)
    } else {
      await createDaily(data)
    }
    setMode("view")
  }

  const removeDaily = async () => {
    if (!selectedDaily) {
      return
    }
    await deleteDaily(selectedDaily.id)
  }

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  const toggleLayout = () => {
    setLayoutMode((current) => (current === "vertical" ? "default" : "vertical"))
  }

  const showListPanel = page === "dailies" && isListPanelOpen

  const preferenceControls = (
    <div className="flex gap-2">
      <Button type="button" variant="outline" size="icon" onClick={toggleTheme} title={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}>
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <Button
        type="button"
        variant={layoutMode === "vertical" ? "default" : "outline"}
        size="icon"
        onClick={toggleLayout}
        title={layoutMode === "vertical" ? "Usar layout padrão" : "Usar layout vertical"}
      >
        {layoutMode === "vertical" ? <Columns3 className="h-4 w-4" /> : <PanelTop className="h-4 w-4" />}
      </Button>
    </div>
  )

  const searchAndCreate = (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por texto, tag, blocker..." />
      </div>
      <Input
        className="w-36"
        type="date"
        value={currentDate ?? (currentPeriod === "today" ? todayDate : "")}
        onChange={(event) => {
          setPage("dailies")
          void loadDailies(event.target.value ? { query, date: event.target.value } : { query })
        }}
        title="Filtrar por data"
      />
      <Button size="icon" onClick={() => { setPage("dailies"); setMode("create") }} title="Nova daily">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )

  const activeFilters = (
    <div className="flex min-h-5 flex-wrap gap-2 text-xs">
      {activeFilterKey === "all" ? <span className="rounded-md bg-secondary px-2 py-1 text-secondary-foreground">Todas as dailys</span> : null}
      {currentPeriod === "today" ? <span className="rounded-md bg-primary px-2 py-1 text-primary-foreground">Hoje</span> : null}
      {currentDate ? <span className="rounded-md bg-primary px-2 py-1 text-primary-foreground">Data: {formatDate(currentDate)}</span> : null}
      {currentProject ? <span className="rounded-md bg-primary px-2 py-1 text-primary-foreground">Projeto: {currentProject}</span> : null}
      {currentTag ? <span className="rounded-md bg-primary px-2 py-1 text-primary-foreground">Tag: #{currentTag}</span> : null}
    </div>
  )

  const listPanel = (
    <section className="flex w-96 shrink-0 flex-col border-r border-border bg-muted/30">
      <header className="space-y-4 border-b border-border px-4 py-4">
        {searchAndCreate}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase text-muted-foreground">Dailys</h2>
            <p className="mt-1 text-xs text-muted-foreground">{dailies.length} item(ns)</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setIsListPanelOpen(false)} title="Recolher lista">
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
        {activeFilters}
      </header>
      <DailyList dailies={dailies} selectedId={selectedDaily?.id} onSelect={(daily) => { selectDaily(daily); setMode("view") }} />
    </section>
  )

  const collapsedListButton = page === "dailies" && !isListPanelOpen ? (
    <div className="flex w-12 shrink-0 flex-col items-center border-r border-border bg-muted/30 py-3">
      <Button variant="ghost" size="icon" onClick={() => setIsListPanelOpen(true)} title="Abrir lista de dailys">
        <ChevronsRight className="h-4 w-4" />
      </Button>
      <Button className="mt-2" variant="ghost" size="icon" onClick={() => { setPage("dailies"); setMode("create") }} title="Nova daily">
        <Plus className="h-4 w-4" />
      </Button>
      <List className="mt-4 h-4 w-4 text-muted-foreground" />
    </div>
  ) : null

  const openDailyFromTasks = (daily: typeof selectedDaily) => {
    if (!daily) {
      return
    }
    selectDaily(daily)
    setPage("dailies")
    setMode("view")
  }

  const mainContent =
    page === "tasks" ? (
      <TodayTasks dailies={dailies} onOpenDaily={openDailyFromTasks} onUpdateTaskStatus={updateTaskStatus} />
    ) : mode === "view" ? (
      <DailyDetail daily={selectedDaily} onEdit={() => setMode("edit")} onDelete={removeDaily} />
    ) : (
      <DailyForm
        daily={mode === "edit" ? selectedDaily : undefined}
        projects={projects}
        people={people}
        projectParticipants={projectParticipants}
        tags={tags}
        onCancel={() => setMode("view")}
        onSave={saveDaily}
      />
    )

  if (layoutMode === "vertical") {
    return (
      <main className="flex h-screen flex-col bg-background text-foreground">
        <header className="border-b border-border bg-card px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-48">
              <h1 className="text-xl font-semibold">Daily Notes</h1>
              <p className="mt-1 text-xs text-muted-foreground">Layout vertical ativo</p>
            </div>
            <div className="min-w-0 flex-1">{searchAndCreate}</div>
            {preferenceControls}
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              className="flex shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm hover:bg-accent"
              onClick={() => { setPage("dailies"); void loadDailies({ query }) }}
            >
              <CalendarDays className="h-4 w-4" />
              Todas
            </button>
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent",
                  ((item.key === activeFilterKey && page === "dailies") || (item.key === "tasks" && page === "tasks"))
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-background"
                )}
                onClick={item.action}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-2">{activeFilters}</div>
        </header>

        <section className="flex min-h-0 flex-1">
          {showListPanel ? (
            <div className="flex w-80 shrink-0 flex-col border-r border-border bg-muted/30">
              <header className="flex items-center justify-between border-b border-border px-3 py-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase text-muted-foreground">Dailys</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{dailies.length} item(ns)</p>
                </div>
                <Button variant="outline" size="icon" onClick={() => setIsListPanelOpen(false)} title="Recolher lista">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </header>
              <DailyList dailies={dailies} selectedId={selectedDaily?.id} onSelect={(daily) => { selectDaily(daily); setMode("view") }} />
            </div>
          ) : collapsedListButton}
          <div className="min-w-0 flex-1 bg-background">
            {mainContent}
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="flex h-screen bg-background text-foreground">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-slate-950 text-slate-50 dark:bg-slate-950">
        <div className="px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Daily Notes</h1>
              <p className="mt-1 text-xs text-slate-400">Notas locais, rápidas e pesquisáveis.</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-auto px-3">
          <button
            className={cn(
              "mb-3 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/10",
              activeFilterKey === "all" && page === "dailies" ? "bg-white text-slate-950" : "text-slate-200"
            )}
            onClick={() => { setPage("dailies"); void loadDailies({ query }) }}
          >
            <CalendarDays className="h-4 w-4" />
            Todas as dailys
          </button>
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/10",
                (item.key === activeFilterKey && page === "dailies") || (item.key === "tasks" && page === "tasks") ? "bg-white text-slate-950" : "text-slate-300"
              )}
              onClick={item.action}
            >
              <item.icon className="h-4 w-4" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              onClick={toggleTheme}
              title={theme === "dark" ? "Usar tema claro" : "Usar tema escuro"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Tema
            </button>
            <button
              className="flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              onClick={toggleLayout}
              title="Usar layout vertical"
            >
              <PanelTop className="h-4 w-4" />
              Vertical
            </button>
          </div>
        </div>
      </aside>

      {showListPanel ? listPanel : collapsedListButton}

      <section className={cn("min-w-0 flex-1 bg-background")}>
        {mainContent}
      </section>
    </main>
  )
}
