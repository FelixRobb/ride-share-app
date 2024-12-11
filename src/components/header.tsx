"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, LogOut, Home, Car, Users, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from "next-themes";

type Notification = {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export function Header() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      if (currentUser) {
        try {
          const response = await fetch(`/api/notifications?userId=${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setNotifications(data.notifications);
          }
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }
    };

    fetchNotifications();
    // Set up interval to fetch notifications periodically
    const intervalId = setInterval(fetchNotifications, 60000); // Fetch every minute

    return () => clearInterval(intervalId);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    // Redirect to home page or login page
    window.location.href = "/";
  };

  const handleOpenNotificationDialog = async () => {
    setIsNotificationDialogOpen(true);
    // Mark notifications as read
    const unreadNotifications = notifications.filter(n => !n.is_read);
    if (unreadNotifications.length > 0) {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: currentUser.id, 
            notificationIds: unreadNotifications.map(n => n.id) 
          }),
        });
        // Update local state
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/dashboard" },
    { icon: Car, label: "Create Ride", href: "/create-ride" },
    { icon: Users, label: "Profile", href: "/profile" },
  ];

  return (
    <header className="bg-background shadow-md border-b">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          RideShare
        </Link>

        {currentUser && (
          <>
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.href}
                  variant={pathname === item.href ? "default" : "ghost"}
                  asChild
                >
                  <Link href={item.href} className="flex items-center space-x-1">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              ))}

              <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" onClick={handleOpenNotificationDialog}>
                    <Bell className="h-4 w-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
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

              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              <Button variant="ghost" onClick={handleLogout}>
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
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" /> {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenNotificationDialog}>
                  <Bell className="mr-2 h-4 w-4" /> Notifications
                  {unreadNotificationsCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                  {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {!currentUser && (
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="default" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}

