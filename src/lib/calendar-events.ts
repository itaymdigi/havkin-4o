import { supabase } from "./supabase"
import type { CalendarEvent } from "@/types"

export async function getCalendarEvents() {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from("calendar_events")
    .select(`
      *,
      contact:contacts(*)
    `)
    .eq('user_id', user?.id)
    .order("start_time", { ascending: true })

  if (error) {
    console.error("Error fetching calendar events:", error)
    throw error
  }

  return data as CalendarEvent[]
}

export async function createCalendarEvent(event: Omit<CalendarEvent, "id" | "created_at" | "updated_at">) {
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError || !session?.user) {
    throw new Error("User must be authenticated to create calendar events");
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert([{ 
      ...event, 
      user_id: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }

  if (!data) {
    throw new Error("Failed to create calendar event");
  }

  return data as CalendarEvent;
}

export async function updateCalendarEvent(id: string, event: Partial<CalendarEvent>) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data, error } = await supabase
    .from("calendar_events")
    .update(event)
    .eq("id", id)
    .eq("user_id", user?.id)
    .select()

  if (error) {
    console.error("Error updating calendar event:", error)
    throw error
  }

  return data[0] as CalendarEvent
}

export async function deleteCalendarEvent(id: string) {
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id)
    .eq("user_id", user?.id)

  if (error) {
    console.error("Error deleting calendar event:", error)
    throw error
  }
} 