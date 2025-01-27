import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, RideData, AssociatedPerson } from "../types";
import { createRide } from "../utils/api";
import dynamic from 'next/dynamic';
import { Loader } from 'lucide-react'
import { useOnlineStatus } from "@/utils/useOnlineStatus";

const LocationSearch = dynamic(() => import('./LocationSearch'), { ssr: false });
const MapDialog = dynamic(() => import('./MapDialog'), { ssr: false });


interface CreateRidePageProps {
  currentUser: User;
  fetchUserData: (userId: string) => Promise<void>;
  setCurrentPage: (page: string) => void;
  associatedPeople: AssociatedPerson[];
}

export default function CreateRidePage({ currentUser, fetchUserData, setCurrentPage, associatedPeople }: CreateRidePageProps) {
  const [rideData, setRideData] = useState<RideData>({
    from_location: "",
    to_location: "",
    from_lat: 0,
    from_lon: 0,
    to_lat: 0,
    to_lon: 0,
    time: "",
    rider_name: currentUser?.name || "",
    rider_phone: currentUser?.phone || null,
    note: null,
  });
  const [riderType, setRiderType] = useState("self");
  const [isFromMapOpen, setIsFromMapOpen] = useState(false);
  const [isToMapOpen, setIsToMapOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Add state for mounted check
  const [isSubmitting, setIsSubmitting] = useState(false); // Added loading state
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setIsMounted(true); // Set mounted to true when component mounts
    return () => setIsMounted(false); // Set mounted to false when component unmounts
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    if (rideData.from_lat === 0 || rideData.from_lon === 0 || rideData.to_lat === 0 || rideData.to_lon === 0) {
      if (!isMounted) return;
      toast.error("Please select both 'From' and 'To' locations.");
      return;
    }
    try {
      setIsSubmitting(true);
      await createRide(rideData, currentUser.id);
      if (!isMounted) return;
      toast.success("Your ride request has been created successfully.");
      setCurrentPage("dashboard");
      void fetchUserData(currentUser.id);
    } catch (error) {
      if (!isMounted) return;
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (type: 'from' | 'to') => (location: { lat: number; lon: number; display_name: string }) => {
    setRideData(prev => ({
      ...prev,
      [`${type}_location`]: location.display_name,
      [`${type}_lat`]: location.lat,
      [`${type}_lon`]: location.lon,
    }));
  };

  const isClient = typeof window !== 'undefined';

  return (
    <Card className="w-full max-w-[350px] mx-auto" data-tutorial="ride-form">
      <CardHeader>
        <CardTitle>Create a Ride</CardTitle>
        <CardDescription>Fill in the details for your ride request.</CardDescription>
      </CardHeader>
      <CardContent>
      {!isOnline && (
          <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
            You are currently offline. Ride creation is disabled.
          </div>
        )}
        {isClient && (
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="from_location">From</Label>
                <LocationSearch
                  selectedLocation={rideData.from_location ? { lat: rideData.from_lat, lon: rideData.from_lon, display_name: rideData.from_location } : null}
                  label="From Location"
                  onOpenMap={() => setIsFromMapOpen(true)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="to_location">To</Label>
                <LocationSearch
                  selectedLocation={rideData.to_location ? { lat: rideData.to_lat, lon: rideData.to_lon, display_name: rideData.to_location } : null}
                  label="To Location"
                  onOpenMap={() => setIsToMapOpen(true)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="datetime-local"
                  value={rideData.time}
                  onChange={(e) => setRideData((prev) => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="rider_type">Rider</Label>
                <Select name="rider_type" value={riderType} onValueChange={setRiderType}>
                  <SelectTrigger id="rider_type">
                    <SelectValue placeholder="Select rider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Myself</SelectItem>
                    {associatedPeople.map((person) => (
                      <SelectItem key={person.id} value={`associated_${person.id}`}>
                        {person.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {riderType === "other" && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="rider_name">Rider Name</Label>
                  <Input
                    id="rider_name"
                    value={rideData.rider_name}
                    onChange={(e) => setRideData((prev) => ({ ...prev, rider_name: e.target.value }))}
                    placeholder="Enter rider's name"
                    required
                  />
                </div>
              )}
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="rider_phone">Rider Phone (optional)</Label>
                <Input
                  id="rider_phone"
                  value={rideData.rider_phone || ""}
                  onChange={(e) => setRideData((prev) => ({ ...prev, rider_phone: e.target.value }))}
                  placeholder="Enter rider's phone number"
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="note">Note (optional)</Label>
                <Input
                  id="note"
                  value={rideData.note || ""}
                  onChange={(e) => setRideData((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Add a note for the driver"
                />
              </div>
            </div>
            <Button className="w-full mt-4" type="submit" disabled={isSubmitting || !isOnline}>
              {isSubmitting ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
              {isSubmitting ? "Creating..." : "Create Ride"}
            </Button>
          </form>
        )}
      </CardContent>
      {isMounted && (
        <>
          <MapDialog
            isOpen={isFromMapOpen}
            onClose={() => setIsFromMapOpen(false)}
            onSelectLocation={handleLocationSelect('from')}
            initialLocation={rideData.from_lat && rideData.from_lon ? { lat: rideData.from_lat, lon: rideData.from_lon } : undefined}
          />
          <MapDialog
            isOpen={isToMapOpen}
            onClose={() => setIsToMapOpen(false)}
            onSelectLocation={handleLocationSelect('to')}
            initialLocation={rideData.to_lat && rideData.to_lon ? { lat: rideData.to_lat, lon: rideData.to_lon } : undefined}
          />

        </>
      )}
    </Card>
  );
}

