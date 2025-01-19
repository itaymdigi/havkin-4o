"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notifications"
import { supabase } from "@/lib/supabase"

// Define Notification type locally since @/types/notifications module is not found
type Notification = {
  id: string
  userId: string 
  message: string
  read: boolean
  createdAt: string
}

interface NotificationsContextType {
  notifications: Notification[] // Array of notifications
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export function NotificationsProvider({ 
  children 
}: { 
  children: React.ReactNode 
}): JSX.Element {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const refreshNotifications = async (): Promise<void> => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Failed to fetch notifications:", getErrorMessage(error))
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchInitialNotifications = async (): Promise<void> => {
      if (!isMounted) return
      await refreshNotifications()
    }

    void fetchInitialNotifications()
    
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        async () => {
          if (!isMounted) return
          await refreshNotifications()
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      void supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = async (id: string): Promise<void> => {
    try {
      await markNotificationAsRead(id)
      await refreshNotifications()
    } catch (error) {
      console.error("Failed to mark notification as read:", getErrorMessage(error))
    }
  }

  const markAllAsRead = async (): Promise<void> => {
    try {
      await markAllNotificationsAsRead()
      await refreshNotifications()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", getErrorMessage(error))
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <NotificationsContext.Provider 
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications(): NotificationsContextType {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
} 