"use client"

import {Search, User2, ArrowRight, CheckCircle, Filter, MapPin} from "lucide-react"
import {CalendarPlus2Icon as CalendarIcon2} from "lucide-react"
import {format, isToday, isYesterday, isThisWeek, isThisMonth} from "date-fns"
import Link from "next/link"
import {useRouter} from "next/navigation"
import {useState, useEffect, useMemo, useRef, useCallback} from "react"
import {toast} from "sonner"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Skeleton} from "@/components/ui/skeleton"
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {useMediaQuery} from "@/hooks/use-media-query"
import type {User, Ride, Contact} from "../types"
import {fetchDashboardData} from "@/utils/api"
import {useOnlineStatus} from "@/utils/useOnlineStatus"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Calendar} from "@/components/ui/calendar"
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover"
import {Separator} from "./ui/separator"

interface FilterProps {
    statusFilter: string | null
    setStatusFilter: (status: string | null) => void
    dateFilter: Date | null
    setDateFilter: (date: Date | null) => void
}

const FilterContent: React.FC<FilterProps> = ({statusFilter, setStatusFilter, dateFilter, setDateFilter}) => {
    return (
        <div className="grid gap-4 p-4">
            <div className="space-y-2">
                <h4 className="font-medium leading-none">Status</h4>
                <Select
                    value={statusFilter || "all"}
                    onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status"/>
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
            <div className="space-y-2 flex items-center justify-center flex-col">
                <h4 className="font-medium leading-none">Date</h4>
                <Calendar
                    mode="single"
                    selected={dateFilter !== null ? dateFilter : undefined}
                    onSelect={(day) => setDateFilter(day ?? null)}
                    initialFocus
                />
            </div>
        </div>
    )
}

