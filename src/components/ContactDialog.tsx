import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { User as BaseUser, Contact } from "@/types"
import { addContact, acceptContact, deleteContact } from "@/utils/api"
import { Loader, Search, UserPlus, Check, Phone, X } from "lucide-react"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

interface ExtendedUser extends BaseUser {
  contactStatus?: string | null
  contactId?: string | null
}

interface ContactDialogProps {
  currentUser: ExtendedUser
  contacts: Contact[]
  suggestedContacts: any[]
  fetchUserData: () => Promise<void>
}

export function ContactDialog({ currentUser, contacts, suggestedContacts, fetchUserData }: ContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ExtendedUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [localSuggestedContacts, setLocalSuggestedContacts] = useState<any[]>([])
  const isOnline = useOnlineStatus()

  useEffect(() => {
    setLocalSuggestedContacts(suggestedContacts)
  }, [suggestedContacts])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${currentUser.id}`,
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to search users")
      }
    } catch (error) {
      console.error("Error searching users:", error)
      toast.error(error instanceof Error ? error.message : "Failed to search users. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddContact = async (user: ExtendedUser) => {
    setAddingUserId(user.id)
    try {
      await addContact(currentUser.id, user.phone, user.country_code || "")
      await fetchUserData()
      setSearchQuery("")
      setSearchResults([])
      toast.success("Contact request sent successfully!")
      // Remove the added contact from suggested contacts
      setLocalSuggestedContacts(localSuggestedContacts.filter((contact) => contact.id !== user.id))
    } catch (error) {
      console.error("Error adding contact:", error)
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setAddingUserId(null)
    }
  }

  const handleAcceptContact = async (contactId: string) => {
    try {
      await acceptContact(contactId, currentUser.id)
      await fetchUserData()
      toast.success("Contact accepted successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId, currentUser.id)
      await fetchUserData()
      setIsContactDetailsOpen(false)
      toast.success("Contact deleted successfully!")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  const getContactStatus = (user: ExtendedUser | Contact): string | null => {
    if ("status" in user) {
      // This is a Contact object
      if (user.status === "accepted") return "Accepted"
      if (user.status === "pending") {
        return user.user_id === currentUser.id ? "Pending" : "Pending their approval"
      }
      return user.status
    } else {
      // This is an ExtendedUser object from search results
      return user.contactStatus || null
    }
  }

  const handleOpenContactDetails = (contact: Contact) => {
    setSelectedContact(contact)
    setIsContactDetailsOpen(true)
  }

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline" disabled={!isOnline}>
            Manage Contacts
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] p-0 max-h-[80vh] overflow-auto rounded-lg">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-medium">Contacts</DialogTitle>
            <DialogDescription>Manage your contacts and add new ones.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Popover open={searchResults.length > 0}>
              <PopoverTrigger asChild>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-input"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={5}>
                <ScrollArea className="h-fit w-full rounded-md border">
                  {searchResults.map((user: ExtendedUser) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-accent">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="/placeholder.svg" alt="Avatar" />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddContact(user)}
                        disabled={user.contactStatus === "accepted" || addingUserId === user.id || !isOnline}
                      >
                        {addingUserId === user.id ? (
                          <Loader className="animate-spin w-4 h-4 mr-2" />
                        ) : user.contactStatus === "accepted" ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : user.contactStatus === "pending" ? (
                          <span>Pending</span>
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        {addingUserId === user.id ? "Adding..." : getContactStatus(user) || "Add"}
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {localSuggestedContacts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-lg font-medium mb-2">Suggested Contacts</h4>
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <div className="flex w-max space-x-4 p-4">
                    {localSuggestedContacts.map((contact) => (
                      <Card key={contact.id} className="w-[200px] flex flex-col justify-between">
                        <CardHeader>
                          <Avatar className="h-12 w-12 mx-auto">
                            <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <CardTitle className="text-center">{contact.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground text-center">{contact.phone}</p>
                          {contact.mutual_contacts > 0 && (
                            <p className="text-xs text-muted-foreground text-center mt-1">
                              {contact.mutual_contacts} mutual contact{contact.mutual_contacts > 1 ? "s" : ""}
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="flex justify-center">
                          <Button
                            size="sm"
                            onClick={() => handleAddContact(contact)}
                            disabled={addingUserId === contact.id || !isOnline}
                          >
                            {addingUserId === contact.id ? (
                              <Loader className="animate-spin w-4 h-4 mr-2" />
                            ) : (
                              <UserPlus className="w-4 h-4 mr-2" />
                            )}
                            Add Contact
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            <div className="mt-4">
              <h4 className="text-lg font-medium mb-2 px-6">Your Contacts</h4>
              <ScrollArea className="h-[300px] w-full rounded-md">
                {contacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No contacts yet.</p>
                ) : (
                  contacts.map((contact) => {
                    const isCurrentUserRequester = contact.user_id === currentUser.id
                    const contactUser = isCurrentUserRequester ? contact.contact : contact.user
                    const contactStatus = getContactStatus(contact)

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer border-b"
                        onClick={() => handleOpenContactDetails(contact)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src="/placeholder.svg" alt="Avatar" />
                            <AvatarFallback>{contactUser.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contactUser.name}</p>
                            <p className="text-sm text-muted-foreground">{contactUser.phone}</p>
                          </div>
                        </div>
                        {contactStatus && (
                          <Badge variant={contactStatus === "Accepted" ? "default" : "secondary"}>
                            {contactStatus}
                          </Badge>
                        )}
                      </div>
                    )
                  })
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isContactDetailsOpen} onOpenChange={setIsContactDetailsOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="/placeholder.svg" alt="Avatar" />
                  <AvatarFallback>
                    {(selectedContact.user_id === currentUser.id
                      ? selectedContact.contact.name
                      : selectedContact.user.name
                    ).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedContact.user_id === currentUser.id
                      ? selectedContact.contact.name
                      : selectedContact.user.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{getContactStatus(selectedContact)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <p>
                    {selectedContact.user_id === currentUser.id
                      ? selectedContact.contact.phone
                      : selectedContact.user.phone}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {selectedContact.status === "pending" && selectedContact.contact_id === currentUser.id ? (
                  <Button onClick={() => handleAcceptContact(selectedContact.id)} disabled={!isOnline}>
                    Accept Contact
                  </Button>
                ) : null}
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteContact(selectedContact.id)}
                  disabled={!isOnline}
                >
                  Remove Contact
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

