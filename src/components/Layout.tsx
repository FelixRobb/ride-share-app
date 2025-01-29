import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Home,
  Car,
  Users,
  HelpCircle,
} from "lucide-react"
import type { User, Notification } from "../types"
import { fetchNotifications } from "../utils/api"
import { NotificationPanel } from "@/components/NotificationPanel"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import PushNotificationHandler from "./PushNotificationHandler"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { TutorialOverlay } from "./TutorialOverlay"
import { useTutorial, TutorialProvider } from "@/contexts/TutorialContext"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "../contexts/NotificationContext"

interface LayoutProps {
  children: React.ReactNode
  currentUser: User | null
}

export default function Layout({ children, currentUser }: LayoutProps) {
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { unreadCount, markAsRead } = useNotifications()
  const router = useRouter()
  const pathname = usePathname()

  const isOnline = useOnlineStatus()
  const [wasPreviouslyOffline, setWasPreviouslyOffline] = useState(false)

  useEffect(() => {
    if (!isOnline) {
      setWasPreviouslyOffline(true)
      toast.error("You're offline. Please check your internet connection.")
    } else if (isOnline && wasPreviouslyOffline) {
      setWasPreviouslyOffline(false)
      toast.success("You're back online. Your connection has been restored.")
    }
  }, [isOnline, wasPreviouslyOffline])

  const fetchUserNotifications = useCallback(async () => {
    if (currentUser && isOnline) {
      try {
        const fetchedNotifications = await fetchNotifications(currentUser.id)
        setNotifications(fetchedNotifications)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        toast.error("Failed to fetch notifications.")
      }
    }
  }, [currentUser, isOnline])

  useEffect(() => {
    fetchUserNotifications()
  }, [fetchUserNotifications])

  const handleOpenNotificationDialog = useCallback(() => {
    setIsNotificationDialogOpen(true)
  }, [])


  const TutorialButton = () => {
    const { restartTutorial } = useTutorial()
    return (
      <Button variant="outline" size="sm" className="mt-4" onClick={restartTutorial}>
        <HelpCircle className="mr-2 h-4 w-4" />
        Restart Tutorial
      </Button>
    )
  }

  const NotificationButton = () => (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-full hover:bg-accent"
      onClick={handleOpenNotificationDialog}
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

  if (!currentUser) return children

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative">
      <TutorialProvider>

        <PushNotificationHandler userId={currentUser!.id} />
        <header className="bg-background/80 backdrop-blur-sm shadow-md border-b border-border sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex-shrink-0 mr-4">
              <Link href="/dashboard" className="text-2xl font-bold text-primary">
                RideShare
              </Link>
            </div>

            {/* Desktop Navigation with Notification Button */}
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
              <div className="h-6 w-px bg-border mx-2" />
              <NotificationPanel
                userId={currentUser.id}
                onNotificationsRead={() => {
                }}
              />
            </nav>

            {/* Mobile Notification Button */}
            <div className="md:hidden">
              <NotificationPanel
                userId={currentUser.id}
                onNotificationsRead={() => {
                }}
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8 pb-7 md:pb-8">
          {children}

        </main>

        {/* Mobile Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
          <div className="flex justify-around items-center h-16">
            {[
              { icon: Home, label: "Dashboard", href: "/dashboard" },
              { icon: Car, label: "Create Ride", href: "/create-ride" },
              { icon: Users, label: "Profile", href: "/profile" },
            ].map((item) => (
              <div key={item.label} className="flex-1">
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
              </div>
            ))}
          </div>
        </nav>

        <footer className="bg-background text-center text-sm text-zinc-500 block mb-20 md:mb-6">
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
      </TutorialProvider>
    </div>
  )
}