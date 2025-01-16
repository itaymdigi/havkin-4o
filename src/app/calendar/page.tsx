"use client"

import { useEffect, useState, useMemo } from "react"
import { Calendar, dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, parseISO } from "date-fns"
import { he } from "date-fns/locale"
import { formatInTimeZone } from "date-fns-tz"
import { DashboardLayout } from "@/components/dashboard-layout"
import { EventFormDialog } from "@/components/calendar/event-form-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar-events"
import type { CalendarEvent } from "@/types"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { getEventStyle } from "@/lib/utils"

const locales = {
  "he": he,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: he }),
  getDay,
  locales,
})

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      const data = await getCalendarEvents()
      setEvents(data)
    } catch (error) {
      console.error("Failed to load events:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteEvent() {
    if (!selectedEvent) return

    try {
      await deleteCalendarEvent(selectedEvent.id)
      await loadEvents()
      setShowDeleteDialog(false)
      setSelectedEvent(null)
    } catch (error) {
      console.error("Failed to delete event:", error)
    }
  }

  const calendarEvents = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: `${event.title}${event.contact ? ` - ${event.contact.first_name} ${event.contact.last_name}` : ""}`,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      resource: event,
      ...getEventStyle(event),
    }))
  }, [events])

  async function handleEventResize({ event, start, end }: any) {
    try {
      const eventToUpdate = event.resource as CalendarEvent
      await updateCalendarEvent(eventToUpdate.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      await loadEvents()
    } catch (error) {
      console.error("Failed to resize event:", error)
    }
  }

  async function handleEventDrop({ event, start, end }: any) {
    try {
      const eventToUpdate = event.resource as CalendarEvent
      await updateCalendarEvent(eventToUpdate.id, {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      })
      await loadEvents()
    } catch (error) {
      console.error("Failed to move event:", error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Calendar</h2>
            <p className="text-muted-foreground">
              Manage your schedule and events
            </p>
          </div>
          <div className="flex gap-2">
            {selectedEvent && (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <EventFormDialog
                  event={selectedEvent}
                  trigger={
                    <Button>
                      Edit Event
                    </Button>
                  }
                  onSuccess={() => {
                    loadEvents()
                    setSelectedEvent(null)
                  }}
                />
              </>
            )}
            <EventFormDialog
              defaultDate={selectedDate || undefined}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              }
              onSuccess={loadEvents}
            />
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-white" style={{ height: "700px" }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              Loading...
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              onSelectSlot={({ start }) => {
                setSelectedDate(start)
                setSelectedEvent(null)
              }}
              selectable
              resizable
              draggableAccessor={() => true}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              popup
              views={["month", "week", "day", "agenda"]}
              onSelectEvent={(event) => {
                setSelectedEvent(event.resource)
                setSelectedDate(null)
              }}
              eventPropGetter={(event) => ({
                style: event.style,
              })}
              culture="he"
              formats={{
                dateFormat: 'dd/MM/yyyy',
                timeGutterFormat: 'HH:mm',
                eventTimeRangeFormat: ({ start, end }, culture, local) =>
                  `${local.format(start, 'HH:mm', culture)} - ${local.format(end, 'HH:mm', culture)}`,
                dayRangeHeaderFormat: ({ start, end }, culture, local) =>
                  `${local.format(start, 'dd/MM/yyyy', culture)} - ${local.format(end, 'dd/MM/yyyy', culture)}`,
              }}
            />
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
} 