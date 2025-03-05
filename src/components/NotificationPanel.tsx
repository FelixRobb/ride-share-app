"use client"

import {
  Bell,
  MessageSquare,
  UserPlus,
  Car,
  CheckCircle,
  Search,
  Loader,
  Settings,
  Smartphone,
  Trash2,
} from "lucide-react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useMediaQuery } from "@/hooks/use-media-query"
import { markNotificationsAsRead } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getDeviceId, formatLastUsed } from "@/utils/deviceUtils"
import type { PushSubscription } from "@/types"

interface Notification {
  id: string
  type: string
  message: string
  created_at: string
  is_read: boolean
}

interface NotificationPanelProps {
  userId: string
}

const notificationTypes = {
  all: "All Notifications",
  newNote: "New Notes",
  contactRequest: "Contact Requests",
  contactAccepted: "Accepted Contacts",
  newRide: "New Rides",
  rideAccepted: "Accepted Rides",
  rideCancelled: "Cancelled Rides",
  rideCompleted: "Completed Rides",
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "newNote":
      return <MessageSquare className="h-4 w-4 text-blue-500" />
    case "contactRequest":
    case "contactAccepted":
      return <UserPlus className="h-4 w-4 text-green-500" />
    case "newRide":
    case "rideAccepted":
    case "rideCancelled":
      return <Car className="h-4 w-4 text-orange-500" />
    case "rideCompleted":
      return <CheckCircle className="h-4 w-4 text-purple-500" />
    default:
      return <Bell className="h-4 w-4 text-zinc-500" />
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const NotificationFilters = ({
  selectedType,
  setSelectedType,
  selectedFilter,
  setSelectedFilter,
  searchTerm,
  setSearchTerm,
}: {
  selectedType: string
  setSelectedType: (type: string) => void
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
}) => {
  return (
    <div className="flex flex-col gap-4 mb-2 mt-4">
      <div className="flex gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="flex-1 min-w-10">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(notificationTypes).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-fit">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  )
}

const NotificationList = ({
  notifications,
  selectedType,
  selectedFilter,
  searchTerm,
  isDesktop,
}: {
  notifications: Notification[]
  selectedType: string
  selectedFilter: string
  searchTerm: string
  isDesktop: boolean
}) => {
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        const matchesType = selectedType === "all" || notification.type === selectedType
        const matchesFilter =
          selectedFilter === "all" ||
          (selectedFilter === "unread" && !notification.is_read) ||
          (selectedFilter === "read" && notification.is_read)
        const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesType && matchesFilter && matchesSearch
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [notifications, selectedType, selectedFilter, searchTerm])

  return (
    <ScrollArea
      className={`${isDesktop ? "h-[calc(100vh-12rem)]" : "h-[60svh]"} w-full p-2 pr-4 my-4 border rounded-lg`}
    >
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No notifications found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search term</p>
        </div>
      ) : (
        filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={`mb-4 transition-all duration-200 hover:shadow-md ${notification.is_read ? "opacity-60" : ""}`}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getNotificationIcon(notification.type)}
                  <CardTitle className="text-sm font-medium">
                    {notificationTypes[notification.type as keyof typeof notificationTypes]}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">{formatDate(notification.created_at)}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm">{notification.message}</p>
            </CardContent>
          </Card>
        ))
      )}
    </ScrollArea>
  )
}

