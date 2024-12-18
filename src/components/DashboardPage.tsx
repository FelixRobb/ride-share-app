import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock } from 'lucide-react';
import { User, Ride, Contact } from "../types";
import Link from 'next/link'

interface DashboardPageProps {
  currentUser: User;
  rides: Ride[];
  contacts: Contact[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchUserData: (userId: string) => Promise<void>;
}

export default function DashboardPage({ currentUser, rides, contacts, searchTerm, setSearchTerm, fetchUserData }: DashboardPageProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [activeTab, setActiveTab] = useState("available");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm, setSearchTerm]);

  const getOfferedByText = (ride: Ride) => {
    if (ride.accepter_id === currentUser.id) {
      return "Me";
    }

    const offeringContact = contacts.find((c) =>
      (c.user_id === ride.accepter_id && c.contact_id === currentUser.id) ||
      (c.contact_id === ride.accepter_id && c.user_id === currentUser.id)
    );

    if (offeringContact) {
      if (offeringContact.user_id === ride.accepter_id) {
        return offeringContact.user.name;
      } else {
        return offeringContact.contact.name;
      }
    }
  }

    const filteredRides = useCallback(
      (rides: Ride[]) => {
        if (!searchTerm.trim()) return rides;
        return rides.filter((ride) => ride.from_location.toLowerCase().includes(searchTerm.toLowerCase()) || ride.to_location.toLowerCase().includes(searchTerm.toLowerCase()));
      },
      [searchTerm]
    );

    const availableRides = filteredRides(
      rides.filter((ride) => {
        const isPendingAndNotOwn = ride.status === "pending" && ride.requester_id !== currentUser?.id;
        const isConnectedUser = contacts.some((contact) => (contact.user_id === ride.requester_id || contact.contact_id === ride.requester_id) && contact.status === "accepted");
        return isPendingAndNotOwn && isConnectedUser;
      })
    );

    const myRides = filteredRides(rides.filter((ride) => ride.requester_id === currentUser?.id));
    const offeredRides = filteredRides(rides.filter((ride) => ride.accepter_id === currentUser?.id && ride.status === "accepted"));

    useEffect(() => {
      setIsLoading(false);
    }, []);

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
                        </Card>
                      ))
                    : availableRides.map((ride) => (
                      <Link href={`/rides/${ride.id}`} key={`available-${ride.id}`}>
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
                      </Link>
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
                        </Card>
                      ))
                    : myRides.map((ride) => (
                      <Link href={`/rides/${ride.id}`} key={`my-${ride.id}`}>
                        <Card className="mb-4 overflow-hidden cursor-pointer hover:bg-secondary transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">
                              {ride.from_location} to {ride.to_location}
                            </CardTitle>
                            <CardDescription>
                              Status: {ride.status === "accepted" ? "Accepted" : ride.status}
                              {ride.status === "accepted" && ride.accepter_id && ` (Offered by: ${getOfferedByText(ride)})`}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(ride.time).toLocaleString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
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
                        </Card>
                      ))
                    : offeredRides.map((ride) => (
                      <Link href={`/rides/${ride.id}`} key={`offered-${ride.id}`}>
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
                      </Link>
                    ))}
                  {!isLoading && offeredRides.length === 0 && <div className="text-center py-4 text-muted-foreground">You haven&apos;t offered any rides yet.</div>}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

