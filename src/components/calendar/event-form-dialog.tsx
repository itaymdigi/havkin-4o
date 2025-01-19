"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { formatInTimeZone } from "date-fns-tz"
import { addHours, parseISO } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getContacts } from "@/lib/contacts"
import { createCalendarEvent, updateCalendarEvent } from "@/lib/calendar-events"
import { ReminderForm } from "@/components/calendar/reminder-form"
import type { Contact, CalendarEvent } from "@/types"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  location: z.string().optional(),
  contact_id: z.string().nullable().default(null),
})

type EventFormValues = z.infer<typeof eventSchema>

interface EventFormDialogProps {
  event?: CalendarEvent
  defaultDate?: Date
  trigger: React.ReactNode
  onSuccess: () => void
}

export function EventFormDialog({
  event,
  defaultDate,
  trigger,
  onSuccess,
}: EventFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await getContacts()
        setContacts(data)
      } catch (error) {
        console.error("Failed to load contacts:", error)
      }
    }
    loadContacts()
  }, [])

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      start_time: event?.start_time 
        ? formatInTimeZone(parseISO(event.start_time), 'Asia/Jerusalem', "yyyy-MM-dd'T'HH:mm")
        : defaultDate
        ? formatInTimeZone(defaultDate, 'Asia/Jerusalem', "yyyy-MM-dd'T'HH:mm")
        : "",
      end_time: event?.end_time
        ? formatInTimeZone(parseISO(event.end_time), 'Asia/Jerusalem', "yyyy-MM-dd'T'HH:mm")
        : defaultDate
        ? formatInTimeZone(addHours(defaultDate, 1), 'Asia/Jerusalem', "yyyy-MM-dd'T'HH:mm")
        : "",
      location: event?.location || "",
      contact_id: event?.contact_id || "none",
    },
  })

  async function onSubmit(data: EventFormValues) {
    try {
      setLoading(true)
      
      // Convert local datetime to UTC ISO string
      const startDate = new Date(data.start_time);
      const endDate = new Date(data.end_time);
      
      const formattedData = {
        ...data,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        description: data.description || null,
        location: data.location || null,
      }
      
      if (event) {
        await updateCalendarEvent(event.id, formattedData)
      } else {
        await createCalendarEvent({ 
          ...formattedData,
          user_id: "default_user_id",
          contact_id: data.contact_id === "none" ? null : data.contact_id
        })
      }
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to save event:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {event ? "Edit Event" : "Add New Event"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Contact</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.first_name} {contact.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>

        {event && (
          <>
            <Separator className="my-4" />
            <ReminderForm
              eventId={event.id}
              eventStartTime={event.start_time}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 