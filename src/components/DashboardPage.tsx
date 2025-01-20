import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Clock, MapPin, User2, CalendarIcon, ArrowRight, CheckCircle, Filter, MoreHorizontal } from 'lucide-react';
import { User, Ride, Contact } from "../types";
import Link from 'next/link';
import { useOnlineStatus } from "@/utils/useOnlineStatus";
import { toast } from "sonner";


interface FilterPopoverProps {
  statusFilter: string | null;
  setStatusFilter: (status: string | null) => void;
  dateFilter: Date | null;
  setDateFilter: (date: Date | null) => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ statusFilter, setStatusFilter, dateFilter, setDateFilter }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-full">
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {(statusFilter || dateFilter) && (
            <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="w-full bg-popover rounded-md shadow-md">
          <div className="p-4 grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Status</h4>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Date</h4>
              <Calendar
                mode="single"
                selected={dateFilter !== null ? dateFilter : undefined}
                onSelect={(day) => setDateFilter(day ?? null)}
                initialFocus
              />
            </div>
            <Button className="w-full" onClick={() => { }}>Apply Filters</Button>
            {(statusFilter || dateFilter) && (
              <Button variant="ghost" onClick={() => { setStatusFilter(null); setDateFilter(null); }} className="h-10">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface DashboardPageProps {
  currentUser: User;
  rides: Ride[];
  contacts: Contact[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  fetchUserData: () => Promise<void>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardPage({
  currentUser,
  rides,
  contacts,
  searchTerm,
  setSearchTerm,
  fetchUserData,
  activeTab,
  setActiveTab
}: DashboardPageProps) {
  const router = useRouter();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [localRides, setLocalRides] = useState<Ride[]>(rides);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setLocalRides(rides);
  }, [rides]);

  useEffect(() => {
    const fetchData = async () => {
      if (isOnline) {
        try {
          await fetchUserData();
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to fetch user data. Please try again.");
        } finally {
          setIsInitialLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [isOnline, fetchUserData]);

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { date: formattedDate, time: formattedTime };
  };

  const getOfferedByText = (ride: Ride) => {
    if (ride.accepter_id === currentUser.id) return "Me";
    const contact = contacts.find((c) => c.user_id === ride.accepter_id || c.contact_id === ride.accepter_id);
    return contact ? (contact.user_id === ride.accepter_id ? contact.user.name : contact.contact.name) : "Unknown";
  };

  const getRequesterName = (ride: Ride) => {
    if (ride.requester_id === currentUser.id) return "Me"; // Or currentUser.name
    const contact = contacts.find((c) => c.user_id === ride.requester_id || c.contact_id === ride.requester_id);
    return contact ? (contact.user_id === ride.requester_id ? contact.user.name : contact.contact.name) : "Unknown";
  };


  const filteredRides = useMemo(() => {
    return localRides.filter((ride) => {
      const matchesSearch =
        ride.from_location.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        ride.to_location.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        ride.rider_name.toLowerCase().includes(localSearchTerm.toLowerCase());

      const matchesStatus = !statusFilter || ride.status === statusFilter;

      const matchesDate = !dateFilter || new Date(ride.time).toDateString() === dateFilter.toDateString();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [localRides, localSearchTerm, statusFilter, dateFilter]);

  const activeRides = useMemo(() =>
    filteredRides.filter(ride =>
      (ride.requester_id === currentUser.id || ride.accepter_id === currentUser.id) &&
      (ride.status === "pending" || ride.status === "accepted")
    ),
    [filteredRides, currentUser.id]);

  const availableRides = useMemo(() =>
    filteredRides.filter(ride =>
      ride.status === "pending" && ride.requester_id !== currentUser.id
    ),
    [filteredRides, currentUser.id]);

  const historyRides = useMemo(() =>
    filteredRides.filter(ride =>
      (ride.requester_id === currentUser.id || ride.accepter_id === currentUser.id) &&
      (ride.status === "completed" || ride.status === "cancelled")
    ),
    [filteredRides, currentUser.id]);

  useEffect(() => {
    setSearchTerm(localSearchTerm);
  }, [localSearchTerm, setSearchTerm]);

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

  const RideCard = ({ ride }: { ride: Ride }) => {
    const { date, time } = formatDateTime(ride.time);

    return (
      <Link href={`/rides/${ride.id}?from=${activeTab}`}>
        <Card className="mb-4 hover:bg-accent transition-colors duration-200 group">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getRequesterName(ride)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
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
                    <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{ride.from_location}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{ride.to_location}</p>
                    </div>
                  </div>
                </div>
                {ride.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </div>

              {(ride.status === "accepted" || ride.status === "completed") && ride.accepter_id && (
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

  const RideCardSkeleton = () => (
    <Card className="mb-4">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-9/12" />
          <Skeleton className="h-4 w-7/12" />
        </div>
      </CardContent>
    </Card>
  );

  const renderRides = (rides: Ride[]) => {
    if (rides.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No rides available
        </div>
      );
    }
    return rides.map((ride) => <RideCard key={ride.id} ride={ride} />);
  };

  const ImportantRides = () => {
    const now = new Date();
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);


    const upcomingRides = activeRides
      .filter(ride => new Date(ride.time) > now && new Date(ride.time) < twoDaysFromNow)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(0, 3);

    if (upcomingRides.length === 0) {
      return null;
    }

    const renderImportantRide = (ride: Ride) => {
      const { date, time } = formatDateTime(ride.time);
      const isUserRequester = ride.requester_id === currentUser.id;
      const actionNeeded = ride.status === "pending" ? (isUserRequester ? "Waiting for offer" : "Offer a ride") : "";
      const fromLocationParts = ride.from_location.split(",");
      const toLocationParts = ride.to_location.split(",");
      const shortFromLocation = fromLocationParts[0];
      const shortToLocation = toLocationParts[0];

      return (

        <Card key={ride.id} className="w-full mb-4 hover:bg-accent transition-colors duration-200 overflow-hidden mr-3">
          <Link href={`/rides/${ride.id}?from=active`}>
            <CardHeader className="pb-2 bg-primary/10">
              <div className="flex justify-between items-start flex-col sm:flex-row">
                <div className="">
                  <CardTitle className="text-md">
                    <MapPin className="mx-1 h-4 w-4 inline text-muted-foreground mb-1" /> {shortFromLocation} to {shortToLocation}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 ml-1 mb-1">
                    <Clock className="h-4 w-4 inline text-muted-foreground" /> {date} at {time}
                  </CardDescription>
                </div>
                <div className="flex flex-row justify-between items-center sm:justify-end sm:flex-col sm:items-end gap-4 sm:gap-1">
                  <div> {getStatusBadge(ride.status)}</div>
                  <div>{actionNeeded && (
                    <Badge variant="destructive">
                      {actionNeeded}
                    </Badge>
                  )}</div>

                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 bg-primary/10">
              <div className="space-y-2 border rounded-lg p-3 bg-card">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Requester:</span>
                  <span>{getRequesterName(ride)}</span>
                </div>
                {ride.status === "accepted" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Offered by:</span>
                    <span>{getOfferedByText(ride)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rider:</span>
                  <span>{ride.rider_name}</span>
                </div>
                {ride.rider_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Rider Phone:</span>
                    <span>{ride.rider_phone}</span>
                  </div>
                )}
                {ride.note && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Note:</span>
                    <span className="text-sm break-words max-w-[70%]">{ride.note}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Link>
        </Card >

      );
    };

    return (
      <div className="mb-6 bg-primary/5 rounded-lg p-4 border border-primary/8 flex flex-col">
        <div>
          <h2 className="text-xl font-bold mb-2">Important Rides</h2>
          <p className="text-sm text-muted-foreground">Your upcoming rides that need attention</p>
        </div>

        <div className="relative mt-4">
          <ScrollArea className="w-full max-h-[350px] sm:max-h-[450px] overflow-y-auto">
            <div className="flex flex-col">
              {upcomingRides.map(renderImportantRide)}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto" data-tutorial="dashboard">
      <Card className="shadow-lg min-h-min relative z-10">
        <CardHeader className="space-y-6">
          <div>
            <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
            <CardDescription>Manage your rides and connections</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow flex flex-row gap-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search rides..."
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full h-10"
              />
              <Button className="block sm:hidden h-10" data-tutorial='create-ride' variant="default" onClick={() => router.push('/create-ride')}>
                Create Ride
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <FilterPopover
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
              />
              <Button className="hidden sm:block h-10" data-tutorial="create-ride" variant="default" onClick={() => router.push('/create-ride')}>
                Create Ride
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ImportantRides />
          <Tabs defaultValue={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            router.push(`/dashboard?tab=${value}`, { scroll: false });
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4" data-tutorial="dashboard-tabs">
              <TabsTrigger value="active" className="text-xs">
                Active
              </TabsTrigger>
              <TabsTrigger value="available" className="text-sm">
                Available
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm">
                History
              </TabsTrigger>
            </TabsList>

            <div>
              {["active", "available", "history"].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <ScrollArea className="h-[calc(100vh-300px)] pr-3">
                    {isInitialLoading ? (
                      Array(3).fill(0).map((_, i) => (
                        <RideCardSkeleton key={i} />
                      ))
                    ) : (
                      <>
                        {tab === "active" && renderRides(activeRides)}
                        {tab === "available" && renderRides(availableRides)}
                        {tab === "history" && renderRides(historyRides)}
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

