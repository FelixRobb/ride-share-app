"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  phone: string;
}

interface AssociatedPerson {
  id: string;
  name: string;
  relationship: string;
}

interface RideData {
  from_location: string;
  to_location: string;
  time: string;
  rider_name: string;
  rider_phone: string;
  note: string;
}

export function CreateRidePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [rideData, setRideData] = useState<RideData>({
    from_location: "",
    to_location: "",
    time: "",
    rider_name: "",
    rider_phone: "",
    note: "",
  });
  const [riderType, setRiderType] = useState("self");
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      const parsedUser: User = JSON.parse(user);
      setCurrentUser(parsedUser);
      setRideData(prev => ({
        ...prev,
        rider_name: parsedUser.name,
        rider_phone: parsedUser.phone,
      }));
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchAssociatedPeople = async () => {
      if (currentUser) {
        try {
          const response = await fetch(`/api/associated-people?userId=${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            setAssociatedPeople(data.associatedPeople);
          } else {
            console.error("Failed to fetch associated people");
          }
        } catch (error) {
          console.error("Error fetching associated people:", error);
        }
      }
    };

    fetchAssociatedPeople();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...rideData, requester_id: currentUser.id }),
      });
      if (response.ok) {
        toast({
          title: "Ride Created",
          description: "Your ride request has been created successfully.",
        });
        router.push("/dashboard");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to create ride. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating ride:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-[350px] mx-auto">
      <CardHeader>
        <CardTitle>Create a Ride</CardTitle>
        <CardDescription>Fill in the details for your ride request.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="from_location">From</Label>
              <Input
                id="from_location"
                value={rideData.from_location}
                onChange={(e) => setRideData((prev) => ({ ...prev, from_location: e.target.value }))}
                placeholder="Enter starting location"
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="to_location">To</Label>
              <Input
                id="to_location"
                value={rideData.to_location}
                onChange={(e) => setRideData((prev) => ({ ...prev, to_location: e.target.value }))}
                placeholder="Enter destination"
                required
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
                value={rideData.rider_phone}
                onChange={(e) => setRideData((prev) => ({ ...prev, rider_phone: e.target.value }))}
                placeholder="Enter rider's phone number"
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="note">Note (optional)</Label>
              <Input
                id="note"
                value={rideData.note}
                onChange={(e) => setRideData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Add a note for the driver"
              />
            </div>
          </div>
          <Button className="w-full mt-4" type="submit">
            Create Ride
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

