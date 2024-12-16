import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, User as LucideUser, Phone, Clock, AlertCircle, FileText, MessageSquare, Send } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { User, Ride, Contact, Note } from "@/types"
import { acceptRide, cancelRequest, cancelOffer, addNote, fetchNotes } from "@/utils/api"

interface RideDetailsPageProps {
  ride: Ride
  currentUser: User
  contacts: Contact[]
  fetchUserData: () => Promise<void>
}

export default function RideDetailsPage({ ride, currentUser, contacts, fetchUserData }: RideDetailsPageProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const [isCancelRequestDialogOpen, setIsCancelRequestDialogOpen] = useState(false);
  const [isCancelOfferDialogOpen, setIsCancelOfferDialogOpen] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const fetchedNotes = await fetchNotes(ride.id)
      console.log(fetchedNotes)
      setNotes(Array.isArray(fetchedNotes) ? fetchedNotes : [])
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast({
        title: "Error",
        description: "Failed to load notes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddNote = async () => {
    if (newNote.trim() && currentUser) {
      try {
        const addedNote = await addNote(ride.id, currentUser.id, newNote)
        if (addedNote) {
          setNotes((prevNotes) => [...prevNotes, addedNote])
          setNewNote("")
          await fetchUserData()
        }
      } catch (error) {
        console.error("Error adding note:", error)
        toast({
          title: "Error",
          description: "Failed to add note. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAcceptRide = async () => {
    try {
      await acceptRide(ride.id, currentUser.id)
      await fetchUserData()
      toast({
        title: "Success",
        description: "Ride accepted successfully.",
      })
      router.push('/dashboard')
    } catch (error) {
      console.error("Error accepting ride:", error)
      toast({
        title: "Error",
        description: "Failed to accept ride. Please try again.",
        variant: "destructive",
      })
    }
  }

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

  return (
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
        {(ride.status === "accepted" || ride.requester_id === currentUser?.id || ride.accepter_id === currentUser?.id) && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <Label className="font-semibold">Messages</Label>
            </div>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {Array.isArray(notes) && notes.map((note) => (
                <div key={note.id} className={`mb-4 ${note.user_id === currentUser?.id ? "text-right" : "text-left"}`}>
                  <div className={`inline-block max-w-[80%] ${note.user_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-2`}>
                    <p className="text-sm">{note.note}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getUserName(note.user_id)} - {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </ScrollArea>
            <div className="flex items-center space-x-2">
              <Input
                id="new-note"
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
        {ride.status === "pending" && ride.requester_id != currentUser?.id && (
          <Button onClick={handleAcceptRide} className="w-full sm:w-auto">
            Offer Ride
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
    </Card>
  )
}

