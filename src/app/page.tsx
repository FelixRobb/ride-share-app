"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, LogOut, UserPlus, Home, Car, Users, Menu, Clock, User, Moon, Sun, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton"

// Types
type User = {
  id: number;
  name: string;
  phone: string;
};

type Ride = {
  id: number;
  from_location: string;
  to_location: string;
  time: string;
  requester_id: number;
  accepter_id: number | null;
  status: "pending" | "accepted" | "completed" | "cancelled";
};

type Contact = {
  id: number;
  user_id: number;
  contact_id: number;
  status: "pending" | "accepted";
  created_at: string;
  user_name: string;
  user_phone: string;
  contact_name: string;
  contact_phone: string;
};

type Notification = {
  id: number;
  user_id: number;
  message: string;
  type: "rideRequest" | "rideAccepted" | "contactRequest";
  is_read: boolean;
  created_at: string;
};

type RideData = {
  from_location: string;
  to_location: string;
  time: string;
};

// Main App Component
export default function RideShareApp() {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    // Simulate loading delay
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const fetchUserData = async (userId: number) => {
    try {
      const [ridesResponse, contactsResponse, notificationsResponse] = await Promise.all([fetch(`/api/rides?userId=${userId}`), fetch(`/api/contacts?userId=${userId}`), fetch(`/api/notifications?userId=${userId}`)]);

      const [ridesData, contactsData, notificationsData] = await Promise.all([ridesResponse.json(), contactsResponse.json(), notificationsResponse.json()]);

      setRides(ridesData.rides);
      setContacts(contactsData.contacts);
      setNotifications(notificationsData.notifications);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
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

  const register = async (name: string, phone: string, password: string) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
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

  const filteredRides = (rides: Ride[]) => {
    return rides.filter((ride) => ride.from_location.toLowerCase().includes(searchTerm.toLowerCase()) || ride.to_location.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const acceptRide = async (rideId: number) => {
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
        setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? data.ride : ride)));
        toast({
          title: "Ride Accepted",
          description: "You have successfully accepted the ride.",
        });
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

  const cancelRequest = async (rideId: number) => {
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
        setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? data.ride : ride)));
        toast({
          title: "Request Cancelled",
          description: "Your ride request has been cancelled successfully.",
        });
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

  const cancelOffer = async (rideId: number) => {
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
        setRides((prevRides) => prevRides.map((ride) => (ride.id === rideId ? data.ride : ride)));
        toast({
          title: "Offer Cancelled",
          description: "Your ride offer has been cancelled successfully.",
        });
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
        setContacts((prevContacts) => [...prevContacts, data.contact]);
        toast({
          title: "Success",
          description: "Contact request sent successfully!",
        });
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

  const acceptContact = async (contactId: number) => {
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
        void fetchUserData(currentUser.id);
        toast({
          title: "Success",
          description: "Contact accepted successfully!",
        });
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

  const deleteContact = async (contactId: number) => {
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

  const markNotificationsAsRead = async (notificationIds: number[]) => {
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
      } else {
        console.error("Failed to mark notifications as read");
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleOpenNotificationDialog = () => {
    setIsNotificationDialogOpen(true);
    const unreadNotifications = notifications.filter((n) => !n.is_read);
    if (unreadNotifications.length > 0) {
      markNotificationsAsRead(unreadNotifications.map((n) => n.id));
    }
  };

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

    return (
      <Card className="w-full max-w-[350px] mx-auto">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your phone number and password to login.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const phone = (e.currentTarget.elements.namedItem("phone") as HTMLInputElement).value;
              const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
              try {
                await login(phone, password);
                setError(null);
              } catch (error) {
                setError(error instanceof Error ? error.message : "An unexpected error occurred");
              }
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Enter your phone number" required />
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
        <CardFooter>
          <Button variant="link" onClick={() => setCurrentPage("register")}>
            Don&apos;t have an account? Register
          </Button>
        </CardFooter>
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
              const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
              try {
                await register(name, phone, password);
                setError(null);
              } catch (error) {
                setError(error instanceof Error ? error.message : "An unexpected error occurred");
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
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" required />
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

  const DashboardPage = () => {
    const safeRides = rides || [];
    const safeContacts = contacts || [];

    const availableRides = filteredRides(safeRides.filter((ride) => ride.status === "pending" && ride.requester_id !== currentUser?.id && safeContacts.some((contact) => (contact.user_id === ride.requester_id || contact.contact_id === ride.requester_id) && contact.status === "accepted")));

    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Dashboard</CardTitle>
            <CardDescription>Manage your rides and connections</CardDescription>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input type="text" placeholder="Search rides..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="available" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="available" className="text-xs md:text-sm">
                  Available Rides
                </TabsTrigger>
                <TabsTrigger value="my-rides" className="text-xs md:text-sm">
                  My Rides
                </TabsTrigger>
                <TabsTrigger value="accepted-rides" className="text-xs md:text-sm">
                  Accepted Rides
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
                        <Card key={`available-${ride.id}`} className="mb-4 overflow-hidden">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">
                              {ride.from_location} to {ride.to_location}
                            </CardTitle>
                            <CardDescription>Requested by: {safeContacts.find((contact) => contact.user_id === ride.requester_id || contact.contact_id === ride.requester_id)?.user_name || "Unknown"}</CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(ride.time).toLocaleString()}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="bg-muted py-2">
                            <Button onClick={() => acceptRide(ride.id)} className="w-full">
                              Offer Ride
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                  {!isLoading && availableRides.length === 0 && <div className="text-center py-4 text-muted-foreground">No available rides at the moment.</div>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="my-rides">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {safeRides
                    .filter((ride) => ride.requester_id === currentUser?.id)
                    .map((ride) => (
                      <Card key={`my-${ride.id}`} className="mb-4 overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            {ride.from_location} to {ride.to_location}
                          </CardTitle>
                          <CardDescription>Status: {ride.status}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(ride.time).toLocaleString()}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted py-2">
                          {ride.status === "pending" && (
                            <Button onClick={() => cancelRequest(ride.id)} variant="destructive" className="w-full">
                              Cancel Request
                            </Button>
                          )}
                          {ride.status === "accepted" && (
                            <Button onClick={() => cancelRequest(ride.id)} variant="destructive" className="w-full">
                              Cancel Ride
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  {safeRides.filter((ride) => ride.requester_id === currentUser?.id).length === 0 && <div className="text-center py-4 text-muted-foreground">You haven't requested any rides yet.</div>}
                </ScrollArea>
              </TabsContent>
              <TabsContent value="accepted-rides">
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  {safeRides
                    .filter((ride) => ride.accepter_id === currentUser?.id && ride.status === "accepted")
                    .map((ride) => (
                      <Card key={`accepted-${ride.id}`} className="mb-4 overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            {ride.from_location} to {ride.to_location}
                          </CardTitle>
                          <CardDescription>Requested by: {safeContacts.find((contact) => contact.user_id === ride.requester_id || contact.contact_id === ride.requester_id)?.user_name || "Unknown"}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(ride.time).toLocaleString()}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted py-2">
                          <Button onClick={() => cancelOffer(ride.id)} variant="destructive" className="w-full">
                            Cancel Offer
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  {safeRides.filter((ride) => ride.accepter_id === currentUser?.id && ride.status === "accepted").length === 0 && <div className="text-center py-4 text-muted-foreground">You haven't accepted any rides yet.</div>}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };
  const CreateRidePage = () => (
    <Card className="w-full max-w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Create New Ride</CardTitle>
        <CardDescription>Request a ride by filling out the details below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const from = (e.currentTarget.elements.namedItem("from") as HTMLInputElement).value;
            const to = (e.currentTarget.elements.namedItem("to") as HTMLInputElement).value;
            const time = (e.currentTarget.elements.namedItem("time") as HTMLInputElement).value;
            createRide({ from_location: from, to_location: to, time });
            setCurrentPage("dashboard");
          }}
        >
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" placeholder="Enter starting location" required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" placeholder="Enter destination" required />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="datetime-local" required />
            </div>
          </div>
          <Button className="w-full mt-4" type="submit">
            Create Ride
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const ProfilePage = () => {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    if (!currentUser) {
      return <div>Loading user profile...</div>;
    }

    // Filter out the current user from contacts list and handle different contact states
    const filteredContacts = contacts.filter((contact) => {
      return contact.user_id === currentUser.id || contact.contact_id === currentUser.id;
    });

    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-lg">{currentUser.name.charAt(0).toUpperCase()}</div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <p className="text-muted-foreground">{currentUser.phone}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Manage Contacts</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Contacts</DialogTitle>
                <DialogDescription>Manage your contacts and friend requests.</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <h3 className="mb-2 font-semibold">Add New Contact</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const phone = (e.currentTarget.elements.namedItem("contactPhone") as HTMLInputElement).value;
                    if (phone === currentUser.phone) {
                      toast({
                        title: "Error",
                        description: "You cannot add yourself as a contact",
                        variant: "destructive",
                      });
                      return;
                    }
                    addContact(phone);
                    e.currentTarget.reset();
                  }}
                  className="flex space-x-2"
                >
                  <Input id="contactPhone" placeholder="Enter phone number" required />
                  <Button type="submit">
                    <UserPlus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </form>
              </div>
              <ScrollArea className="h-[200px]">
                {filteredContacts.map((contact) => {
                  const isOutgoingRequest = contact.user_id === currentUser.id;
                  const contactName = isOutgoingRequest ? contact.contact_name : contact.user_name;
                  const contactPhone = isOutgoingRequest ? contact.contact_phone : contact.user_phone;

                  return (
                    <div key={`contact-${contact.id}`} className="flex justify-between items-center py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">{contactName.charAt(0).toUpperCase()}</div>
                        <div>
                          <p className="font-semibold">{contactName}</p>
                          <p className="text-sm text-muted-foreground">{contactPhone}</p>
                          <p className="text-xs text-muted-foreground">
                            {contact.status === "pending" && isOutgoingRequest && "Request sent"}
                            {contact.status === "pending" && !isOutgoingRequest && "Request received"}
                            {contact.status === "accepted" && "Connected"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {contact.status === "pending" && isOutgoingRequest && (
                          <Button onClick={() => deleteContact(contact.id)} size="sm" variant="destructive">
                            Cancel
                          </Button>
                        )}
                        {contact.status === "pending" && !isOutgoingRequest && (
                          <>
                            <Button onClick={() => acceptContact(contact.id)} size="sm">
                              Accept
                            </Button>
                            <Button onClick={() => deleteContact(contact.id)} size="sm" variant="destructive">
                              Decline
                            </Button>
                          </>
                        )}
                        {contact.status === "accepted" && (
                          <Button onClick={() => deleteContact(contact.id)} size="sm" variant="destructive">
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredContacts.length === 0 && <div className="text-center py-4 text-muted-foreground">No contacts found</div>}
              </ScrollArea>
            </DialogContent>
          </Dialog>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription>Are you sure you want to delete your account? This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={deleteUser}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    );
  };

  const Layout = ({ children }: { children: React.ReactNode }) => {
    if (!currentUser) return children;

    const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

    return (
      <div className={`flex flex-col min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-zinc-50"}`}>
        <header className={`${theme === "dark" ? "bg-zinc-900" : "bg-white"} shadow-md border-b ${theme === "dark" ? "border-x-zinc-700" : "border-zinc-200"}`}>
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            {/* Logo and brand */}
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">RideShare</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={`hidden md:flex space-x-2 ${theme === "dark" ? "bg-zinc-700" : "bg-zinc-100"} rounded-full p-1`}>
              {[
                { icon: Home, label: "Dashboard", page: "dashboard" },
                { icon: Car, label: "Create Ride", page: "create-ride" },
                { icon: Users, label: "Profile", page: "profile" },
              ].map((item) => (
                <Button key={item.page} variant={currentPage === item.page ? "default" : "ghost"} onClick={() => setCurrentPage(item.page)} className={`rounded-full px-4 py-2 ${theme === "dark" ? "hover:bg-zinc-600" : "hover:bg-primary/10"} transition-colors duration-200`}>
                  <item.icon className="mr-2 h-4 w-4" /> {item.label}
                </Button>
              ))}

              {/* Notifications */}
              <Dialog open={isNotificationDialogOpen} onOpenChange={setIsNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className={`rounded-full px-4 py-2 ${theme === "dark" ? "hover:bg-zinc-600" : "hover:bg-primary/10"} relative`} onClick={handleOpenNotificationDialog}>
                    <Bell className="h-4 w-4" />
                    {unreadNotificationsCount > 0 && <span className="absolute top-0 right-0 bg-destructive text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{unreadNotificationsCount}</span>}
                  </Button>
                </DialogTrigger>
                <DialogContent className={theme === "dark" ? "bg-zinc-800 text-white" : ""}>
                  <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[300px]">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`py-2 border-b ${theme === "dark" ? "border-zinc-700" : ""} rounded-md p-3 mb-2`}>
                        <p>{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && <p className="text-center text-muted-foreground py-4">No notifications</p>}
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

                <DropdownMenuSeparator className={` ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-300"}  w-11/12 mx-auto `} />

                {[
                  { icon: Home, label: "Dashboard", page: "dashboard" },
                  { icon: Car, label: "Create Ride", page: "create-ride" },
                  { icon: Users, label: "Profile", page: "profile" },
                ].map((item) => (
                  <DropdownMenuItem key={item.page} onClick={() => setCurrentPage(item.page)} className="cursor-pointer">
                    <item.icon className="mr-2 h-4 w-4" /> {item.label}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator className={` ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-300"}  w-11/12 mx-auto `} />

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

        <footer className={`${theme === "dark" ? "bg-zinc-900 border-zinc-600" : "bg-white border-zinc-200"} border-t py-4`}>
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} RideShare. All rights reserved.</div>
        </footer>
      </div>
    );
  };

  // Render the appropriate page based on the current state
  return (
    <Layout>
      <div className={`flex items-center justify-center min-h-[calc(100vh-12rem)] ${theme === "dark" ? "text-white" : ""}`}>
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-12 w-[400px] rounded-md" />
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
  )
}
