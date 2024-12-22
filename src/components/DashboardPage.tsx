import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, MapPin, User2, Calendar, ArrowRight, CheckCircle } from 'lucide-react';
import { User, Ride, Contact } from "../types";
import Link from 'next/link';

interface DashboardPageProps {
  currentUser: User;
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
  const offeredRides = filteredRides(rides.filter((ride) => ride.accepter_id === currentUser?.id));

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return <Badge variant="default" className="bg-green-500">Accepted</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-blue-500">Completed</Badge>;
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    };
  };

  const RideCard = ({ ride }: { ride: Ride }) => {
    const { date, time } = formatDateTime(ride.time);
    
    return (
      <Link href={`/rides/${ride.id}`}>
        <Card className="mb-4 hover:bg-accent transition-colors duration-200 group">
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{ride.rider_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{date}</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{time}</span>
                  </div>
                </div>
                <div>
                  {getStatusBadge(ride.status)}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{ride.from_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-destructive mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">{ride.to_location}</p>
                    </div>
                  </div>
                </div>
                {ride.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              {ride.status === "accepted" && ride.accepter_id && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <User2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Offered by: {getOfferedByText(ride)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="space-y-6">
          <div>
            <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
            <CardDescription>Manage your rides and connections</CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
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
              <TabsTrigger value="available" className="text-sm">
                Available ({availableRides.length})
              </TabsTrigger>
              <TabsTrigger value="my-rides" className="text-sm">
                My Rides ({myRides.length})
              </TabsTrigger>
              <TabsTrigger value="offered-rides" className="text-sm">
                Offered ({offeredRides.length})
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              {["available", "my-rides", "offered-rides"].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <ScrollArea className="h-[600px] pr-4">
                    {isLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <Card key={i} className="mb-4">
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <Skeleton className="h-4 w-[250px]" />
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <>
                        {tab === "available" && (
                          availableRides.length > 0 ? (
                            availableRides.map((ride) => (
                              <RideCard key={`available-${ride.id}`} ride={ride} />
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No available rides at the moment
                            </div>
                          )
                        )}
                        {tab === "my-rides" && (
                          myRides.length > 0 ? (
                            myRides.map((ride) => (
                              <RideCard key={`my-${ride.id}`} ride={ride} />
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              You haven't requested any rides yet
                            </div>
                          )
                        )}
                        {tab === "offered-rides" && (
                          offeredRides.length > 0 ? (
                            offeredRides.map((ride) => (
                              <RideCard key={`offered-${ride.id}`} ride={ride} />
                            ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              You haven't offered any rides yet
                            </div>
                          )
                        )}
                      </>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
