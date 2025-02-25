"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Layout from "@/components/Layout"
import {
  Search,
  Clock,
  MapPin,
  User2,
  CalendarIcon,
  ArrowRight,
  CheckCircle,
  X,
  Loader2,
  CircleSlash,
  ArrowBigLeft,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import type { Ride, User } from "@/types"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ExtendedRide extends Ride {
  requester: User
  accepter?: User
}

interface FilterState {
  status: string
  date: Date | undefined
}

// Define a key for localStorage
const FILTER_STORAGE_KEY = "ride-history-filters"

export default function RideHistoryPage() {
  const router = useRouter()
  const [rides, setRides] = useState<ExtendedRide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<ExtendedRide[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [activeFilters, setActiveFilters] = useState<FilterState>(() => {
    // Only run in browser environment to avoid SSR issues
    if (typeof window !== "undefined") {
      const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY)
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters)
        // Convert date string back to Date object if it exists
        return {
          status: parsedFilters.status || "all",
          date: parsedFilters.date ? new Date(parsedFilters.date) : undefined,
        }
      }
    }
    // Default filters if no saved state or error parsing
    return {
      status: "all",
      date: undefined,
    }
  })

  const [filterCount, setFilterCount] = useState(0)
  const isOnline = useOnlineStatus()
  const searchRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersToSave = {
      status: activeFilters.status,
      date: activeFilters.date ? activeFilters.date.toISOString() : undefined,
    }
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filtersToSave))
  }, [activeFilters])

  useEffect(() => {
    let count = 0
    if (activeFilters.status !== "all") count++
    if (activeFilters.date) count++
    setFilterCount(count)
  }, [activeFilters])

  // Fetch rides when filters change or when loading more
  const fetchRides = useCallback(
    async (resetRides = false) => {
      if (!isOnline) {
        return
      }

      setIsLoading(true)
      try {
        const queryParams = new URLSearchParams()
        queryParams.append("page", resetRides ? "1" : page.toString())

        // Only add status filter if not "all" - API will show all statuses by default
        if (activeFilters.status !== "all") {
          queryParams.append("status", activeFilters.status)
        }

        if (activeFilters.date) {
          queryParams.append("date", activeFilters.date.toISOString())
        }

        const response = await fetch(`/api/ride-history?${queryParams.toString()}`)
        if (!response.ok) throw new Error("Failed to fetch rides")
        const data = await response.json()

        if (resetRides) {
          setRides(data.rides)
          setPage(1)
        } else {
          setRides((prevRides) => [...prevRides, ...data.rides])
        }

        setHasMore(data.hasMore)
        setTotalCount(data.totalCount)
      } finally {
        setIsLoading(false)
      }
    },
    [isOnline, page, activeFilters],
  )

  // Fetch rides when filters change
  useEffect(() => {
    fetchRides(true)
  }, [fetchRides])

  // Fetch more rides when page changes
  useEffect(() => {
    if (page > 1) {
      fetchRides(false)
    }
  }, [page])

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  const handleSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/ride-history?search=${encodeURIComponent(term)}&limit=5`)
      if (!response.ok) throw new Error("Failed to fetch search results")
      const data = await response.json()
      setSearchResults(data.rides)
      setShowSearchResults(true)
    } finally {
      setIsSearching(false)
    }
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(searchTerm)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm, handleSearch])

  const handleSearchResultSelect = (ride: ExtendedRide) => {
    router.push(`/rides/${ride.id}`)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setSearchResults([])
    setShowSearchResults(false)
  }

  const handleResetFilters = useCallback(() => {
    setActiveFilters({
      status: "all",
      date: undefined,
    })
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    const formattedDate = date.toLocaleDateString(undefined, options)
    const formattedTime = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    return { date: formattedDate, time: formattedTime }
  }

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

  const RideCard = ({ ride }: { ride: ExtendedRide }) => {
    const { date, time } = formatDateTime(ride.time)
    const router = useRouter()

    return (
      <Card
        className="mb-4 hover:bg-accent transition-colors duration-200 group cursor-pointer"
        onClick={() => router.push(`/rides/${ride.id}?from=ride-history`)}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <User2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{ride.requester.name}</span>
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
              <div>{getStatusBadge(ride.status)}</div>
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

            {(ride.status === "accepted" || ride.status === "completed") && ride.accepter && (
              <div className="flex items-center space-x-2 pt-2 border-t">
                <User2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Offered by: {ride.accepter.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Layout>
        <Button type="button" variant="ghost" onClick={() => router.push("/dashboard?tab=history")} className="mb-2">
          <ArrowBigLeft />
          Go Back to Dashboard
        </Button>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Ride History</h1>

          {/* Redesigned Search and Filter UI */}
          <div className="mb-8 bg-card rounded-lg shadow-sm border">
            <div className="p-4">
              {/* Search Bar - Full Width Dedicated Section */}
              <div className="relative mb-4" ref={searchRef}>
                <div className="relative flex items-center">
                  <Search className="absolute left-3 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-10 py-6 w-full bg-background text-lg"
                  />
                  {isSearching ? (
                    <Loader2 className="absolute right-3 h-5 w-5 animate-spin text-muted-foreground" />
                  ) : searchTerm ? (
                    <button
                      className="absolute right-3 text-muted-foreground hover:text-foreground"
                      onClick={handleClearSearch}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>

                {/* Search Results Dropdown */}
                {showSearchResults && (
                  <Card className="absolute z-10 w-full mt-1 shadow-lg rounded-md overflow-hidden">
                    <ScrollArea className="max-h-[350px]">
                      {searchResults.length > 0 ? (
                        <ul className="py-1">
                          {searchResults.map((ride) => (
                            <li key={ride.id} className="px-1">
                              <button
                                className="w-full text-left p-3 hover:bg-accent rounded-md transition-colors"
                                onClick={() => handleSearchResultSelect(ride)}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="font-medium flex items-center">
                                    <MapPin className="w-4 h-4 text-primary mr-1" />
                                    <span>{ride.from_location}</span>
                                    <ArrowRight className="mx-2 h-3 w-3" />
                                    <MapPin className="w-4 h-4 text-destructive mr-1" />
                                    <span>{ride.to_location}</span>
                                  </div>
                                  {getStatusBadge(ride.status)}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1 flex items-center">
                                  <CalendarIcon className="w-3 h-3 mr-1" />
                                  {new Date(ride.time).toLocaleDateString()} |
                                  <User2 className="w-3 h-3 mx-1" />
                                  {ride.requester.name}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center">
                          <CircleSlash className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No matching rides found</p>
                        </div>
                      )}
                    </ScrollArea>
                  </Card>
                )}
              </div>

              {/* Filter Section - Tab-based UI */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-lg">Filters</h3>
                  {filterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>

                {/* Status Filter - Improved Tabs & Select Implementation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Status
                      {activeFilters.status !== "all" && (
                        <Badge variant="outline" className="ml-2 capitalize">
                          {activeFilters.status}
                        </Badge>
                      )}
                    </label>
                    {activeFilters.status !== "all" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFilters((prev) => ({ ...prev, status: "all" }))}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>

                  {/* Conditional rendering based on screen size using useMediaQuery */}
                  {isMobile ? (
                    <Select
                      value={activeFilters.status}
                      onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full h-10 border transition-all",
                          activeFilters.status !== "all" && "border-primary border-2",
                        )}
                      >
                        <SelectValue placeholder="Select status">
                          <span className="flex items-center">
                            {activeFilters.status === "accepted" && (
                              <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            )}
                            {activeFilters.status === "completed" && (
                              <CheckCircle className="h-3 w-3 mr-2 text-blue-500" />
                            )}
                            {activeFilters.status === "cancelled" && (
                              <CircleSlash className="h-3 w-3 mr-2 text-destructive" />
                            )}
                            <span className="capitalize">{activeFilters.status}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-2 text-orange-500" />
                            Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="accepted">
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            Accepted
                          </span>
                        </SelectItem>
                        <SelectItem value="completed">
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2 text-blue-500" />
                            Completed
                          </span>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <span className="flex items-center">
                            <CircleSlash className="h-3 w-3 mr-2 text-destructive" />
                            Cancelled
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Tabs
                      value={activeFilters.status}
                      onValueChange={(value) => setActiveFilters((prev) => ({ ...prev, status: value }))}
                      className="w-full"
                    >
                      <TabsList className="w-full h-auto p-1 grid grid-cols-5 gap-1 bg-muted/70">
                        <TabsTrigger
                          value="all"
                          className={cn(
                            "h-9 flex-1 data-[state=active]:shadow-sm",
                            "data-[state=active]:bg-background",
                          )}
                        >
                          All
                        </TabsTrigger>
                        <TabsTrigger
                          value="pending"
                          className={cn(
                            "h-9 flex-1 data-[state=active]:shadow-sm",
                            "data-[state=active]:border-orange-300 data-[state=active]:border-b-2",
                          )}
                        >
                          <span className="flex items-center justify-center">
                            {activeFilters.status === "pending" && <Clock className="h-3 w-3 mr-1 text-orange-500" />}
                            Pending
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="accepted"
                          className={cn(
                            "h-9 flex-1 data-[state=active]:shadow-sm",
                            "data-[state=active]:border-green-500 data-[state=active]:border-b-2",
                          )}
                        >
                          <span className="flex items-center justify-center">
                            {activeFilters.status === "accepted" && (
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                            )}
                            Accepted
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="completed"
                          className={cn(
                            "h-9 flex-1 data-[state=active]:shadow-sm",
                            "data-[state=active]:border-blue-500 data-[state=active]:border-b-2",
                          )}
                        >
                          <span className="flex items-center justify-center">
                            {activeFilters.status === "completed" && (
                              <CheckCircle className="h-3 w-3 mr-1 text-blue-500" />
                            )}
                            Completed
                          </span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="cancelled"
                          className={cn(
                            "h-9 flex-1 data-[state=active]:shadow-sm",
                            "data-[state=active]:border-destructive data-[state=active]:border-b-2",
                          )}
                        >
                          <span className="flex items-center justify-center">
                            {activeFilters.status === "cancelled" && (
                              <CircleSlash className="h-3 w-3 mr-1 text-destructive" />
                            )}
                            Cancelled
                          </span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>

                {/* Date Filter - Improved to match status filter style */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      Date
                      {activeFilters.date && (
                        <Badge variant="outline" className="ml-2">
                          {activeFilters.date.toLocaleDateString()}
                        </Badge>
                      )}
                    </label>
                    {activeFilters.date && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFilters((prev) => ({ ...prev, date: undefined }))}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reset
                      </Button>
                    )}
                  </div>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !activeFilters.date && "text-muted-foreground",
                          activeFilters.date && "border-primary border-2",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {activeFilters.date ? activeFilters.date.toLocaleDateString() : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={activeFilters.date}
                        onSelect={(date) => setActiveFilters((prev) => ({ ...prev, date }))}
                        initialFocus
                        className="border rounded-md"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {filterCount > 0 && (
              <>
                <Separator />
                <div className="p-3 bg-accent/30 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium mr-2">Active filters:</span>
                    <div className="flex gap-2">
                      {activeFilters.status !== "all" && (
                        <Badge variant="secondary" className="capitalize">
                          Status: {activeFilters.status}
                        </Badge>
                      )}
                      {activeFilters.date && (
                        <Badge variant="secondary">Date: {activeFilters.date.toLocaleDateString()}</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-7">
                    <X className="h-3 w-3 mr-1" /> Clear
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Results Count Banner */}
          <div className="mb-6 px-4 py-2 bg-muted rounded-md flex justify-between items-center">
            <span className="text-sm">
              Showing <span className="font-medium">{rides.length}</span> of{" "}
              <span className="font-medium">{totalCount}</span> rides
            </span>
            {filterCount > 0 && (
              <Button variant="link" onClick={handleResetFilters} className="h-auto p-0">
                Clear filters
              </Button>
            )}
          </div>

          {/* Ride Cards */}
          <div className="space-y-4">
            {isLoading && page === 1 ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <Skeleton key={`skeleton-${index}`} className="h-32 w-full" />
                ))}
              </div>
            ) : rides.length > 0 ? (
              <>
                {rides.map((ride, index) => (
                  <RideCard key={`${ride.id}-${index}`} ride={ride} />
                ))}
                {isLoading && page > 1 && (
                  <div className="text-center py-4">
                    <Loader2 className="animate-spin h-6 w-6 mx-auto text-muted-foreground" />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <CircleSlash className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No rides found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {filterCount > 0
                    ? "Try adjusting your filters or search criteria to see more results."
                    : "You don't have any ride history yet."}
                </p>
                {filterCount > 0 && (
                  <Button variant="outline" onClick={handleResetFilters} className="mt-4">
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}

            {/* Load More Button */}
            {hasMore && !isLoading && rides.length > 0 && (
              <div className="text-center mt-6">
                <Button onClick={handleLoadMore} disabled={isLoading} variant="outline" className="w-40">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  )
}

