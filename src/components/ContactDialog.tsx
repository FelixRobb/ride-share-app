import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Contact } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { addContact, acceptContact, deleteContact } from "@/utils/api";
import { Loader, Search, UserPlus, Check, Phone } from 'lucide-react';

interface ContactDialogProps {
  currentUser: User;
  contacts: Contact[];
  fetchUserData: () => Promise<void>;
}

export function ContactDialog({ currentUser, contacts, fetchUserData }: ContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchUsers = async () => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (user: User) => {
    setAddingUserId(user.id);
    try {
      await addContact(currentUser.id, user.phone, user.country_code || '');
      await fetchUserData();
      setSearchQuery('');
      setSearchResults([]);
      toast({
        title: "Success",
        description: "Contact request sent successfully!",
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setAddingUserId(null);
    }
  };

  const handleAcceptContact = async (contactId: string) => {
    try {
      await acceptContact(contactId, currentUser.id);
      await fetchUserData();
      toast({
        title: "Success",
        description: "Contact accepted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId, currentUser.id);
      await fetchUserData();
      toast({
        title: "Success",
        description: "Contact deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getContactStatus = (user: User | Contact): string | null => {
    if ('status' in user) {
      // This is a Contact object
      if (user.status === 'accepted') return 'Accepted';
      if (user.status === 'pending') {
        return user.user_id === currentUser.id ? 'Pending' : 'Pending their approval';
      }
      return user.status;
    } else {
      // This is a User object from search results
      const existingContact = contacts.find(c => c.contact_id === user.id || c.user_id === user.id);
      if (existingContact) {
        return getContactStatus(existingContact);
      }
      return null;
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
          <Button variant="outline">Manage Contacts</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="text-lg font-medium">Contacts</DialogTitle>
            <DialogDescription>Manage your contacts and add new ones.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:ring-primary focus:border-primary"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
            </div>
            {searchResults.length > 0 && (
              <div ref={searchResultsRef} className="relative z-10 mt-1 w-full bg-popover shadow-md rounded-md border border-border">
                <ScrollArea className="h-[200px]">
                  {searchResults.map((user) => (
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
                        disabled={getContactStatus(user) !== null}
                      >
                        {addingUserId === user.id ? (
                          <Loader className="animate-spin w-4 h-4 mr-2" />
                        ) : getContactStatus(user) === 'Accepted' ? (
                          <Check className="w-4 h-4 mr-2" />
                        ) : getContactStatus(user) === 'Pending' ? (
                          <span>Pending</span>
                        ) : getContactStatus(user) === 'Pending their approval' ? (
                          <span>Pending</span>
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        {addingUserId === user.id ? "Adding..." : getContactStatus(user) || "Add"}
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
            <div className="mt-8">
              <h4 className="text-lg font-medium mb-2">Your Contacts</h4>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                {contacts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No contacts yet.</p>
                ) : (
                  contacts.map((contact) => {
                    const isCurrentUserRequester = contact.user_id === currentUser.id;
                    const contactUser = isCurrentUserRequester ? contact.contact : contact.user;
                    const contactStatus = getContactStatus(contact);

                    return (
                      <div key={contact.id} className="flex items-center justify-between mb-2 p-2 hover:bg-accent cursor-pointer rounded-md border" onClick={() => handleOpenContactDetails(contact)}>
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
                          <Badge variant={contactStatus === 'Accepted' ? 'default' : 'secondary'}>
                            {contactStatus}
                          </Badge>
                        )}
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isContactDetailsOpen} onOpenChange={setIsContactDetailsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="/placeholder.svg" alt="Avatar" />
                  <AvatarFallback>{(selectedContact.user_id === currentUser.id ? selectedContact.contact.name : selectedContact.user.name).charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedContact.user_id === currentUser.id ? selectedContact.contact.name : selectedContact.user.name}</h3>
                  <p className="text-sm text-muted-foreground">{getContactStatus(selectedContact)}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <p>{selectedContact.user_id === currentUser.id ? selectedContact.contact.phone : selectedContact.user.phone}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                {selectedContact.status === "pending" && selectedContact.contact_id === currentUser.id ? (
                  <Button onClick={() => handleAcceptContact(selectedContact.id)}>Accept Contact</Button>
                ) : null}
                <Button variant="destructive" onClick={() => handleDeleteContact(selectedContact.id)}>
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

