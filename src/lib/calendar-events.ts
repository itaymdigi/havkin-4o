import type { CalendarEvent } from "@/types"

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const response = await fetch('/api/calendar-events')
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch calendar events')
  }
  
  return response.json()
}

export async function createCalendarEvent(event: Omit<CalendarEvent, "id" | "created_at" | "updated_at">): Promise<CalendarEvent> {
  const response = await fetch('/api/calendar-events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create calendar event')
  }
  
  return response.json()
}

export async function updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
  const response = await fetch(`/api/calendar-events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update calendar event')
  }
  
  return response.json()
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const response = await fetch(`/api/calendar-events/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete calendar event')
  }
} 