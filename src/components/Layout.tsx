import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Bell,
  LogOut,
  Home,
  Car,
  Users,
  Menu,
  Moon,
  Sun,
  Monitor,
  MessageSquare,
  UserPlus,
  CheckCircle,
  HelpCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User, Notification } from "../types"
import { markNotificationsAsRead, fetchNotifications } from "../utils/api"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import PushNotificationHandler from "./PushNotificationHandler"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { TutorialOverlay } from "./TutorialOverlay"
import { useTutorial } from "@/contexts/TutorialContext"

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

interface LayoutProps {
  children: React.ReactNode
  currentUser: User | null
}

export default function Layout({ children, currentUser }: LayoutProps) {
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()
  const pathname = usePathname()

  const isOnline = useOnlineStatus()
  const [wasPreviouslyOffline, setWasPreviouslyOffline] = useState(false)

  const fetchUserNotifications = useCallback(async () => {
    if (currentUser && isOnline) {
      try {
        const fetchedNotifications = await fetchNotifications(currentUser.id)
        setNotifications(fetchedNotifications)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }
  }, [currentUser, isOnline])

  useEffect(() => {
    fetchUserNotifications()
    const intervalId = setInterval(fetchUserNotifications, 10000)
    return () => clearInterval(intervalId)
  }, [fetchUserNotifications])

  useEffect(() => {
    if (!isOnline) {
      setWasPreviouslyOffline(true)
      toast.error("You're offline. Please check your internet connection.")
    } else if (isOnline && wasPreviouslyOffline) {
      setWasPreviouslyOffline(false)
      toast.success("You're back online. Your connection has been restored.")
    }
  }, [isOnline, wasPreviouslyOffline])


  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length

  const handleOpenNotificationDialog = useCallback(() => {
    setIsNotificationDialogOpen(true)
  }, [])

  const handleCloseNotificationDialog = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read)
    if (unreadNotifications.length > 0 && currentUser) {
      try {
        await markNotificationsAsRead(
          currentUser.id,
          unreadNotifications.map((n) => n.id),
        )
        setNotifications((prevNotifications) => prevNotifications.map((n) => ({ ...n, is_read: true })))
      } catch (error) {
        console.error("Error marking notifications as read:", error)
        toast.error("Failed to mark notifications as read.")
      }
    }
    setIsNotificationDialogOpen(false)
  }, [currentUser, notifications])


  const TutorialButton = () => {
    const { restartTutorial } = useTutorial()
    return (
      <Button variant="outline" size="sm" className="mt-4" onClick={restartTutorial}>
        <HelpCircle className="mr-2 h-4 w-4" />
        Restart Tutorial
      </Button>
    )
  }

  if (!currentUser) return children

  if (!currentUser) return children

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative">
      <PushNotificationHandler userId={currentUser!.id} />
      <header className="bg-background/80 backdrop-blur-sm shadow-md border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-shrink-0 mr-4">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              RideShare
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2 rounded-full p-1 border">
            {[
              { icon: Home, label: "Dashboard", href: "/dashboard" },
              { icon: Car, label: "Create Ride", href: "/create-ride" },
              { icon: Users, label: "Profile", href: "/profile" },
            ].map((item) => (
              <Button
                key={item.href}
                variant="ghost"
                asChild
                className="rounded-full px-4 py-2 transition-colors duration-200"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" /> {item.label}
                </Link>
              </Button>
            ))}

            <Dialog open={isNotificationDialogOpen} onOpenChange={handleCloseNotificationDialog}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full px-4 py-2 relative hover:bg-accent"
                onClick={handleOpenNotificationDialog}
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>
              <DialogContent className="sm:max-w-md rounded-lg w-md bg-background text-foreground">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription>Your recent notifications</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full pr-4">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No notifications</p>
                  ) : (
                    notifications.map((notification) => (
                      <Card key={notification.id} className={`mb-4 ${notification.is_read ? "opacity-60" : ""}`}>
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getNotificationIcon(notification.type)}
                              <CardTitle className="text-sm font-medium">{notification.type}</CardTitle>
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
              </DialogContent>
            </Dialog>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8 pb-20 md:pb-8">
        {children}
        <TutorialOverlay />
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around items-center h-16">
          {[
            { icon: Home, label: "Dashboard", href: "/dashboard" },
            { icon: Car, label: "Create Ride", href: "/create-ride" },
            { icon: Users, label: "Profile", href: "/profile" },
            { 
              icon: Bell, 
              label: "Notifications", 
              href: "#",
              onClick: handleOpenNotificationDialog,
              badge: unreadNotificationsCount
            },
          ].map((item) => (
            <div key={item.href} className="flex-1">
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={cn(
                    "w-full flex flex-col items-center p-2 relative",
                    "text-muted-foreground hover:text-foreground transition-colors"
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute top-1 right-1/4 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center p-2",
                    pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - Hidden on Mobile */}
      <footer className="bg-background py-8 text-center text-sm text-zinc-500 md:block hidden">
        <p>&copy; {new Date().getFullYear()} RideShare by Félix Robb. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors duration-300">
            Privacy Policy
          </Link>
          <Link href="/terms-of-service" className="hover:text-orange-500 transition-colors duration-300">
            Terms of Service
          </Link>
          <Link
            href="https://github.com/FelixRobb/ride-share-app"
            className="hover:text-orange-500 transition-colors duration-300"
          >
            Source code on github
          </Link>
        </div>
        <TutorialButton />
      </footer>
    </div>
  )
}