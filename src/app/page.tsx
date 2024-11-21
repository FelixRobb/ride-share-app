"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bell, LogOut, Home, Car, Users, Menu, Clock, User, Moon, Sun, Search, Mail, Phone, MapPin, MessageSquare, Send, AlertCircle, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types
type User = {
  id: string; // Changed from number to string
  name: string;
  phone: string;
  email: string;
};

type Ride = {
  id: string;
  from_location: string;
  to_location: string;
  time: string;
  requester_id: string;
  accepter_id: string | null;
  status: "pending" | "accepted" | "cancelled";
  rider_name: string;
  rider_phone: string | null;
  note: string | null;
};


type Contact = {
  id: string;
  user_id: string;
  contact_id: string;
  status: "pending" | "accepted";
  created_at: string;
  user: {
    name: string;
    phone: string;
  };
  contact: {
    name: string;
    phone: string;
  };
};

type Notification = {
  id: string;
  user_id: string;
  message: string;
  type: "rideRequest" | "rideAccepted" | "contactRequest";
  is_read: boolean;
  created_at: string;
};

type RideData = {
  from_location: string;
  to_location: string;
  time: string;
  rider_name: string;
  rider_phone: string | null;
  note: string | null;
};

type AssociatedPerson = {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
};

type UserStats = {
  rides_offered: number;
  rides_accepted: number;
};

type Note = {
  id: string;
  ride_id: string;
  user_id: string;
  note: string;
  created_at: string;
  user_name: string;
};

