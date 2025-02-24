"use client"

import { Loader, Search, UserPlus, Check, Phone, Users, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { parsePhoneNumber } from "libphonenumber-js"

import { ContactSuggestions } from "@/components/ContactSugestions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import type { User, Contact } from "@/types"
import { addContact, acceptContact, deleteContact } from "@/utils/api"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ExtendedUser extends User {
  contactStatus?: "pending" | "accepted" | null
  contactId?: string | null
}

interface SuggestedContact extends User {
  mutual_contacts: number
  contactStatus?: "pending" | "accepted" | null
}

interface ContactManagerProps {
  currentUser: ExtendedUser
  contacts: Contact[]
  fetchProfileData: () => Promise<void>
}

// Custom hook for fetching suggested contacts
const useSuggestedContacts = (currentUserId: string, isOnline: boolean) => {
  const [suggestedContacts, setSuggestedContacts] = useState<SuggestedContact[]>([])
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)

  const fetchSuggestedContacts = useCallback(async () => {
    if (!isOnline) return

    setIsFetchingSuggestions(true)
    try {
      const response = await fetch(`/api/suggested-contacts?userId=${currentUserId}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestedContacts(data.suggestedContacts || [])
      } else {
        throw new Error("Failed to fetch suggested contacts")
      }
    } catch {
      if (isOnline) {
        toast.error("Failed to load suggested contacts. Please try again later.")
      }
    } finally {
      setIsFetchingSuggestions(false)
    }
  }, [currentUserId, isOnline])

  useEffect(() => {
    fetchSuggestedContacts()
  }, [fetchSuggestedContacts])

  return { suggestedContacts, isFetchingSuggestions, fetchSuggestedContacts }
}

export function ContactManager({ currentUser, contacts, fetchProfileData }: ContactManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ExtendedUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null)
  const isOnline = useOnlineStatus()
  const isMobile = useMediaQuery("(max-width: 768px)")

  const { suggestedContacts, isFetchingSuggestions, fetchSuggestedContacts } = useSuggestedContacts(
    currentUser.id,
    isOnline,
  )

  const handleAddContact = useCallback(
    async (user: ExtendedUser) => {
      if (!isOnline) return
      setAddingUserId(user.id)
      try {
        const phoneNumber = parsePhoneNumber(user.phone)
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number")
        }
        const e164PhoneNumber = phoneNumber.format("E.164")
        await addContact(currentUser.id, e164PhoneNumber)
        await fetchProfileData()
        setSearchQuery("")
        setSearchResults([])
        toast.success("Contact request sent successfully!")
        fetchSuggestedContacts()
      } catch (error) {
        if (isOnline) {
          toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        }
      } finally {
        setAddingUserId(null)
      }
    },
    [currentUser.id, isOnline, fetchProfileData, fetchSuggestedContacts],
  )

  const handleAcceptContact = useCallback(
    async (contactId: string) => {
      if (!isOnline) return
      setAddingUserId(contactId)
      try {
        await acceptContact(contactId, currentUser.id)
        await fetchProfileData()
        toast.success("Contact accepted successfully!")
      } catch (error) {
        if (isOnline) {
          toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        }
      } finally {
        setAddingUserId(null)
      }
    },
    [currentUser.id, isOnline, fetchProfileData],
  )

  const handleDeleteContact = useCallback(
    async (contactId: string) => {
      if (!isOnline) return
      setDeletingContactId(contactId)
      try {
        await deleteContact(contactId, currentUser.id)
        await fetchProfileData()
        setIsContactDetailsOpen(false)
        toast.success("Contact deleted successfully!")
      } catch (error) {
        if (isOnline) {
          toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
        }
      } finally {
        setDeletingContactId(null)
      }
    },
    [currentUser.id, isOnline, fetchProfileData],
  )

  const getContactStatus = useCallback(
    (user: ExtendedUser | Contact): string | null => {
      if ("status" in user) {
        // This is a Contact object
        if (user.status === "accepted") return "Accepted"
        if (user.status === "pending") {
          return user.user_id === currentUser.id ? "Pending" : "Pending their approval"
        }
        return user.status
      } else {
        // This is a User object from search results
        return user.contactStatus || null
      }
    },
    [currentUser.id],
  )

  const handleOpenContactDetails = useCallback((contact: Contact) => {
    setSelectedContact(contact)
    setIsContactDetailsOpen(true)
  }, [])

  useEffect(() => {
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
        toast.error(error instanceof Error ? error.message : "Failed to search users. Please try again.")
      } finally {
        setIsSearching(false)
      }
    }

    if (searchQuery.length >= 2) {
      const debounceTimer = setTimeout(() => {
        searchUsers()
      }, 300)
      return () => clearTimeout(debounceTimer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, currentUser.id])

  // Render contact details content based on the selected contact
  const renderContactDetails = () => {
    if (!selectedContact) return null

    const contactUser = selectedContact.user_id === currentUser.id
      ? selectedContact.contact
      : selectedContact.user

    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback>{contactUser.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{contactUser.name}</h3>
            <p className="text-sm text-muted-foreground">{getContactStatus(selectedContact)}</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="bg-accent/30 rounded-lg p-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Contact Information</h4>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium">{contactUser.phone}</p>
            </div>
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
            disabled={!isOnline || deletingContactId === selectedContact.id}
          >
            {deletingContactId === selectedContact.id ? (
              <Loader className="animate-spin w-4 h-4 mr-2" />
            ) : null}
            {selectedContact.user_id === currentUser.id ? "Remove Contact" : "Decline Request"}
          </Button>
        </div>
      </div>
    )
  }

  // Empty state component for when there are no contacts
  const EmptyState = ({ isPending = false }) => (
    <div className="text-center py-12 px-4 border border-dashed rounded-lg bg-muted/20">
      <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Users className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-lg font-medium mb-2">
        {isPending ? "No pending requests" : "No contacts yet"}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {isPending
          ? "You don't have any pending contact requests. When you send or receive requests, they'll appear here."
          : "Start building your contact list by searching for people or checking the suggestions below."}
      </p>
      {!isPending && (
        <Button
          size="sm"
          onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="Search contacts"]')?.focus()}
        >
          Find Contacts
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="relative mb-6">
        <div className="flex items-center h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
          <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />
          <Input
            placeholder="Search contacts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent w-full"
          />
          {isSearching && <Loader className="h-4 w-4 animate-spin text-primary shrink-0 ml-2" />}
        </div>
        {searchResults.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg">
            <ScrollArea className="max-h-[300px] h-fit overflow-y-auto">
              <div className="p-1">
                {searchResults.map((user: ExtendedUser) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-grow">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-grow">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Phone className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.phone}</span>
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={user.contactStatus === "accepted" ? "secondary" : "default"}
                      onClick={() => handleAddContact(user)}
                      disabled={user.contactStatus === "accepted" || addingUserId === user.id || !isOnline}
                      className="ml-2 shrink-0"
                    >
                      {addingUserId === user.id ? (
                        <Loader className="animate-spin w-4 h-4" />
                      ) : user.contactStatus === "accepted" ? (
                        <Check className="w-4 h-4" />
                      ) : user.contactStatus === "pending" ? (
                        "Pending"
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-3">Suggested Contacts</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            <ContactSuggestions
              suggestedContacts={suggestedContacts}
              isFetchingSuggestions={isFetchingSuggestions}
              handleAddContact={handleAddContact}
              currentUser={currentUser}
              isOnline={isOnline}
            />
          </div>
        </ScrollArea>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="all">All Contacts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <ScrollArea className="h-fit max-h-[500px]">
            <div className="py-4 grid gap-4">
              {contacts.length === 0 ? (
                <EmptyState />
              ) : (
                contacts.map((contact) => {
                  const isCurrentUserRequester = contact.user_id === currentUser.id
                  const contactUser = isCurrentUserRequester ? contact.contact : contact.user
                  const contactStatus = getContactStatus(contact)

                  return (
                    <div
                      key={contact.id}
                      className="group flex items-center justify-between p-4 hover:bg-accent/30 rounded-lg transition-colors cursor-pointer"
                      onClick={() => handleOpenContactDetails(contact)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          handleOpenContactDetails(contact)
                        }
                      }}
                    >
                      <div className="flex items-center space-x-4 flex-grow min-w-0">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarFallback>{contactUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow min-w-0">
                          <p className="font-medium truncate">{contactUser.name}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">{contactUser.phone}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-2 shrink-0">
                        {contactStatus && (
                          <Badge variant={contactStatus === "Accepted" ? "default" : "secondary"}>
                            {contactStatus}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <ScrollArea className="h-fit max-h-[500px]">
            <div className="py-4 grid gap-4">
              {contacts.filter((contact) => contact.status === "pending").length === 0 ? (
                <EmptyState isPending={true} />
              ) : (
                contacts
                  .filter((contact) => contact.status === "pending")
                  .map((contact) => {
                    const isCurrentUserRequester = contact.user_id === currentUser.id
                    const contactUser = isCurrentUserRequester ? contact.contact : contact.user

                    return (
                      <div key={contact.id} className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
                        <div className="flex items-center space-x-4 flex-grow min-w-0">
                          <Avatar className="h-12 w-12 shrink-0">
                            <AvatarFallback>{contactUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-grow min-w-0">
                            <p className="font-medium truncate">{contactUser.name}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span className="truncate">{contactUser.phone}</span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {isCurrentUserRequester ? "Waiting for approval" : "Wants to connect"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2 shrink-0">
                          {!isCurrentUserRequester && (
                            <Button onClick={() => handleAcceptContact(contact.id)} disabled={!isOnline}>
                              {addingUserId === contact.id ? <Loader className="animate-spin w-4 h-4" /> : "Accept"}
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={!isOnline || deletingContactId === contact.id}
                          >
                            {deletingContactId === contact.id ? (
                              <Loader className="animate-spin w-4 h-4" />
                            ) : (
                              <span>{isCurrentUserRequester ? "Cancel" : "Decline"}</span>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {isMobile ? (
        <Drawer open={isContactDetailsOpen} onOpenChange={setIsContactDetailsOpen}>
          <DrawerContent className="px-4">
            <DrawerHeader className="px-0">
              <DrawerTitle>Contact Details</DrawerTitle>
              <DrawerDescription>View and manage contact information</DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              {renderContactDetails()}
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isContactDetailsOpen} onOpenChange={setIsContactDetailsOpen}>
          <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-lg">
            <DialogHeader>
              <DialogTitle>Contact Details</DialogTitle>
              <Button
                className="absolute right-4 top-4"
                variant="ghost"
                size="icon"
                onClick={() => setIsContactDetailsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            {renderContactDetails()}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}