const FilterPopover: React.FC<FilterProps> = (props) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-full">
                    <Filter className="mr-2 h-4 w-4"/>
                    Filters
                    {(props.statusFilter || props.dateFilter) &&
                        <span className="ml-2 h-2 w-2 rounded-full bg-primary"/>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <FilterContent {...props} />
                <div className="flex items-center justify-between p-4 pt-0">
                    <Button
                        variant="ghost"
                        onClick={() => {
                            props.setStatusFilter(null)
                            props.setDateFilter(null)
                        }}
                        className="h-10"
                    >
                        Clear Filters
                    </Button>
                    <Button className="h-10">Apply Filters</Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

const FilterDrawer: React.FC<FilterProps> = (props) => {
    return (
        <Drawer>
            <DrawerTrigger asChild>
                <Button variant="outline" className="h-10 w-full">
                    <Filter className="mr-2 h-4 w-4"/>
                    Filters
                    {(props.statusFilter || props.dateFilter) &&
                        <span className="ml-2 h-2 w-2 rounded-full bg-primary"/>}
                </Button>
            </DrawerTrigger>
            <DrawerContent>
                <DrawerHeader>
                    <DrawerTitle>Filters</DrawerTitle>
                </DrawerHeader>
                <FilterContent {...props} />
                <DrawerFooter className="pt-2">
                    <Button
                        onClick={() => {
                            props.setStatusFilter(null)
                            props.setDateFilter(null)
                        }}
                        variant="outline"
                    >
                        Clear Filters
                    </Button>
                    <DrawerClose asChild>
                        <Button>Apply Filters</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

const StatusBadge = ({status}: { status: string }) => {
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

interface DashboardPageProps {
    currentUser: User
    searchTerm: string
    setSearchTerm: (term: string) => void
    activeTab: string
    setActiveTab: (tab: string) => void
}

export default function DashboardPage({
                                          currentUser,
                                          searchTerm,
                                          setSearchTerm,
                                          activeTab,
                                          setActiveTab,
                                      }: DashboardPageProps) {
    const router = useRouter()
    const isOnline = useOnlineStatus()
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
    const [isInitialLoading, setIsInitialLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [dateFilter, setDateFilter] = useState<Date | null>(null)
    const [rides, setRides] = useState<Ride[]>([])
    const [contacts, setContacts] = useState<Contact[]>([])
    const isDesktop = useMediaQuery("(min-width: 500px)")
    const previousRidesRef = useRef<Ride[]>([])
    const previousContactsRef = useRef<Contact[]>([])

    const fetchData = useCallback(async (isInitial: boolean = false) => {
        if (isOnline && currentUser) {
            try {
                if (isInitial) {
                    setIsInitialLoading(true)
                }

                const data = await fetchDashboardData()

                // Only update state if data has changed
                const hasRidesChanged = JSON.stringify(data.rides) !== JSON.stringify(previousRidesRef.current)
                const hasContactsChanged = JSON.stringify(data.contacts) !== JSON.stringify(previousContactsRef.current)

                if (hasRidesChanged) {
                    setRides(data.rides)
                    previousRidesRef.current = data.rides
                }

                if (hasContactsChanged) {
                    setContacts(data.contacts)
                    previousContactsRef.current = data.contacts
                }

                // Only show toast if data has changed and it's not the initial load
                if (!isInitial && (hasRidesChanged || hasContactsChanged)) {
                    toast.success("Dashboard updated")
                }
            } catch {
                toast.error("Failed to fetch dashboard data. Please try again.")
            } finally {
                if (isInitial) {
                    setIsInitialLoading(false)
                }
            }
        }
    }, [isOnline, currentUser])

    useEffect(() => {
        // Initial data fetch
        fetchData(true)

        // Set up periodic refresh
        const intervalId = setInterval(() => fetchData(), 10000) // Refresh every 10 seconds
        return () => clearInterval(intervalId)
    }, [fetchData])

    const formatDateTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const options: Intl.DateTimeFormatOptions = {year: "numeric", month: "long", day: "numeric"}
        const formattedDate = date.toLocaleDateString(undefined, options)
        const formattedTime = date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
        return {
            date: formattedDate,
            time: formattedTime,
            relative: getRelativeTimeLabel(date),
        }
    }

    const getRelativeTimeLabel = (date: Date) => {
        if (isToday(date)) return "Today"
        if (isYesterday(date)) return "Yesterday"
        if (isThisWeek(date)) return format(date, "EEEE") // Day name
        if (isThisMonth(date)) return format(date, "MMMM d") // Month and day
        return format(date, "MMM d, yyyy") // Full date for older dates
    }

    const getOfferedByText = (ride: Ride) => {
        if (ride.accepter_id === currentUser.id) return "Me"
        const contact = contacts.find((c) => c.user_id === ride.accepter_id || c.contact_id === ride.accepter_id)
        return contact ? (contact.user_id === ride.accepter_id ? contact.user.name : contact.contact.name) : "Unknown"
    }

    const getRequesterName = (ride: Ride) => {
        if (ride.requester_id === currentUser.id) return "Me" // Or currentUser.name
        const contact = contacts.find((c) => c.user_id === ride.requester_id || c.contact_id === ride.requester_id)
        return contact ? (contact.user_id === ride.requester_id ? contact.user.name : contact.contact.name) : "Unknown"
    }

// This replaces the current filteredRides useMemo hook in the component

    const filteredRides = useMemo(() => {
        if (!localSearchTerm) {
            // If no search term, just apply other filters
            return rides.filter((ride) => {
                const matchesStatus = !statusFilter || ride.status === statusFilter;
                const matchesDate = !dateFilter || new Date(ride.time).toDateString() === dateFilter.toDateString();
                return matchesStatus && matchesDate;
            });
        }

        // For search with term, calculate relevance score for each ride
        return rides
            .map((ride) => {
                let score = 0;
                const searchTermLower = localSearchTerm.toLowerCase();

                // Exact matches get highest priority
                if (ride.from_location.toLowerCase() === searchTermLower) score += 100;
                if (ride.to_location.toLowerCase() === searchTermLower) score += 100;
                if (ride.rider_name.toLowerCase() === searchTermLower) score += 100;

                // Starts with matches get high priority
                if (ride.from_location.toLowerCase().startsWith(searchTermLower)) score += 75;
                if (ride.to_location.toLowerCase().startsWith(searchTermLower)) score += 75;
                if (ride.rider_name.toLowerCase().startsWith(searchTermLower)) score += 75;

                // Contains matches get medium priority
                if (ride.from_location.toLowerCase().includes(searchTermLower)) score += 50;
                if (ride.to_location.toLowerCase().includes(searchTermLower)) score += 50;
                if (ride.rider_name.toLowerCase().includes(searchTermLower)) score += 50;

                // Check for word boundaries to prioritize whole word matches
                const wordBoundaryCheck = (text: string) => {
                    const words = text.toLowerCase().split(/\s+|,/);
                    return words.some(word => word === searchTermLower) ? 25 : 0;
                };

                score += wordBoundaryCheck(ride.from_location);
                score += wordBoundaryCheck(ride.to_location);
                score += wordBoundaryCheck(ride.rider_name);

                // Additional search in note field with lower priority
                if (ride.note && ride.note.toLowerCase().includes(searchTermLower)) {
                    score += 15;
                }

                // If there's a phone number in the search and it matches rider_phone
                if (ride.rider_phone && searchTermLower.match(/\d+/) &&
                    ride.rider_phone.includes(searchTermLower)) {
                    score += 40;
                }

                // Check for partial matches in location context (city, state, etc.)
                const partialLocationMatch = (location: string) => {
                    const parts = location.toLowerCase().split(',');
                    return parts.some(part => part.trim().includes(searchTermLower)) ? 20 : 0;
                };

                score += partialLocationMatch(ride.from_location);
                score += partialLocationMatch(ride.to_location);

                // If this is a multi-word search term, check for matches of individual words
                if (searchTermLower.includes(' ')) {
                    const searchWords = searchTermLower.split(' ');
                    searchWords.forEach(word => {
                        if (word.length > 2) { // Only consider meaningful words (longer than 2 chars)
                            if (ride.from_location.toLowerCase().includes(word)) score += 10;
                            if (ride.to_location.toLowerCase().includes(word)) score += 10;
                            if (ride.rider_name.toLowerCase().includes(word)) score += 10;
                        }
                    });
                }

                // Apply other filters
                const matchesStatus = !statusFilter || ride.status === statusFilter;
                const matchesDate = !dateFilter || new Date(ride.time).toDateString() === dateFilter.toDateString();

                return {
                    ride,
                    score,
                    matchesFilters: matchesStatus && matchesDate
                };
            })
            .filter(item => item.score > 0 && item.matchesFilters) // Only keep matches that pass all filters
            .sort((a, b) => b.score - a.score) // Sort by descending score
            .map(item => item.ride); // Extract just the ride objects
    }, [rides, localSearchTerm, statusFilter, dateFilter]);

    const activeRides = useMemo(
        () =>
            filteredRides.filter(
                (ride) =>
                    (ride.requester_id === currentUser.id || ride.accepter_id === currentUser.id) &&
                    (ride.status === "pending" || ride.status === "accepted"),
            ),
        [filteredRides, currentUser.id],
    )

    const availableRides = useMemo(
        () => filteredRides.filter((ride) => ride.status === "pending" && ride.requester_id !== currentUser.id),
        [filteredRides, currentUser.id],
    )

    const historyRides = useMemo(
        () =>
            filteredRides.filter(
                (ride) =>
                    (ride.requester_id === currentUser.id || ride.accepter_id === currentUser.id) &&
                    (ride.status === "completed" || ride.status === "cancelled"),
            ),
        [filteredRides, currentUser.id],
    )

    useEffect(() => {
        setSearchTerm(localSearchTerm)
    }, [localSearchTerm, setSearchTerm])

    const RideCard = ({ride}: { ride: Ride }) => {
        const {time, relative} = formatDateTime(ride.time)

        // Extract just the first part of the location for a cleaner display
        const fromLocationParts = ride.from_location.split(",")
        const toLocationParts = ride.to_location.split(",")
        const fromLocationShort = fromLocationParts[0]
        const toLocationShort = toLocationParts[0]

        return (
            <Link href={`/rides/${ride.id}?from=${activeTab}`}>
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
                                    <div className="flex items-center space-x-2 mb-1">
                                        <CalendarIcon2 className="w-4 h-4 text-muted-foreground"/>
                                        <div className="flex flex-col items-start justify-center">
                                            <span className="text-sm font-medium">{relative}</span>
                                            <span className="text-sm text-muted-foreground">{time}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <User2 className="w-4 h-4 text-muted-foreground"/>
                                        <span className="text-sm text-muted-foreground">{getRequesterName(ride)}</span>
                                    </div>
                                </div>
                                <StatusBadge status={ride.status}/>
                            </div>

                            {/* Route information */}
                            <div className="flex items-center space-x-3">
                                <div className="flex flex-col items-center space-y-1">
                                    <MapPin className="w-3 h-3 rounded-full text-primary"></MapPin>
                                    <div className="w-0.5 h-10 bg-muted-foreground/30"></div>
                                    <MapPin className="w-3 h-3 rounded-full text-destructive"></MapPin>
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
                                        <CheckCircle className="w-5 h-5 text-blue-500"/>
                                    ) : (
                                        <ArrowRight
                                            className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
                                    )}
                                </div>
                            </div>

                            {/* Additional information */}
                            {(ride.status === "accepted" || ride.status === "completed") && ride.accepter_id && (
                                <>
                                    <Separator className="my-1"/>
                                    <div className="flex items-center space-x-2">
                                        <User2 className="w-4 h-4 text-muted-foreground"/>
                                        <span
                                            className="text-sm text-muted-foreground">Offered by: {getOfferedByText(ride)}</span>
                                    </div>
                                </>
                            )}
                            {ride.note && (
                                <>
                                    <Separator className="my-1"/>
                                    <div>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            <span className="font-medium">Note:</span> {ride.note}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        )
    }

    // Update the RideCardSkeleton component to match the new design
    const RideCardSkeleton = () => (
        <Card className="mb-4 border-l-4">
            <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col space-y-4">
                    <div className="flex items-start justify-between">
                        <Skeleton className="h-5 w-32"/>
                        <Skeleton className="h-6 w-20"/>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-center space-y-1">
                            <MapPin className="w-3 h-3 rounded-full text-muted"></MapPin>
                            <div className="w-0.5 h-10 bg-muted"></div>
                            <MapPin className="w-3 h-3 rounded-full text-muted"></MapPin>
                        </div>
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-5 w-full"/>
                            <Skeleton className="h-5 w-full"/>
                        </div>
                    </div>
                    <Skeleton className="h-4 w-3/4"/>
                </div>
            </CardContent>
        </Card>
    )

    const renderRides = (rides: Ride[]) => {
        if (rides.length === 0) {
            return <div className="text-center py-8 text-muted-foreground">No rides available</div>
        }
        return rides.map((ride) => <RideCard key={ride.id} ride={ride}/>)
    }

    const ImportantRides = () => {
        const now = new Date()
        const twoDaysFromNow = new Date()
        twoDaysFromNow.setDate(now.getDate() + 2)

        const upcomingRides = activeRides
            .filter((ride) => new Date(ride.time) > now && new Date(ride.time) < twoDaysFromNow)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
            .slice(0, 3)

        if (upcomingRides.length === 0) {
            return null
        }

        // Update the ImportantRides component to use the new card design
        const renderImportantRide = (ride: Ride) => {
            const {time, relative} = formatDateTime(ride.time)
            const isUserRequester = ride.requester_id === currentUser.id
            const actionNeeded = ride.status === "pending" ? (isUserRequester ? "Waiting for offer" : "Offer a ride") : ""

            // Extract just the first part of the location for a cleaner display
            const fromLocationParts = ride.from_location.split(",")
            const toLocationParts = ride.to_location.split(",")
            const fromLocationShort = fromLocationParts[0]
            const toLocationShort = toLocationParts[0]

            return (
                <Card
                    key={ride.id}
                    className={`mb-4 hover:bg-accent/50 transition-all duration-200 group border-l-4 hover:shadow-md 
            ${ride.status === "completed"
                        ? "border-blue-500"
                        : ride.status === "accepted"
                            ? "border-green-500"
                            : ride.status === "cancelled"
                                ? "border-destructive"
                                : ride.status === "pending"
                                    ? "border-secondary"
                                    : "border-border"
                    }`}>
                    <Link href={`/rides/${ride.id}?from=active`}>
                        <CardHeader className="pb-2 bg-primary/5">
                            <div className="flex justify-between items-start flex-col sm:flex-row">
                                <div className="">
                                    <CardTitle className="text-md flex items-center">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <CalendarIcon2 className="w-4 h-4 text-muted-foreground"/>
                                            <div className="flex flex-col items-start justify-center">
                                                <span className="text-sm font-medium">{relative}</span>
                                                <span className="text-sm text-muted-foreground">{time}</span>
                                            </div>
                                        </div>
                                    </CardTitle>
                                    <CardDescription className="flex items-center gap-2 ml-1 mb-1">
                                        <User2
                                            className="h-4 w-4 inline text-muted-foreground"/> {getRequesterName(ride)}
                                    </CardDescription>
                                </div>
                                <div
                                    className="flex flex-row justify-between items-center sm:justify-end sm:flex-col sm:items-end gap-4 sm:gap-1">
                                    <div>
                                        <StatusBadge status={ride.status}/>
                                    </div>
                                    <div>{actionNeeded && <Badge variant="destructive">{actionNeeded}</Badge>}</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 bg-primary/5">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="flex flex-col items-center space-y-1">
                                    <MapPin className="w-3 h-3 rounded-full text-primary"></MapPin>
                                    <div className="w-0.5 h-10 bg-muted-foreground/30"></div>
                                    <MapPin className="w-3 h-3 rounded-full text-destructive"></MapPin>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{fromLocationShort}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-full">
                                            {ride.from_location.replace(fromLocationShort + ",", "")}
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{toLocationShort}</p>
                                        <p className="text-xs text-muted-foreground truncate max-w-full">
                                            {ride.to_location.replace(toLocationShort + ",", "")}
                                        </p>
                                    </div>
                                </div>
                            </div>

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
                </Card>
            )
        }

        return (
            <div className="mb-6 bg-primary/5 rounded-lg p-4 border border-primary/8 flex flex-col">
                <div>
                    <h2 className="text-xl font-bold mb-2">Important Rides</h2>
                    <p className="text-sm text-muted-foreground">Your upcoming rides that need attention</p>
                </div>

                <div className="relative mt-4">
                    <ScrollArea className="w-full max-h-[350px] sm:max-h-[450px] overflow-y-auto">
                        <div className="flex flex-col">{upcomingRides.map(renderImportantRide)}</div>
                    </ScrollArea>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto" data-tutorial="dashboard">
            <Card className="shadow-lg min-h-min relative z-10">
                <CardHeader className="space-y-6">
                    <div>
                        <CardTitle className="text-2xl font-bold">Dashboard</CardTitle>
                        <CardDescription>Manage your rides and connections</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4" data-tutorial="search-filter">
                        <div className="relative flex-grow">
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"/>
                            <Input
                                id="search"
                                type="text"
                                placeholder="Search rides..."
                                value={localSearchTerm}
                                onChange={(e) => setLocalSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full h-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            {isDesktop ? (
                                <FilterPopover
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                />
                            ) : (
                                <FilterDrawer
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    dateFilter={dateFilter}
                                    setDateFilter={setDateFilter}
                                />
                            )}
                            <Button
                                className="h-10"
                                data-tutorial="create-ride"
                                variant="default"
                                onClick={() => router.push("/create-ride")}
                            >
                                Create Ride
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ImportantRides/>
                    <Tabs
                        defaultValue={activeTab}
                        onValueChange={(value) => {
                            setActiveTab(value)
                            router.push(`/dashboard?tab=${value}`, {scroll: false})
                        }}
                        className="w-full"
                    >
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
                                            Array(7)
                                                .fill(0)
                                                .map((_, i) => <RideCardSkeleton key={i}/>)
                                        ) : (
                                            <>
                                                {tab === "active" && renderRides(activeRides)}
                                                {tab === "available" && renderRides(availableRides)}
                                                {tab === "history" && (
                                                    <>
                                                        {renderRides(historyRides)}
                                                        <div className="mt-4 text-center">
                                                            <Button onClick={() => router.push("/ride-history")}
                                                                    variant="outline">
                                                                View Full Ride History
                                                            </Button>
                                                        </div>
                                                    </>
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
    )
}

