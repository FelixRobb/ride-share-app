"use client"

import { DialogFooter } from "@/components/ui/dialog"

import type React from "react"

import { parsePhoneNumber } from "libphonenumber-js"
import {
  MapPin,
  LucideUser,
  Phone,
  Clock,
  AlertCircle,
  FileText,
  AlertTriangle,
  Wifi,
  Search,
  ShieldAlert,
  ServerCrash,
  Loader
} from "lucide-react"
import maplibregl from "maplibre-gl"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ReportDialog } from "@/components/ReportDialog"
import type { User, Ride, Contact } from "@/types"
import { acceptRide, cancelRequest, cancelOffer, fetchRideDetailsData, finishRide } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Pencil } from "lucide-react"
import { RideMessages } from "@/components/RideMessages"

import "maplibre-gl/dist/maplibre-gl.css"

interface RideDetailsPageProps {
  currentUser: User
  rideId: string
}

// Define error types for better handling
type ErrorType = "permission" | "not_found" | "network" | "server" | "unknown"

interface ErrorState {
  type: ErrorType
  message: string
  status?: number
}

export default function RideDetailsPage({ currentUser, rideId }: RideDetailsPageProps) {
  const [isFetching, setIsFetching] = useState(true)
  const [ride, setRide] = useState<Ride | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const router = useRouter()
  const [isCancelRequestDialogOpen, setIsCancelRequestDialogOpen] = useState(false)
  const [isCancelOfferDialogOpen, setIsCancelOfferDialogOpen] = useState(false)
  const [isFinishRideDialogOpen, setIsFinishRideDialogOpen] = useState(false)
  const mapRef = useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<maplibregl.Map | null>(null)
  const [isLoadingMap, setIsLoadingMap] = useState(true)
  const isOnline = useOnlineStatus()
  // Replace simple permission error with comprehensive error state
  const [error, setError] = useState<ErrorState | null>(null)

  const fetchData = useCallback(
    async (silent = false) => {
      if (!isOnline) {
        if (!silent) {
          setError({
            type: "network",
            message: "You're currently offline. Please check your internet connection and try again.",
            status: 0,
          })
        }
        return
      }

      try {
        if (!silent) {
          setIsLoading(true)
        } else {
          setIsRefreshing(true)
        }

        const data = await fetchRideDetailsData(rideId)
        setRide(data.ride)
        setContacts(data.contacts)
        setError(null) // Clear any previous errors
      } catch (err) {
        const typedError = err as { message?: string; status?: number; code?: string }

        // Set fetching to false on error
        setIsFetching(false)

        if (!silent) {
          // Determine error type based on status code and error code
          if (typedError.status === 403) {
            setError({
              type: "permission",
              message: typedError.message || "You do not have permission to view this ride",
              status: 403,
            })
          } else if (typedError.status === 404) {
            setError({
              type: "not_found",
              message: typedError.message || "The requested ride could not be found",
              status: 404,
            })
          } else if (typedError.status === 0 || typedError.code === "network_error") {
            setError({
              type: "network",
              message: "Unable to connect to the server. Please check your internet connection and try again.",
              status: 0,
            })
          } else if (typedError.status && typedError.status >= 500) {
            setError({
              type: "server",
              message: typedError.message || "A server error occurred. Please try again later.",
              status: typedError.status,
            })
          } else {
            setError({
              type: "unknown",
              message: typedError.message || "An unexpected error occurred. Please try again.",
              status: typedError.status,
            })
          }
        } else if (isOnline && silent && !error) {
          // Only show toast for silent refreshes (background updates)
          // and don't show it when we're displaying the error UI
          toast.error("Failed to refresh ride details. Please try again.")
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [isOnline, rideId, error],
  )

  useEffect(() => {
    if (isFetching) {
      fetchData()
    }

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      if (isFetching) {
        fetchData(true) // Silent refresh
      }
    }, 10000)

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchData, isFetching])

  const getRequesterName = (ride: Ride) => {
    if (ride.requester_id === currentUser.id) {
      return currentUser.name
    }
    const contact = contacts.find((c) => c.user_id === ride.requester_id || c.contact_id === ride.requester_id)
    return contact ? (contact.user_id === ride.requester_id ? contact.user.name : contact.contact.name) : "Unknown User"
  }

  useEffect(() => {
    const buildMap = async () => {
      if (mapRef.current && !map && ride) {
        setIsLoadingMap(true)
        try {
          const mapContainer = mapRef.current
          if (!mapContainer) {
            throw new Error("Map container is null")
          }

          // Calculate center coordinates
          const center = [(ride.from_lon + ride.to_lon) / 2 || 0, (ride.from_lat + ride.to_lat) / 2 || 0]

          // Initialize the map
          const newMap = new maplibregl.Map({
            container: mapContainer,
            style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
            center: center as [number, number],
            zoom: 10,
          })

          setMap(newMap)

          newMap.on("load", () => {
            if (ride) {
              // Add markers for the starting and ending points
              new maplibregl.Marker().setLngLat([ride.from_lon, ride.from_lat]).addTo(newMap)
              new maplibregl.Marker().setLngLat([ride.to_lon, ride.to_lat]).addTo(newMap)

              // Fit map bounds to markers
              newMap.fitBounds(
                [
                  [ride.from_lon, ride.from_lat],
                  [ride.to_lon, ride.to_lat],
                ],
                { padding: 50 },
              )
            }
            setIsLoadingMap(false)
          })
        } catch {
          setIsLoadingMap(false)
        }
      }
    }

    buildMap()
  }, [ride, map])

  const handleAcceptRide = async () => {
    if (!ride) return

    setIsActionLoading(true)
    try {
      await acceptRide(ride.id, currentUser.id)
      await fetchData(true)
      toast.success("Ride offered successfully.")
    } catch {
      toast.error("Failed to accept ride. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancelRequest = () => {
    setIsCancelRequestDialogOpen(true)
  }

  const confirmCancelRequest = async () => {
    if (!ride) return

    try {
      setIsActionLoading(true)
      setIsCancelRequestDialogOpen(false)
      await cancelRequest(ride.id, currentUser.id)
      await fetchData(true)
      toast.success("Ride request cancelled successfully.")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to cancel request. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancelOffer = () => {
    setIsCancelOfferDialogOpen(true)
  }

  const confirmCancelOffer = async () => {
    if (!ride) return

    try {
      setIsActionLoading(true)
      setIsCancelOfferDialogOpen(false)
      await cancelOffer(ride.id, currentUser.id)
      await fetchData(true)
      toast.success("Ride offer cancelled successfully.")
      setIsCancelOfferDialogOpen(false)
      router.push("/dashboard")
    } catch {
      toast.error("Failed to cancel offer. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleFinishRide = async () => {
    if (!ride) return

    setIsActionLoading(true)
    setIsFinishRideDialogOpen(false)
    try {
      await finishRide(ride.id, currentUser.id)
      await fetchData(true)
      toast.success("Ride marked as completed.")
    } catch {
      toast.error("Failed to finish ride. Please try again.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    if (typeof window !== "undefined" && window.navigator?.clipboard) {
      try {
        await window.navigator.clipboard.writeText(text)
        toast.success("The address has been copied to your clipboard.")
      } catch {
        toast.error("Failed to copy the address to your clipboard.")
      }
    }
  }

  const openInGoogleMaps = (lat: number, lon: number) => {
    if (typeof window !== "undefined") {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, "_blank")
    }
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

  // Update the component to format the phone number for display
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return "Not provided"
    try {
      const phoneNumber = parsePhoneNumber(phone)
      return phoneNumber ? phoneNumber.formatInternational() : phone
    } catch {
      return phone
    }
  }

  // Helper functions for skeleton UI
  const LocationSkeleton = () => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
      <div className="ml-7 h-4 w-48 bg-muted animate-pulse rounded" />
      <div className="ml-7 space-x-2 flex">
        <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        <div className="h-8 w-28 bg-muted animate-pulse rounded" />
      </div>
    </div>
  )

  // Render different error states based on error type
  if (error) {
    let errorTitle = "Error"
    let errorIcon = <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
    const errorDescription = error.message
    let errorDetails: React.ReactNode = null
    const actionButton = (
      <Button onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
        Return to Dashboard
      </Button>
    )

    switch (error.type) {
      case "permission":
        errorTitle = "Access Denied"
        errorIcon = <ShieldAlert className="h-8 w-8 text-destructive mb-2" />
        errorDetails = (
          <>
            <p className="text-muted-foreground mb-4">
              You don&apos;t have permission to view this ride. This could be because:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-6">
              <li>You are not the requester or accepter of this ride</li>
              <li>The ride may have been deleted</li>
              <li>There might be a system error</li>
            </ul>
          </>
        )
        break

      case "not_found":
        errorTitle = "Ride Not Found"
        errorIcon = <Search className="h-8 w-8 text-destructive mb-2" />
        errorDetails = (
          <>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find the ride you&apos;re looking for. This could be because:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-6">
              <li>The ride has been deleted</li>
              <li>The ride ID is incorrect</li>
              <li>The ride never existed</li>
            </ul>
          </>
        )
        break

      case "network":
        errorTitle = "Connection Error"
        errorIcon = <Wifi className="h-8 w-8 text-destructive mb-2" />
        errorDetails = (
          <>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t connect to our servers. This could be because:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-6">
              <li>Your internet connection is offline</li>
              <li>Our servers are temporarily unavailable</li>
              <li>There might be a network issue</li>
            </ul>
          </>
        )
        break

      case "server":
        errorTitle = "Server Error"
        errorIcon = <ServerCrash className="h-8 w-8 text-destructive mb-2" />
        errorDetails = (
          <>
            <p className="text-muted-foreground mb-4">
              Our servers encountered an error while processing your request. This could be because:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-6">
              <li>Our servers are experiencing high load</li>
              <li>There&apos;s a temporary issue with our database</li>
              <li>We&apos;re currently performing maintenance</li>
            </ul>
          </>
        )
        break

      default:
        errorTitle = "Unexpected Error"
        errorIcon = <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        errorDetails = (
          <p className="text-muted-foreground mb-6">
            An unexpected error occurred while trying to load this ride. Please try again or contact support if the
            problem persists.
          </p>
        )
    }

    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center">{errorIcon}</div>
          <CardTitle className="text-2xl font-bold">{errorTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-destructive">Error Details</h3>
                <p className="text-destructive/90 mt-1">{errorDescription}</p>
              </div>
            </div>
          </div>
          {errorDetails}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">{actionButton}</CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl font-bold">
              {isLoading ? <div className="h-8 w-32 bg-muted animate-pulse rounded" /> : "Ride Details"}
            </CardTitle>
            <CardDescription className="text-lg">
              {isLoading ? (
                <div className="h-6 w-64 bg-muted animate-pulse rounded mt-2" />
              ) : (
                <>
                  From {ride?.from_location} to {ride?.to_location}
                </>
              )}
            </CardDescription>
          </div>
          {!isLoading && ride && ride.status !== "pending" && ride.status !== "cancelled" && (
            <ReportDialog
              reportedId={ride.requester_id === currentUser?.id ? ride.accepter_id || "" : ride.requester_id}
              reportedName={
                ride.requester_id === currentUser?.id
                  ? contacts.find((c) => c.user_id === ride.accepter_id || c.contact_id === ride.accepter_id)?.contact
                    ?.name || "User"
                  : getRequesterName(ride)
              }
              reportType="ride"
              rideId={ride.id}
              trigger={
                <Button variant="ghost" size="default" className="text-destructive hover:bg-destructive/10 ml-4">
                  <AlertTriangle className="h-5 w-5" />
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="h-[300px] w-full relative border rounded-lg"
          ref={mapRef}
          style={{ width: "100%", height: "300px" }}
        >
          {(isLoadingMap || isLoading || !ride) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <Loader className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <LocationSkeleton />
              <LocationSkeleton />
            </>
          ) : ride ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">From</Label>
                </div>
                <p className="ml-7">{ride.from_location}</p>
                <div className="ml-7 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(ride.from_location)}>
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openInGoogleMaps(ride.from_lat, ride.from_lon)}>
                    Google Maps
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">To</Label>
                </div>
                <p className="ml-7">{ride.to_location}</p>
                <div className="ml-7 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(ride.to_location)}>
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openInGoogleMaps(ride.to_lat, ride.to_lon)}>
                    Google Maps
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="ml-7 h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="ml-7 h-4 w-40 bg-muted animate-pulse rounded" />
              </div>
            </>
          ) : ride ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <LucideUser className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Requester</Label>
                </div>
                <p className="ml-7">{getRequesterName(ride)}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Contact Phone</Label>
                </div>
                <p className="ml-7">{formatPhoneNumber(ride.rider_phone)}</p>
              </div>
            </>
          ) : null}
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isLoading ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="ml-7 h-4 w-40 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="ml-7 h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            </>
          ) : ride ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Date and Time</Label>
                </div>
                <p className="ml-7">{new Date(ride.time).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <Label className="font-semibold">Status</Label>
                </div>
                <div>
                  {getStatusBadge(ride.status)}
                  {ride.is_edited && (
                    <Badge variant="secondary" className="ml-2">
                      Edited
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
        <Separator />
        {isLoading ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
            </div>
            <div className="ml-7 h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        ) : ride ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <Label className="font-semibold">Initial Notes</Label>
            </div>
            <p className="ml-7">{ride.note || "No initial notes provided"}</p>
          </div>
        ) : null}

        {!isLoading && ride && (ride.status === "accepted" || ride.status === "completed") && ride.accepter_id && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <LucideUser className="w-5 h-5 text-primary" />
              <Label className="font-semibold">Offered by</Label>
            </div>
            <p className="ml-7">
              {ride.accepter_id === currentUser?.id
                ? "Me"
                : contacts.find((c) => c.user_id === ride.accepter_id || c.contact_id === ride.accepter_id)?.contact
                  ?.name || "Unknown"}
            </p>
          </div>
        )}
        <Separator />
        {!isLoading &&
          ride &&
          (ride.status === "accepted" || ride.status === "cancelled" || ride.status === "completed") && (
            <RideMessages
              ride={ride}
              currentUser={currentUser}
              contacts={contacts}
              isOnline={isOnline}
              isRefreshing={isRefreshing}
            />
          )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        {error && (
          <div className="text-red-500">
            <AlertTriangle className="inline-block h-4 w-4 mr-1 align-text-top" />
            {(error as ErrorState).message}
          </div>
        )}
        {!isLoading && ride && ride.status === "pending" && ride.requester_id === currentUser?.id && (
          <Button
            variant="outline"
            onClick={() => router.push(`/rides/${ride.id}/edit`)}
            className="w-full sm:w-auto"
            disabled={!isOnline}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit Ride
          </Button>
        )}
        {!isLoading &&
          ride &&
          ride.requester_id === currentUser?.id &&
          ride.status !== "cancelled" &&
          ride.status !== "completed" && (
            <Button
              variant="destructive"
              onClick={handleCancelRequest}
              className="w-full sm:w-auto"
              disabled={isActionLoading || !isOnline}
            >
              {isActionLoading ? <Loader className="animate-spin h-5 w-5" /> : "Cancel Request"}
            </Button>
          )}
        {!isLoading && ride && ride.accepter_id === currentUser?.id && ride.status === "accepted" && (
          <Button
            variant="destructive"
            onClick={handleCancelOffer}
            className="w-full sm:w-auto"
            disabled={isActionLoading || !isOnline}
          >
            {isActionLoading ? <Loader className="animate-spin h-5 w-5" /> : "Cancel Offer"}
          </Button>
        )}
        {!isLoading && ride && ride.status === "pending" && ride.requester_id !== currentUser?.id && (
          <Button onClick={handleAcceptRide} className="w-full sm:w-auto" disabled={isActionLoading || !isOnline}>
            {isActionLoading ? <Loader className="animate-spin h-5 w-5" /> : "Offer Ride"}
          </Button>
        )}
        {!isLoading &&
          ride &&
          ride.status === "accepted" &&
          (ride.requester_id === currentUser?.id || ride.accepter_id === currentUser?.id) && (
            <Button
              onClick={() => setIsFinishRideDialogOpen(true)}
              className="w-full sm:w-auto"
              disabled={isActionLoading || !isOnline}
            >
              {isActionLoading ? <Loader className="animate-spin h-5 w-5" /> : "Finish Ride"}
            </Button>
          )}
      </CardFooter>

      <Dialog open={isCancelRequestDialogOpen} onOpenChange={setIsCancelRequestDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Cancel Request</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this ride request?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setIsCancelRequestDialogOpen(false)}>
              No, Keep Request
            </Button>
            <Button className="mb-2" variant="destructive" onClick={confirmCancelRequest}>
              Yes, Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCancelOfferDialogOpen} onOpenChange={setIsCancelOfferDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Cancel Offer</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this ride offer?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setIsCancelOfferDialogOpen(false)}>
              No, Keep Offer
            </Button>
            <Button className="mb-2" variant="destructive" onClick={confirmCancelOffer}>
              Yes, Cancel Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFinishRideDialogOpen} onOpenChange={setIsFinishRideDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Finish Ride</DialogTitle>
            <DialogDescription>Are you sure you want to mark this ride as completed?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setIsFinishRideDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="mb-2" onClick={handleFinishRide}>
              Yes, Finish Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

