"use client";

import {
  Bell,
  MessageSquare,
  UserPlus,
  Car,
  CheckCircle,
  Search,
  X,
  Filter,
  CheckCheck,
  Info,
  ShieldAlert,
  ArrowRight,
  AlertCircle,
  Settings,
  Loader,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DrawerClose,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PushSubscription } from "@/types";
import { markNotificationsAsRead } from "@/utils/api";
import { formatLastUsed, getDeviceId } from "@/utils/deviceUtils";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

import { Switch } from "./ui/switch";

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  is_read: boolean;
  related_id?: string | null;
  link?: string | null;
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
  admin_notification: "Admin Notifications",
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case "newNote":
      return "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-800/40";
    case "contactRequest":
      return "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/40";
    case "contactAccepted":
      return "bg-green-50/60 dark:bg-green-950/20 border-green-200/70 dark:border-green-800/40";
    case "newRide":
      return "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40";
    case "rideAccepted":
      return "bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-800/40";
    case "rideCancelled":
      return "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/70 dark:border-rose-800/40";
    case "rideCompleted":
      return "bg-purple-50/60 dark:bg-purple-950/20 border-purple-200/70 dark:border-purple-800/40";
    case "admin_notification":
      return "bg-red-50/60 dark:bg-red-950/20 border-red-200/70 dark:border-red-800/40";
    default:
      return "bg-zinc-50/60 dark:bg-zinc-900/20 border-zinc-200/70 dark:border-zinc-800/40";
  }
};

