"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Clock, User2 } from "lucide-react"
import Link from "next/link"
import type { User, Ride } from "@/types"

interface RideHistoryPageProps {
  currentUser: User
  rides: Ride[]
  fetchRideHistoryData: () => Promise<void>
}

export default function RideHistoryPage({ currentUser, rides, fetchRideHistoryData }: RideHistoryPageProps) {
  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return date.toLocaleDateString(undefined, options)
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Ride History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-200px)]">
            {rides.map((ride) => (
              <Link href={`/rides/${ride.id}`} key={ride.id}>
                <Card className="mb-4 hover:bg-accent transition-colors duration-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-medium">
                            {ride.from_location} to {ride.to_location}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatDateTime(ride.time)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {ride.requester_id === currentUser.id ? "Requested by you" : "You offered this ride"}
                          </span>
                        </div>
                      </div>
                      <div>{getStatusBadge(ride.status)}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

