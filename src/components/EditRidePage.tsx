import { motion } from "framer-motion"
import { Loader, MapPin, Clock, UserIcon, FileText, ArrowRight } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { InlineDateTimePicker } from "@/components/InlineDateTimePicker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { updateRide, fetchRideDetails } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"

import type { RideData, User } from "../types"




const LocationSearch = dynamic(() => import("./LocationSearch"), { ssr: false })
const MapDialog = dynamic(() => import("./MapDialog"), { ssr: false })

interface EditRidePageProps {
  currentUser: User
  rideId: string
}

export default function EditRidePage({ currentUser, rideId }: EditRidePageProps) {
  const [rideData, setRideData] = useState<RideData | null>(null)
  const [isFromMapOpen, setIsFromMapOpen] = useState(false)
  const [isToMapOpen, setIsToMapOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const isOnline = useOnlineStatus()
  const router = useRouter()

  useEffect(() => {
    const fetchRideData = async () => {
      try {
        const ride = await fetchRideDetails(currentUser.id, rideId)
        setRideData({
          from_location: ride.from_location,
          to_location: ride.to_location,
          from_lat: ride.from_lat,
          from_lon: ride.from_lon,
          to_lat: ride.to_lat,
          to_lon: ride.to_lon,
          time: ride.time,
          rider_name: ride.rider_name,
          rider_phone: ride.rider_phone,
          note: ride.note,
        })
      } catch (error) {
        console.error("Error fetching ride details:", error)
        toast.error("Failed to fetch ride details. Please try again.")
      }
    }

    fetchRideData()
  }, [currentUser.id, rideId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rideData) return

    try {
      setIsSubmitting(true)
      await updateRide(rideId, rideData, currentUser.id)
      toast.success("Your ride has been updated successfully.")
      router.push(`/rides/${rideId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLocationSelect =
    (type: "from" | "to") => (location: { lat: number; lon: number; display_name: string }) => {
      setRideData((prev) =>
        prev
          ? {
              ...prev,
              [`${type}_location`]: location.display_name,
              [`${type}_lat`]: location.lat,
              [`${type}_lon`]: location.lon,
            }
          : null,
      )
    }

  const steps = [
    { title: "Location", icon: MapPin },
    { title: "Time", icon: Clock },
    { title: "Rider", icon: UserIcon },
    { title: "Details", icon: FileText },
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    if (!rideData) return null

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from_location">From</Label>
              <LocationSearch
                selectedLocation={{
                  lat: rideData.from_lat,
                  lon: rideData.from_lon,
                  display_name: rideData.from_location,
                }}
                label="From Location"
                onOpenMap={() => setIsFromMapOpen(true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_location">To</Label>
              <LocationSearch
                selectedLocation={{
                  lat: rideData.to_lat,
                  lon: rideData.to_lon,
                  display_name: rideData.to_location,
                }}
                label="To Location"
                onOpenMap={() => setIsToMapOpen(true)}
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="time">Pick Date & Time</Label>
              <InlineDateTimePicker
                value={new Date(rideData.time)}
                onChange={(date) => setRideData((prev) => (prev ? { ...prev, time: date.toISOString() } : null))}
              />
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rider_name">Rider Name</Label>
              <Input
                id="rider_name"
                value={rideData.rider_name}
                onChange={(e) => setRideData((prev) => (prev ? { ...prev, rider_name: e.target.value } : null))}
                placeholder="Enter rider's name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rider_phone">Rider Phone (optional)</Label>
              <Input
                id="rider_phone"
                value={rideData.rider_phone || ""}
                onChange={(e) => setRideData((prev) => (prev ? { ...prev, rider_phone: e.target.value } : null))}
                placeholder="Enter rider's phone number"
              />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={rideData.note || ""}
                onChange={(e) => setRideData((prev) => (prev ? { ...prev, note: e.target.value } : null))}
                placeholder="Add a note for the driver"
                rows={4}
              />
            </div>
          </div>
        )
      default:
        return null
    }
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-fit bg-background px-4 py-4">
      <Card className="w-full max-w-xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Edit Ride</CardTitle>
          <CardDescription>Update the details for your ride request.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          {!isOnline && (
            <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              You are currently offline. Ride editing is disabled.
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className={cn(
                      "flex flex-col items-center space-y-2",
                      index <= currentStep ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <step.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium">{step.title}</span>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-muted rounded-full">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              {renderStepContent()}
            </motion.div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between px-6 py-4">
          <Button type="button" onClick={prevStep} disabled={currentStep === 0} variant="outline">
            Previous
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || !isOnline}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Updating..." : "Update Ride"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <MapDialog
        isOpen={isFromMapOpen}
        onClose={() => setIsFromMapOpen(false)}
        onSelectLocation={handleLocationSelect("from")}
        initialLocation={{ lat: rideData?.from_lat ?? 0, lon: rideData?.from_lon ?? 0 }}
      />
      <MapDialog
        isOpen={isToMapOpen}
        onClose={() => setIsToMapOpen(false)}
        onSelectLocation={handleLocationSelect("to")}
        initialLocation={{ lat: rideData?.to_lat ?? 0, lon: rideData?.to_lon ?? 0 }}
      />
    </div>
  )
}

