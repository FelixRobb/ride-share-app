"use client"
import type React from "react"
import { createContext, useState, useContext, useCallback, useEffect } from "react"
import type { Notification, User } from "../types"
import { fetchNotifications, markNotificationsAsRead } from "../utils/api"
import { toast } from "sonner"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationIds: string[]) => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider: React.FC<{ children: React.ReactNode; currentUser: User | null }> = ({
  children,
  currentUser,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const fetchUserNotifications = useCallback(async () => {
    if (currentUser) {
      try {
        const fetchedNotifications = await fetchNotifications(currentUser.id)
        setNotifications(fetchedNotifications)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("Failed to fetch notifications.")
      }
    }
  }, [currentUser])

  const markAsRead = useCallback(
    async (notificationIds: string[]) => {
      if (currentUser) {
        try {
          await markNotificationsAsRead(currentUser.id, notificationIds)
          setNotifications((prevNotifications) =>
            prevNotifications.map((n) => (notificationIds.includes(n.id) ? { ...n, is_read: true } : n)),
          )
        } catch (error) {
          console.error("Error marking notifications as read:", error)
          toast.error("Failed to mark notifications as read.")
        }
      }
    },
    [currentUser],
  )

  useEffect(() => {
    fetchUserNotifications()
    const intervalId = setInterval(fetchUserNotifications, 30000) // Fetch every 30 seconds
    return () => clearInterval(intervalId)
  }, [fetchUserNotifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const value = {
    notifications,
    unreadCount,
    fetchNotifications: fetchUserNotifications,
    markAsRead,
  }

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

