import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, LogOut, Home, Car, Users, Menu, Moon, Sun, Monitor } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Notification } from "../types";
import { markNotificationsAsRead, fetchNotifications } from "../utils/api";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import PushNotificationHandler from './PushNotificationHandler';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  logout: () => void;
}



export default function Layout({ children, currentUser, logout }: LayoutProps) {
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const [currentMode, setCurrentMode] = useState("system");
  const { toast } = useToast();

  const fetchUserNotifications = useCallback(async () => {
    if (currentUser) {
      try {
        const fetchedNotifications = await fetchNotifications(currentUser.id);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        toast({
          title: "Error",
          description: "Failed to fetch notifications.",
          variant: "destructive",
        });
      }
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchUserNotifications();
    const intervalId = setInterval(fetchUserNotifications, 60000);
    return () => clearInterval(intervalId);
  }, [fetchUserNotifications]);

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenNotificationDialog = useCallback(() => {
    setIsNotificationDialogOpen(true);
  }, []);

  const handleCloseNotificationDialog = useCallback(async () => {
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length > 0 && currentUser) {
      try {
        await markNotificationsAsRead(
          currentUser.id,
          unreadNotifications.map((n) => n.id)
        );
        setNotifications(prevNotifications =>
          prevNotifications.map(n => ({ ...n, is_read: true }))
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
        toast({
          title: "Error",
          description: "Failed to mark notifications as read.",
          variant: "destructive",
        });
      }
    }
    setIsNotificationDialogOpen(false);
  }, [currentUser, notifications, toast]);

// Sync the theme state with the current mode
useEffect(() => {
  if (currentMode === "system") {
    setTheme(systemTheme || "dark"); // Default to "dark" if systemTheme is undefined
  } else {
    setTheme(currentMode);
  }
}, [currentMode, setTheme, systemTheme]);

// Toggle between "system", "dark", and "light"
const toggleTheme = () => {
  setCurrentMode((prevMode) => {
    if (prevMode === "system") return "dark";
    if (prevMode === "dark") return "light";
    return "system";
  });
};

  useEffect(() => {
    const handleOnline = () => {
      toast({
        title: "You're back online",
        description: "Your connection has been restored.",
      });
    };

    const handleOffline = () => {
      toast({
        title: "You're offline",
        description: "Please check your internet connection.",
        variant: "destructive",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutDialogOpen(false);
    logout();
  };

  if (!currentUser) return children;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <PushNotificationHandler userId={currentUser!.id} />
      <header className="bg-background shadow-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-shrink-0 mr-4">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              RideShare
            </Link>
          </div>

          <nav className={`hidden md:flex items-center space-x-2 rounded-full p-1 border`}>
            {[
              { icon: Home, label: "Dashboard", href: "/dashboard" },
              { icon: Car, label: "Create Ride", href: "/create-ride" },
              { icon: Users, label: "Profile", href: "/profile" },
            ].map((item) => (
              <Button key={item.href} variant="ghost" asChild className="rounded-full px-4 py-2 transition-colors duration-200">
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" /> {item.label}
                </Link>
              </Button>
            ))}

            <Dialog open={isNotificationDialogOpen} onOpenChange={handleCloseNotificationDialog}>
              <Button variant="ghost" size="icon" className="rounded-full px-4 py-2 relative hover:bg-accent" onClick={handleOpenNotificationDialog}>
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">{unreadNotificationsCount}</span>}
              </Button>
              <DialogContent className="sm:max-w-[425px] rounded w-11/12 bg-background text-foreground">
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
                        <CardHeader className="p-4">
                          <CardTitle className="text-sm font-medium">{notification.type}</CardTitle>
                          <CardDescription className="text-xs">{new Date(notification.created_at).toLocaleString()}</CardDescription>
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

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-accent">
            {currentMode === "system" ? (
              <Monitor className="h-4 w-4" />
            ) : currentMode === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>

            <Button variant="ghost" onClick={handleLogout} className="rounded-full px-4 py-2 hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-background text-foreground">
              <DropdownMenuLabel className="flex items-center">
                <Users className="mr-2 h-4 w-4" /> {currentUser.name}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {[
                { icon: Home, label: "Dashboard", href: "/dashboard" },
                { icon: Car, label: "Create Ride", href: "/create-ride" },
                { icon: Users, label: "Profile", href: "/profile" },
              ].map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" /> {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleOpenNotificationDialog}>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
                {unreadNotificationsCount > 0 && <span className="ml-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">{unreadNotificationsCount}</span>}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:text-destructive-foreground focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-background py-8 text-center text-sm text-zinc-500">
        <p>&copy; {new Date().getFullYear()} RideShare by Félix Robb. All rights reserved.</p>
        <div className="mt-2 space-x-4">
          <Link href="/privacy-policy" className="hover:text-orange-500 transition-colors duration-300">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-orange-500 transition-colors duration-300">Terms of Service</Link>
          <Link href="https://github.com/FelixRobb/ride-share-app" className="hover:text-orange-500 transition-colors duration-300">Source code on github</Link>
        </div>
      </footer>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-4" variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="mb-4" onClick={confirmLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

