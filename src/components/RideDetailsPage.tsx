import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, LucideUser, Phone, Clock, AlertCircle, FileText, MessageSquare, Send, Edit, Trash, ArrowBigLeft, Loader, Map } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact, Note } from "@/types"
import { acceptRide, cancelRequest, cancelOffer, addNote, fetchNotes, editNote, deleteNote, markNoteAsSeen, fetchRideDetails } from "@/utils/api"
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet'

interface RideDetailsPageProps {
  ride: Ride
  currentUser: User
  contacts: Contact[]
  fetchUserData: () => Promise<void>
}

export default function RideDetailsPage({ ride: initialRide, currentUser, contacts, fetchUserData }: RideDetailsPageProps) {
  const [ride, setRide] = useState<Ride>(initialRide)
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editedNoteContent, setEditedNoteContent] = useState("")
  const [loading, setLoading] = useState(false);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const router = useRouter()
  const { toast } = useToast()
  const [isCancelRequestDialogOpen, setIsCancelRequestDialogOpen] = useState(false);
  const [isCancelOfferDialogOpen, setIsCancelOfferDialogOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const customIcon = new Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  })

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const loadNotes = useCallback(async () => {
    if (ride.status === "accepted" || ride.status === "cancelled") {
      try {
        const fetchedNotes = await fetchNotes(ride.id);
        setNotes(fetchedNotes || []);
        
        // Automatically mark new notes as seen
        const unseenNotes = fetchedNotes.filter(note => 
          note.user_id !== currentUser.id && 
          (!note.seen_by || !note.seen_by.includes(currentUser.id))
        );
        
        if (unseenNotes.length > 0) {
          await Promise.all(unseenNotes.map(note => markNoteAsSeen(note.id, currentUser.id)));
        }

        // Scroll to bottom only on initial load
        if (notes.length === 0 && fetchedNotes.length > 0) {
          scrollToBottom();
        }
      } catch (error) {
        console.error("Error fetching notes:", error);
        toast({
          title: "Error",
          description: "Failed to load notes. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [ride.id, ride.status, currentUser.id, toast, notes.length]);

  const refreshRideData = useCallback(async () => {
    try {
      const updatedRide = await fetchRideDetails(currentUser.id, ride.id);
      setRide(updatedRide);
    } catch (error) {
      console.error("Error refreshing ride data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, ride.id]);

  useEffect(() => {
    loadNotes();
    scrollToBottom();
    const notesInterval = setInterval(loadNotes, 10000);
    const rideInterval = setInterval(refreshRideData, 20000);

    return () => {
      clearInterval(notesInterval);
      clearInterval(rideInterval);
    };
  }, [loadNotes, refreshRideData]);

  const handleAddNote = async (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    if (newNote.trim() && currentUser) {
      try {
        const addedNote = await addNote(ride.id, currentUser.id, newNote);
        if (addedNote) {
          setNotes((prevNotes) => [...prevNotes, addedNote]);
          setNewNote("");
          scrollToBottom();
          toast({
            title: "Success",
            description: "Message sent successfully.",
          });
        }
      } catch (error) {
        console.error("Error adding note:", error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditNote = async (noteId: string) => {
    const noteToEdit = notes.find(note => note.id === noteId);
    if (noteToEdit) {
      setEditingNoteId(noteId);
      setEditedNoteContent(noteToEdit.note);
    }
  };

  const handleSaveEdit = async () => {
    if (editingNoteId && editedNoteContent.trim()) {
      try {
        const updatedNote = await editNote(editingNoteId, currentUser.id, editedNoteContent);
        setNotes(prevNotes => prevNotes.map(note => note.id === editingNoteId ? updatedNote : note));
        setEditingNoteId(null);
        setEditedNoteContent("");
        toast({
          title: "Success",
          description: "Message edited successfully.",
        });
      } catch (error) {
        console.error("Error editing note:", error);
        toast({
          title: "Error",
          description: "Failed to edit message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId, currentUser.id);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      toast({
        title: "Success",
        description: "Message deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAcceptRide = async () => {
    setLoading(true);
    try {
      await acceptRide(ride.id, currentUser.id);
      await fetchUserData(); 
      await refreshRideData();
      toast({
        title: "Success",
        description: "Ride offered successfully.",
      });
    } catch (error) {
      console.error("Error offering ride:", error);
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      });
    } 
  };

  const handleCancelRequest = () => {
    setIsCancelRequestDialogOpen(true);
  };

  const confirmCancelRequest = async () => {
    try {
      await cancelRequest(ride.id, currentUser.id);
      await fetchUserData();
      toast({
        title: "Success",
        description: "Ride request cancelled successfully.",
      });
      setIsCancelRequestDialogOpen(false);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    }
  }

  const handleCancelOffer = () => {
    setIsCancelOfferDialogOpen(true);
  };

  const confirmCancelOffer = async () => {
    try {
      await cancelOffer(ride.id, currentUser.id);
      await fetchUserData();
      toast({
        title: "Success",
        description: "Ride offer cancelled successfully.",
      });
      setIsCancelOfferDialogOpen(false);
      router.push('/dashboard');
    } catch (error) {
      console.error("Error cancelling offer:", error);
      toast({
        title: "Error",
        description: "Failed to cancel offer. Please try again.",
        variant: "destructive",
      });
    }
  }

  const getDisplayStatus = () => {
    if (ride.status === "accepted" && ride.accepter_id === currentUser?.id) {
      return "Offered"
    }
    return ride.status.charAt(0).toUpperCase() + ride.status.slice(1)
  }

  const getStatusColor = () => {
    switch (ride.status) {
      case "accepted":
        return "text-green-500"
      case "cancelled":
        return "text-red-500"
      default:
        return "text-yellow-500"
    }
  }

  const getUserName = (userId: string) => {
    if (userId === currentUser.id) {
      return currentUser.name;
    }
    const contact = contacts.find(c => c.user_id === userId || c.contact_id === userId);
    return contact ? (contact.user_id === userId ? contact.user.name : contact.contact.name) : "Unknown User";
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "The address has been copied to your clipboard.",
      });
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  const openInGoogleMaps = (lat: number, lon: number) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  };

  return (
    <div>
      <div className="mb-4">
        <Button type="button" variant="ghost" onClick={() => router.push('/dashboard')}><ArrowBigLeft />Go Back to Dashboard</Button>
      </div>
      
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Ride Details</CardTitle>
          <CardDescription className="text-lg">
            From {ride.from_location} to {ride.to_location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <LucideUser className="w-5 h-5 text-primary" />
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
                <AlertCircle className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Status</Label>
              </div>
              <p className={`ml-7 font-semibold ${getStatusColor()}`}>{getDisplayStatus()}</p>
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
          {ride.status === "accepted" && ride.accepter_id && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <LucideUser className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Offered by</Label>
              </div>
              <p className="ml-7">
                {ride.accepter_id === currentUser?.id
                  ? "Me"
                  : contacts.find((c) => c.user_id === ride.accepter_id || c.contact_id === ride.accepter_id)?.contact?.name || "Unknown"}
              </p>
            </div>
          )}
          <Separator />
          <div className="flex justify-center">
            <Button onClick={() => setIsMapDialogOpen(true)}>
              <Map className="mr-2 h-4 w-4" />
              View on Map
            </Button>
          </div>
          {(ride.status === "accepted" || ride.status === "cancelled") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <Label className="font-semibold">Messages</Label>
              </div>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4" ref={scrollAreaRef}>
                {notes.map((note) => (
                  <div key={note.id} className={`mb-4 ${note.user_id === currentUser?.id ? "text-right" : "text-left"}`}>
                    <div className={`inline-block max-w-[80%] ${note.user_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3`}>
                      {editingNoteId === note.id ? (
                        <div>
                          <Input
                            value={editedNoteContent}
                            onChange={(e) => setEditedNoteContent(e.target.value)}
                            className="mb-2"
                          />
                          <Button onClick={handleSaveEdit} size="sm" className="mr-2">
                            Save
                          </Button>
                          <Button onClick={() => setEditingNoteId(null)} size="sm" variant="outline">
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm mb-1 break-words">{note.note}</p>
                          <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                            <span>{getUserName(note.user_id)}</span>
                            <span>&nbsp;-&nbsp;</span>
                            <span>{new Date(note.created_at).toLocaleString()}</span>
                          </div>
                          {note.is_edited && <span className="text-xs text-muted-foreground">(edited)</span>}
                        </>
                      )}
                    </div>
                    {note.user_id === currentUser?.id && !editingNoteId && (
                      <div className="mt-1">
                        <Button onClick={() => handleEditNote(note.id)} size="sm" variant="ghost" className="p-1">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => handleDeleteNote(note.id)} size="sm" variant="ghost" className="p-1">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </ScrollArea>
              <div className="flex items-center space-x-2">
                <Input
                  id="new-note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyPress={(e) => handleAddNote(e)}
                  placeholder="Type your message..."
                  className="flex-grow"
                />
                <Button onClick={() => handleAddNote()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
              <Button 
                onClick={handleAcceptRide} 
                className="w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? <Loader className="animate-spin h-5 w-5" /> : "Offer Ride"}
              </Button>
            )}
          </CardFooter>

        <Dialog open={isCancelRequestDialogOpen} onOpenChange={setIsCancelRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Cancel Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this ride request?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelRequestDialogOpen(false)}>No, Keep Request</Button>
              <Button variant="destructive" onClick={confirmCancelRequest}>Yes, Cancel Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCancelOfferDialogOpen} onOpenChange={setIsCancelOfferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Cancel Offer</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this ride offer?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelOfferDialogOpen(false)}>No, Keep Offer</Button>
              <Button variant="destructive" onClick={confirmCancelOffer}>Yes, Cancel Offer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Ride Map</DialogTitle>
            </DialogHeader>
            <div style={{ height: '400px', width: '100%' }}>
              <MapContainer
                bounds={[
                  [ride.from_lat, ride.from_lon],
                  [ride.to_lat, ride.to_lon]
                ]}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[ride.from_lat, ride.from_lon]} icon={customIcon}>
                  <Popup>From: {ride.from_location}</Popup>
                </Marker>
                <Marker position={[ride.to_lat, ride.to_lon]} icon={customIcon}>
                  <Popup>To: {ride.to_location}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}

