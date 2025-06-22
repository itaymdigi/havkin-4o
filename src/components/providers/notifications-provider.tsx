"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/notifications"
import { supabase } from "@/lib/supabase"
import { useUser } from "@clerk/nextjs"
import type { Notification } from "@/types"

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isSignedIn, isLoaded } = useUser()

  const refreshNotifications = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      const message = getErrorMessage(error)
      console.error("Failed to fetch notifications:", message)
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchInitialNotifications = async (): Promise<void> => {
      if (!isMounted || !isLoaded) return
      
      if (isSignedIn) {
        await refreshNotifications()
      } else {
        setNotifications([])
        setIsLoading(false)
      }
    }

    void fetchInitialNotifications()
    
    // Set up real-time subscription for notifications
    let channel: ReturnType<typeof supabase.channel> | null = null
    if (isSignedIn) {
      channel = supabase
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
    }

    return () => {
      isMounted = false
      if (channel) {
        void supabase.removeChannel(channel)
      }
    }
  }, [isSignedIn, isLoaded])

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
        isLoading,
        error,
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