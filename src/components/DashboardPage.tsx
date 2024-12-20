import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, MapPin } from 'lucide-react';
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

  const LocationText = ({ text }: { text: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLParagraphElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
      const checkOverflow = () => {
        if (containerRef.current && textRef.current) {
          setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth);
        }
      };

      checkOverflow();
      window.addEventListener('resize', checkOverflow);
      return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    return (
      <div ref={containerRef} className="relative w-full overflow-hidden">
        {isOverflowing && (
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
        )}
        <p ref={textRef} className="truncate">{text}</p>
      </div>
    );
  };

  const RideCard = ({ ride, type }: { ride: Ride; type: 'available' | 'my' | 'offered' }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [locationWidth, setLocationWidth] = useState('100%');

    useEffect(() => {
      const updateWidth = () => {
        if (cardRef.current) {
          const cardWidth = cardRef.current.offsetWidth;
          const iconWidth = 16; // 4 * 4px (w-4)
          const iconMargin = 8; // 2 * 4px (space-x-2)
          const newWidth = cardWidth - iconWidth - iconMargin;
          setLocationWidth(`${newWidth}px`);
        }
      };

      updateWidth();
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }, []);

    return (
      <Link href={`/rides/${ride.id}`}>
        <Card className="mb-4 hover:bg-secondary transition-colors cursor-pointer">
          <CardContent className="p-4" ref={cardRef}>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <div style={{ width: locationWidth }}>
                  <LocationText text={ride.from_location} />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <div style={{ width: locationWidth }}>
                  <LocationText text={ride.to_location} />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-muted-foreground gap-2">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{new Date(ride.time).toLocaleString()}</span>
                </div>
                <div className="truncate max-w-full">
                  {type === 'available' && `Requested by: ${ride.rider_name}`}
                  {type === 'my' && `Status: ${ride.status}`}
                  {type === 'offered' && `Requested by: ${ride.rider_name}`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <Card className="shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          <div className="relative mb-6">
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
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="available" className="text-xs sm:text-sm">
                Available
              </TabsTrigger>
              <TabsTrigger value="my-rides" className="text-xs sm:text-sm">
                My Rides
              </TabsTrigger>
              <TabsTrigger value="offered-rides" className="text-xs sm:text-sm">
                Offered
              </TabsTrigger>
            </TabsList>
            <TabsContent value="available">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {isLoading
                  ? Array(3).fill(0).map((_, i) => (
                      <Card key={i} className="mb-4">
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
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
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
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
                        <CardContent className="p-4">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
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

