import React, { useState, useEffect, useCallback } from "react"
import { Loader, Search, UserPlus, Check, Phone } from "lucide-react"
import { parsePhoneNumber } from "libphonenumber-js"
import { toast } from "sonner"

import { ContactSuggestions } from "@/components/ContactSugestions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { addContact, acceptContact, deleteContact } from "@/utils/api"

// Components
const ContactSearchResult = ({ user, onAddContact, addingUserId, isOnline, getContactStatus }) => (
  <div className="flex items-center justify-between p-2 hover:bg-accent">
    <div className="flex items-center space-x-3">
      <Avatar>
        <AvatarImage src="/placeholder.svg" alt={user.name} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.phone}</p>
      </div>
    </div>
    <Button
      size="sm"
      onClick={() => onAddContact(user)}
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
)

const ContactCard = ({ contact, currentUser, onOpenDetails, getContactStatus }) => {
  const isCurrentUserRequester = contact.user_id === currentUser.id
  const contactUser = isCurrentUserRequester ? contact.contact : contact.user
  const contactStatus = getContactStatus(contact)

  return (
    <div
      className="flex items-center justify-between p-4 hover:bg-accent cursor-pointer border-b"
      onClick={() => onOpenDetails(contact)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onOpenDetails(contact)
        }
      }}
    >
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src="/placeholder.svg" alt={contactUser.name} />
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
}

