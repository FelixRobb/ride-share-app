"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, User, Phone, MessageSquare, Send } from 'lucide-react';

interface User {
  id: string;
  name: string;
}

interface Ride {
  id: string;
  from_location: string;
  to_location: string;
  time: string;
  status: string;
  requester_id: string;
  accepter_id: string | null;
  rider_name: string;
  rider_phone: string;
  note: string;
}

interface Note {
  id: string;
  user_id: string;
  user_name: string;
  note: string;
  created_at: string;
}

export function RideDetailsPage({ rideId }: { rideId: string }) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    } else {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchRideDetails = async () => {
      try {
        const response = await fetch(`/api/rides/${rideId}`);
        if (response.ok) {
          const data = await response.json();
          setRide(data.ride);
          setNotes(data.notes || []);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch ride details. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching ride details:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (rideId) {
      fetchRideDetails();
    }
  }, [rideId, toast]);

  const handleAcceptRide = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        setRide((prevRide) => prevRide ? { ...prevRide, status: "accepted", accepter_id: currentUser.id } : null);
        toast({
          title: "Success",
          description: "You have successfully accepted the ride.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to accept ride. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error accepting ride:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/cancelrequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        setRide((prevRide) => prevRide ? { ...prevRide, status: "cancelled" } : null);
        toast({
          title: "Success",
          description: "Your ride request has been cancelled successfully.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to cancel request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOffer = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`/api/rides/${rideId}/canceloffer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (response.ok) {
        setRide((prevRide) => prevRide ? { ...prevRide, status: "pending", accepter_id: null } : null);
        toast({
          title: "Success",
          description: "Your ride offer has been cancelled successfully.",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to cancel offer. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim() && currentUser) {
      try {
        const response = await fetch(`/api/rides/${rideId}/notes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser.id, note: newNote }),
        });
        if (response.ok) {
          const data = await response.json();
          setNotes([...notes, data.note]);
          setNewNote("");
          toast({
            title: "Success",
            description: "Note added successfully.",
          });
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Failed to add note. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error adding note:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (!ride) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Ride Details</CardTitle>
        <CardDescription className="text-lg">
          From {ride.from_location} to {ride.to_location}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <Label className="font-semibold">From</Label>
              </div>
              <p className="ml-7">{ride.from_location}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary" />
                <Label className="font-semibold">To</Label>
              </div>
              <p className="ml-7">{ride.to_location}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Requester</Label>
              </div>
              <p className="ml-7">{ride.rider_name}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Contact Phone</Label>
              </div>
              <p className="ml-7">{ride.rider_phone || "Not provided"}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Date and Time</Label>
              </div>
              <p className="ml-7">{new Date(ride.time).toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label className="font-semibold">Status</Label>
              </div>
              <p className="ml-7 font-semibold">{ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="font-semibold">Initial Notes</Label>
            <p>{ride.note || "No initial notes provided"}</p>
          </div>
          <Separator />
          <div className="space-y-4">
            <Label className="font-semibold">Messages</Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {notes.map((note) => (
                <div key={note.id} className={`mb-4 ${note.user_id === currentUser?.id ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[80%] ${note.user_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-2`}>
                    <p className="text-sm">{note.note}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {note.user_name} - {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Type your message..."
                className="flex-grow"
              />
              <Button onClick={handleAddNote} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        {ride.requester_id === currentUser?.id && ride.status !== "cancelled" && (
          <Button variant="destructive" onClick={handleCancelRequest} className="w-full sm:w-auto">
            Cancel Request
          </Button>
        )}
        {ride.accepter_id === currentUser?.id && ride.status === "accepted" && (
          <Button variant="destructive" onClick={handleCancelOffer} className="w-full sm:w-auto">
            Cancel Offer
          </Button>
        )}
        {ride.status === "pending" && ride.requester_id !== currentUser?.id && (
          <Button onClick={handleAcceptRide} className="w-full sm:w-auto">
            Offer Ride
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

