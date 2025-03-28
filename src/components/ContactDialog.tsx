"use client";

import {
  Loader,
  Search,
  UserPlus,
  Check,
  Phone,
  Users,
  X,
  UserX,
  UserCheck,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { parsePhoneNumber } from "libphonenumber-js";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle } from "lucide-react";
import { ReportDialog } from "@/components/ReportDialog";
import type { User, Contact } from "@/types";
import { addContact, acceptContact, deleteContact } from "@/utils/api";
import { useOnlineStatus } from "@/utils/useOnlineStatus";
import { useMediaQuery } from "@/hooks/use-media-query";

// First, import the AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExtendedUser extends User {
  contactStatus?: "pending" | "accepted" | null;
  contactId?: string | null;
}

interface SuggestedContact extends User {
  mutual_contacts: number;
  contactStatus?: "pending" | "accepted" | null;
}

interface ContactManagerProps {
  currentUser: ExtendedUser;
  contacts: Contact[];
  fetchProfileData: () => Promise<void>;
}

// Custom hook for fetching suggested contacts
const useSuggestedContacts = (currentUserId: string, isOnline: boolean) => {
  const [suggestedContacts, setSuggestedContacts] = useState<
    SuggestedContact[]
  >([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);

  const fetchSuggestedContacts = useCallback(async () => {
    if (!isOnline) return;

    setIsFetchingSuggestions(true);
    try {
      const response = await fetch(`/api/suggested-contacts`);
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
  }, [isOnline]);

  useEffect(() => {
    fetchSuggestedContacts();
  }, [fetchSuggestedContacts]);

  return { suggestedContacts, isFetchingSuggestions, fetchSuggestedContacts };
};

interface ContactSuggestionsProps {
  suggestedContacts: SuggestedContact[];
  isFetchingSuggestions: boolean;
  handleAddContact: (user: ExtendedUser | SuggestedContact) => Promise<void>;
  currentUser: ExtendedUser;
  isOnline: boolean;
  addingUserId: string | null;
}

// Suggested contacts component
const ContactSuggestions = ({
  suggestedContacts,
  isFetchingSuggestions,
  handleAddContact,
  isOnline,
  addingUserId,
}: ContactSuggestionsProps) => {
  if (isFetchingSuggestions) {
    return (
      <div className="flex items-center justify-center w-full py-6">
        <Loader className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (suggestedContacts.length === 0) {
    return (
      <div className="w-full text-center py-4">
        <p className="text-muted-foreground">No suggestions available</p>
      </div>
    );
  }

  return (
    <>
      {suggestedContacts.map((contact) => (
        <Card
          key={contact.id}
          className="min-w-[240px] max-w-[280px] bg-accent/30 hover:bg-accent/50 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center gap-3">
              <Avatar className="h-16 w-16 mt-2">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {contact.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium">{contact.name}</h4>
                <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Phone className="h-3 w-3" />
                  {contact.phone}
                </p>
                {contact.mutual_contacts > 0 && (
                  <p className="text-xs text-primary">
                    {contact.mutual_contacts} mutual{" "}
                    {contact.mutual_contacts === 1 ? "contact" : "contacts"}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="w-full mt-1"
                onClick={() => handleAddContact(contact)}
                disabled={
                  contact.contactStatus === "accepted" ||
                  addingUserId === contact.id ||
                  !isOnline
                }
                variant={
                  contact.contactStatus === "accepted" ? "secondary" : "default"
                }
              >
                {addingUserId === contact.id ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : contact.contactStatus === "accepted" ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : contact.contactStatus === "pending" ? (
                  "Pending"
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export function ContactManager({
  currentUser,
  contacts,
  fetchProfileData,
}: ContactManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ExtendedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null
  );
  // Add this near the other state declarations in the ContactManager component
  const [contactToDelete, setContactToDelete] = useState<{
    id: string;
    name: string;
    status: string;
  } | null>(null);
  const isOnline = useOnlineStatus();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [activeTab, setActiveTab] = useState("all");

  const { suggestedContacts, isFetchingSuggestions, fetchSuggestedContacts } =
    useSuggestedContacts(currentUser.id, isOnline);

  const handleAddContact = useCallback(
    async (user: ExtendedUser | SuggestedContact) => {
      if (!isOnline) return;
      setAddingUserId(user.id);
      try {
        const phoneNumber = parsePhoneNumber(user.phone);
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number");
        }
        const e164PhoneNumber = phoneNumber.format("E.164");
        await addContact(currentUser.id, e164PhoneNumber);
        await fetchProfileData();
        setSearchQuery("");
        setSearchResults([]);
        toast.success("Contact request sent successfully!");
        fetchSuggestedContacts();
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
    },
    [currentUser.id, isOnline, fetchProfileData, fetchSuggestedContacts]
  );

  const handleAcceptContact = useCallback(
    async (contactId: string) => {
      if (!isOnline) return;
      setAddingUserId(contactId);
      try {
        await acceptContact(contactId, currentUser.id);
        await fetchProfileData();
        toast.success("Contact accepted successfully!");
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
    },
    [currentUser.id, isOnline, fetchProfileData]
  );

  // Replace the handleDeleteContact function with this updated version
  const handleDeleteContact = useCallback(
    async (contactId: string, contactName: string, status: string) => {
      // Show confirmation dialog first
      setContactToDelete({ id: contactId, name: contactName, status });
    },
    []
  );

  // Add this new function to perform the actual deletion after confirmation
  const confirmDeleteContact = useCallback(async () => {
    if (!contactToDelete || !isOnline) return;

    const contactId = contactToDelete.id;
    setDeletingContactId(contactId);
    try {
      const result = await deleteContact(contactId, currentUser.id);
      await fetchProfileData();
      setIsContactDetailsOpen(false);

      // Show a more detailed success message based on the response
      if (result.deletedData) {
        const { rides, notes } = result.deletedData;
        if (contactToDelete.status === "accepted" && rides > 0) {
          toast.success(
            `Contact removed and ${rides} shared rides deleted with ${notes} notes.`
          );
        } else if (contactToDelete.status === "pending") {
          toast.success(
            contactToDelete.status === "pending"
              ? "Contact request cancelled."
              : "Contact request declined."
          );
        } else {
          toast.success("Contact removed successfully!");
        }
      } else {
        toast.success(
          contactToDelete.status === "accepted"
            ? "Contact removed successfully!"
            : contactToDelete.status === "pending"
              ? "Contact request cancelled."
              : "Contact request declined."
        );
      }
    } catch (error) {
      if (isOnline) {
        toast.error(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      }
    } finally {
      setDeletingContactId(null);
      setContactToDelete(null);
    }
  }, [contactToDelete, currentUser.id, isOnline, fetchProfileData]);

  const getContactStatus = useCallback(
    (user: ExtendedUser | Contact): string | null => {
      if ("status" in user) {
        // This is a Contact object
        if (user.status === "accepted") return "Accepted";
        if (user.status === "pending") {
          return user.user_id === currentUser.id
            ? "Pending their approval"
            : "Waiting for your approval";
        }
        return user.status;
      } else {
        // This is a User object from search results
        return user.contactStatus || null;
      }
    },
    [currentUser.id]
  );

  const handleOpenContactDetails = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setIsContactDetailsOpen(true);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const sanitizedsearchQuery = searchQuery
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      try {
        const response = await fetch(
          `/api/users/search?query=${encodeURIComponent(sanitizedsearchQuery)}&currentUserId=${currentUser.id}`
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
      const debounceTimer = setTimeout(() => {
        searchUsers();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, currentUser.id]);

  // Calculate pending requests count
  const pendingRequestsCount = contacts.filter(
    (contact) =>
      contact.status === "pending" && contact.contact_id === currentUser.id
  ).length;

  // Render contact details content based on the selected contact
  const renderContactDetails = () => {
    if (!selectedContact) return null;

    const contactUser =
      selectedContact.user_id === currentUser.id
        ? selectedContact.contact
        : selectedContact.user;

    return (
      <div className="grid gap-6">
        <div className="flex flex-col items-center text-center gap-4">
          <Avatar className="w-24 h-24">
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {contactUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{contactUser.name}</h3>
            <Badge
              className="mt-2"
              variant={
                selectedContact.status === "accepted" ? "default" : "secondary"
              }
            >
              {getContactStatus(selectedContact)}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="grid gap-4">
          <div className="bg-accent/30 rounded-lg p-4">
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Contact Information
            </h4>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              <p className="font-medium">{contactUser.phone}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-4 flex-col">
          {selectedContact.status === "pending" &&
          selectedContact.contact_id === currentUser.id ? (
            <Button
              className="w-full"
              onClick={() => handleAcceptContact(selectedContact.id)}
              disabled={!isOnline}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Accept Contact
            </Button>
          ) : null}
          <Button
            variant="destructive"
            className="w-full"
            onClick={() =>
              handleDeleteContact(
                selectedContact.id,
                selectedContact.user_id === currentUser.id
                  ? selectedContact.contact.name
                  : selectedContact.user.name,
                selectedContact.status
              )
            }
            disabled={!isOnline || deletingContactId === selectedContact.id}
          >
            {deletingContactId === selectedContact.id ? (
              <Loader className="animate-spin w-4 h-4 mr-2" />
            ) : (
              <UserX className="w-4 h-4 mr-2" />
            )}
            {selectedContact.status === "pending" &&
            selectedContact.user_id === currentUser.id
              ? "Cancel Request"
              : selectedContact.user_id === currentUser.id
                ? "Remove Contact"
                : selectedContact.status === "accepted"
                  ? "Remove Contact"
                  : "Decline Request"}
          </Button>
          {selectedContact.status === "accepted" && (
            <ReportDialog
              reportedId={
                selectedContact.user_id === currentUser.id
                  ? selectedContact.contact_id
                  : selectedContact.user_id
              }
              reportedName={contactUser.name}
              reportType="user"
              trigger={
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Report User
                </Button>
              }
            />
          )}
        </div>
      </div>
    );
  };

  // Empty state component for when there are no contacts
  const EmptyState = ({ isPending = false }) => (
    <Card className="border-dashed bg-muted/10">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {isPending ? "No pending requests" : "No contacts yet"}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {isPending
            ? "You don't have any pending contact requests. When you send or receive requests, they'll appear here."
            : "Start building your contact list by searching for people or checking the suggestions below."}
        </p>
        {!isPending && (
          <Button
            size="sm"
            onClick={() =>
              document
                .querySelector<HTMLInputElement>(
                  'input[placeholder="Search contacts, start by tiping two characters"]'
                )
                ?.focus()
            }
          >
            <Search className="w-4 h-4 mr-2" />
            Find Contacts
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card className="w-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl mb-4">Contacts</CardTitle>
      </CardHeader>
      <CardContent className="p-0 space-y-6">
        <div className="relative mb-6">
          <div className="flex items-center h-12 w-full rounded-md border border-input bg-background px-4 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 transition-all">
            <Search className="h-5 w-5 text-muted-foreground mr-3 shrink-0" />
            <Input
              placeholder="earch contacts, start by tiping two characters"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent w-full h-full text-base"
            />
            {isSearching && (
              <Loader className="h-5 w-5 animate-spin text-primary shrink-0 ml-2" />
            )}
          </div>
          {searchResults.length > 0 && (
            <Card className="absolute z-50 top-full left-0 right-0 mt-1 border shadow-lg overflow-hidden">
              <ScrollArea className="max-h-[300px] h-fit overflow-y-auto">
                <CardContent className="p-2">
                  {searchResults.map((user: ExtendedUser) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-grow">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
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
                        variant={
                          user.contactStatus === "accepted"
                            ? "secondary"
                            : "default"
                        }
                        onClick={() => handleAddContact(user)}
                        disabled={
                          user.contactStatus === "accepted" ||
                          addingUserId === user.id ||
                          !isOnline
                        }
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
                </CardContent>
              </ScrollArea>
            </Card>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Suggested Contacts</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSuggestedContacts}
              disabled={!isOnline}
            >
              <svg
                className="w-4 h-4 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              <ContactSuggestions
                suggestedContacts={suggestedContacts}
                isFetchingSuggestions={isFetchingSuggestions}
                handleAddContact={handleAddContact}
                currentUser={currentUser}
                isOnline={isOnline}
                addingUserId={addingUserId}
              />
            </div>
          </ScrollArea>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-2 w-64">
              <TabsTrigger value="all">All Contacts</TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequestsCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            {!isOnline && (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-300"
              >
                Offline Mode
              </Badge>
            )}
          </div>

          <TabsContent value="all" className="mt-0">
            <Card className="border-none shadow-none">
              <CardContent className="p-0">
                {/* Fix for mobile overflow: limiting the max height and making sure content doesn't overflow */}
                <ScrollArea className="h-fit max-h-[500px]">
                  <div className="py-4 grid gap-2">
                    {contacts.length === 0 ? (
                      <EmptyState />
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
                            className="group flex items-center justify-between p-4 hover:bg-accent/30 rounded-lg transition-colors cursor-pointer overflow-hidden"
                            onClick={() => handleOpenContactDetails(contact)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleOpenContactDetails(contact);
                              }
                            }}
                          >
                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {contactUser.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">
                                  {contactUser.name}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Phone className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {contactUser.phone}
                                  </span>
                                </p>
                              </div>
                            </div>
                            {/* Adjusted for better mobile display with flex-shrink */}
                            <div className="flex items-center gap-2 ml-2 shrink-0">
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
                              {/* Only show this button on non-mobile */}
                              {!isMobile && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <Card className="border-none shadow-none">
              <CardContent className="p-0">
                <ScrollArea className="h-fit max-h-[500px]">
                  <div className="py-4 grid gap-2">
                    {contacts.filter((contact) => contact.status === "pending")
                      .length === 0 ? (
                      <EmptyState isPending={true} />
                    ) : (
                      contacts
                        .filter((contact) => contact.status === "pending")
                        .map((contact) => {
                          const isCurrentUserRequester =
                            contact.user_id === currentUser.id;
                          const contactUser = isCurrentUserRequester
                            ? contact.contact
                            : contact.user;

                          return (
                            <Card
                              key={contact.id}
                              className={`border ${isCurrentUserRequester ? "bg-muted/40 border-dashed" : "bg-accent/30"}`}
                            >
                              <CardContent className="p-4">
                                {/* Improved layout for mobile with better spacing and flex properties */}
                                <div
                                  className={`flex ${isMobile ? "flex-col" : "items-center justify-between"}`}
                                >
                                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                                    <Avatar className="h-10 w-10 shrink-0">
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {contactUser.name
                                          .charAt(0)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium truncate">
                                        {contactUser.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                          {contactUser.phone}
                                        </span>
                                      </p>
                                      <div className="mt-1">
                                        {isCurrentUserRequester ? (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-muted/50"
                                          >
                                            Outgoing Request
                                          </Badge>
                                        ) : (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-primary/10 text-primary"
                                          >
                                            Incoming Request
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    className={`flex ${isMobile ? "flex-row mt-3 justify-end" : "flex-col gap-2 ml-2 shrink-0"}`}
                                  >
                                    {!isCurrentUserRequester && (
                                      <Button
                                        onClick={() =>
                                          handleAcceptContact(contact.id)
                                        }
                                        disabled={
                                          !isOnline ||
                                          addingUserId === contact.id
                                        }
                                        size="sm"
                                        className={isMobile ? "mr-2" : ""}
                                      >
                                        {addingUserId === contact.id ? (
                                          <Loader className="animate-spin w-4 h-4" />
                                        ) : (
                                          <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Accept
                                          </>
                                        )}
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteContact(
                                          contact.id,
                                          isCurrentUserRequester
                                            ? contact.contact.name
                                            : contact.user.name,
                                          contact.status
                                        )
                                      }
                                      disabled={
                                        !isOnline ||
                                        deletingContactId === contact.id
                                      }
                                      className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    >
                                      {deletingContactId === contact.id ? (
                                        <Loader className="animate-spin w-4 h-4" />
                                      ) : (
                                        <>
                                          <X className="w-4 h-4 mr-2" />
                                          <span>
                                            {isCurrentUserRequester
                                              ? "Cancel"
                                              : "Decline"}
                                          </span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isMobile ? (
          <Drawer
            open={isContactDetailsOpen}
            onOpenChange={setIsContactDetailsOpen}
          >
            <DrawerContent className="px-4">
              <DrawerHeader className="px-0">
                <DrawerTitle>Contact Details</DrawerTitle>
                <Button
                  className="absolute right-4 top-4"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsContactDetailsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DrawerHeader>
              <div className="p-4">{renderContactDetails()}</div>
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog
            open={isContactDetailsOpen}
            onOpenChange={setIsContactDetailsOpen}
          >
            <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-lg">
              <DialogHeader>
                <DialogTitle>Contact Details</DialogTitle>
              </DialogHeader>
              {renderContactDetails()}
            </DialogContent>
          </Dialog>
        )}
        {/* Confirmation Dialog */}
        <AlertDialog
          open={contactToDelete !== null}
          onOpenChange={(open) => !open && setContactToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                {contactToDelete?.status === "accepted" ? (
                  <>
                    This will permanently delete your connection with{" "}
                    <strong>{contactToDelete?.name}</strong> and all related
                    rides and messages between you two. This action cannot be
                    undone.
                  </>
                ) : (
                  <>
                    This will{" "}
                    {contactToDelete?.status === "pending"
                      ? "cancel the contact request"
                      : "decline the request"}{" "}
                    with <strong>{contactToDelete?.name}</strong>.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteContact}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingContactId ? (
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                ) : contactToDelete?.status === "accepted" ? (
                  "Delete"
                ) : (
                  "Confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