const ContactDetails = ({ contact, currentUser, onAccept, onDelete, isOnline, getContactStatus }) => {
  const contactUser = contact.user_id === currentUser.id ? contact.contact : contact.user

  return (
    <div className="grid gap-4 py-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src="/placeholder.svg" alt={contactUser.name} />
          <AvatarFallback>{contactUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{contactUser.name}</h3>
          <p className="text-sm text-muted-foreground">{getContactStatus(contact)}</p>
        </div>
      </div>
      <div className="grid gap-2">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4" />
          <p>{contactUser.phone}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        {contact.status === "pending" && contact.contact_id === currentUser.id && (
          <Button onClick={() => onAccept(contact.id)} disabled={!isOnline}>
            Accept Contact
          </Button>
        )}
        <Button variant="destructive" onClick={() => onDelete(contact.id)} disabled={!isOnline}>
          Remove Contact
        </Button>
      </div>
    </div>
  )
}

// Main Component
export function ContactDialog({ currentUser, contacts, fetchUserData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchState, setSearchState] = useState({
    query: "",
    results: [],
    isSearching: false
  })
  const [selectedContact, setSelectedContact] = useState(null)
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false)
  const [addingUserId, setAddingUserId] = useState(null)
  const [suggestionsState, setSuggestionsState] = useState({
    suggestions: [],
    localSuggestions: [],
    isFetching: false
  })
  
  const isOnline = useOnlineStatus()

  const getContactStatus = useCallback((user) => {
    if ("status" in user) {
      if (user.status === "accepted") return "Accepted"
      if (user.status === "pending") {
        return user.user_id === currentUser.id ? "Pending" : "Pending their approval"
      }
      return user.status
    }
    return user.contactStatus || null
  }, [currentUser.id])

  const handleSearch = useCallback(async (query) => {
    if (query.length < 2) {
      setSearchState(prev => ({ ...prev, results: [] }))
      return
    }
    setSearchState(prev => ({ ...prev, isSearching: true }))
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}&currentUserId=${currentUser.id}`)
      if (!response.ok) throw new Error("Failed to search users")
      const data = await response.json()
      setSearchState(prev => ({ ...prev, results: data.users }))
    } catch (error) {
      toast.error(error.message || "Failed to search users")
    } finally {
      setSearchState(prev => ({ ...prev, isSearching: false }))
    }
  }, [currentUser.id])

  const handleAddContact = async (user) => {
    if (!isOnline) return
    setAddingUserId(user.id)
    try {
      const phoneNumber = parsePhoneNumber(user.phone)
      if (!phoneNumber?.isValid()) throw new Error("Invalid phone number")
      
      await addContact(currentUser.id, phoneNumber.format("E.164"))
      await fetchUserData()
      setSearchState(prev => ({ ...prev, query: "", results: [] }))
      toast.success("Contact request sent successfully!")
      setSuggestionsState(prev => ({
        ...prev,
        localSuggestions: prev.localSuggestions.filter(contact => contact.id !== user.id)
      }))
    } catch (error) {
      if (isOnline) {
        toast.error(error.message || "An unexpected error occurred")
      }
    } finally {
      setAddingUserId(null)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchState.query) handleSearch(searchState.query)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchState.query, handleSearch])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!isOnline) return
      setSuggestionsState(prev => ({ ...prev, isFetching: true }))
      try {
        const response = await fetch(`/api/suggested-contacts?userId=${currentUser.id}`)
        if (!response.ok) throw new Error("Failed to fetch suggested contacts")
        const data = await response.json()
        setSuggestionsState(prev => ({
          ...prev,
          suggestions: data.suggestedContacts || [],
          localSuggestions: data.suggestedContacts || []
        }))
      } catch (error) {
        if (isOnline) {
          toast.error("Failed to load suggested contacts")
        }
      } finally {
        setSuggestionsState(prev => ({ ...prev, isFetching: false }))
      }
    }
    fetchSuggestions()
  }, [currentUser.id, isOnline])

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline" disabled={!isOnline}>
            Manage Contacts
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] w-full p-0 max-h-[80vh] overflow-auto rounded-lg">
          {!isOnline && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
              <p className="font-bold">You are offline</p>
              <p>Some features may be limited. Please check your internet connection.</p>
            </div>
          )}
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold">Contacts</DialogTitle>
            <DialogDescription>Manage your contacts and add new ones.</DialogDescription>
          </DialogHeader>
          
          <div className="p-6">
            <Popover open={searchState.results.length > 0}>
              <PopoverTrigger asChild>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone"
                    value={searchState.query}
                    onChange={(e) => setSearchState(prev => ({ ...prev, query: e.target.value }))}
                    className="pl-10 pr-4 py-2 w-full rounded-md border border-input"
                  />
                  {searchState.isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={5}>
                <ScrollArea className="h-fit w-full rounded-md border">
                  {searchState.results.map((user) => (
                    <ContactSearchResult
                      key={user.id}
                      user={user}
                      onAddContact={handleAddContact}
                      addingUserId={addingUserId}
                      isOnline={isOnline}
                      getContactStatus={getContactStatus}
                    />
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="w-full max-w-[500px] overflow-hidden">
              <ContactSuggestions
                suggestedContacts={suggestionsState.localSuggestions}
                isFetchingSuggestions={suggestionsState.isFetching}
                handleAddContact={handleAddContact}
                currentUser={currentUser}
                isOnline={isOnline}
              />
            </div>

            <div className="mt-4">
              <h4 className="text-lg font-medium mb-2 px-6">Your Contacts</h4>
              <ScrollArea className="h-[300px] w-full rounded-md">
                {contacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No contacts yet.</p>
                ) : (
                  contacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      currentUser={currentUser}
                      onOpenDetails={(contact) => {
                        setSelectedContact(contact)
                        setIsContactDetailsOpen(true)
                      }}
                      getContactStatus={getContactStatus}
                    />
                  ))
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
            <ContactDetails
              contact={selectedContact}
              currentUser={currentUser}
              onAccept={async (contactId) => {
                if (!isOnline) return
                try {
                  await acceptContact(contactId, currentUser.id)
                  await fetchUserData()
                  toast.success("Contact accepted successfully!")
                } catch (error) {
                  if (isOnline) {
                    toast.error(error.message || "An unexpected error occurred")
                  }
                }
              }}
              onDelete={async (contactId) => {
                if (!isOnline) return
                try {
                  await deleteContact(contactId, currentUser.id)
                  await fetchUserData()
                  setIsContactDetailsOpen(false)
                  toast.success("Contact deleted successfully!")
                } catch (error) {
                  if (isOnline) {
                    toast.error(error.message || "An unexpected error occurred")
                  }
                }
              }}
              isOnline={isOnline}
              getContactStatus={getContactStatus}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}