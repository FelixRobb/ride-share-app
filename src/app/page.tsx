"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, LogOut, UserPlus, Home, Car, Users, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  status: "pending" | "accepted" | "completed";
};

type Contact = {
  id: number;
  user_id: number;
  contact_id: number;
  name: string;
  phone: string;
  status: "pending" | "accepted";
};

type Notification = {
  id: number;
  user_id: number;
  message: string;
  type: "rideRequest" | "rideAccepted" | "contactRequest";
};

// Main App Component
export default function RideShareApp() {
  const [currentPage, setCurrentPage] = useState("welcome");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
      setCurrentPage("dashboard");
      fetchUserData(JSON.parse(user).id);
    }
  }, []);

  const fetchUserData = async (userId: number) => {
    const ridesResponse = await fetch(`/api/rides?userId=${userId}`);
    const ridesData = await ridesResponse.json();
    setRides(ridesData.rides);

    const contactsResponse = await fetch(`/api/contacts?userId=${userId}`);
    const contactsData = await contactsResponse.json();
    setContacts(contactsData.contacts);

    const notificationsResponse = await fetch(
      `/api/notifications?userId=${userId}`
    );
    const notificationsData = await notificationsResponse.json();
    setNotifications(notificationsData.notifications);
  };

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setCurrentPage("dashboard");
        fetchUserData(data.user.id);
      } else {
        alert("Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed");
    }
  };

  const register = async (name: string, phone: string, password: string) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        setCurrentPage("dashboard");
        fetchUserData(data.user.id);
      } else {
        alert("Registration failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        "Registration failed: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
    setCurrentPage("welcome");
  };

  const createRide = async (from: string, to: string, time: string) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, time, requesterId: currentUser.id }),
      });
      const data = await response.json();
      if (data.ride) {
        setRides([...rides, data.ride]);
      } else {
        alert("Failed to create ride");
      }
    } catch (error) {
      console.error("Create ride error:", error);
      alert("Failed to create ride");
    }
  };

  const acceptRide = async (rideId: number) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepterId: currentUser?.id }),
      });
      const data = await response.json();
      if (data.ride) {
        setRides(rides.map((ride) => (ride.id === rideId ? data.ride : ride)));
        fetchUserData(currentUser!.id);
      } else {
        alert("Failed to accept ride");
      }
    } catch (error) {
      console.error("Accept ride error:", error);
      alert("Failed to accept ride");
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
      if (data.contact) {
        setContacts([...contacts, data.contact]);
      } else {
        alert("Failed to add contact");
      }
    } catch (error) {
      console.error("Add contact error:", error);
      alert("Failed to add contact");
    }
  };

  const acceptContact = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept contact");
      }

      const data = await response.json();
      if (data.contact) {
        setContacts(
          contacts.map((contact) =>
            contact.id === contactId ? data.contact : contact
          )
        );
        fetchUserData(currentUser!.id);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("Accept contact error:", error);
      alert(
        "Failed to accept contact: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  // Components
  const WelcomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-white px-4">
      <h1 className="text-5xl font-bold mb-6 text-center text-slate-950">
        Welcome to RideShare
      </h1>
      <p className="text-xl mb-8 text-center max-w-md text-slate-900">
        Connect with friends, share rides, and travel together safely.
      </p>
      <div className="space-y-4 w-full max-w-xs text-slate-950">
        <Button
          onClick={() => setCurrentPage("login")}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Login
        </Button>
        <Button
          onClick={() => setCurrentPage("register")}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Register
        </Button>
      </div>
    </div>
  );

  const LoginPage = () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your phone number and password to login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const phone = (
              e.currentTarget.elements.namedItem("phone") as HTMLInputElement
            ).value;
            const password = (
              e.currentTarget.elements.namedItem("password") as HTMLInputElement
            ).value;
            login(phone, password);
          }}
        >
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter your phone number" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <Button className="w-full mt-4" type="submit">
            Login
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button variant="link" onClick={() => setCurrentPage("register")}>
          Don't have an account? Register
        </Button>
      </CardFooter>
    </Card>
  );

  const RegisterPage = () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Register</CardTitle>
        <CardDescription>
          Create a new account to start sharing rides.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = (
              e.currentTarget.elements.namedItem("name") as HTMLInputElement
            ).value;
            const phone = (
              e.currentTarget.elements.namedItem("phone") as HTMLInputElement
            ).value;
            const password = (
              e.currentTarget.elements.namedItem("password") as HTMLInputElement
            ).value;
            register(name, phone, password);
          }}
        >
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter your phone number" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
              />
            </div>
          </div>
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

  const DashboardPage = () => (
    <div className="w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Manage your rides and connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Rides</TabsTrigger>
              <TabsTrigger value="my-rides">My Rides</TabsTrigger>
            </TabsList>
            <TabsContent value="available">
              <ScrollArea className="h-[300px]">
                {rides
                  .filter(
                    (ride) =>
                      ride.status === "pending" &&
                      ride.requester_id !== currentUser?.id
                  )
                  .map((ride) => (
                    <Card key={ride.id} className="mb-4">
                      <CardHeader>
                        <CardTitle>
                          {ride.from_location} to {ride.to_location}
                        </CardTitle>
                        <CardDescription>
                          Requested by: {ride.requester_id}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Time: {ride.time}</p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => acceptRide(ride.id)}>
                          Accept Ride
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="my-rides">
              <ScrollArea className="h-[300px]">
                {rides
                  .filter((ride) => ride.requester_id === currentUser?.id)
                  .map((ride) => (
                    <Card key={ride.id} className="mb-4">
                      <CardHeader>
                        <CardTitle>
                          {ride.from_location} to {ride.to_location}
                        </CardTitle>
                        <CardDescription>Status: {ride.status}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Time: {ride.time}</p>
                      </CardContent>
                    </Card>
                  ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  const CreateRidePage = () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create New Ride</CardTitle>
        <CardDescription>
          Request a ride by filling out the details below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const from = (
              e.currentTarget.elements.namedItem("from") as HTMLInputElement
            ).value;
            const to = (
              e.currentTarget.elements.namedItem("to") as HTMLInputElement
            ).value;
            const time = (
              e.currentTarget.elements.namedItem("time") as HTMLInputElement
            ).value;
            createRide(from, to, time);
            setCurrentPage("dashboard");
          }}
        >
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input id="from" placeholder="Enter starting location" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" placeholder="Enter destination" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <Input id="time" type="datetime-local" />
            </div>
          </div>
          <Button className="w-full mt-4" type="submit">
            Create Ride
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const ProfilePage = () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{currentUser?.name}</h2>
            <p className="text-sm text-gray-500">{currentUser?.phone}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Manage Contacts</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contacts</DialogTitle>
              <DialogDescription>
                Manage your contacts and friend requests.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <h3 className="mb-2 font-semibold">Add New Contact</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const phone = (
                    e.currentTarget.elements.namedItem(
                      "contactPhone"
                    ) as HTMLInputElement
                  ).value;
                  addContact(phone);
                }}
                className="flex space-x-2"
              >
                <Input id="contactPhone" placeholder="Enter phone number" />
                <Button type="submit">
                  <UserPlus className="h-4 w-4 mr-2" /> Add
                </Button>
              </form>
            </div>
            <ScrollArea className="h-[200px]">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex justify-between items-center py-2"
                >
                  <div>
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-sm text-gray-500">{contact.phone}</p>
                  </div>
                  {contact.status === "pending" && (
                    <Button onClick={() => acceptContact(contact.id)}>
                      Accept
                    </Button>
                  )}
                </div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );

  const Layout = ({ children }: { children: React.ReactNode }) => {
    if (!currentUser) return children;

    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-primary text-primary-foreground shadow-md">
          <div className="container mx-auto px-4 py-2 flex justify-between items-center">
            <h1 className="text-2xl font-bold">RideShare</h1>
            <nav className="hidden md:flex space-x-4">
              <Button
                variant="ghost"
                onClick={() => setCurrentPage("dashboard")}
              >
                <Home className="mr-2 h-4 w-4" /> Dashboard
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentPage("create-ride")}
              >
                <Car className="mr-2 h-4 w-4" /> Create Ride
              </Button>
              <Button variant="ghost" onClick={() => setCurrentPage("profile")}>
                <Users className="mr-2 h-4 w-4" /> Profile
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost">
                    <Bell className="mr-2 h-4 w-4" /> Notifications
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[300px]">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="py-2">
                        <p>{notification.message}</p>
                      </div>
                    ))}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </nav>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCurrentPage("dashboard")}>
                  <Home className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage("create-ride")}>
                  <Car className="mr-2 h-4 w-4" /> Create Ride
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentPage("profile")}>
                  <Users className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-100 py-4">
          <div className="container mx-auto px-4 text-center text-sm text-gray-600">
            © 2024 RideShare. All rights reserved.
          </div>
        </footer>
      </div>
    );
  };

  // Render the appropriate page based on the current state
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        {currentPage === "welcome" && <WelcomePage />}
        {currentPage === "login" && <LoginPage />}
        {currentPage === "register" && <RegisterPage />}
        {currentPage === "dashboard" && <DashboardPage />}
        {currentPage === "create-ride" && <CreateRidePage />}
        {currentPage === "profile" && <ProfilePage />}
      </div>
    </Layout>
  );
}
