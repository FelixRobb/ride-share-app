import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, MapPin, User } from 'lucide-react';
import { User as UserType, Ride, Contact } from "../types";
import Link from 'next/link';

interface DashboardPageProps {
  currentUser: UserType;
  rides: Ride[];
  contacts: Contact[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchUserData: (userId: string) => Promise<void>;
}

export default function DashboardPage({ currentUser, rides, contacts, searchTerm, setSearchTerm }: DashboardPageProps) {
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

  const RideCard = ({ ride, type }: { ride: Ride; type: 'available' | 'my' | 'offered' }) => (
    <Link href={`/rides/${ride.id}`}>
      <Card className="mb-4 hover:bg-secondary transition-colors cursor-pointer">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <CardTitle className="text-base font-semibold">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="truncate max-w-[150px]">{ride.from_location}</span>
                </div>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{ride.to_location}</span>
                </div>
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">
                {type === 'available' && 'Requested by:'}
                {type === 'my' && 'Status:'}
                {type === 'offered' && 'Requested by:'}
              </p>
              <p className="text-muted-foreground">
                {type === 'available' && ride.rider_name}
                {type === 'my' && (ride.status === "accepted" ? `Accepted by ${getOfferedByText(ride)}` : ride.status)}
                {type === 'offered' && ride.rider_name}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{new Date(ride.time).toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Dashboard</CardTitle>
          <div className="relative mt-2">
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
                {isLoading
                  ? Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="mb-4">
                        <CardHeader className="p-4">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px] mt-2" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Skeleton className="h-4 w-[100px]" />
                        </CardContent>
                      </Card>
                    ))
                  : availableRides.map((ride) => (
                      <RideCard key={`available-${ride.id}`} ride={ride} type="available" />
                    ))}
                {!isLoading && availableRides.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">No available rides at the moment.</div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="my-rides">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {isLoading
                  ? Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="mb-4">
                        <CardHeader className="p-4">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px] mt-2" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Skeleton className="h-4 w-[100px]" />
                        </CardContent>
                      </Card>
                    ))
                  : myRides.map((ride) => (
                      <RideCard key={`my-${ride.id}`} ride={ride} type="my" />
                    ))}
                {!isLoading && myRides.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">You haven&apos;t requested any rides yet.</div>
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="offered-rides">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {isLoading
                  ? Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="mb-4">
                        <CardHeader className="p-4">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px] mt-2" />
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <Skeleton className="h-4 w-[100px]" />
                        </CardContent>
                      </Card>
                    ))
                  : offeredRides.map((ride) => (
                      <RideCard key={`offered-${ride.id}`} ride={ride} type="offered" />
                    ))}
                {!isLoading && offeredRides.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">You haven&apos;t offered any rides yet.</div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

