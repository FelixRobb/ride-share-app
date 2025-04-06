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
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { PushSubscription } from "@/types";
import { markNotificationsAsRead } from "@/utils/api";
import { getDeviceId, formatLastUsed } from "@/utils/deviceUtils";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

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
    // Safety check - if notifications is not an array, initialize as empty array
    const notificationsArray = Array.isArray(notifications) ? notifications : [];

    if (!searchTerm) {
      // If no search term, just apply other filters
      const filtered = notificationsArray
        .filter((notification) => {
          const matchesType = selectedType === "all" || notification.type === selectedType;
          const matchesFilter =
            selectedFilter === "all" ||
            (selectedFilter === "unread" && !notification.is_read) ||
            (selectedFilter === "read" && notification.is_read);
          return matchesType && matchesFilter;
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return filtered;
    }

    // For search with term, calculate relevance score for each notification
    const searchResults = notificationsArray
      .map((notification) => {
        let score = 0;
        const searchTermLower = searchTerm.toLowerCase();
        const message = notification.message.toLowerCase();
        const notificationType =
          notificationTypes[notification.type as keyof typeof notificationTypes]?.toLowerCase() ||
          "";

        // Exact matches get highest priority
        if (message === searchTermLower) score += 100;
        if (notificationType === searchTermLower) score += 100;

        // Beginning of text/phrase matches get very high priority
        if (message.startsWith(searchTermLower)) score += 90;
        if (notificationType.startsWith(searchTermLower)) score += 90;

        // Beginning of word matches get high priority
        const messageWords = message.split(/\s+|,|\.|!|\?/);
        const typeWords = notificationType.split(/\s+|,|\.|!|\?/);

        if (messageWords.some((word) => word.startsWith(searchTermLower))) score += 75;
        if (typeWords.some((word) => word.startsWith(searchTermLower))) score += 75;

        // Contains matches get medium priority
        if (message.includes(searchTermLower)) score += 50;
        if (notificationType.includes(searchTermLower)) score += 50;

        // Check for word boundaries to prioritize whole word matches
        const wordBoundaryCheck = (text: string) => {
          const words = text.split(/\s+|,|\.|!|\?/);
          return words.some((word) => word === searchTermLower) ? 25 : 0;
        };

        score += wordBoundaryCheck(message);
        score += wordBoundaryCheck(notificationType);

        // If this is a multi-word search term, check for matches of individual words
        if (searchTermLower.includes(" ")) {
          const searchWords = searchTermLower.split(" ");
          searchWords.forEach((word) => {
            if (word.length > 2) {
              // Only consider meaningful words (longer than 2 chars)
              if (message.includes(word)) score += 10;
              if (notificationType.includes(word)) score += 10;

              // Give extra points if the word is at the beginning of the message
              if (message.startsWith(word)) score += 15;
              if (notificationType.startsWith(word)) score += 15;
            }
          });
        }

        // Check for date matches if the search term looks like a date
        const dateInNotification = formatDate(notification.created_at).toLowerCase();
        if (dateInNotification.includes(searchTermLower)) {
          score += 40;
        }

        // Apply other filters
        const matchesType = selectedType === "all" || notification.type === selectedType;
        const matchesFilter =
          selectedFilter === "all" ||
          (selectedFilter === "unread" && !notification.is_read) ||
          (selectedFilter === "read" && notification.is_read);

        return {
          notification,
          score,
          matchesFilters: matchesType && matchesFilter,
        };
      })
      .filter((item) => item.score > 0 && item.matchesFilters) // Only keep matches that pass all filters
      .sort((a, b) => b.score - a.score) // Sort by descending score
      .map((item) => item.notification); // Extract just the notification objects

    return searchResults;
  }, [notifications, selectedType, selectedFilter, searchTerm]);

  return (
    <ScrollArea
      className={`${isDesktop ? "h-[calc(100vh-13rem)]" : "h-[66svh]"} w-full p-2 pr-4 my-4 border rounded-lg`}
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
  const [devices, setDevices] = useState<PushSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentDeviceId] = useState(() => getDeviceId());
  const [permissionState, setPermissionState] = useState<NotificationPermission | null>(null);
  const [hasDeclinedInApp, setHasDeclinedInApp] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOnline = useOnlineStatus();

  // Check notification permission and declined state on mount and when settings are opened
  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setPermissionState(Notification.permission);
      }

      // Check if user has previously declined in the app
      const hasDeclined = localStorage.getItem("pushNotificationDeclined");
      setHasDeclinedInApp(hasDeclined === "true");
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    let mounted = true;

    const fetchDevices = async () => {
      if (!isOnline || !isSettingsOpen) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/push-devices`);
        if (response.ok && mounted) {
          const data = await response.json();

          // If permission is denied OR the user has declined in app with default permission,
          // filter out the current device
          const shouldFilter =
            permissionState === "denied" || (permissionState === "default" && hasDeclinedInApp);

          if (shouldFilter) {
            setDevices(
              data.devices.filter(
                (device: PushSubscription) => device.device_id !== currentDeviceId
              )
            );
          } else {
            setDevices(data.devices);
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDevices();

    return () => {
      mounted = false;
    };
  }, [userId, isOnline, isSettingsOpen, permissionState, currentDeviceId, hasDeclinedInApp]);

  const handleToggleDevice = async (deviceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/push-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, deviceId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update device preference");
      }

      const data = await response.json();
      if (data.success) {
        setDevices((prev) =>
          prev.map((device) => (device.device_id === deviceId ? { ...device, enabled } : device))
        );
        toast.success(
          enabled
            ? "Notifications enabled for this device"
            : "Notifications disabled for this device"
        );
      } else {
        throw new Error("Failed to update device preference");
      }
    } catch {
      toast.error("Failed to update notification preference. Please try again.");
      setDevices((prev) => [...prev]);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/push-subscription`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, deviceId }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove device");
      }

      setDevices((prev) => prev.filter((device) => device.device_id !== deviceId));
      toast.success("Device removed successfully");
    } catch {
      toast.error("Failed to remove device");
    }
  };

  const handleRequestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(permission);

      if (permission === "granted") {
        // Clear the declined flag when permission is granted
        localStorage.removeItem("pushNotificationDeclined");
        setHasDeclinedInApp(false);

        // Refresh the page to trigger the PushNotificationHandler to register
        window.location.reload();
      } else if (permission === "denied") {
        toast.error("Permission denied for push notifications");
      } else {
        // If still in default state after request (user dismissed the browser dialog)
        // we'll treat this as a declined state for our app
        localStorage.setItem("pushNotificationDeclined", "true");
        setHasDeclinedInApp(true);
        toast.error("Notification permission prompt was dismissed");
      }
    } catch {
      toast.error("Failed to request notification permission");
    }
  };

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
  );

  // Determine if we should show the permission banner
  const shouldShowPermissionBanner =
    permissionState === "denied" || (permissionState === "default" && hasDeclinedInApp);

  const PermissionDeniedBanner = (
    <Card className="border-destructive/50 bg-destructive/5 hover:shadow-none mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-destructive" />
            <CardTitle className="text-sm font-semibold">Notifications Blocked</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <p className="text-sm mb-3">
          {permissionState === "denied"
            ? "Push notifications are blocked in your browser settings for this site."
            : "You previously declined push notifications for this site."}{" "}
          To receive ride updates and important notifications, please allow them in your browser.
        </p>
        <div className="flex flex-col space-y-2">
          <Button size="sm" onClick={handleRequestPermission} className="w-full">
            Request Permission Again
          </Button>
          <div className="text-xs text-muted-foreground mt-1">
            <p className="text-center mb-2">
              If the button doesn&apos;t work, you may need to update permissions in your browser
              settings:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Chrome:</strong> Click the lock/info icon in the address bar → Site settings
                → Notifications
              </li>
              <li>
                <strong>Safari:</strong> Preferences → Websites → Notifications → Find this website
              </li>
              <li>
                <strong>Firefox:</strong> Click the lock icon in the address bar → Connection secure
                → More information → Permissions
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SettingsContent = (
    <div className="space-y-6 py-5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Device Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Manage push notifications across your devices
            </p>
          </div>
          {!isOnline && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Smartphone className="h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>

        {shouldShowPermissionBanner && PermissionDeniedBanner}

        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : devices.length === 0 && !shouldShowPermissionBanner ? (
          <div className="text-center py-6 border rounded-lg bg-accent/50">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No devices registered for notifications</p>
            <p className="text-xs text-muted-foreground mt-2">
              Connect a new device to receive push notifications
            </p>
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
                      <Smartphone
                        className={`h-5 w-5 ${device.enabled ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <div>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          {device.device_name}
                          {device.device_id === currentDeviceId && (
                            <Badge variant="outline" className="text-xs text-nowrap truncate">
                              Current Device
                            </Badge>
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
                    <span
                      className={`text-sm ${device.enabled ? "text-foreground" : "text-muted-foreground"}`}
                    >
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
  );

  if (isDesktop) {
    return (
      <>
        {SettingsButton}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[90svh]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Notification Preferences</DialogTitle>
              <DialogDescription>
                Customize how and where you receive notifications across your devices
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] px-4">{SettingsContent}</ScrollArea>
            <DialogFooter>
              <Button onClick={() => setIsSettingsOpen(false)} variant="outline">
                Close
              </Button>
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
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle className="text-xl">Notification Preferences</DrawerTitle>
            <DrawerDescription>Customize how and where you receive notifications</DrawerDescription>
          </DrawerHeader>
          <div className="px-4 max-h-[60svh] overflow-auto">{SettingsContent}</div>
          <DrawerFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)} className="w-full">
              Close
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Utility function to safely fetch data with error handling
const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const response = await fetch(url, options);

    // For 304 Not Modified, return a special result
    if (response.status === 304) {
      return { notModified: true, data: null, response };
    }

    // For non-ok responses, structure a consistent error
    if (!response.ok) {
      return {
        error: true,
        status: response.status,
        statusText: response.statusText,
        data: null,
        response,
      };
    }

    // Get text and parse as JSON
    try {
      const text = await response.text();
      const data = JSON.parse(text);
      return { data, response };
    } catch {
      return {
        error: true,
        parseError: true,
        data: null,
        response,
      };
    }
  } catch {
    // Network error or other fetch failure
    return { error: true, networkError: true, data: null };
  }
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
    if (!isOnline) {
      return;
    }

    const headers: HeadersInit = {};
    if (etag) {
      headers["If-None-Match"] = etag;
    }

    // Use our safe fetch utility
    const result = await safeFetch("/api/notifications", { headers });

    // Handle 304 Not Modified
    if (result.notModified) {
      return;
    }

    // Handle errors
    if (result.error) {
      if (result.parseError) {
        toast.error("Error parsing notification data");
      } else if (result.networkError) {
        toast.error("Network error, please try again");
      } else {
        toast.error("Failed to fetch notifications");
      }
      return;
    }

    // We have data at this point
    const { data, response } = result;

    // Check if response exists
    if (!response) {
      toast.error("Error processing notification data");
      return;
    }

    const newEtag = response.headers.get("ETag");

    // Validate notification data structure
    if (!data || !data.notifications) {
      toast.error("Invalid API response");
      return;
    }

    if (!Array.isArray(data.notifications)) {
      toast.error("Invalid notifications data structure");
      return;
    }

    // Check if we have valid notification objects
    let validStructure = true;
    let _firstInvalidIdx = -1;

    // Verify the first few notifications have the right shape
    for (let i = 0; i < Math.min(data.notifications.length, 3); i++) {
      const n = data.notifications[i];
      if (
        !n ||
        typeof n !== "object" ||
        !("id" in n) ||
        !("type" in n) ||
        !("message" in n) ||
        !("created_at" in n) ||
        !("is_read" in n)
      ) {
        validStructure = false;
        _firstInvalidIdx = i;
        break;
      }
    }

    if (!validStructure) {
      toast.error("Invalid notification data format");
      return;
    }

    // Update state if both are null (initial load) or they don't match
    if (newEtag !== etag || (newEtag === null && etag === null)) {
      const unreadFilteredCount = data.notifications.filter((n: Notification) => !n.is_read).length;

      setEtag(newEtag);
      setNotifications(data.notifications);
      setUnreadCount(unreadFilteredCount);
    }
  }, [etag, isOnline]);

  useEffect(() => {
    if (isOnline) {
      void fetchNotificationsCallback();
      const interval = setInterval(() => void fetchNotificationsCallback(), 15000);
      return () => clearInterval(interval);
    }
  }, [fetchNotificationsCallback, isOnline]);

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open);
      if (!open && unreadCount > 0) {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

        try {
          await markNotificationsAsRead(userId, unreadIds);
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setUnreadCount(0);
        } catch {
          toast.error("Failed to mark notifications as read");
        }
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
        <DrawerContent>
          <div className="h-[90svh]">
            <DrawerHeader className="flex flex-row items-center justify-between pr-4">
              <div>
                <DrawerTitle>Notifications</DrawerTitle>
                <DrawerDescription>Your recent notifications</DrawerDescription>
              </div>
              <NotificationSettings userId={userId} />
            </DrawerHeader>
            <div className="px-4">{NotificationContent}</div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
