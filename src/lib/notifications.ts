import { supabase } from "./supabase"
import type { Notification } from "@/types"

export async function getNotifications() {
  const response = await fetch('/api/notifications', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch notifications')
  }
  
  return response.json()
}

export async function createNotification(notification: Omit<Notification, "id" | "created_at" | "updated_at" | "read">) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User must be authenticated to create notifications")
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert([{ 
      ...notification,
      user_id: user.id,
      read: false 
    }])
    .select()

  if (error) {
    console.error("Error creating notification:", error)
    throw error
  }

  return data[0] as Notification
}

export async function markNotificationAsRead(id: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .select()

  if (error) {
    console.error("Error marking notification as read:", error)
    throw error
  }

  return data[0] as Notification
}

export async function markAllNotificationsAsRead() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("User must be authenticated")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting notification:", error)
    throw error
  }
} 