import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react"
import { Bold, Italic, List, ListOrdered, Quote, Underline } from "lucide-react"
import { cn } from "@renderer/lib/utils"

interface RichTextEditorProps {
  value?: string
  onChange: (value: string) => void
  mentions: string[]
  placeholder?: string
}

function textToHtml(value?: string) {
  if (!value) {
    return ""
  }

  const repairedValue = repairEntityNoise(value)

  if (repairedValue.includes("<")) {
    return repairedValue
  }

  return repairedValue
    .split("\n")
    .map((line) => line.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
    .join("<br>")
}

function repairEntityNoise(value: string) {
  let repaired = value

  for (let index = 0; index < 6; index += 1) {
    repaired = repaired.replace(/&amp;/g, "&")
  }

  return repaired.replace(/&nbsp;|\u00a0/g, " ")
}

function normalizeEditorHtml(value: string) {
  return repairEntityNoise(value)
    .replace(/<div><br><\/div>/g, "")
    .replace(/<p><br><\/p>/g, "")
    .trim()
}

export function RichTextEditor({ value, onChange, mentions, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const lastEmittedHtmlRef = useRef("")
  const [query, setQuery] = useState<string | null>(null)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0)

  const suggestions = useMemo(() => {
    const normalizedQuery = query?.toLowerCase() ?? ""
    return mentions.filter((mention) => mention.toLowerCase().includes(normalizedQuery)).slice(0, 6)
  }, [mentions, query])

  useEffect(() => {
    setActiveSuggestionIndex(0)
  }, [query])

  useEffect(() => {
    if (activeSuggestionIndex >= suggestions.length) {
      setActiveSuggestionIndex(Math.max(suggestions.length - 1, 0))
    }
  }, [activeSuggestionIndex, suggestions.length])

  useEffect(() => {
    const editor = editorRef.current
    const nextHtml = textToHtml(value)

    if (!editor || editor === document.activeElement || lastEmittedHtmlRef.current === nextHtml || editor.innerHTML === nextHtml) {
      return
    }

    editor.innerHTML = nextHtml
  }, [value])

  const emitChange = () => {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML ?? "")
    lastEmittedHtmlRef.current = html
    onChange(html)
  }

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    emitChange()
  }

  const updateMentionQuery = () => {
    const selection = window.getSelection()
    const text = selection?.anchorNode?.textContent?.slice(0, selection.anchorOffset) ?? ""
    const match = text.match(/@([\p{L}\p{N}_-]*)$/u)
    setQuery(match ? match[1] : null)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (query === null || !suggestions.length) {
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveSuggestionIndex((current) => (current - 1 + suggestions.length) % suggestions.length)
      return
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault()
      insertMention(suggestions[activeSuggestionIndex])
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setQuery(null)
    }
  }

  const insertMention = (name: string) => {
    const selection = window.getSelection()
    if (!selection?.rangeCount) {
      return
    }

    const range = selection.getRangeAt(0)
    const anchorText = selection.anchorNode?.textContent ?? ""
    const atIndex = anchorText.lastIndexOf("@", selection.anchorOffset)

    if (selection.anchorNode && atIndex >= 0) {
      range.setStart(selection.anchorNode, atIndex)
      range.deleteContents()
    }

    const mention = document.createElement("span")
    mention.className = "mention"
    mention.contentEditable = "false"
    mention.dataset.person = name
    mention.textContent = `@${name}`

    const trailingSpace = document.createTextNode("\u00a0")
    const fragment = document.createDocumentFragment()
    fragment.appendChild(mention)
    fragment.appendChild(trailingSpace)

    range.insertNode(fragment)
    range.setStartAfter(trailingSpace)
    range.setEndAfter(trailingSpace)
    selection.removeAllRanges()
    selection.addRange(range)
    setQuery(null)
    emitChange()
  }

  return (
    <div className="relative rounded-md border border-border bg-background">
      <div className="flex items-center gap-1 border-b border-border px-2 py-2">
        <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")} title="Negrito">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")} title="Itálico">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")} title="Sublinhado">
          <Underline className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")} title="Lista">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")} title="Lista numerada">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className="rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("formatBlock", "blockquote")} title="Citação">
          <Quote className="h-4 w-4" />
        </button>
        <span className="ml-auto text-xs text-muted-foreground">Use @ para mencionar</span>
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          className={cn(
            "prose-content min-h-32 px-3 py-3 text-sm leading-7 outline-none empty:before:pointer-events-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
          )}
          contentEditable
          data-placeholder={placeholder}
          onInput={() => {
            emitChange()
            updateMentionQuery()
          }}
          onKeyUp={updateMentionQuery}
          onKeyDown={handleKeyDown}
          onBlur={() => window.setTimeout(() => setQuery(null), 120)}
          suppressContentEditableWarning
        />

        {query !== null && suggestions.length ? (
          <div className="absolute left-3 top-full z-20 mt-2 w-64 rounded-md border border-border bg-card p-1 shadow-lg">
            {suggestions.map((mention) => (
            <button
              key={mention}
              type="button"
              className={cn(
                "block w-full rounded px-3 py-2 text-left text-sm hover:bg-accent",
                suggestions[activeSuggestionIndex] === mention ? "bg-accent text-accent-foreground" : ""
              )}
              onMouseDown={(event) => {
                event.preventDefault()
                insertMention(mention)
                }}
              >
                @{mention}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
