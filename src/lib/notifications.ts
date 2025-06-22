import type { Notification } from "../types"; // Adjust the path as necessary
import { supabase } from "./supabase";

export async function getNotifications(): Promise<Notification[]> {
  // Check if user is authenticated first
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return []; // Return empty array if not authenticated
  }

  const response = await fetch("/api/notifications", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important for cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Failed to fetch notifications" }));
    throw new Error(error.error || "Failed to fetch notifications");
  }

  return response.json();
}

export async function createNotification(
  notification: Omit<Notification, "id" | "created_at" | "updated_at" | "read">
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated to create notifications");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert([
      {
        ...notification,
        user_id: user.id,
        read: false,
      },
    ])
    .select();

  if (error) {
    throw error;
  }

  return data[0] as Notification;
}

export async function markNotificationAsRead(id: string) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
    .select();

  if (error) {
    throw error;
  }

  return data[0] as Notification;
}

export async function markAllNotificationsAsRead() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User must be authenticated");
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false);

  if (error) {
    throw error;
  }
}

export async function deleteNotification(id: string) {
  const { error } = await supabase.from("notifications").delete().eq("id", id);

  if (error) {
    throw error;
  }
}
