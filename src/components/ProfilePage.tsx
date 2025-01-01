import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LucideUser, Mail, Phone, Car, MapPin, Loader } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { User, Contact, AssociatedPerson, UserStats } from "../types";
import {
  updateProfile,
  changePassword,
  addContact,
  acceptContact,
  deleteContact,
  addAssociatedPerson,
  deleteAssociatedPerson,
  deleteUser,
} from "../utils/api";
import { Switch } from "@/components/ui/switch";

interface ProfilePageProps {
  currentUser: User;
  setCurrentUser: (user: User | null) => void;
  contacts: Contact[];
  associatedPeople: AssociatedPerson[];
  userStats: UserStats | null;
  fetchUserData: (userId: string) => Promise<void>;
}

export default function ProfilePage({
  currentUser,
  setCurrentUser,
  contacts,
  associatedPeople,
  userStats,
  fetchUserData,
}: ProfilePageProps) {
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newAssociatedPerson, setNewAssociatedPerson] = useState({ name: "", relationship: "" });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [editedUser, setEditedUser] = useState<User | null>(currentUser);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteContactDialogOpen, setIsDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [isPushLoading, setIsPushLoading] = useState(true);

  const { toast } = useToast();

  const fetchSuggestedContacts = useCallback(async () => {
    if (!currentUser) return;
    setIsFetchingSuggestions(true);
    try {
      const response = await fetch(`/api/suggested-contacts?userId=${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestedContacts(data.suggestedContacts || []);
      } else {
        throw new Error("Failed to fetch suggested contacts");
      }
    } catch (error) {
      console.error("Error fetching suggested contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load suggested contacts. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    fetchSuggestedContacts();
  }, [fetchSuggestedContacts]);

  useEffect(() => {
    const fetchPushPreference = async () => {
      setIsPushLoading(true); // Set loading to true before fetching
      try {
        const response = await fetch(`/api/users/${currentUser.id}/push-preference`);
        if (response.ok) {
          const data = await response.json();
          setIsPushEnabled(data.enabled);
        }
      } catch (error) {
        console.error('Error fetching push notification preference:', error);
      } finally {
        setIsPushLoading(false); // Set loading to false after fetching, regardless of success/failure
      }
    };

    if (currentUser) {
      void fetchPushPreference();
    }
  }, [currentUser]);


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedUser) {
      try {
        setIsUpdatingProfile(true);
        await updateProfile(currentUser.id, editedUser);
        setCurrentUser(editedUser);
        localStorage.setItem("currentUser", JSON.stringify(editedUser));
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
        setIsEditProfileOpen(false);
        void fetchUserData(currentUser.id);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsUpdatingProfile(false);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsChangingPassword(true);
      await changePassword(currentUser.id, currentPassword, newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      setIsChangePasswordOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAddContact = async () => {
    if (newContactPhone.trim()) {
      try {
        setIsAddingContact(true);
        await addContact(currentUser.id, newContactPhone);
        setNewContactPhone("");
        await fetchUserData(currentUser.id);
        await fetchSuggestedContacts();
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsAddingContact(false);
      }
    }
  };

  const handleAcceptContact = async (contactId: string) => {
    try {
      await acceptContact(contactId, currentUser.id);
      await fetchUserData(currentUser.id);
      await fetchSuggestedContacts();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContact = (contactId: string) => {
    setContactToDelete(contactId);
    setIsDeleteContactDialogOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (contactToDelete) {
      try {
        await deleteContact(contactToDelete, currentUser.id);
        await fetchUserData(currentUser.id);
        await fetchSuggestedContacts();
        setIsDeleteContactDialogOpen(false);
        setContactToDelete(null);
        toast({
          title: "Contact Deleted",
          description: "The contact has been successfully deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddAssociatedPerson = async () => {
    if (newAssociatedPerson.name && newAssociatedPerson.relationship) {
      try {
        await addAssociatedPerson(currentUser.id, newAssociatedPerson.name, newAssociatedPerson.relationship);
        setNewAssociatedPerson({ name: "", relationship: "" });
        void fetchUserData(currentUser.id);
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteAssociatedPerson = async (personId: string) => {
    try {
      await deleteAssociatedPerson(personId, currentUser.id);
      void fetchUserData(currentUser.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    setIsDeleteAccountDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteUser(currentUser.id);
      setCurrentUser(null);
      localStorage.removeItem("currentUser");
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      setIsDeleteAccountDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handlePushToggle = async (checked: boolean) => {
    setIsPushEnabled(checked);
    try {
      const response = await fetch(`/api/users/${currentUser.id}/push-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: checked }),
      });
      if (!response.ok) {
        throw new Error('Failed to update push notification preference');
      }
      toast({
        title: checked ? "Push notifications enabled" : "Push notifications disabled",
        description: checked ? "You will now receive push notifications" : "You will no longer receive push notifications",
      });
    } catch (error) {
      console.error('Error updating push notification preference:', error);
      toast({
        title: "Error",
        description: "Failed to update push notification preference. Please try again.",
        variant: "destructive",
      });
      setIsPushEnabled(!checked); // Revert the switch if the API call fails
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <LucideUser className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p>{currentUser?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Phone className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p>{currentUser?.phone}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Mail className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p>{currentUser?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Button onClick={() => setIsEditProfileOpen(true)}>Edit Profile</Button>
            <Button onClick={() => setIsChangePasswordOpen(true)}>Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-4">
              <Car className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Rides Offered</p>
                <p>{userStats?.rides_offered || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Rides Accepted</p>
                <p>{userStats?.rides_accepted || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications even when the app is closed</p>
            </div>
            {isPushLoading ? ( // Conditionally render loader or switch
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              <Switch
                checked={isPushEnabled}
                onCheckedChange={handlePushToggle}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contacts.map((contact) => {
            const isCurrentUserRequester = contact.user_id === currentUser?.id;
            const contactName = isCurrentUserRequester ? contact.contact?.name ?? "Unknown name" : contact.user?.name ?? "Unknown name";
            const contactPhone = isCurrentUserRequester ? contact.contact?.phone ?? "Unknown phone" : contact.user?.phone ?? "Unknown phone";

            return (
              <div key={contact.id} className="flex flex-col space-y-2 p-3 bg-secondary rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {contactName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex flex-row items-center gap-1">
                        <p className="font-semibold">{contactName}</p>
                        <p className="text-sm text-muted-foreground">({contact.status})</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{contactPhone}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {contact.status === "pending" && contact.contact_id === currentUser?.id && (
                      <Button onClick={() => handleAcceptContact(contact.id)} size="sm">
                        Accept
                      </Button>
                    )}
                    <Button onClick={() => handleDeleteContact(contact.id)} variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex space-x-2 mt-4">
            <Input
              id="telephone-contact"
              type="tel"
              placeholder="Enter contact's phone number"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
            />
            <Button onClick={handleAddContact} disabled={isAddingContact}>
              {isAddingContact ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
              {isAddingContact ? "Adding..." : "Add Contact"}
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Suggested Contacts</h3>
            {isFetchingSuggestions ? (
              <div className="flex space-x-4 overflow-x-auto p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col items-center space-y-2 w-32">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : suggestedContacts.length > 0 ? (
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4">
                  {suggestedContacts.map((contact) => (
                    <div key={contact.id} className="flex flex-col items-center space-y-2 w-32">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">
                        {contact.common_rides > 0
                          ? `${contact.common_rides} common ride${contact.common_rides > 1 ? "s" : ""}`
                          : contact.is_mutual_contact
                          ? "Mutual contact"
                          : "No common rides"}
                      </p>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => addContact(currentUser.id, contact.phone)}>
                        Add Contact
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-muted-foreground py-4">No suggested contacts at the moment.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Associated People</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {associatedPeople.map((person) => (
              <div key={person.id} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                <span>
                  {person.name} ({person.relationship})
                </span>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteAssociatedPerson(person.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <Input
              id="name-ass"
              placeholder="Name"
              value={newAssociatedPerson.name}
              onChange={(e) => setNewAssociatedPerson((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              id="rela-ass"
              placeholder="Relationship"
              value={newAssociatedPerson.relationship}
              onChange={(e) => setNewAssociatedPerson((prev) => ({ ...prev, relationship: e.target.value }))}
            />
            <Button onClick={handleAddAssociatedPerson} className="w-full">
              Add Associated Person
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingAccount}>
            {isDeletingAccount ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
            {isDeletingAccount ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editedUser?.name || ""}
                  onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editedUser?.phone || ""}
                  onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editedUser?.email || ""}
                  onChange={(e) => setEditedUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
                {isUpdatingProfile ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
      <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and a new password</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? <Loader className="animate-spin h-5 w-5 mr-2" /> : null}
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
      <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setIsDeleteAccountDialogOpen(false)}>Cancel</Button>
            <Button className="mb-2" variant="destructive" onClick={confirmDeleteUser}>Delete Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteContactDialogOpen} onOpenChange={setIsDeleteContactDialogOpen}>
      <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Delete Contact</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setIsDeleteContactDialogOpen(false)}>Cancel</Button>
            <Button className="mb-2" variant="destructive" onClick={confirmDeleteContact}>Delete Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

