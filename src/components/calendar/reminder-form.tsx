"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { getEventReminders, createReminder, deleteReminder } from "@/lib/reminders"
import type { Reminder } from "@/types"

const reminderSchema = z.object({
  remind_at: z.string().min(1, "Reminder time is required"),
  type: z.enum(["email", "notification"], {
    required_error: "Reminder type is required",
  }),
})

type ReminderFormValues = z.infer<typeof reminderSchema>

interface ReminderFormProps {
  eventId: string
  eventStartTime: string
}

export function ReminderForm({ eventId, eventStartTime }: ReminderFormProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      remind_at: "",
      type: "notification",
    },
  })

  useEffect(() => {
    loadReminders()
  }, [eventId])

  async function loadReminders() {
    try {
      const data = await getEventReminders(eventId)
      setReminders(data)
    } catch (error) {
      console.error("Failed to load reminders:", error)
    }
  }

  async function onSubmit(data: ReminderFormValues) {
    try {
      setLoading(true)
      await createReminder({
        event_id: eventId,
        remind_at: data.remind_at,
        type: data.type,
      })
      form.reset()
      await loadReminders()
    } catch (error) {
      console.error("Failed to create reminder:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteReminder(id: string) {
    try {
      await deleteReminder(id)
      await loadReminders()
    } catch (error) {
      console.error("Failed to delete reminder:", error)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Reminders</h3>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="remind_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remind At</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      max={eventStartTime}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Reminder"}
          </Button>
        </form>
      </Form>

      <div className="space-y-2">
        {reminders.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-2 border rounded-lg"
          >
            <div>
              <p className="font-medium">
                {new Date(reminder.remind_at).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {reminder.type}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteReminder(reminder.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 