// The notification icon function remains mostly the same
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "newNote":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "contactRequest":
      return <UserPlus className="h-5 w-5 text-emerald-500" />;
    case "contactAccepted":
      return <CheckCheck className="h-5 w-5 text-green-500" />;
    case "newRide":
      return <Car className="h-5 w-5 text-amber-500" />;
    case "rideAccepted":
      return <CheckCircle className="h-5 w-5 text-indigo-500" />;
    case "rideCancelled":
      return <X className="h-5 w-5 text-rose-500" />;
    case "rideCompleted":
      return <CheckCheck className="h-5 w-5 text-purple-500" />;
    case "admin_notification":
      return <ShieldAlert className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-zinc-500" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }
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
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const renderFilters = () => (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="notification-type" className="text-sm font-medium">
          Notification Type
        </label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full">
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
      </div>

      <div className="space-y-1.5">
        <span className="text-sm font-medium">Status</span>
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search notifications..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 rounded-full"
        />
        {isDesktop ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
              >
                <Filter className="h-4 w-4" />
                {selectedType !== "all" || selectedFilter !== "all" ? (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                ) : null}
                <span className="sr-only">Toggle filters</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 p-3" align="end">
              {renderFilters()}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
              >
                <Filter className="h-4 w-4" />
                {selectedType !== "all" || selectedFilter !== "all" ? (
                  <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                ) : null}
                <span className="sr-only">Toggle filters</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
                <DrawerDescription>Customize your notification list</DrawerDescription>
              </DrawerHeader>
              <div className="p-4">{renderFilters()}</div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        )}
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
  onClose,
  userId,
  setNotifications, // Add this to update parent state
  setUnreadCount, // Add this to update parent state
}: {
  notifications: Notification[];
  selectedType: string;
  selectedFilter: string;
  searchTerm: string;
  isDesktop: boolean;
  onClose: () => void;
  userId: string;
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const router = useRouter();

  const handleNotificationClick = async (notification: Notification) => {
    // Determine the destination based on notification type and related_id
    let destination = notification.link || null;

    if (!destination && notification.related_id) {
      switch (notification.type) {
        case "newNote":
        case "rideAccepted":
        case "rideCancelled":
        case "rideCompleted":
          destination = `/rides/${notification.related_id}`;
          break;
        case "contactRequest":
        case "contactAccepted":
          destination = `/profile?tab=contacts`;
          break;
        case "newRide":
          destination = `/dashboard?tab=available`;
          break;
        // Admin notifications and others might not have a specific destination
        default:
          break;
      }
    }

    // Always close the panel if we're already on the destination page
    const isCurrentPage = destination && window.location.pathname === destination.split("?")[0];

    if (isCurrentPage) {
      // If we're already on this page, just close the panel
      onClose();
      return;
    }

    // Mark notification as read before navigating
    if (!notification.is_read) {
      try {
        // Call the API to mark this notification as read
        await markNotificationsAsRead(userId, [notification.id]);

        // Update local state for immediate UI feedback
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );

        // Decrement unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
        // Continue with navigation even if marking as read fails
      }
    }

    onClose();
    if (destination) {
      router.push(destination);
    }
  };

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
      className={`${isDesktop ? "h-[calc(100vh-10rem)]" : "h-[70svh]"} w-full my-4 border rounded-lg`}
    >
      <div className="p-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted/30 p-6 rounded-full mb-4">
              <Bell className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No notifications found</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Try adjusting your filters or search term to find what you&apos;re looking for
            </p>
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {filteredNotifications.map((notification: Notification) => {
              // Determine action button label based on notification type
              const getActionLabel = () => {
                switch (notification.type) {
                  case "newNote":
                    return "View Message";
                  case "contactRequest":
                    return "Respond";
                  case "contactAccepted":
                    return "View Contact";
                  case "newRide":
                    return "View Ride";
                  case "rideAccepted":
                    return "See Details";
                  case "rideCancelled":
                    return "View Status";
                  case "rideCompleted":
                    return "View Summary";
                  case "admin_notification":
                    return "Read More";
                  default:
                    return "View";
                }
              };

              // Generate button color based on notification type
              const getButtonStyle = (type: string) => {
                switch (type) {
                  case "newNote":
                    return "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-300 dark:border-blue-800/30";
                  case "contactRequest":
                    return "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800/30";
                  case "contactAccepted":
                    return "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:hover:bg-green-900/60 dark:text-green-300 dark:border-green-800/30";
                  case "newRide":
                    return "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 dark:text-amber-300 dark:border-amber-800/30";
                  case "rideAccepted":
                    return "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800/30";
                  case "rideCancelled":
                    return "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 dark:text-rose-300 dark:border-rose-800/30";
                  case "rideCompleted":
                    return "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:hover:bg-purple-900/60 dark:text-purple-300 dark:border-purple-800/30";
                  case "admin_notification":
                    return "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 dark:border-red-800/30";
                  default:
                    return "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/60 dark:text-zinc-300 dark:border-zinc-700/30";
                }
              };

              return (
                <div
                  key={notification.id}
                  className={`rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    notification.is_read ? "opacity-70" : ""
                  } ${getNotificationColor(notification.type)}`}
                >
                  {/* Main content section */}
                  <div className="p-2 sm:p-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="mt-0.5 flex-shrink-0 bg-white/80 dark:bg-black/20 backdrop-blur-sm rounded-full p-2 shadow-sm border">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 sm:gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate flex items-center gap-2">
                            {notificationTypes[notification.type as keyof typeof notificationTypes]}
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            )}
                          </h4>
                          <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                            {formatDate(notification.created_at)}
                          </time>
                        </div>
                        <p className="text-sm leading-relaxed break-words">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action section with custom-styled button */}
                  {(notification.related_id || notification.link) && (
                    <div className="border-t border-t-black/5 dark:border-t-white/5 px-2 py-1.5 flex justify-end bg-black/[0.02] dark:bg-white/[0.02]">
                      <button
                        onClick={() => handleNotificationClick(notification)}
                        className={`text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-md border transition-all ${getButtonStyle(
                          notification.type
                        )} flex items-center justify-center gap-1 sm:gap-1.5 font-medium`}
                      >
                        {getActionLabel()}
                        <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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
  const isOnline = useOnlineStatus();
  const isDesktop = useMediaQuery("(min-width: 768px)");

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
        body: JSON.stringify({ deviceId }),
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
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
        <div>
          <h3 className="font-medium text-destructive mb-1">Notifications Blocked</h3>
          <p className="text-sm mb-3">
            {permissionState === "denied"
              ? "Push notifications are blocked in your browser settings for this site."
              : "You previously declined push notifications for this site."}{" "}
            To receive ride updates and important notifications, please allow them in your browser.
          </p>
          <Button size="sm" onClick={handleRequestPermission} variant="outline" className="w-full">
            Request Permission Again
          </Button>
          <div className="text-xs text-muted-foreground mt-3">
            <p className="mb-1">
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
      </div>
    </div>
  );

  const SettingsContent = (
    <div className="space-y-6 py-2">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Device Notifications</h3>
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
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <Loader className="animate-spin h-8 w-8 text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading devices...</p>
            </div>
          </div>
        ) : devices.length === 0 && !shouldShowPermissionBanner ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg">
            <div className="bg-background p-4 rounded-full border mb-4">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium mb-1">No devices registered</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Connect a new device to receive push notifications about your rides and contacts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => (
              <div
                key={device.device_id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                  device.device_id === currentDeviceId ? "border-primary" : ""
                } ${!device.enabled ? "opacity-70 bg-muted/30" : "bg-card"}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${device.enabled ? "bg-primary/10" : "bg-muted"}`}
                  >
                    <Smartphone
                      className={`h-5 w-5 ${device.enabled ? "text-primary" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        {device.device_name}
                        {device.device_id === currentDeviceId && (
                          <Badge variant="outline" className="text-xs">
                            Current Device
                          </Badge>
                        )}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Last used: {formatLastUsed(device.last_used)}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={device.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleDevice(device.device_id, checked)
                          }
                          disabled={!isOnline}
                        />
                        <span className="text-sm">{device.enabled ? "Enabled" : "Disabled"}</span>
                      </div>
                      {!(device.device_id === currentDeviceId) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDevice(device.device_id)}
                          disabled={!isOnline}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
          <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl">Notification Preferences</DialogTitle>
              <DialogDescription>
                Customize how and where you receive notifications across your devices
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">{SettingsContent}</ScrollArea>
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
          <div className="px-4 max-h-[60vh] overflow-auto">{SettingsContent}</div>
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

export function NotificationPanel({ userId }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const isOnline = useOnlineStatus();
  const cachedNotificationsRef = useRef<Notification[]>([]);
  const etagRef = useRef<string | null>(null);

  const fetchNotificationsCallback = useCallback(async () => {
    if (!isOnline) {
      return;
    }

    try {
      const headers: HeadersInit = {
        "Cache-Control": "max-age=0",
      };

      // Add If-None-Match header if we have a stored ETag
      if (etagRef.current) {
        headers["If-None-Match"] = etagRef.current;
      }

      const response = await fetch("/api/notifications", {
        cache: "no-cache",
        headers,
      });

      // If we get a 304 Not Modified, use our cached data
      if (response.status === 304) {
        return;
      }

      // Store the new ETag if available
      const newETag = response.headers.get("etag");
      if (newETag) {
        etagRef.current = newETag;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();

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

      // Update our cache and state
      cachedNotificationsRef.current = data.notifications;
      setNotifications(data.notifications);

      // Update unread count
      const unreadFilteredCount = data.notifications.filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unreadFilteredCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch notifications");
    }
  }, [isOnline]);

  const handleClosePanel = useCallback(() => {
    setIsOpen(false);
  }, []);
  // Set up polling for notifications
  useEffect(() => {
    if (isOnline) {
      // Initial fetch
      void fetchNotificationsCallback();

      // Set up polling every 30 seconds
      const intervalId = setInterval(() => {
        void fetchNotificationsCallback();
      }, 30000);

      return () => clearInterval(intervalId);
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
        variant="outline"
        size="icon"
        className="relative rounded-full"
        onClick={() => handleOpenChange(true)}
        data-tutorial="notifications"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
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
          onClose={handleClosePanel}
          userId={userId}
          setNotifications={setNotifications}
          setUnreadCount={setUnreadCount}
        />
      </>
    ),
    [selectedType, selectedFilter, searchTerm, notifications, isDesktop, handleClosePanel, userId]
  );

  if (isDesktop) {
    return (
      <>
        {NotificationButton}
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader className="flex flex-row items-center justify-between pr-2 mb-2">
              <div>
                <SheetTitle className="text-xl">Notifications</SheetTitle>
                <SheetDescription>Stay updated with your rides and contacts</SheetDescription>
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
            <DrawerHeader className="flex flex-row items-center justify-between pr-4 mb-2">
              <div>
                <DrawerTitle className="text-xl">Notifications</DrawerTitle>
                <DrawerDescription>Stay updated with your rides and contacts</DrawerDescription>
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
