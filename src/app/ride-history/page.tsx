"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Layout from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CalendarIcon,
  ArrowRight,
  User2,
  CheckCircle,
  X,
  CalendarPlus2Icon as CalendarIcon2,
  AlertCircle,
  ChevronDown,
} from "lucide-react"
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { cn } from "@/lib/utils"
import type { Ride } from "@/types"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

const ITEMS_PER_PAGE = 10

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// Status badge component with improved visual design
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="px-2 py-1 font-medium">
          Pending
        </Badge>
      )
    case "accepted":
      return (
        <Badge variant="default" className="bg-green-500 px-2 py-1 font-medium">
          Accepted
        </Badge>
      )
    case "cancelled":
      return (
        <Badge variant="destructive" className="px-2 py-1 font-medium">
          Cancelled
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="default" className="bg-blue-500 px-2 py-1 font-medium">
          Completed
        </Badge>
      )
    default:
      return null
  }
}

// Time period filter options
const TIME_PERIODS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this-week" },
  { label: "This Month", value: "this-month" },
  { label: "Custom", value: "custom" },
]

// Status filter options
const STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Accepted", value: "accepted" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
]

export default function RideHistoryPage() {

  // State for ride data and pagination
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined)
  const [timePeriod, setTimePeriod] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Determine if any filters are active
  const hasActiveFilters = useMemo(() => {
    return statusFilter !== "all" || dateFilter !== undefined || timePeriod !== "all" || debouncedSearchTerm !== ""
  }, [statusFilter, dateFilter, timePeriod, debouncedSearchTerm])

  // Load filters from local storage on initial render
  useEffect(() => {
    const savedFilters = localStorage.getItem("rideHistoryFilters");
    if (savedFilters) {
      const filters = JSON.parse(savedFilters);
      setCurrentPage(filters.currentPage || 1);
      setSearchTerm(filters.searchTerm || "");
      setStatusFilter(filters.statusFilter || "all");
      setTimePeriod(filters.timePeriod || "all");
      setDateFilter(filters.dateFilter ? new Date(filters.dateFilter) : undefined);

      // Set active tab based on the loaded status filter
      setActiveTab(filters.statusFilter || "all");
    }
  }, []);

  // Save filters to local storage whenever they change
  useEffect(() => {
    const filters = {
      currentPage,
      searchTerm,
      statusFilter,
      timePeriod,
      dateFilter: dateFilter ? dateFilter.toISOString() : undefined,
    };
    localStorage.setItem("rideHistoryFilters", JSON.stringify(filters));
  }, [currentPage, searchTerm, statusFilter, timePeriod, dateFilter]);

  // Function to fetch rides with current filters
  const fetchRides = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: debouncedSearchTerm,
        status: statusFilter,
        timePeriod: timePeriod,
        date: dateFilter ? format(dateFilter, "yyyy-MM-dd") : "",
      })

      const response = await fetch(`/api/ride-history?${queryParams}`)

      if (!response.ok) {
        throw new Error("Failed to fetch rides")
      }

      const data = await response.json()
      setRides(data.rides)
      setTotalPages(data.totalPages)
      setCurrentPage(data.page) // Use the page returned from the API
    } catch {
      setError("Failed to load ride history. Please try again.")
      setRides([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, dateFilter, timePeriod])

  // Fetch rides when filters or pagination changes
  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter("all")
    setDateFilter(undefined)
    setTimePeriod("all")
    setSearchTerm("")
    setCurrentPage(1)
  }

  // Helper functions for the ride card
  const formatDateTime = (dateTimeString: string) => {
    const dateObj = new Date(dateTimeString)
    return {
      date: format(dateObj, "MMM d, yyyy"),
      time: format(dateObj, "h:mm a"),
      relative: getRelativeTimeLabel(dateObj),
    }
  }

  // Get a human-readable relative time label
  const getRelativeTimeLabel = (date: Date) => {
    if (isToday(date)) return "Today"
    if (isYesterday(date)) return "Yesterday"
    if (isThisWeek(date)) return format(date, "EEEE") // Day name
    if (isThisMonth(date)) return format(date, "MMMM d") // Month and day
    return format(date, "MMM d, yyyy") // Full date for older dates
  }

  // Get requester name (simplified for this example)
  const getRequesterName = (ride: Ride) => {
    return ride.rider_name || "Unknown rider"
  }

  // Get offered by text (simplified for this example)
  const getOfferedByText = (ride: Ride) => {
    return ride.rider_name || "Unknown driver"
  }

  // Render a ride card with improved design
  const RideCard = ({ ride }: { ride: Ride }) => {
    const { time, relative } = formatDateTime(ride.time)

    // Extract just the first part of the location for a cleaner display
    const fromLocationShort = ride.from_location.split(",")[0]
    const toLocationShort = ride.to_location.split(",")[0]

    return (
      <Link href={`/rides/${ride.id}?from=history`} className="block">
        <Card
          className={`mb-4 hover:bg-accent/50 transition-all duration-200 group border-l-4 hover:shadow-md 
            ${ride.status === "completed"
              ? "border-l-blue-500"
              : ride.status === "accepted"
                ? "border-l-green-500"
                : ride.status === "cancelled"
                  ? "border-l-destructive"
                  : ride.status === "pending"
                    ? "border-l-secondary"
                    : "border-l-border"
            }`}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4">
              {/* Header with status and time */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{relative}</span>
                    <span className="text-sm text-muted-foreground">• {time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{getRequesterName(ride)}</span>
                  </div>
                </div>
                <StatusBadge status={ride.status} />
              </div>

              {/* Route information */}
              <div className="flex items-center space-x-3">
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-0.5 h-10 bg-muted-foreground/30"></div>
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{fromLocationShort}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-full">
                      {ride.from_location.replace(fromLocationShort + ",", "")}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{toLocationShort}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-full">
                      {ride.to_location.replace(toLocationShort + ",", "")}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {ride.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>

              {/* Additional information */}
              {(ride.status === "accepted" || ride.status === "completed") && ride.rider_name && (
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <User2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Offered by: {getOfferedByText(ride)}</span>
                </div>
              )}
              {ride.note && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    <span className="font-medium">Note:</span> {ride.note}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  // Render skeleton loaders during loading state
  const RideCardSkeleton = () => (
    <Card className="mb-4 border-l-4">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center space-y-1">
              <div className="w-3 h-3 rounded-full bg-muted"></div>
              <div className="w-0.5 h-10 bg-muted"></div>
              <div className="w-3 h-3 rounded-full bg-muted"></div>
            </div>
            <div className="flex-1 space-y-4">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  )

  // Filter tabs for quick filtering
  const FilterTabs = () => (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        setActiveTab(value)
        if (value === "all") {
          setStatusFilter("all")
        } else {
          setStatusFilter(value)
        }
        setCurrentPage(1)
      }}
      className="mb-6"
    >
      <TabsList className="grid grid-cols-4 w-full">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="completed">Completed</TabsTrigger>
        <TabsTrigger value="accepted">Accepted</TabsTrigger>
        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
      </TabsList>
    </Tabs>
  )

  // Time period dropdown for filtering by time
  const TimePeriodFilter = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="truncate">
              {timePeriod === "all"
                ? "Any Time"
                : timePeriod === "custom" && dateFilter
                  ? format(dateFilter, "MMM d, yyyy")
                  : TIME_PERIODS.find((p) => p.value === timePeriod)?.label || "Any Time"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              setTimePeriod("all")
              setDateFilter(undefined)
            }}
          >
            Any Time
          </DropdownMenuItem>
          <Separator />
          {TIME_PERIODS.map((period) => (
            <DropdownMenuItem
              key={period.value}
              onClick={() => {
                setTimePeriod(period.value)
                if (period.value !== "custom") {
                  setDateFilter(undefined)
                }
              }}
            >
              {period.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // Calendar popover for custom date selection
  const DatePickerPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={timePeriod === "custom" ? "default" : "outline"}
          className={cn("w-full justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}

        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateFilter}
          onSelect={(date) => {
            setDateFilter(date)
            setTimePeriod("custom")
            setCurrentPage(1)
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )

  // Active filters display with clear buttons
  const ActiveFilters = () => {
    if (!hasActiveFilters) return null

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {debouncedSearchTerm && (
          <Badge variant="secondary" className="px-3 py-1">
            Search: {debouncedSearchTerm}
            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 p-0" onClick={() => setSearchTerm("")}>
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {statusFilter !== "all" && (
          <Badge variant="secondary" className="px-3 py-1">
            Status: {STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0"
              onClick={() => {
                setStatusFilter("all")
                setActiveTab("all")
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {timePeriod !== "all" && (
          <Badge variant="secondary" className="px-3 py-1">
            Time:{" "}
            {timePeriod === "custom" && dateFilter
              ? format(dateFilter, "MMM d, yyyy")
              : TIME_PERIODS.find((p) => p.value === timePeriod)?.label}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 ml-1 p-0"
              onClick={() => {
                setTimePeriod("all")
                setDateFilter(undefined)
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearFilters}>
          Clear All
        </Button>
      </div>
    )
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Ride History</h1>
          <p className="text-muted-foreground">
            {totalPages > 0 ? `Showing ${rides.length} of ${totalPages * ITEMS_PER_PAGE} rides` : "No rides found"}
          </p>
        </div>

        {/* Filter section */}
        <div className="bg-card rounded-lg border shadow-sm p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search input */}
            <div className="relative col-span-1 md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search locations, riders..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-10 pr-4 w-full"
              />
            </div>

            {/* Time period filter */}
            <div className="grid grid-cols-2 gap-2">
              <TimePeriodFilter />
              <DatePickerPopover />
            </div>
          </div>

          {/* Filter tabs for status */}
          <FilterTabs />

          {/* Active filters display */}
          <ActiveFilters />
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Ride list */}
        <div className="space-y-4">
          {loading ? (
            // Skeleton loaders during loading
            Array.from({ length: 5 }).map((_, index) => <RideCardSkeleton key={index} />)
          ) : rides.length > 0 ? (
            // Scrollable ride list
            <ScrollArea className="h-[calc(100vh-350px)]">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </ScrollArea>
          ) : (
            // Empty state
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="rounded-full bg-muted p-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">No rides found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search terms"
                    : "You don't have any ride history yet. Create a ride to get started."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-2">
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
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
              disabled={currentPage === totalPages || loading}
              className="flex items-center"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  )
}