const NotificationSettings = ({ userId }: { userId: string }) => {
  const [devices, setDevices] = useState<PushSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [currentDeviceId] = useState(() => getDeviceId())
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isOnline = useOnlineStatus()

  useEffect(() => {
    let mounted = true

    const fetchDevices = async () => {
      if (!isOnline || !isSettingsOpen) return

      setIsLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}/push-devices`)
        if (response.ok && mounted) {
          const data = await response.json()
          setDevices(data.devices)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void fetchDevices()

    return () => {
      mounted = false
    }
  }, [userId, isOnline, isSettingsOpen])

  const handleToggleDevice = async (deviceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/push-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, deviceId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update device preference")
      }

      const data = await response.json()
      if (data.success) {
        setDevices((prev) => prev.map((device) => (device.device_id === deviceId ? { ...device, enabled } : device)))
        toast.success(enabled ? "Notifications enabled for this device" : "Notifications disabled for this device")
      } else {
        throw new Error("Failed to update device preference")
      }
    } catch {
      toast.error("Failed to update notification preference. Please try again.")
      setDevices((prev) => [...prev])
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/push-subscription`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deviceId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove device")
      }

      setDevices((prev) => prev.filter((device) => device.device_id !== deviceId))
      toast.success("Device removed successfully")
    } catch {
      toast.error("Failed to remove device")
    }
  }

  const SettingsButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-full hover:bg-accent/20 transition-colors duration-200"
      onClick={() => setIsSettingsOpen(true)}
      aria-label="Notification Settings"
    >
      <Settings className="h-5 w-5 text-muted-foreground" />
    </Button>
  )

  const SettingsContent = (
    <div className="space-y-6 py-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Device Notifications</h3>
            <p className="text-sm text-muted-foreground">Manage push notifications across your devices</p>
          </div>
          {!isOnline && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-6 border rounded-lg bg-accent/50">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No devices registered for notifications</p>
            <p className="text-xs text-muted-foreground mt-2">Connect a new device to receive push notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <Card
                key={device.device_id}
                className={`
                  ${device.device_id === currentDeviceId ? "border-primary" : "border-border"}
                  hover:shadow-sm transition-shadow duration-200
                  ${!device.enabled ? "opacity-60" : ""}
                `}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className={`h-5 w-5 ${device.enabled ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          {device.device_name}
                          {device.device_id === currentDeviceId && (
                            <Badge variant="outline" className="text-xs">Current Device</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Last used: {formatLastUsed(device.last_used)}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardFooter className="pt-0 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={device.enabled}
                      onCheckedChange={(checked) => handleToggleDevice(device.device_id, checked)}
                      disabled={!isOnline}
                      className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                    />
                    <span className={`text-sm ${device.enabled ? "text-foreground" : "text-muted-foreground"}`}>
                      {device.enabled ? "Notifications On" : "Notifications Off"}
                    </span>
                  </div>
                  {!(device.device_id === currentDeviceId) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDevice(device.device_id)}
                      disabled={!isOnline}
                      className="text-destructive hover:bg-destructive/10 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <>
        {SettingsButton}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Notification Preferences</DialogTitle>
              <DialogDescription>
                Customize how and where you receive notifications across your devices
              </DialogDescription>
            </DialogHeader>
            {SettingsContent}
            <DialogFooter>
              <Button onClick={() => setIsSettingsOpen(false)} variant="outline">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      {SettingsButton}
      <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DrawerContent className="h-[70svh]">
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-xl">Notification Preferences</DrawerTitle>
            <DrawerDescription>
              Customize how and where you receive notifications
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-auto">{SettingsContent}</div>
          <DrawerFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsSettingsOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedType, setSelectedType] = useState("all")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [etag, setEtag] = useState<string | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isOnline = useOnlineStatus()

  const fetchNotificationsCallback = useCallback(async () => {
    if (isOnline) {
      const headers: HeadersInit = {}
      if (etag) {
        headers["If-None-Match"] = etag
      }

      const response = await fetch(`/api/notifications`, { headers })

      if (response.status === 304) {
        return null // Data hasn't changed
      }

      if (response.ok) {
        const newEtag = response.headers.get("ETag")
        const data = await response.json()
        if (newEtag !== etag) {
          setEtag(newEtag)
          setNotifications(data.notifications)
          setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length)
        }
      }
    }
  }, [etag, isOnline])

  useEffect(() => {
    if (isOnline) {
      void fetchNotificationsCallback()
      const interval = setInterval(() => void fetchNotificationsCallback(), 15000)
      return () => clearInterval(interval)
    }
  }, [fetchNotificationsCallback, isOnline])

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open)
      if (!open && unreadCount > 0) {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)

        await markNotificationsAsRead(userId, unreadIds)
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    },
    [userId, notifications, unreadCount],
  )

  const NotificationButton = useMemo(
    () => (
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-full hover:bg-accent border"
        onClick={() => handleOpenChange(true)}
        data-tutorial="notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
    ),
    [unreadCount, handleOpenChange],
  )

  const NotificationContent = useMemo(
    () => (
      <>
        <NotificationFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          selectedFilter={selectedFilter}
          setSelectedFilter={setSelectedFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        <NotificationList
          notifications={notifications}
          selectedType={selectedType}
          selectedFilter={selectedFilter}
          searchTerm={searchTerm}
          isDesktop={isDesktop}
        />
      </>
    ),
    [selectedType, selectedFilter, searchTerm, notifications, isDesktop],
  )

  if (isDesktop) {
    return (
      <>
        {NotificationButton}
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent>
            <SheetHeader className="flex flex-row items-center justify-between pr-2">
              <div>
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>Your recent notifications</SheetDescription>
              </div>
              <NotificationSettings userId={userId} />
            </SheetHeader>
            {NotificationContent}
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      {NotificationButton}
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[90svh]">
          <DrawerHeader className="flex flex-row items-center justify-between pr-4">
            <div>
              <DrawerTitle>Notifications</DrawerTitle>
              <DrawerDescription>Your recent notifications</DrawerDescription>
            </div>
            <NotificationSettings userId={userId} />
          </DrawerHeader>
          <div className="px-4">{NotificationContent}</div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

