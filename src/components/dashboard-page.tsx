"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { RideCard } from "@/components/ride-card";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Ride {
  id: string;
  from_location: string;
  to_location: string;
  time: string;
  status: string;
  requester_id: string;
  accepter_id: string | null;
  rider_name: string;
}

interface Contact {
  id: string;
  user_id: string;
  contact_id: string;
  status: string;
}

export function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/user-data?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setRides(data.rides);
        setContacts(data.contacts);
        setIsLoading(false);
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      void fetchUserData(parsedUser.id);
    } else {
      router.push("/login");
    }
  }, [fetchUserData, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  const filteredRides = useCallback(
    (rides: Ride[]) => {
      if (!searchTerm.trim()) return rides;
      return rides.filter((ride) => 
        ride.from_location.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ride.to_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    [searchTerm]
  );

  const availableRides = filteredRides(
    rides.filter((ride) => {
      const isPendingAndNotOwn = ride.status === "pending" && ride.requester_id !== currentUser?.id;
      const isConnectedUser = contacts.some((contact) => 
        (contact.user_id === ride.requester_id || contact.contact_id === ride.requester_id) && 
        contact.status === "accepted"
      );
      return isPendingAndNotOwn && isConnectedUser;
    })
  );

  const myRides = filteredRides(rides.filter((ride) => ride.requester_id === currentUser?.id));
  const offeredRides = filteredRides(rides.filter((ride) => ride.accepter_id === currentUser?.id && ride.status === "accepted"));

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Dashboard</CardTitle>
          <CardDescription>Manage your rides and connections</CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            <Input
              id="search"
              type="text"
              placeholder="Search rides..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
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
                {isLoading ? (
                  <div>Loading...</div>
                ) : availableRides.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No available rides at the moment.</div>
                ) : (
                  availableRides.map((ride) => <RideCard key={ride.id} ride={ride} type="available" />)
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="my-rides">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {isLoading ? (
                  <div>Loading...</div>
                ) : myRides.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">You haven't requested any rides yet.</div>
                ) : (
                  myRides.map((ride) => <RideCard key={ride.id} ride={ride} type="my-ride" />)
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="offered-rides">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {isLoading ? (
                  <div>Loading...</div>
                ) : offeredRides.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">You haven't offered any rides yet.</div>
                ) : (
                  offeredRides.map((ride) => <RideCard key={ride.id} ride={ride} type="offered" />)
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

