import type { Reminder } from "@/types";
import { supabase } from "./supabase";

export async function getEventReminders(eventId: string) {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("event_id", eventId)
    .order("remind_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data as Reminder[];
}

export async function createReminder(
  reminder: Omit<Reminder, "id" | "created_at" | "updated_at" | "status">
) {
  const { data, error } = await supabase
    .from("reminders")
    .insert([{ ...reminder, status: "pending" }])
    .select();

  if (error) {
    throw error;
  }

  return data[0] as Reminder;
}

export async function updateReminder(id: string, reminder: Partial<Reminder>) {
  const { data, error } = await supabase.from("reminders").update(reminder).eq("id", id).select();

  if (error) {
    throw error;
  }

  return data[0] as Reminder;
}

export async function deleteReminder(id: string) {
  const { error } = await supabase.from("reminders").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
