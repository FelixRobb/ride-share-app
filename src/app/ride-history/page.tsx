"use client";

import { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarIcon,
  MapPin,
  ArrowRight,
  Filter,
  User2,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Ride } from "@/types";
import { Label } from "@/components/ui/label";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

export default function RideHistoryPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const activeTab = "history"; // Set a default or make it dynamic as needed

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: searchTerm,
        status: statusFilter,
        date: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
      });

      const response = await fetch(`/api/ride-history?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch rides");
      const data = await response.json();
      setRides(data.rides);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page); // Use the page returned from the API
    } catch {
      setRides([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, dateFilter]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRides();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchRides();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateFilter(undefined);
    setCurrentPage(1);

    // Use setTimeout to ensure the state updates have been processed
    setTimeout(() => {
      fetchRides();
    }, 0);
  };

  // Helper functions for the ride card
  const formatDateTime = (dateTimeString: string) => {
    const dateObj = new Date(dateTimeString);
    return {
      date: format(dateObj, "MMM d, yyyy"),
      time: format(dateObj, "h:mm a"),
    };
  };

  const getRequesterName = (ride: Ride) => {
    return ride.rider_name || "Unknown rider";
  };

  const getOfferedByText = (ride: Ride) => {
    return ride.rider_name || "Unknown driver";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            Accepted
          </Badge>
        )
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      case "completed":
        return (
          <Badge variant="default" className="bg-blue-500">
            Completed
          </Badge>
        )
      default:
        return null
    }
  }

  const RideCard = ({ ride }: { ride: Ride }) => {
    const { date, time } = formatDateTime(ride.time);
    return (
      <Link href={`/rides/${ride.id}?from=${activeTab}`} className="block">
        <Card className="mb-4 hover:bg-accent transition-colors duration-200 group">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {getRequesterName(ride)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {date}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {time}
                    </span>
                  </div>
                </div>
                <div>{getStatusBadge(ride.status)}</div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 space-y-2">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">
                        {ride.from_location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">
                        {ride.to_location}
                      </p>
                    </div>
                  </div>
                </div>
                {ride.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                )}
              </div>
              {(ride.status === "accepted" || ride.status === "completed") &&
                ride.rider_name && (
                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Offered by: {getOfferedByText(ride)}
                    </span>
                  </div>
                )}
              {ride.note && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">
                    Note: {ride.note}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Ride History</h1>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search rides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </div>
          </form>
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full sm:w-auto flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            {isFilterOpen ? "Hide Filters" : "Show Filters"}
          </Button>
        </div>

        {isFilterOpen && (
          <div className="mb-6 p-4 border rounded-md bg-background shadow-sm">
            <h2 className="font-semibold mb-4">Filters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <div>
                <Label className="block text-sm font-medium mb-1">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFilter && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFilter}
                      onSelect={setDateFilter}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-between sm:col-span-2 mt-2">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={handleFilterChange}>Apply Filters</Button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : rides.length > 0 ? (
          <div>
            {rides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-background">
            <p className="text-muted-foreground mb-2">No rides found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm">
              Page <span className="font-medium">{currentPage}</span> of{" "}
              <span className="font-medium">{totalPages}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
