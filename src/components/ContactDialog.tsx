import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Contact } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { addContact, acceptContact, deleteContact } from "@/utils/api";
import { Loader, Search, UserPlus, X } from 'lucide-react';

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

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      } else {
        throw new Error('Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (contactId: string, phone: string, countryCode: string) => {
    setIsAddingContact(true);
    try {
      await addContact(currentUser.id, phone, countryCode);
      await fetchUserData();
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
      setIsAddingContact(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Contacts</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
          <DialogDescription>Manage your contacts and add new ones.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search" className="text-right">
              Search
            </Label>
            <div className="col-span-3 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {isSearching ? (
              <div className="flex justify-center items-center h-full">
                <Loader className="h-6 w-6 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddContact(user.id, user.phone, user.country_code)}
                    disabled={isAddingContact}
                  >
                    {isAddingContact ? <Loader className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-muted-foreground">No results found</p>
            ) : (
              <p className="text-center text-muted-foreground">Enter at least 2 characters to search</p>
            )}
          </ScrollArea>
          <div className="mt-4">
            <h4 className="mb-2 font-medium">Your Contacts</h4>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {contacts.map((contact) => {
                const isCurrentUserRequester = contact.user_id === currentUser.id;
                const contactName = isCurrentUserRequester ? contact.contact?.name : contact.user?.name;
                const contactPhone = isCurrentUserRequester ? contact.contact?.phone : contact.user?.phone;

                return (
                  <div key={contact.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{contactName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="ml-2">
                        <p className="text-sm font-medium">{contactName}</p>
                        <p className="text-xs text-muted-foreground">{contactPhone}</p>
                      </div>
                    </div>
                    {contact.status === "pending" && contact.contact_id === currentUser.id ? (
                      <Button size="sm" onClick={() => handleAcceptContact(contact.id)}>Accept</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteContact(contact.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

