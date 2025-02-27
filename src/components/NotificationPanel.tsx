"use client";

import {
  Bell,
  MessageSquare,
  UserPlus,
  Car,
  CheckCircle,
  Search,
  Loader,
  Settings,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { markNotificationsAsRead } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationPanelProps {
  userId: string;
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
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "newNote":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "contactRequest":
    case "contactAccepted":
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case "newRide":
    case "rideAccepted":
    case "rideCancelled":
      return <Car className="h-4 w-4 text-orange-500" />;
    case "rideCompleted":
      return <CheckCircle className="h-4 w-4 text-purple-500" />;
    default:
      return <Bell className="h-4 w-4 text-zinc-500" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationFilters = ({
  selectedType,
  setSelectedType,
  selectedFilter,
  setSelectedFilter,
  searchTerm,
  setSearchTerm,
}: {
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
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
        <Tabs
          value={selectedFilter}
          onValueChange={setSelectedFilter}
          className="flex-1 min-w-10"
        >
          <TabsList className="grid w-full grid-cols-3">
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
  );
};

const NotificationList = ({
  notifications,
  selectedType,
  selectedFilter,
  searchTerm,
  isDesktop,
}: {
  notifications: Notification[];
  selectedType: string;
  selectedFilter: string;
  searchTerm: string;
  isDesktop: boolean;
}) => {
  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((notification) => {
        const matchesType =
          selectedType === "all" || notification.type === selectedType;
        const matchesFilter =
          selectedFilter === "all" ||
          (selectedFilter === "unread" && !notification.is_read) ||
          (selectedFilter === "read" && notification.is_read);
        const matchesSearch = notification.message
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesType && matchesFilter && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }, [notifications, selectedType, selectedFilter, searchTerm]);

  return (
    <ScrollArea
      className={`${isDesktop ? "h-[calc(100vh-12rem)]" : "h-[60svh]"} w-full p-2 pr-4 my-4 border rounded-lg`}
    >
      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No notifications found</p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search term
          </p>
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
                    {
                      notificationTypes[
                        notification.type as keyof typeof notificationTypes
                      ]
                    }
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {formatDate(notification.created_at)}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm">{notification.message}</p>
            </CardContent>
          </Card>
        ))
      )}
    </ScrollArea>
  );
};

const NotificationSettings = ({ userId }: { userId: string }) => {
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const fetchPushPreference = async () => {
      setIsPushLoading(true);
      try {
        if (!isOnline) {
          return;
        }
        const response = await fetch(`/api/users/${userId}/push-preference`);
        if (response.ok) {
          const data = await response.json();
          setIsPushEnabled(data.enabled);
        }
      } finally {
        setIsPushLoading(false);
      }
    };

    if (isSettingsOpen) {
      void fetchPushPreference();
    }
  }, [isOnline, userId, isSettingsOpen]);

  const handlePushToggle = async (checked: boolean) => {
    setIsPushEnabled(checked);
    try {
      const response = await fetch(`/api/users/${userId}/push-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
      });
      if (!response.ok) {
        throw new Error("Failed to update push notification preference");
      }
      toast.success(
        checked ? "Push notifications enabled" : "Push notifications disabled"
      );
    } catch {
      toast.error(
        "Failed to update push notification preference. Please try again."
      );
      setIsPushEnabled(!checked);
    }
  };

  const SettingsButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-full hover:bg-accent"
      onClick={() => setIsSettingsOpen(true)}
      aria-label="Notification Settings"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );

  const SettingsContent = (
    <div className="space-y-6 py-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-medium">Push Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Receive alerts even when app is closed
            </p>
          </div>
          {isPushLoading ? (
            <Loader className="animate-spin h-5 w-5" />
          ) : (
            <Switch
              checked={isPushEnabled}
              onCheckedChange={handlePushToggle}
              disabled={!isOnline}
            />
          )}
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        {SettingsButton}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Notification Settings</DialogTitle>
              <DialogDescription>
                Manage your notification preferences
              </DialogDescription>
            </DialogHeader>
            {SettingsContent}
            <DialogFooter>
              <Button onClick={() => setIsSettingsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {SettingsButton}
      <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DrawerContent className="h-fit">
          <DrawerHeader>
            <DrawerTitle>Notification Settings</DrawerTitle>
            <DrawerDescription>
              Manage your notification preferences
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{SettingsContent}</div>
          <DrawerFooter className="pt-0">
            <Button variant="default" onClick={() => setIsSettingsOpen(false)}>
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [etag, setEtag] = useState<string | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOnline = useOnlineStatus();

  const fetchNotificationsCallback = useCallback(async () => {
    if (isOnline) {
      const headers: HeadersInit = {};
      if (etag) {
        headers["If-None-Match"] = etag;
      }

      const response = await fetch(`/api/notifications`, { headers });

      if (response.status === 304) {
        return null; // Data hasn't changed
      }

      if (response.ok) {
        const newEtag = response.headers.get("ETag");
        const data = await response.json();
        if (newEtag !== etag) {
          setEtag(newEtag);
          setNotifications(data.notifications);
          setUnreadCount(
            data.notifications.filter((n: Notification) => !n.is_read).length
          );
        }
      }
    }
  }, [etag, isOnline]);

  useEffect(() => {
    if (isOnline) {
      void fetchNotificationsCallback();
      const interval = setInterval(
        () => void fetchNotificationsCallback(),
        15000
      );
      return () => clearInterval(interval);
    }
  }, [fetchNotificationsCallback, isOnline]);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open);
      if (!open && unreadCount > 0) {
        const unreadIds = notifications
          .filter((n) => !n.is_read)
          .map((n) => n.id);

        await markNotificationsAsRead(userId, unreadIds);
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    },
    [userId, notifications, unreadCount]
  );

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
    [unreadCount, handleOpenChange]
  );

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
    [selectedType, selectedFilter, searchTerm, notifications, isDesktop]
  );

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
    );
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
  );
}
