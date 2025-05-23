"use client";

import "react-phone-number-input/style.css";
import { motion } from "framer-motion";
import { Loader, MapPin, Clock, UserIcon, ArrowRight, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import { toast } from "sonner";

import { InlineDateTimePicker } from "@/components/InlineDateTimePicker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DialogFooter,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

import type { RideData, AssociatedPerson, User } from "../types";
import { createRide, fetchCreateRideData } from "../utils/api";

const LocationSearch = dynamic(() => import("./LocationSearch"), {
  ssr: false,
});
const MapDialog = dynamic(() => import("./MapDialog"), { ssr: false });

interface CreateRidePageProps {
  currentUser: User;
}

const initialRideData: RideData = {
  from_location: "",
  from_lat: 0,
  from_lon: 0,
  to_location: "",
  to_lat: 0,
  to_lon: 0,
  time: (() => {
    try {
      // Create a date 24 hours from now in a safer way
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      if (isNaN(tomorrow.getTime())) {
        throw new Error("Invalid date created");
      }
      return tomorrow.toISOString();
    } catch {
      return new Date().toISOString(); // Fallback to current time
    }
  })(),
  rider_name: "",
  rider_phone: "",
  note: "",
};

export default function CreateRidePage({ currentUser }: CreateRidePageProps) {
  const [rideData, setRideData] = useState<RideData>({
    ...initialRideData,
    rider_name: currentUser?.name || "",
    rider_phone: currentUser?.phone || null,
  });
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [riderType, setRiderType] = useState("self");
  const [isFromMapOpen, setIsFromMapOpen] = useState(false);
  const [isToMapOpen, setIsToMapOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const isOnline = useOnlineStatus();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReusingRide = searchParams.get("reuse") === "true";

  useEffect(() => {
    if (isReusingRide) {
      // Use a timeout to ensure the toast appears after the page loads
      const timer = setTimeout(() => {
        toast.success(
          "Ride details loaded. Please update the time and any other details as needed."
        );
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isReusingRide]);

  // Fetch associated people data
  useEffect(() => {
    const fetchData = async () => {
      if (isOnline && currentUser) {
        try {
          setIsLoading(true);
          const data = await fetchCreateRideData();
          setAssociatedPeople(data.associatedPeople);
        } catch {
          toast.error("Failed to fetch user data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOnline, currentUser]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    // Check for reused ride data first (takes priority)
    const reusedRideData = localStorage.getItem("reuseRideData");
    if (reusedRideData) {
      const parsedData: RideData = JSON.parse(reusedRideData);
      setRideData({
        ...parsedData,
        // Ensure time is set to default (24 hours from now)
        time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // If we're reusing a ride, we want to show the first step (locations)
      setCurrentStep(0);

      // Remove the reused ride data from localStorage
      localStorage.removeItem("reuseRideData");
      return;
    }

    // If no reused ride data, check for draft ride data
    const storedRideData = localStorage.getItem("rideData");
    if (storedRideData) {
      const parsedData: RideData = JSON.parse(storedRideData);

      // Check if there's significant data to restore by excluding specified fields
      const hasSignificantData = Object.entries(parsedData).some(([key, value]) => {
        // Skip checking these fields
        if (key === "time" || key === "rider_name" || key === "rider_phone") {
          return false;
        }
        // Check if the value is non-empty and not the default value
        return (
          value !== "" &&
          value !== null &&
          value !== 0 &&
          JSON.stringify(value) !== JSON.stringify(initialRideData[key as keyof RideData])
        );
      });

      if (hasSignificantData) {
        setShowRestoreDialog(true);
        setRideData(parsedData);
      }
    }
  }, []);

  const handleRestoreData = () => {
    setShowRestoreDialog(false);
    const storedRideData = localStorage.getItem("rideData");
    if (storedRideData) {
      const parsedRideData: RideData = JSON.parse(storedRideData);
      setRideData(parsedRideData);
    }
    localStorage.removeItem("rideData");
  };

  const handleDiscardData = () => {
    setShowRestoreDialog(false);
    localStorage.removeItem("rideData");
    setRideData(initialRideData);
    setRiderType("self");
  };

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("rideData", JSON.stringify(rideData));
    }
  }, [rideData, isMounted]);

  const validateForm = () => {
    if (!rideData.from_location) {
      toast.error("Please select a from location.");
      return false;
    }
    if (!rideData.to_location) {
      toast.error("Please select a to location.");
      return false;
    }
    if (!rideData.time) {
      toast.error("Please select a time.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    if (
      rideData.from_lat === 0 ||
      rideData.from_lon === 0 ||
      rideData.to_lat === 0 ||
      rideData.to_lon === 0
    ) {
      if (!isMounted) return;
      toast.error("Please select both 'From' and 'To' locations.");
      return;
    }
    if (!validateForm()) {
      return;
    }
    try {
      setIsSubmitting(true);
      if (rideData.rider_phone && !rideData.rider_phone.startsWith("+")) {
        throw new Error("Invalid phone number format. Please use the international format.");
      }
      await createRide(rideData);
      if (!isMounted) return;
      toast.success("Your ride request has been created successfully.");
      localStorage.removeItem("rideData");
      localStorage.removeItem("reuseRideData");
      router.push("/dashboard");
    } catch (error) {
      if (!isMounted) return;
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect =
    (type: "from" | "to") => (location: { lat: number; lon: number; display_name: string }) => {
      setRideData((prev) => ({
        ...prev,
        [`${type}_location`]: location.display_name,
        [`${type}_lat`]: location.lat,
        [`${type}_lon`]: location.lon,
      }));
    };

  const isClient = typeof window !== "undefined";

  const steps = [
    { title: "Location", icon: MapPin },
    { title: "Time", icon: Clock },
    { title: "Rider", icon: UserIcon },
    { title: "Details", icon: FileText },
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    if (isLoading && currentStep === 2) {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="from_location">From</Label>
              <LocationSearch
                selectedLocation={
                  rideData.from_location
                    ? {
                        lat: rideData.from_lat,
                        lon: rideData.from_lon,
                        display_name: rideData.from_location,
                      }
                    : null
                }
                label="From Location"
                onOpenMap={() => setIsFromMapOpen(true)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_location">To</Label>
              <LocationSearch
                selectedLocation={
                  rideData.to_location
                    ? {
                        lat: rideData.to_lat,
                        lon: rideData.to_lon,
                        display_name: rideData.to_location,
                      }
                    : null
                }
                label="To Location"
                onOpenMap={() => setIsToMapOpen(true)}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <InlineDateTimePicker
              value={rideData.time ? new Date(rideData.time) : new Date()}
              onChange={(date) =>
                setRideData((prev) => {
                  // Ensure date is valid before calling toISOString
                  if (!(date instanceof Date) || isNaN(date.getTime())) {
                    // Fallback to current date + 24h
                    const fallbackDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    return {
                      ...prev,
                      time: fallbackDate.toISOString(),
                    };
                  }

                  return {
                    ...prev,
                    time: date.toISOString(),
                  };
                })
              }
            />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
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
              <div className="space-y-2">
                <Label htmlFor="rider_name">Rider Name</Label>
                <Input
                  id="rider_name"
                  value={rideData.rider_name}
                  onChange={(e) =>
                    setRideData((prev) => ({
                      ...prev,
                      rider_name: e.target.value,
                    }))
                  }
                  placeholder="Enter rider's name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rider_phone">Rider Phone (optional)</Label>
              <PhoneInput
                id="rider_phone"
                value={rideData.rider_phone || ""}
                onChange={(value) =>
                  setRideData((prev) => ({
                    ...prev,
                    rider_phone: value || null,
                  }))
                }
                placeholder="Enter rider's phone number"
                defaultCountry="PT"
                international
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                value={rideData.note || ""}
                onChange={(e) => setRideData((prev) => ({ ...prev, note: e.target.value }))}
                placeholder="Add a note for the driver"
                rows={4}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-fit bg-background px-4 py-4">
      <Card className="w-full max-w-xl mx-auto shadow-lg" data-tutorial="ride-form">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Create a Ride</CardTitle>
          <CardDescription>Fill in the details for your ride request.</CardDescription>
        </CardHeader>
        <CardContent className="px-6 py-4">
          {!isOnline && (
            <div className="mb-6 p-3 bg-yellow-100 text-yellow-800 rounded-md text-sm">
              You are currently offline. Ride creation is disabled.
            </div>
          )}
          {isClient && (
            <form onSubmit={handleSubmit}>
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.title}
                      className={cn(
                        "flex flex-col items-center space-y-2",
                        index <= currentStep ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          index <= currentStep ? "bg-primary text-primary-foreground" : "bg-muted"
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
                    animate={{
                      width: `${((currentStep + 1) / steps.length) * 100}%`,
                    }}
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
          )}
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
              disabled={isSubmitting || !isOnline || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <Loader className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? "Creating..." : "Create Ride"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {isMounted && (
        <>
          <MapDialog
            isOpen={isFromMapOpen}
            onClose={() => setIsFromMapOpen(false)}
            onSelectLocation={handleLocationSelect("from")}
            initialLocation={
              rideData.from_lat && rideData.from_lon
                ? { lat: rideData.from_lat, lon: rideData.from_lon }
                : undefined
            }
          />
          <MapDialog
            isOpen={isToMapOpen}
            onClose={() => setIsToMapOpen(false)}
            onSelectLocation={handleLocationSelect("to")}
            initialLocation={
              rideData.to_lat && rideData.to_lon
                ? { lat: rideData.to_lat, lon: rideData.to_lon }
                : undefined
            }
          />
        </>
      )}

      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent className="w-11/12 rounded-lg">
          <DialogHeader>
            <DialogTitle>Restore Previous Ride Data</DialogTitle>
            <DialogDescription>
              It seems you have unsaved ride data. Would you like to restore it?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {rideData.from_location && (
              <p>
                <strong>From:</strong> {rideData.from_location}
              </p>
            )}
            {rideData.to_location && (
              <p>
                <strong>To:</strong> {rideData.to_location}
              </p>
            )}
            {rideData.note && (
              <p>
                <strong>Notes:</strong> {rideData.note}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button className="mb-2" type="button" variant="outline" onClick={handleDiscardData}>
              Discard
            </Button>
            <Button className="mb-2" type="button" onClick={handleRestoreData}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
