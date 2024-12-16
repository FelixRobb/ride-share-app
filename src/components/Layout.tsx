import { useState, useCallback, useEffect } from "react";
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, LogOut, Home, Car, Users, Menu, Moon, Sun } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, Notification } from "../types";
import { markNotificationsAsRead } from "../utils/api";
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  notifications: Notification[];
  logout: () => void;
}

export default function Layout({
  children,
  currentUser,
  notifications,
  logout,
}: LayoutProps) {
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast();

  const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

  const handleOpenNotificationDialog = useCallback(() => {
    setIsNotificationDialogOpen(true);
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length > 0) {
      void markNotificationsAsRead(currentUser!.id, unreadNotifications.map((n) => n.id));
    }
  }, [notifications, currentUser]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

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

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    <div className="flex flex-col min-h-screen bg-background">
      <header className="bg-background shadow-md border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">RideShare</Link>
          </div>

          <nav className="hidden md:flex items-center space-x-2 bg-muted rounded-full p-1">
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

            <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
              <Button
                variant="ghost"
                className="rounded-full px-4 py-2 hover:bg-primary/10 relative"
                onClick={handleOpenNotificationDialog}
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotificationsCount}
                  </span>
                )}
              </Button>
              <DialogContent className="sm:max-w-[425px]">
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

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-primary/10">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Button variant="ghost" onClick={handleLogout} className="rounded-full px-4 py-2 hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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

              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-background border-t border-border py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} RideShare. All rights reserved.</div>
      </footer>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

