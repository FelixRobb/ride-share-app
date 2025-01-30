import { useEffect, useState, useCallback } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MessageSquare, UserPlus, Car, CheckCircle } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

interface Notification {
  id: string
  type: string
  message: string
  created_at: string
  is_read: boolean
}

interface NotificationPanelProps {
  userId: string
  onNotificationsRead?: () => void
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

const NotificationList = ({
  notifications,
  searchQuery,
  selectedType,
  selectedFilter,
  isDesktop,
}: {
  notifications: Notification[]
  searchQuery: string
  selectedType: string
  selectedFilter: string
  isDesktop: boolean
}) => {
  const filteredNotifications = notifications
    .filter((notification) => {
      const matchesSearch = notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = selectedType === "all" || notification.type === selectedType
      const matchesFilter =
        selectedFilter === "all" ||
        (selectedFilter === "unread" && !notification.is_read) ||
        (selectedFilter === "read" && notification.is_read)
      return matchesSearch && matchesType && matchesFilter
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <ScrollArea
      className={`${isDesktop ? "h-[calc(100vh-16rem)]" : "h-[60svh]"} w-full p-2 pr-4 mb-4 border rounded-lg`}
    >
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No notifications found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
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

const NotificationFilters = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedFilter,
  setSelectedFilter,
}: {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedType: string
  setSelectedType: (type: string) => void
  selectedFilter: string
  setSelectedFilter: (filter: string) => void
}) => (
  <div className="space-y-4 my-4">
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search notifications..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-9 pr-4"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-5 w-5"
          onClick={() => setSearchQuery("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
    <div className="flex gap-4">
      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="w-[200px]">
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
      <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-[200px]">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  </div>
)

export function NotificationPanel({ userId, onNotificationsRead }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [etag, setEtag] = useState<string | null>(null)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const isOnline = useOnlineStatus()

  const fetchNotifications = useCallback(async () => {
    if (isOnline) {
      try {
        const headers: HeadersInit = {}
        if (etag) {
          headers["If-None-Match"] = etag
        }

        const response = await fetch(`/api/notifications?userId=${userId}`, { headers })

        if (response.status === 304) {
          return // No changes, use cached data
        }

        const newEtag = response.headers.get("ETag")
        const data = await response.json()

        // Check for new notifications before updating state and ETag
        if (newEtag && newEtag !== etag) {
          setEtag(newEtag)
          if (JSON.stringify(data.notifications) !== JSON.stringify(notifications)) {
            setNotifications(data.notifications)
            setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length)
          } else {
            console.log("Received same notifications, skipping update.")
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }
  }, [userId, etag, notifications, isOnline])

  useEffect(() => {
    if (isOnline) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 15000)
      return () => clearInterval(interval)
    }
  }, [fetchNotifications, isOnline]) // Added isOnline to dependencies

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open)
      if (!open && unreadCount > 0) {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, notificationIds: unreadIds }),
          })
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
          setUnreadCount(0)
          onNotificationsRead?.()
        } catch (error) {
          console.error("Error marking notifications as read:", error)
        }
      }
    },
    [userId, notifications, unreadCount, onNotificationsRead],
  )

  const NotificationButton = () => (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-full hover:bg-accent border"
      onClick={() => handleOpenChange(true)}
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
  )

  const NotificationContent = () => (
    <>
      <NotificationFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
      />
      <NotificationList
        notifications={notifications}
        searchQuery={searchQuery}
        selectedType={selectedType}
        selectedFilter={selectedFilter}
        isDesktop={isDesktop}
      />
    </>
  )

  if (isDesktop) {
    return (
      <>
        <NotificationButton />
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription>Your recent notifications</SheetDescription>
            </SheetHeader>
            <NotificationContent />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      <NotificationButton />
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[90svh]">
          <DrawerHeader>
            <DrawerTitle>Notifications</DrawerTitle>
            <DrawerDescription>Your recent notifications</DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <NotificationContent />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}

