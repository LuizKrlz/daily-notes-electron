import { z } from "zod"

const optionalText = z.string().trim().optional().or(z.literal(""))
const taskStatusSchema = z.enum(["todo", "doing", "done"])

export const dailyTaskInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  status: taskStatusSchema.default("todo")
})

export const dailyInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  dailyDate: z.string().trim().min(1),
  project: optionalText,
  participants: z.array(z.string().trim().min(1)).default([]),
  summary: optionalText,
  yesterday: optionalText,
  today: optionalText,
  blockers: optionalText,
  discussions: optionalText,
  decisions: optionalText,
  nextSteps: optionalText,
  notes: optionalText,
  tasks: z.array(dailyTaskInputSchema).default([]),
  tags: z.array(z.string().trim().min(1)).default([])
})

export const dailyUpdateSchema = dailyInputSchema.partial()

export const dailyFiltersSchema = z.object({
  query: optionalText,
  project: optionalText,
  tag: optionalText,
  period: z.enum(["today"]).optional(),
  date: optionalText
})

export type DailyInputSchema = z.infer<typeof dailyInputSchema>
