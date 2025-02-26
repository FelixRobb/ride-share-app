"use client";

import type React from "react";

import { parsePhoneNumber } from "libphonenumber-js";
import {
  MapPin,
  LucideUser,
  Phone,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Send,
  Edit,
  Trash,
  Loader,
  Pencil,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { User, Ride, Contact, Note } from "@/types";
import {
  acceptRide,
  cancelRequest,
  cancelOffer,
  addNote,
  fetchNotes,
  editNote,
  deleteNote,
  markNoteAsSeen,
  fetchRideDetailsData,
  finishRide,
} from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

import "maplibre-gl/dist/maplibre-gl.css";
import { Textarea } from "./ui/textarea";

interface RideDetailsPageProps {
  ride: Ride;
  currentUser: User;
  contacts: Contact[];
}

export default function RideDetailsPage({
  ride: initialRide,
  currentUser,
  contacts: initialContacts,
}: RideDetailsPageProps) {
  const [ride, setRide] = useState<Ride>(initialRide);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedNoteContent, setEditedNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isCancelRequestDialogOpen, setIsCancelRequestDialogOpen] =
    useState(false);
  const [isCancelOfferDialogOpen, setIsCancelOfferDialogOpen] = useState(false);
  const [isFinishRideDialogOpen, setIsFinishRideDialogOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const isOnline = useOnlineStatus();
  const [isDeleteNoteDialogOpen, setIsDeleteNoteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (typeof window !== "undefined" && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  const getRequesterName = (ride: Ride) => {
    if (ride.requester_id === currentUser.id) {
      return currentUser.name;
    }
    const contact = contacts.find(
      (c) =>
        c.user_id === ride.requester_id || c.contact_id === ride.requester_id
    );
    return contact
      ? contact.user_id === ride.requester_id
        ? contact.user.name
        : contact.contact.name
      : "Unknown User";
  };

  const loadNotes = useCallback(async () => {
    if (
      isOnline &&
      (ride.status === "accepted" ||
        ride.status === "cancelled" ||
        ride.status === "completed")
    ) {
      try {
        const fetchedNotes = await fetchNotes(ride.id);
        setNotes(fetchedNotes || []);

        // Automatically mark new notes as seen
        const unseenNotes = fetchedNotes.filter(
          (note) =>
            note.user_id !== currentUser.id &&
            (!note.seen_by || !note.seen_by.includes(currentUser.id))
        );

        if (unseenNotes.length > 0) {
          await Promise.all(
            unseenNotes.map((note) => markNoteAsSeen(note.id, currentUser.id))
          );
        }

        // Scroll to bottom only on initial load
        if (notes.length === 0 && fetchedNotes.length > 0) {
          scrollToBottom();
        }
      } catch {
        if (isOnline) {
          toast.error("Failed to load notes. Please try again.");
        }
      }
    }
  }, [
    isOnline,
    ride.status,
    ride.id,
    notes.length,
    currentUser.id,
    scrollToBottom,
  ]);

  const refreshRideData = useCallback(async () => {
    if (isOnline) {
      try {
        const data = await fetchRideDetailsData(ride.id);
        setRide(data.ride);
        setContacts(data.contacts);
      } catch {
        toast.error("Failed to fetch ride details. Please try again.");
      }
    }
  }, [ride.id, isOnline]);

  useEffect(() => {
    loadNotes();
    scrollToBottom();
    const notesInterval = setInterval(loadNotes, 5000);

    return () => {
      clearInterval(notesInterval);
    };
  }, [loadNotes, refreshRideData, scrollToBottom]);

  useEffect(() => {
    const buildMap = async () => {
      if (mapRef.current && !map) {
        setIsLoadingMap(true);
        try {
          const mapContainer = mapRef.current;
          if (!mapContainer) {
            throw new Error("Map container is null");
          }

          // Calculate center coordinates
          const center = [
            (ride?.from_lon + ride?.to_lon) / 2 || 0,
            (ride?.from_lat + ride?.to_lat) / 2 || 0,
          ];

          // Initialize the map
          const newMap = new maplibregl.Map({
            container: mapContainer,
            style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
            center: center as [number, number],
            zoom: 10,
          });

          setMap(newMap);

          newMap.on("load", () => {
            if (ride) {
              // Add markers for the starting and ending points
              new maplibregl.Marker()
                .setLngLat([ride.from_lon, ride.from_lat])
                .addTo(newMap);
              new maplibregl.Marker()
                .setLngLat([ride.to_lon, ride.to_lat])
                .addTo(newMap);

              // Fit map bounds to markers
              newMap.fitBounds(
                [
                  [ride.from_lon, ride.from_lat],
                  [ride.to_lon, ride.to_lat],
                ],
                { padding: 50 }
              );
            }
            setIsLoadingMap(false);
          });
        } catch {
          setIsLoadingMap(false);
        }
      }
    };

    buildMap();
  }, [ride, map]);

  const handleAddNote = async (
    e?: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e && e.key !== "Enter") return;
    if (newNote.trim() && currentUser) {
      try {
        const addedNote = await addNote(ride.id, currentUser.id, newNote);
        if (addedNote) {
          setNotes((prevNotes) => [...prevNotes, addedNote]);
          setNewNote("");
          scrollToBottom();
          toast.success("Message sent successfully.");
        }
      } catch {
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  const handleEditNote = async (noteId: string) => {
    const noteToEdit = notes.find((note) => note.id === noteId);
    if (noteToEdit) {
      setEditingNoteId(noteId);
      setEditedNoteContent(noteToEdit.note);
    }
  };

  const handleSaveEdit = async () => {
    if (editingNoteId && editedNoteContent.trim()) {
      try {
        const updatedNote = await editNote(
          editingNoteId,
          currentUser.id,
          editedNoteContent
        );
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === editingNoteId ? updatedNote : note
          )
        );
        setEditingNoteId(null);
        setEditedNoteContent("");
        toast.success("Message edited successfully.");
      } catch {
        toast.error("Failed to edit message. Please try again.");
      }
    }
  };

  const confirmDeleteNote = async () => {
    if (noteToDeleteId) {
      try {
        await deleteNote(noteToDeleteId, currentUser.id);
        setNotes((prevNotes) =>
          prevNotes.filter((note) => note.id !== noteToDeleteId)
        );
        toast.success("Message deleted successfully.");
      } catch {
        toast.error("Failed to delete message. Please try again.");
      } finally {
        setIsDeleteNoteDialogOpen(false);
        setNoteToDeleteId(null);
      }
    }
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setIsDeleteNoteDialogOpen(true);
  };

  const handleAcceptRide = async () => {
    setIsLoading(true);
    try {
      await acceptRide(ride.id, currentUser.id);
      await fetchRideDetailsData(ride.id);
      await refreshRideData();
      toast.success("Ride offered successfully.");
    } catch {
      toast.error("Failed to accept ride. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = () => {
    setIsCancelRequestDialogOpen(true);
  };

  const confirmCancelRequest = async () => {
    try {
      setIsLoading(true);
      setIsCancelRequestDialogOpen(true);
      await cancelRequest(ride.id, currentUser.id);
      await fetchRideDetailsData(ride.id);
      toast.success("Ride request cancelled successfully.");
      setIsCancelRequestDialogOpen(false);
      router.push("/dashboard");
    } catch {
      toast.error("Failed to cancel request. Please try again.");
    }
  };

  const handleCancelOffer = () => {
    setIsCancelOfferDialogOpen(true);
  };

  const confirmCancelOffer = async () => {
    try {
      setIsLoading(true);
      setIsCancelOfferDialogOpen(false);
      await cancelOffer(ride.id, currentUser.id);
      await fetchRideDetailsData(ride.id);
      toast.success("Ride offer cancelled successfully.");
      setIsCancelOfferDialogOpen(false);
      router.push("/dashboard");
    } catch {
      toast.error("Failed to cancel offer. Please try again.");
    }
  };

  const handleFinishRide = async () => {
    setIsLoading(true);
    setIsFinishRideDialogOpen(false);
    try {
      await finishRide(ride.id, currentUser.id);
      await fetchRideDetailsData(ride.id);
      await refreshRideData();
      toast.success("Ride marked as completed.");
    } catch {
      toast.error("Failed to finish ride. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    if (userId === currentUser.id) {
      return currentUser.name;
    }
    const contact = contacts.find(
      (c) => c.user_id === userId || c.contact_id === userId
    );
    return contact
      ? contact.user_id === userId
        ? contact.user.name
        : contact.contact.name
      : "Unknown User";
  };

  const copyToClipboard = async (text: string) => {
    if (typeof window !== "undefined" && window.navigator?.clipboard) {
      try {
        await window.navigator.clipboard.writeText(text);
        toast.success("The address has been copied to your clipboard.");
      } catch {
        toast.error("Failed to copy the address to your clipboard.");
      }
    }
  };

  const openInGoogleMaps = (lat: number, lon: number) => {
    if (typeof window !== "undefined") {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
        "_blank"
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-500">
            Accepted
          </Badge>
        );
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "completed":
        return (
          <Badge variant="default" className="bg-blue-500">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  // Update the component to format the phone number for display
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return "Not provided";
    try {
      const phoneNumber = parsePhoneNumber(phone);
      return phoneNumber ? phoneNumber.formatInternational() : phone;
    } catch {
      return phone;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Ride Details</CardTitle>
        <CardDescription className="text-lg">
          From {ride.from_location} to {ride.to_location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="h-[300px] w-full relative border rounded-lg"
          ref={mapRef}
          style={{ width: "100%", height: "300px" }}
        >
          {isLoadingMap && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
              <Loader className="w-8 h-8 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-primary" />
              <Label className="font-semibold">From</Label>
            </div>
            <p className="ml-7">{ride.from_location}</p>
            <div className="ml-7 space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(ride.from_location)}
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInGoogleMaps(ride.from_lat, ride.from_lon)}
              >
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(ride.to_location)}
              >
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInGoogleMaps(ride.to_lat, ride.to_lon)}
              >
                Google Maps
              </Button>
            </div>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </div>
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <Label className="font-semibold">Initial Notes</Label>
          </div>
          <p className="ml-7">{ride.note || "No initial notes provided"}</p>
        </div>
        {(ride.status === "accepted" || ride.status === "completed") &&
          ride.accepter_id && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <LucideUser className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Offered by</Label>
              </div>
              <p className="ml-7">
                {ride.accepter_id === currentUser?.id
                  ? "Me"
                  : contacts.find(
                      (c) =>
                        c.user_id === ride.accepter_id ||
                        c.contact_id === ride.accepter_id
                    )?.contact?.name || "Unknown"}
              </p>
            </div>
          )}
        <Separator />
        {/* Messages section with improved styling */}
        {(ride.status === "accepted" ||
          ride.status === "cancelled" ||
          ride.status === "completed") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Messages</Label>
              </div>
              {notes.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {notes.length} {notes.length === 1 ? "message" : "messages"}
                </Badge>
              )}
            </div>

            <div className="rounded-lg border bg-card">
              <ScrollArea className="h-[400px] px-4 pt-4" ref={scrollAreaRef}>
                {notes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[350px] space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-center">
                      No messages yet
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Messages between you and other participants will appear
                      here
                    </p>
                  </div>
                ) : (
                  <div className="pb-4">
                    {notes.reduce((acc: JSX.Element[], note, index) => {
                      const currentDate = new Date(
                        note.created_at
                      ).toLocaleDateString();
                      const previousDate =
                        index > 0
                          ? new Date(
                              notes[index - 1].created_at
                            ).toLocaleDateString()
                          : null;
                      const nextNote =
                        index < notes.length - 1 ? notes[index + 1] : null;

                      // Add date separator
                      if (currentDate !== previousDate) {
                        acc.push(
                          <div
                            key={`date-separator-${currentDate}-${index}`}
                            className="relative flex py-3 my-2"
                          >
                            <div className="flex-grow border-t border-muted"></div>
                            <span className="flex-shrink mx-4 text-xs font-medium text-muted-foreground">
                              {currentDate === new Date().toLocaleDateString()
                                ? "Today"
                                : currentDate}
                            </span>
                            <div className="flex-grow border-t border-muted"></div>
                          </div>
                        );
                      }

                      const isCurrentUser = note.user_id === currentUser?.id;

                      // Check if this message is at the end of a consecutive group from the same user
                      const isLastInGroup =
                        !nextNote ||
                        nextNote.user_id !== note.user_id ||
                        new Date(nextNote.created_at).toLocaleDateString() !==
                          currentDate;

                      // Check if this is part of a message group
                      const isFirstInGroup =
                        index === 0 ||
                        notes[index - 1].user_id !== note.user_id ||
                        currentDate !== previousDate;

                      acc.push(
                        <div
                          key={`message-${note.id}-${index}`}
                          className={`group relative flex flex-col ${isCurrentUser ? "items-end" : "items-start"} 
                 ${isFirstInGroup ? "mt-4" : "mt-3"} 
                 ${!isLastInGroup ? "mb-3" : "mb-4"}`}
                        >
                          {/* Show name only for first message in a group when it's not current user */}
                          {isFirstInGroup && !isCurrentUser && (
                            <span className="text-xs font-medium text-muted-foreground ml-10 mb-1">
                              {getUserName(note.user_id)}
                            </span>
                          )}

                          <div className="flex items-end gap-2 max-w-[85%]">
                            {/* Only show icon if this is the last message in a consecutive group */}
                            {!isCurrentUser && !isLastInGroup && (
                              <div className="w-8 h-8 invisible">
                                <span className="sr-only">User</span>
                              </div>
                            )}

                            {/* Message content with hover-activated action buttons for current user */}
                            <div className="relative">
                              <div
                                className={`px-4 py-2 shadow-sm
              ${
                isCurrentUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }
              ${
                !isFirstInGroup && !isLastInGroup
                  ? "rounded-lg"
                  : isFirstInGroup && !isLastInGroup
                    ? isCurrentUser
                      ? "rounded-lg rounded-br-none"
                      : "rounded-lg rounded-bl-none"
                    : !isFirstInGroup && isLastInGroup
                      ? isCurrentUser
                        ? "rounded-lg rounded-tr-sm"
                        : "rounded-lg rounded-tl-sm"
                      : isCurrentUser
                        ? "rounded-2xl rounded-br-none"
                        : "rounded-2xl rounded-bl-none"
              }
            `}
                              >
                                {editingNoteId === note.id ? (
                                  <div className="space-y-2 w-full">
                                    <Textarea
                                      value={editedNoteContent}
                                      onChange={(e) =>
                                        setEditedNoteContent(e.target.value)
                                      }
                                      className="bg-background resize-none"
                                      placeholder="Edit your message..."
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                      <Button
                                        onClick={() => setEditingNoteId(null)}
                                        size="sm"
                                        variant="outline"
                                        disabled={!isOnline}
                                        className="h-8 px-3"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleSaveEdit}
                                        size="sm"
                                        disabled={
                                          !isOnline || !editedNoteContent.trim()
                                        }
                                        className="h-8 px-3"
                                      >
                                        Save changes
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                      {note.note}
                                    </p>
                                    <div
                                      className={`flex items-center text-xs opacity-70 mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}
                                    >
                                      <span>
                                        {new Date(
                                          note.created_at
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                        {note.is_edited && " • edited"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action buttons overlay for current user messages */}
                              {isCurrentUser && !editingNoteId && (
                                <div className="absolute -top-3 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
                                  <div className="bg-background/90 backdrop-blur-sm rounded-full shadow-md border border-border flex overflow-hidden p-0.5">
                                    <Button
                                      onClick={() => handleEditNote(note.id)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 rounded-full hover:bg-primary/10 hover:text-primary"
                                      disabled={!isOnline}
                                    >
                                      <Edit className="h-3 w-3" />
                                      <span className="sr-only">Edit</span>
                                    </Button>
                                    <Button
                                      onClick={() => handleDeleteNote(note.id)}
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                      disabled={!isOnline}
                                    >
                                      <Trash className="h-3 w-3" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Show user icon only at the bottom of a group */}
                            {!isCurrentUser && isLastInGroup && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <LucideUser className="w-4 h-4 text-primary" />
                              </div>
                            )}

                            {/* Current user icon at the bottom of their message group */}
                            {isCurrentUser && !isLastInGroup && (
                              <div className="w-8 h-8 invisible">
                                <span className="sr-only">Me</span>
                              </div>
                            )}

                            {isCurrentUser && isLastInGroup && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <LucideUser className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      return acc;
                    }, [])}
                  </div>
                )}
              </ScrollArea>

              {/* Message input area with improved styling */}
              {(ride.status === "accepted" || ride.status === "completed") && (
                <div className="border-t p-3">
                  <div className="flex items-center gap-2">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      onKeyDown={(e) => handleAddNote(e)}
                      placeholder="Type your message..."
                      className="flex-grow bg-background border-muted resize-none overflow-hidden"
                      rows={1}
                      onInput={(e) => {
                        e.currentTarget.style.height = "auto";
                        e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                      }}
                      disabled={!isOnline}
                    />
                    <Button
                      onClick={() => handleAddNote()}
                      size="icon"
                      disabled={!isOnline || !newNote.trim()}
                      className="h-10 w-10 shrink-0 rounded-full"
                    >
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send message</span>
                    </Button>
                  </div>
                  {!isOnline && (
                    <p className="mt-2 text-xs text-destructive">
                      You&apos;re offline. Messages will be sent when you
                      reconnect.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-2">
        {ride.status === "pending" && ride.requester_id === currentUser?.id && (
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
        {ride.requester_id === currentUser?.id &&
          ride.status !== "cancelled" &&
          ride.status !== "completed" && (
            <Button
              variant="destructive"
              onClick={handleCancelRequest}
              className="w-full sm:w-auto"
              disabled={isLoading || !isOnline}
            >
              {isLoading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                "Cancel Request"
              )}
            </Button>
          )}
        {ride.accepter_id === currentUser?.id && ride.status === "accepted" && (
          <Button
            variant="destructive"
            onClick={handleCancelOffer}
            className="w-full sm:w-auto"
            disabled={isLoading || !isOnline}
          >
            {isLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              "Cancel Offer"
            )}
          </Button>
        )}
        {ride.status === "pending" && ride.requester_id !== currentUser?.id && (
          <Button
            onClick={handleAcceptRide}
            className="w-full sm:w-auto"
            disabled={isLoading || !isOnline}
          >
            {isLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              "Offer Ride"
            )}
          </Button>
        )}
        {ride.status === "accepted" &&
          (ride.requester_id === currentUser?.id ||
            ride.accepter_id === currentUser?.id) && (
            <Button
              onClick={() => setIsFinishRideDialogOpen(true)}
              className="w-full sm:w-auto"
              disabled={isLoading || !isOnline}
            >
              {isLoading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                "Finish Ride"
              )}
            </Button>
          )}
      </CardFooter>

      <Dialog
        open={isCancelRequestDialogOpen}
        onOpenChange={setIsCancelRequestDialogOpen}
      >
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Cancel Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ride request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="mb-2"
              variant="outline"
              onClick={() => setIsCancelRequestDialogOpen(false)}
            >
              No, Keep Request
            </Button>
            <Button
              className="mb-2"
              variant="destructive"
              onClick={confirmCancelRequest}
            >
              Yes, Cancel Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCancelOfferDialogOpen}
        onOpenChange={setIsCancelOfferDialogOpen}
      >
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Cancel Offer</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this ride offer?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="mb-2"
              variant="outline"
              onClick={() => setIsCancelOfferDialogOpen(false)}
            >
              No, Keep Offer
            </Button>
            <Button
              className="mb-2"
              variant="destructive"
              onClick={confirmCancelOffer}
            >
              Yes, Cancel Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFinishRideDialogOpen}
        onOpenChange={setIsFinishRideDialogOpen}
      >
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Finish Ride</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this ride as completed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="mb-2"
              variant="outline"
              onClick={() => setIsFinishRideDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="mb-2" onClick={handleFinishRide}>
              Yes, Finish Ride
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isDeleteNoteDialogOpen}
        onOpenChange={setIsDeleteNoteDialogOpen}
      >
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="mb-2"
              variant="outline"
              onClick={() => setIsDeleteNoteDialogOpen(false)}
            >
              No, Keep Message
            </Button>
            <Button
              className="mb-2"
              variant="destructive"
              onClick={confirmDeleteNote}
            >
              Yes, Delete Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
