import { useState, useEffect, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Clock, MapPin, User2, CalendarIcon, ArrowRight, CheckCircle, Filter } from 'lucide-react';
import { User, Ride, Contact } from "../types";
import Link from 'next/link';
import { format } from "date-fns";

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
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

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

  useEffect(() => {
    const fetchRides = async () => {
      setIsLoading(true);
      await fetchUserData();
      setIsLoading(false);
    };
    fetchRides();
  }, [fetchUserData]);

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      const matchesSearch =
        ride.from_location.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        ride.to_location.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        ride.rider_name.toLowerCase().includes(localSearchTerm.toLowerCase());

      const matchesStatus = !statusFilter || ride.status === statusFilter;

      const matchesDate = !dateFilter || new Date(ride.time).toDateString() === dateFilter.toDateString();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [rides, localSearchTerm, statusFilter, dateFilter]);

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
                    <span className="text-sm text-muted-foreground">{ride.rider_name}</span>
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

  const RideCardSkeleton = () => (
    <Card className="mb-4">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px]" />
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
    const upcomingRides = activeRides
      .filter(ride => new Date(ride.time) > now)
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
      .slice(0, 3);

    if (upcomingRides.length === 0) {
      return null;
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Important Rides</CardTitle>
          <CardDescription>Your upcoming rides that need attention</CardDescription>
        </CardHeader>
        <CardContent>
          {renderRides(upcomingRides)}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <ImportantRides />

      <Card className="shadow-lg">
        <CardHeader className="space-y-6">
          <div>
            <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
            <CardDescription>Manage your rides and connections</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
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
            <div className="flex gap-2">
              <Select onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[120px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "PPP") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter !== null ? dateFilter : undefined}
                    onSelect={(day) => setDateFilter(day ?? null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {(statusFilter || dateFilter) && (
                <Button variant="ghost" onClick={() => { setStatusFilter(null); setDateFilter(null); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            router.push(`/dashboard?tab=${value}`, { scroll: false });
          }} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="active" className="text-sm">
                Active Rides ({activeRides.length})
              </TabsTrigger>
              <TabsTrigger value="available" className="text-sm">
                Available ({availableRides.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-sm">
                History ({historyRides.length})
              </TabsTrigger>
            </TabsList>

            <div>
              {["active", "available", "history"].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  <ScrollArea className="h-[calc(100vh-300px)] sm:h-[600px] pr-4">
                    {isLoading ? (
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

