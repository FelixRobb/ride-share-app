"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "@/hooks/use-auth";
// import { updateProfile, changePassword, deleteUser } from "@/lib/auth";
// import { addContact, acceptContact, deleteContact } from "@/lib/contacts";
// import { addAssociatedPerson, deleteAssociatedPerson } from "@/lib/associated-people";

export function ProfilePage() {
  // const { currentUser, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  const [newContactPhone, setNewContactPhone] = useState("");
  const [newAssociatedPerson, setNewAssociatedPerson] = useState({ name: "", relationship: "" });
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [editedUser, setEditedUser] = useState<{
    name: string;
    phone: string;
    email: string;
  } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      setEditedUser(parsedUser);
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!currentUser) {
    return null;
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editedUser) {
      try {
        await updateProfile(editedUser);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
        setIsEditProfileOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const updateProfile = async (updatedUser: any) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setCurrentUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Update profile error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
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
      await changePassword(currentPassword, newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
      setIsChangePasswordOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch(`/api/users/${currentUser.id}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully!",
        });
        setIsChangePasswordOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Change password error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };


  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        // await deleteUser();
        // logout();
        router.push("/");
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete account. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <p>{currentUser.name}</p>
            </div>
            <div>
              <Label>Phone</Label>
              <p>{currentUser.phone}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p>{currentUser.email}</p>
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <Button onClick={() => setIsEditProfileOpen(true)}>Edit Profile</Button>
            <Button onClick={() => setIsChangePasswordOpen(true)}>Change Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Contacts list and management UI */}
          <div className="flex space-x-2 mt-4">
            <Input
              type="tel"
              placeholder="Enter contact's phone number"
              value={newContactPhone}
              onChange={(e) => setNewContactPhone(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newContactPhone.trim()) {
                  // addContact(newContactPhone);
                  setNewContactPhone("");
                }
              }}
            >
              Add Contact
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Associated People</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Associated people list and management UI */}
          <div className="mt-4 space-y-2">
            <Input
              placeholder="Name"
              value={newAssociatedPerson.name}
              onChange={(e) => setNewAssociatedPerson((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="Relationship"
              value={newAssociatedPerson.relationship}
              onChange={(e) => setNewAssociatedPerson((prev) => ({ ...prev, relationship: e.target.value }))}
            />
            <Button
              onClick={() => {
                if (newAssociatedPerson.name && newAssociatedPerson.relationship) {
                  // addAssociatedPerson(newAssociatedPerson.name, newAssociatedPerson.relationship);
                  setNewAssociatedPerson({ name: "", relationship: "" });
                }
              }}
              className="w-full"
            >
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
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
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
                  onChange={(e) => setEditedUser((prev: typeof editedUser) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editedUser?.phone || ""}
                  onChange={(e) => setEditedUser((prev: typeof editedUser) => (prev ? { ...prev, phone: e.target.value } : null))}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  value={editedUser?.email || ""}
                  onChange={(e) => setEditedUser((prev: typeof editedUser) => (prev ? { ...prev, email: e.target.value } : null))}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
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
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">Change Password</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