export default function RideShareApp() {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeTab, setActiveTab] = useState("available");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [etag, setEtag] = useState<string | null>(null);

  const { toast } = useToast();

  const dataRef = useRef({
    rides: [],
    contacts: [],
    notifications: [] as Notification[], // Define the type of notifications
    associatedPeople: [],
    userStats: null,
  });

  const displayedNotificationIds = useRef<Set<string>>(new Set());

  const fetchUserData = useCallback(
    async (userId: string) => {
      try {
        const headers: HeadersInit = {};
        if (etag) {
          headers["If-None-Match"] = etag;
        }

        const response = await fetch(`/api/user-data?userId=${userId}`, { headers });

        if (response.status === 304) {
          // Data hasn't changed
          return;
        }

        if (response.ok) {
          const newEtag = response.headers.get("ETag");
          if (newEtag) {
            setEtag(newEtag);
          }

          const data = await response.json();

          let hasChanges = false;

          if (JSON.stringify(data.rides) !== JSON.stringify(dataRef.current.rides)) {
            setRides(data.rides);
            dataRef.current.rides = data.rides;
            hasChanges = true;
          }

          if (JSON.stringify(data.contacts) !== JSON.stringify(dataRef.current.contacts)) {
            setContacts(data.contacts);
            dataRef.current.contacts = data.contacts;
            hasChanges = true;
          }

          const newNotifications = data.notifications.filter((newNotif: Notification) => !dataRef.current.notifications.some((oldNotif) => oldNotif.id === newNotif.id));

          if (newNotifications.length > 0) {
            setNotifications((prev) => [...prev, ...newNotifications]);
            dataRef.current.notifications = [...dataRef.current.notifications, ...newNotifications];
            
            // Show toast only for new, unread notifications that haven't been displayed before
            newNotifications.forEach((notification: Notification) => {
              if (!notification.is_read && !displayedNotificationIds.current.has(notification.id)) {
                toast({
                  title: "New Notification",
                  description: notification.message,
                });
                displayedNotificationIds.current.add(notification.id);
              }
            });
            
            hasChanges = true;
          }

          if (JSON.stringify(data.associatedPeople) !== JSON.stringify(dataRef.current.associatedPeople)) {
            setAssociatedPeople(data.associatedPeople);
            dataRef.current.associatedPeople = data.associatedPeople;
            hasChanges = true;
          }

          if (JSON.stringify(data.stats) !== JSON.stringify(dataRef.current.userStats)) {
            setUserStats(data.stats);
            dataRef.current.userStats = data.stats;
            hasChanges = true;
          }

          if (hasChanges) {
            console.log("Data updated");
          } else {
            console.log("No changes in data. All good!");
          }
        } else {
          console.error("Failed to fetch user data");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    },
    [etag, toast]
  );

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (user) {
      const parsedUser = JSON.parse(user) as User;
      setCurrentUser(parsedUser);
      setCurrentPage("dashboard");
      void fetchUserData(parsedUser.id);
    }
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
    setIsLoading(false);
  }, [fetchUserData]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (currentUser) {
      intervalId = setInterval(() => {
        void fetchUserData(currentUser.id);
      }, 10000); // Fetch every 10 seconds
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentUser, fetchUserData]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const login = async (phoneOrEmail: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneOrEmail, password }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setCurrentPage("dashboard");
        void fetchUserData(data.user.id);
        toast({
          title: "Success",
          description: "Logged in successfully!",
        });
      } else {
        throw new Error(data.error || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (name: string, phone: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, password }),
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setCurrentPage("dashboard");
        void fetchUserData(data.user.id);
        toast({
          title: "Success",
          description: "Registered successfully!",
        });
      } else {
        throw new Error(data.error || "Failed to register. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setCurrentPage("welcome");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully.",
    });
  };

  const createRide = async (rideData: RideData) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...rideData, requester_id: currentUser.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setRides((prevRides) => [...prevRides, data.ride]);
        toast({
          title: "Ride Created",
          description: "Your ride request has been created successfully.",
        });
        setCurrentPage("dashboard");
        setActiveTab("my-rides");
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create ride. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating ride:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? { ...ride, status: "accepted", accepter_id: currentUser.id } : ride)));
        toast({
          title: "Ride Accepted",
          description: "You have successfully accepted the ride.",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to accept ride. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelRequest = async (rideId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/cancelrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? { ...ride, status: "cancelled" } : ride)));
        toast({
          title: "Request Cancelled",
          description: "Your ride request has been cancelled successfully.",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to cancel request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelOffer = async (rideId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/canceloffer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        const data = await response.json();
        setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? { ...ride, status: "pending", accepter_id: null } : ride)));
        toast({
          title: "Offer Cancelled",
          description: "Your ride offer has been cancelled successfully.",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to cancel offer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addNote = async (rideId: string, note: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id, note }),
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Note Added",
          description: "Your note has been added successfully.",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
        return data.note;
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to add note. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchNotes = async (rideId: string) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/notes`);
      if (response.ok) {
        const data = await response.json();
        return data.notes;
      } else {
        throw new Error("Failed to fetch notes");
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addContact = async (phone: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, contactPhone: phone }),
      });
      const data = await response.json();
      if (response.ok && data.contact) {
        const newContact = {
          ...data.contact,
          contact: {
            name: data.contact.contact_name || "Pending",
            phone: data.contact.contact_phone || phone,
          },
          user: {
            name: currentUser.name,
            phone: currentUser.phone,
          },
        };
        setContacts((prevContacts) => [...prevContacts, newContact]);
        toast({
          title: "Success",
          description: "Contact request sent successfully!",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add contact. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Add contact error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const acceptContact = async (contactId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/contacts/${contactId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      const data = await response.json();
      if (response.ok && data.contact) {
        setContacts((prevContacts) => prevContacts.map((contact) => (contact.id === contactId ? { ...contact, status: "accepted" } : contact)));
        toast({
          title: "Success",
          description: "Contact accepted successfully!",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to accept contact. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Accept contact error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        setContacts((prevContacts) => prevContacts.filter((contact) => contact.id !== contactId));
        toast({
          title: "Success",
          description: "Contact deleted successfully!",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete contact. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete contact error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateProfile = async (updatedUser: User) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/users/${currentUser.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully!",
        });
        setIsChangePasswordOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const addAssociatedPerson = async (name: string, relationship: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/associated-people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, name, relationship }),
      });
      const data = await response.json();
      if (response.ok && data.associatedPerson) {
        setAssociatedPeople((prevPeople) => [...prevPeople, data.associatedPerson]);
        toast({
          title: "Success",
          description: "Associated person added successfully!",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add associated person. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Add associated person error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteAssociatedPerson = async (personId: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/associated-people?id=${personId}&userId=${currentUser.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setAssociatedPeople((prevPeople) => prevPeople.filter((person) => person.id !== personId));
        toast({
          title: "Success",
          description: "Associated person deleted successfully!",
        });
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete associated person. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete associated person error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        logout();
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markNotificationsAsRead = async (notificationIds: string[]) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id, notificationIds }),
      });

      if (response.ok) {
        setNotifications((prevNotifications) => prevNotifications.map((notification) => (notificationIds.includes(notification.id) ? { ...notification, is_read: true } : notification)));
        void fetchUserData(currentUser.id); // Fetch updated data
      } else {
        console.error("Failed to mark notifications as read");
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleOpenNotificationDialog = useCallback(() => {
    setIsNotificationDialogOpen(true);
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length > 0) {
      void markNotificationsAsRead(unreadNotifications.map((n) => n.id));
    }
  }, [notifications, markNotificationsAsRead]);

  // Components
  const WelcomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-white px-4">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center text-slate-950">Welcome to RideShare</h1>
      <p className="text-lg md:text-xl mb-8 text-center max-w-md text-slate-900">Connect with friends, share rides, and travel together safely.</p>
      <div className="space-y-4 w-full max-w-xs text-slate-950">
        <Button onClick={() => setCurrentPage("login")} variant="secondary" size="lg" className="w-full">
          Login
        </Button>
        <Button onClick={() => setCurrentPage("register")} variant="secondary" size="lg" className="w-full">
          Register
        </Button>
      </div>
    </div>
  );

  const LoginPage = () => {
    const [error, setError] = useState<string | null>(null);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    const handleResetPassword = async () => {
      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: resetEmail }),
        });
        if (response.ok) {
          toast({
            title: "Success",
            description: "Password reset email sent. Please check your inbox.",
          });
          setIsResetPasswordOpen(false);
        } else {
          const data = await response.json();
          throw new Error(data.error || "Failed to send reset email");
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    };

    return (
      <Card className="w-full max-w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your phone number or email and password to login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const phoneOrEmail = (e.currentTarget.elements.namedItem("phoneOrEmail") as HTMLInputElement).value;
              const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
              try {
                await login(phoneOrEmail, password);
                setError(null);
              } catch (error) {
                setError("Invalid phone number/email or password. Please try again.");
              }
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phoneOrEmail">Phone or Email</Label>
                <Input id="phoneOrEmail" placeholder="Enter your phone number or email" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" required />
              </div>
            </div>
            {error && <p className="text-destructive mt-2">{error}</p>}
            <Button className="w-full mt-4" type="submit">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="link" onClick={() => setCurrentPage("register")}>
            Don&apos;t have an account? Register
          </Button>
          <Button variant="link" onClick={() => setIsResetPasswordOpen(true)}>
            Forgot your password?
          </Button>
        </CardFooter>

        <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>Enter your email to receive a password reset link.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reset-email" className="text-right">
                  Email
                </Label>
                <Input id="reset-email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleResetPassword}>Send Reset Link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  };

  const RegisterPage = () => {
    const [error, setError] = useState<string | null>(null);

    return (
      <Card className="w-full max-w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account to start sharing rides.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const name = (e.currentTarget.elements.namedItem("name") as HTMLInputElement).value;
              const phone = (e.currentTarget.elements.namedItem("phone") as HTMLInputElement).value;
              const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
              const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
              const confirmPassword = (e.currentTarget.elements.namedItem("confirmPassword") as HTMLInputElement).value;

              if (password !== confirmPassword) {
                setError("Passwords do not match. Please try again.");
                return;
              }

              try {
                await register(name, phone, email, password);
                setError(null);
              } catch (error) {
                if (error instanceof Error && error.message.includes("User already exists")) {
                  setError("This phone number or email is already registered. Please use a different one or login.");
                } else {
                  setError("Registration failed. Please try again.");
                }
              }
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Enter your name" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Enter your phone number" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm your password" required />
              </div>
            </div>
            {error && <p className="text-destructive mt-2">{error}</p>}
            <Button className="w-full mt-4" type="submit">
              Register
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="link" onClick={() => setCurrentPage("login")}>
            Already have an account? Login
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const filteredRides = useCallback(
    (rides: Ride[]) => {
      if (!searchTerm.trim()) return rides;
      return rides.filter((ride) => ride.from_location.toLowerCase().includes(searchTerm.toLowerCase()) || ride.to_location.toLowerCase().includes(searchTerm.toLowerCase()));
    },
    [searchTerm]
  );

  const DashboardPage = () => {
    const safeRides = rides || [];
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        setSearchTerm(localSearchTerm);
      }, 300);
  
      return () => clearTimeout(timer);
    }, [localSearchTerm]);
  
    const availableRides = filteredRides(
      safeRides.filter((ride) => {
        const isPendingAndNotOwn = ride.status === "pending" && ride.requester_id !== currentUser?.id;
        const isConnectedUser = contacts.some((contact) => 
          (contact.user_id === ride.requester_id || contact.contact_id === ride.requester_id) && contact.status === "accepted"
        );
        return isPendingAndNotOwn && isConnectedUser;
      })
    );
  
    const myRides = filteredRides(safeRides.filter((ride) => ride.requester_id === currentUser?.id));
    const offeredRides = filteredRides(safeRides.filter((ride) => ride.accepter_id === currentUser?.id && ride.status === "accepted"));

    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Dashboard</CardTitle>
            <CardDescription>Manage your rides and connections</CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              <Input id="search" type="text" placeholder="Search rides..." value={localSearchTerm} onChange={(e) => setLocalSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available" className="text-xs md:text-sm">
                  Available Rides
                </TabsTrigger>
                <TabsTrigger value="my-rides" className="text-xs md:text-sm">
                  My Rides
                </TabsTrigger>
                <TabsTrigger value="offered-rides" className="text-xs md:text-sm">
                  Offered Rides
                </TabsTrigger>
              </TabsList>
              <TabsContent value="available">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {isLoading
                    ? Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <Card key={i} className="mb-4">
                            <CardHeader>
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                            </CardHeader>
                            <CardContent>
                              <Skeleton className="h-4 w-[150px]" />
                            </CardContent>
                            <CardFooter>
                              <Skeleton className="h-10 w-full" />
                            </CardFooter>
                          </Card>
                        ))
                    : availableRides.map((ride) => (
                        <RideDetailsDialog key={`available-${ride.id}`} ride={ride} onAcceptRide={acceptRide} onAddNote={addNote} fetchNotes={fetchNotes} currentUser={currentUser}>
                          <Card className="mb-4 overflow-hidden cursor-pointer hover:bg-secondary transition-colors">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">
                                {ride.from_location} to {ride.to_location}
                              </CardTitle>
                              <CardDescription>Requested by: {ride.rider_name}</CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(ride.time).toLocaleString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </RideDetailsDialog>
                      ))}
                  {!isLoading && availableRides.length === 0 && <div className="text-center py-4 text-muted-foreground">No available rides at the moment.</div>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="my-rides">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {isLoading
                    ? Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <Card key={i} className="mb-4">
                            <CardHeader>
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                            </CardHeader>
                            <CardContent>
                              <Skeleton className="h-4 w-[150px]" />
                            </CardContent>
                            <CardFooter>
                              <Skeleton className="h-10 w-full" />
                            </CardFooter>
                          </Card>
                        ))
                    : myRides.map((ride) => (
                        <RideDetailsDialog key={`my-${ride.id}`} ride={ride} onCancelRequest={cancelRequest} onAddNote={addNote} fetchNotes={fetchNotes} currentUser={currentUser}>
                          <Card className="mb-4 overflow-hidden cursor-pointer hover:bg-secondary transition-colors">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">
                                {ride.from_location} to {ride.to_location}
                              </CardTitle>
                              <CardDescription>
                                Status: {ride.status === "accepted" ? "Accepted" : ride.status}
                                {ride.status === "accepted" && ` (Offered by: ${ride.accepter_id ? contacts.find((c) => c.user_id === ride.accepter_id || c.contact_id === ride.accepter_id)?.user.name : "Unknown"})`}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(ride.time).toLocaleString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </RideDetailsDialog>
                      ))}
                  {!isLoading && myRides.length === 0 && <div className="text-center py-4 text-muted-foreground">You haven&apos;t requested any rides yet.</div>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="offered-rides">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {isLoading
                    ? Array(3)
                        .fill(0)
                        .map((_, i) => (
                          <Card key={i} className="mb-4">
                            <CardHeader>
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                            </CardHeader>
                            <CardContent>
                              <Skeleton className="h-4 w-[150px]" />
                            </CardContent>
                            <CardFooter>
                              <Skeleton className="h-10 w-full" />
                            </CardFooter>
                          </Card>
                        ))
                    : offeredRides.map((ride) => (
                        <RideDetailsDialog key={`offered-${ride.id}`} ride={ride} onCancelOffer={cancelOffer} onAddNote={addNote} fetchNotes={fetchNotes} currentUser={currentUser}>
                          <Card className="mb-4 overflow-hidden cursor-pointer hover:bg-secondary transition-colors">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-lg">
                                {ride.from_location} to {ride.to_location}
                              </CardTitle>
                              <CardDescription>
                                Status: Offered
                                {` (Requested by: ${ride.rider_name})`}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-2">
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(ride.time).toLocaleString()}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </RideDetailsDialog>
                      ))}
                  {!isLoading && offeredRides.length === 0 && <div className="text-center py-4 text-muted-foreground">You haven&apos;t offered any rides yet.</div>}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  const RideDetailsDialog = ({
    children,
    ride,
    onCancelRequest,
    onCancelOffer,
    onAcceptRide,
    onAddNote,
    fetchNotes,
    currentUser,
  }: {
    children: React.ReactNode;
    ride: Ride;
    onCancelRequest?: (rideId: string) => Promise<void>;
    onCancelOffer?: (rideId: string) => Promise<void>;
    onAcceptRide?: (rideId: string) => Promise<void>;
    onAddNote: (rideId: string, note: string) => Promise<Note | undefined>;
    fetchNotes: (rideId: string) => Promise<Note[]>;
    currentUser: User | null;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState("");
  
    const loadNotes = async () => {
      const fetchedNotes = await fetchNotes(ride.id);
      setNotes(fetchedNotes);
    };
  
    useEffect(() => {
      if (isOpen) {
        void loadNotes();
      }
    }, [isOpen]);
  
    const handleAddNote = async () => {
      if (newNote.trim()) {
        const addedNote = await onAddNote(ride.id, newNote);
        if (addedNote) {
          setNotes((prevNotes) => [...prevNotes, addedNote]);
          setNewNote("");
        }
      }
    };
  
    const getDisplayStatus = () => {
      if (ride.status === "accepted" && ride.accepter_id === currentUser?.id) {
        return "Offered";
      }
      return ride.status.charAt(0).toUpperCase() + ride.status.slice(1);
    };
  
    const getStatusColor = () => {
      switch (ride.status) {
        case "accepted":
          return "text-green-500";
        case "cancelled":
          return "text-red-500";
        default:
          return "text-yellow-500";
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Ride Details</DialogTitle>
            <DialogDescription className="text-lg">
              From {ride.from_location} to {ride.to_location}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">From</Label>
                </div>
                <p className="ml-7">{ride.from_location}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">To</Label>
                </div>
                <p className="ml-7">{ride.to_location}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Requester</Label>
                </div>
                <p className="ml-7">{ride.rider_name}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Contact Phone</Label>
                </div>
                <p className="ml-7">{ride.rider_phone || 'Not provided'}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Date and Time</Label>
                </div>
                <p className="ml-7">{new Date(ride.time).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Status</Label>
                </div>
                <p className={`ml-7 font-semibold ${getStatusColor()}`}>{getDisplayStatus()}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Initial Notes</Label>
              </div>
              <p className="ml-7">{ride.note || 'No initial notes provided'}</p>
            </div>
            <Separator />
            {(ride.status === "accepted" || ride.requester_id === currentUser?.id || ride.accepter_id === currentUser?.id) && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Messages</Label>
                </div>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  {notes.map((note) => (
                    <div key={note.id} className={`mb-4 ${note.user_id === currentUser?.id ? "text-right" : "text-left"}`}>
                      <div className={`inline-block max-w-[80%] ${note.user_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-2`}>
                        <p className="text-sm">{note.note}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.user_name} - {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex items-center space-x-2">
                  <Input
                    id="new-note"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow"
                  />
                  <Button onClick={handleAddNote} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {ride.requester_id === currentUser?.id && ride.status !== "cancelled" && onCancelRequest && (
              <Button variant="destructive" onClick={() => onCancelRequest(ride.id)} className="w-full sm:w-auto">
                Cancel Request
              </Button>
            )}
            {ride.accepter_id === currentUser?.id && ride.status === "accepted" && onCancelOffer && (
              <Button variant="destructive" onClick={() => onCancelOffer(ride.id)} className="w-full sm:w-auto">
                Cancel Offer
              </Button>
            )}
            {ride.status === "pending" && onAcceptRide && (
              <Button onClick={() => onAcceptRide(ride.id)} className="w-full sm:w-auto">
                Offer Ride
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const CreateRidePage = () => {
    const [rideData, setRideData] = useState<RideData>({
      from_location: "",
      to_location: "",
      time: "",
      rider_name: currentUser?.name || "",
      rider_phone: currentUser?.phone || null,
      note: null,
    });
    const [riderType, setRiderType] = useState("self");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      void createRide(rideData);
    };

    return (
      <Card className="w-full max-w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>Create a Ride</CardTitle>
          <CardDescription>Fill in the details for your ride request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="from_location">From</Label>
                <Input id="from_location" value={rideData.from_location} onChange={(e) => setRideData((prev) => ({ ...prev, from_location: e.target.value }))} placeholder="Enter starting location" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="to_location">To</Label>
                <Input id="to_location" value={rideData.to_location} onChange={(e) => setRideData((prev) => ({ ...prev, to_location: e.target.value }))} placeholder="Enter destination" required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="datetime-local" value={rideData.time} onChange={(e) => setRideData((prev) => ({ ...prev, time: e.target.value }))} required />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="rider_type">Rider</Label>
                <Select name="rider_type" value={riderType} onValueChange={setRiderType}>
                  <SelectTrigger id="rider_type">
                    <SelectValue placeholder="Select rider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Myself</SelectItem>
                    {associatedPeople.map((person) => (
                      <SelectItem key={person.id} value={`associated_${person.id}`}>
                        {person.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {riderType === "other" && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="rider_name">Rider Name</Label>
                  <Input id="rider_name" value={rideData.rider_name} onChange={(e) => setRideData((prev) => ({ ...prev, rider_name: e.target.value }))} placeholder="Enter rider's name" required />
                </div>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="rider_phone">Rider Phone (optional)</Label>
                <Input id="rider_phone" value={rideData.rider_phone || ""} onChange={(e) => setRideData((prev) => ({ ...prev, rider_phone: e.target.value }))} placeholder="Enter rider's phone number" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="note">Note (optional)</Label>
                <Input id="note" value={rideData.note || ""} onChange={(e) => setRideData((prev) => ({ ...prev, note: e.target.value }))} placeholder="Add a note for the driver" />
              </div>
            </div>
            <Button className="w-full mt-4" type="submit">
              Create Ride
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  const ProfilePage = () => {
    const [newContactPhone, setNewContactPhone] = useState("")
    const [newAssociatedPerson, setNewAssociatedPerson] = useState({ name: "", relationship: "" });
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [editedUser, setEditedUser] = useState<User | null>(currentUser);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");


    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                <User className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p>{currentUser?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Phone className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p>{currentUser?.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Mail className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p>{currentUser?.email}</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-4 mt-4">
              <Button onClick={() => setIsEditProfileOpen(true)}>Edit Profile</Button>
              <Button onClick={() => setIsChangePasswordOpen(true)}>Change Password</Button>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-4">
                <Car className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">Rides Offered</p>
                  <p>{userStats?.rides_offered || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <MapPin className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">Rides Accepted</p>
                  <p>{userStats?.rides_accepted || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl">Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {contacts.map((contact) => {
          // Determine if the current user is the requester
          const isCurrentUserRequester = contact.user_id === currentUser?.id

          // Get the correct name and phone based on who is the requester
          const contactName = isCurrentUserRequester 
            ? contact.contact?.name ?? "Unknown name"
            : contact.user?.name ?? "Unknown name"
          
          const contactPhone = isCurrentUserRequester 
            ? contact.contact?.phone ?? "Unknown phone"
            : contact.user?.phone ?? "Unknown phone"

          return (
            <div key={contact.id} className="flex flex-col space-y-2 p-3 bg-secondary rounded-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {contactName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-row items-center gap-1">
                      <p className="font-semibold">{contactName}</p>
                      <p className="text-sm text-muted-foreground">({contact.status})</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{contactPhone}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {contact.status === "pending" && contact.contact_id === currentUser?.id && (
                    <Button onClick={() => acceptContact(contact.id)} size="sm">
                      Accept
                    </Button>
                  )}
                  <Button onClick={() => deleteContact(contact.id)} variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
        <div className="flex space-x-2 mt-4">
          <Input 
            id="telephone-contact" 
            type="tel" 
            placeholder="Enter contact's phone number" 
            value={newContactPhone} 
            onChange={(e) => setNewContactPhone(e.target.value)} 
          />
          <Button
            onClick={() => {
              if (newContactPhone.trim()) {
                addContact(newContactPhone)
                setNewContactPhone("")
              }
            }}
          >
            Add Contact
          </Button>
        </div>
      </CardContent>
    </Card>



        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Associated People</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {associatedPeople.map((person) => (
                <div key={person.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                  <span>
                    {person.name} ({person.relationship})
                  </span>
                  <Button variant="destructive" size="sm" onClick={() => deleteAssociatedPerson(person.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <Input id="name-ass" placeholder="Name" value={newAssociatedPerson.name} onChange={(e) => setNewAssociatedPerson((prev) => ({ ...prev, name: e.target.value }))} />
              <Input id="rela-ass" placeholder="Relationship" value={newAssociatedPerson.relationship} onChange={(e) => setNewAssociatedPerson((prev) => ({ ...prev, relationship: e.target.value }))} />
              <Button onClick={() => addAssociatedPerson(newAssociatedPerson.name, newAssociatedPerson.relationship)} className="w-full">
                Add Associated Person
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-destructive">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={deleteUser}>
              Delete Account
            </Button>
          </CardContent>
        </Card>

        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your personal information</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Implement the logic to update the user profile
                setIsEditProfileOpen(false);
              }}
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editedUser?.name || ""} onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, name: e.target.value } : null))} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={editedUser?.phone || ""} onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, phone: e.target.value } : null))} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" value={editedUser?.email || ""} onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, email: e.target.value } : null))} />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>Update your personal information</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editedUser) {
                  updateProfile(editedUser);
                  setIsEditProfileOpen(false);
                }
              }}
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" value={editedUser?.name || ""} onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, name: e.target.value } : null))} required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" value={editedUser?.phone || ""} onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, phone: e.target.value } : null))} required />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" value={editedUser?.email || ""} onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, email: e.target.value } : null))} required />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter your current password and a new password</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword !== confirmNewPassword) {
                  toast({
                    title: "Error",
                    description: "New passwords do not match",
                    variant: "destructive",
                  });
                  return;
                }
                changePassword(currentPassword, newPassword);
              }}
            >
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input id="confirm-new-password" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="submit">Change Password</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const Layout = ({ children }: { children: React.ReactNode }) => {
    if (!currentUser) return children;

    const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

    return (
      <div className={`flex flex-col min-h-screen ${theme === "dark" ? "bg-zinc-900 text-white" : "bg-zinc-50"}`}>
        <header className={`${theme === "dark" ? "bg-zinc-800" : "bg-white"} shadow-md border-b ${theme === "dark" ? "border-zinc-700" : "border-zinc-200"}`}>
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* Logo and brand */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-primary">RideShare</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex items-center space-x-2 ${theme === "dark" ? "bg-zinc-700" : "bg-zinc-100"} rounded-full p-1`}>
              {[
                { icon: Home, label: "Dashboard", page: "dashboard" },
                { icon: Car, label: "Create Ride", page: "create-ride" },
                { icon: Users, label: "Profile", page: "profile" },
              ].map((item) => (
                <Button
                  key={item.page}
                  variant={currentPage === item.page ? "default" : "ghost"}
                  onClick={() => setCurrentPage(item.page)}
                  className={`rounded-full px-4 py-2 transition-colors duration-200 ${currentPage === item.page ? `${theme === "dark" ? "bg-zinc-300" : "bg-primary text-primary-foreground"}` : `${theme === "dark" ? "hover:bg-zinc-600" : "hover:bg-primary/10"}`}`}
                >
                  <item.icon className="mr-2 h-4 w-4" /> {item.label}
                </Button>
              ))}

               {/* Notifications */}
               <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`rounded-full px-4 py-2 ${theme === "dark" ? "hover:bg-zinc-600" : "hover:bg-primary/10"} relative`}
                    onClick={handleOpenNotificationDialog}
                  >
                    <Bell className="h-4 w-4" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute top-0 right-0 bg-destructive text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className={`sm:max-w-[425px] ${theme === "dark" ? "bg-zinc-800 text-white" : ""}`}>
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

              {/* Theme Toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className={`rounded-full ${theme === "dark" ? "hover:bg-zinc-600" : "hover:bg-primary/10"}`}>
                {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>

              {/* Logout Button */}
              <Button variant="ghost" onClick={logout} className={`rounded-full px-4 py-2 ${theme === "dark" ? "hover:bg-red-900 hover:text-red-100" : "hover:bg-destructive/10 hover:text-destructive"}`}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </nav>

            {/* Mobile Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`w-56 ${theme === "dark" ? "bg-zinc-800 text-white" : ""}`}>
                <DropdownMenuLabel className="flex items-center">
                  <User className="mr-2 h-4 w-4" /> {currentUser.name}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {[
                  { icon: Home, label: "Dashboard", page: "dashboard" },
                  { icon: Car, label: "Create Ride", page: "create-ride" },
                  { icon: Users, label: "Profile", page: "profile" },
                ].map((item) => (
                  <DropdownMenuItem key={item.page} onClick={() => setCurrentPage(item.page)} className="cursor-pointer">
                    <item.icon className="mr-2 h-4 w-4" /> {item.label}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleOpenNotificationDialog} className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  Notifications
                  {unreadNotificationsCount > 0 && <span className="ml-2 bg-destructive text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{unreadNotificationsCount}</span>}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                  {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  {theme === "light" ? "Dark Mode" : "Light Mode"}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={logout} className={`${theme === "dark" ? "text-red-400 focus:bg-red-900" : "text-destructive focus:bg-destructive/10"} cursor-pointer`}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className={`flex-grow container mx-auto px-4 py-8 ${theme === "dark" ? "text-white" : ""}`}>{children}</main>

        <footer className={`${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200"} border-t py-4`}>
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} RideShare. All rights reserved.</div>
        </footer>
      </div>
    );
  };

  return (
    <>
      <Layout>
        <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${theme === "dark" ? "text-white" : ""}`}>
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          ) : (
            <>
              {currentPage === "welcome" && <WelcomePage />}
              {currentPage === "login" && <LoginPage />}
              {currentPage === "register" && <RegisterPage />}
              {currentPage === "dashboard" && currentUser && <DashboardPage />}
              {currentPage === "create-ride" && currentUser && <CreateRidePage />}
              {currentPage === "profile" && currentUser && <ProfilePage />}
              {!currentUser && currentPage !== "welcome" && currentPage !== "login" && currentPage !== "register" && <div>Loading...</div>}
            </>
          )}
        </div>
      </Layout>
      <Toaster />
    </>
  );
}
