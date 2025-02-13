import { Loader, Search, UserPlus, Check, Phone, Users } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { parsePhoneNumber } from "libphonenumber-js";

import { ContactSuggestions } from "@/components/ContactSugestions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import type { User, Contact } from "@/types";
import { addContact, acceptContact, deleteContact } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";

interface ExtendedUser extends User {
  contactStatus?: "pending" | "accepted" | null;
  contactId?: string | null;
}

interface SuggestedContact extends User {
  mutual_contacts: number;
  contactStatus?: "pending" | "accepted" | null;
}

interface ContactDialogProps {
  currentUser: ExtendedUser;
  contacts: Contact[];
  suggestedContacts: ExtendedUser[];
  fetchUserData: () => Promise<void>;
}

export function ContactDialog({
  currentUser,
  contacts,
  fetchUserData,
}: ContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExtendedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [localSuggestedContacts, setLocalSuggestedContacts] = useState<
    SuggestedContact[]
  >([]);
  const [suggestedContacts, setSuggestedContacts] = useState<
    SuggestedContact[]
  >([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/users/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${currentUser.id}`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.users);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to search users");
        }
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to search users. Please try again."
        );
      } finally {
        setIsSearching(false);
      }
    };

    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, currentUser.id]);

  useEffect(() => {
    setLocalSuggestedContacts(suggestedContacts);
  }, [suggestedContacts]);

  const fetchUserNotifications = useCallback(async () => {
    if (isOnline) {
      setIsFetchingSuggestions(true);
      try {
        const response = await fetch(`/api/suggested-contacts?userId=${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestedContacts(data.suggestedContacts || []);
        } else {
          throw new Error("Failed to fetch suggested contacts");
        }
      } catch {
        if (isOnline) {
          toast.error(
            "Failed to load suggested contacts. Please try again later."
          );
        }
      } finally {
        setIsFetchingSuggestions(false);
      }
    }
  }, [currentUser.id, isOnline]);

  useEffect(() => {
    fetchUserNotifications();
  }, [fetchUserNotifications]);

  const handleAddContact = async (user: ExtendedUser) => {
    if (!isOnline) return;
    setAddingUserId(user.id);
    try {
      const phoneNumber = parsePhoneNumber(user.phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error("Invalid phone number");
      }
      const e164PhoneNumber = phoneNumber.format("E.164");
      await addContact(currentUser.id, e164PhoneNumber);
      await fetchUserData();
      setSearchQuery("");
      setSearchResults([]);
      toast.success("Contact request sent successfully!");
      setLocalSuggestedContacts(
        localSuggestedContacts.filter((contact) => contact.id !== user.id)
      );
    } catch (error) {
      if (isOnline) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    } finally {
      setAddingUserId(null);
    }
  };

  const handleAcceptContact = async (contactId: string) => {
    if (!isOnline) return;
    try {
      await acceptContact(contactId, currentUser.id);
      await fetchUserData();
      toast.success("Contact accepted successfully!");
    } catch (error) {
      if (isOnline) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!isOnline) return;
    try {
      await deleteContact(contactId, currentUser.id);
      await fetchUserData();
      setIsContactDetailsOpen(false);
      toast.success("Contact deleted successfully!");
    } catch (error) {
      if (isOnline) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    }
  };

  const getContactStatus = (user: ExtendedUser | Contact): string | null => {
    if ("status" in user) {
      // This is a Contact object
      if (user.status === "accepted") return "Accepted";
      if (user.status === "pending") {
        return user.user_id === currentUser.id
          ? "Pending"
          : "Pending their approval";
      }
      return user.status;
    } else {
      // This is a User object from search results
      return user.contactStatus || null;
    }
  };

  const handleOpenContactDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactDetailsOpen(true);
  };

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline" disabled={!isOnline}>
            Manage Contacts
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[800px] w-full p-0 max-h-[90vh] overflow-hidden rounded-lg">
          {!isOnline && (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4"
              role="alert"
            >
              <p className="font-bold">You are offline</p>
              <p>
                Some features may be limited. Please check your internet
                connection.
              </p>
            </div>
          )}
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center justify-between">
              Contacts
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="all" className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="all">All Contacts</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              </TabsList>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search contacts by name or phone"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg overflow-hidden">
                    <ScrollArea className="max-h-[300px]">
                      {searchResults.map((user: ExtendedUser) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 hover:bg-accent border-b last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/placeholder.svg" alt="Avatar" />
                              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddContact(user)}
                            disabled={
                              user.contactStatus === "accepted" ||
                              addingUserId === user.id ||
                              !isOnline
                            }
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
                            {addingUserId === user.id
                              ? "Adding..."
                              : getContactStatus(user) || "Add"}
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>

            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[500px] w-full">
                <div className="p-6 grid gap-4">
                  {contacts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No contacts yet. Start by adding some contacts!
                    </p>
                  ) : (
                    contacts.map((contact) => {
                      const isCurrentUserRequester =
                        contact.user_id === currentUser.id;
                      const contactUser = isCurrentUserRequester
                        ? contact.contact
                        : contact.user;
                      const contactStatus = getContactStatus(contact);

                      return (
                        <div
                          key={contact.id}
                          className="group flex items-center justify-between p-4 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleOpenContactDetails(contact)}
                          role="button"
                          tabIndex={0}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleOpenContactDetails(contact);
                            }
                          }}
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="/placeholder.svg" alt="Avatar" />
                              <AvatarFallback>
                                {contactUser.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contactUser.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {contactUser.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {contactStatus && (
                              <Badge
                                variant={
                                  contactStatus === "Accepted"
                                    ? "default"
                                    : "secondary"
                                }
                              >
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
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="pending" className="mt-0">
              <ScrollArea className="h-[500px] w-full">
                <div className="p-6 grid gap-4">
                  {contacts
                    .filter((contact) => contact.status === "pending")
                    .map((contact) => {
                      const isCurrentUserRequester =
                        contact.user_id === currentUser.id;
                      const contactUser = isCurrentUserRequester
                        ? contact.contact
                        : contact.user;

                      return (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-4 bg-accent/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src="/placeholder.svg" alt="Avatar" />
                              <AvatarFallback>
                                {contactUser.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{contactUser.name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Phone className="h-3 w-3" />
                                {contactUser.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {!isCurrentUserRequester && (
                              <Button
                                onClick={() => handleAcceptContact(contact.id)}
                                disabled={!isOnline}
                              >
                                Accept
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              onClick={() => handleDeleteContact(contact.id)}
                              disabled={!isOnline}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="suggestions" className="mt-0">
              <ScrollArea className="h-[500px] w-full">
                <div className="p-6">
                  <ContactSuggestions
                    suggestedContacts={localSuggestedContacts}
                    isFetchingSuggestions={isFetchingSuggestions}
                    handleAddContact={handleAddContact}
                    currentUser={currentUser}
                    isOnline={isOnline}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isContactDetailsOpen}
        onOpenChange={setIsContactDetailsOpen}
      >
        <DialogContent className="sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
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
                  <p className="text-sm text-muted-foreground">
                    {getContactStatus(selectedContact)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p>
                    {selectedContact.user_id === currentUser.id
                      ? selectedContact.contact.phone
                      : selectedContact.user.phone}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {selectedContact.status === "pending" &&
                  selectedContact.contact_id === currentUser.id ? (
                  <Button
                    onClick={() => handleAcceptContact(selectedContact.id)}
                    disabled={!isOnline}
                  >
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
  );
}
