"use client"

import { LucideUser, Mail, Phone, Car, Loader, Moon, Sun, Monitor, Settings, Shield, Bell, UserPlus, LogOut, UserX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { parsePhoneNumber } from "libphonenumber-js"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

import type { User, Contact, AssociatedPerson } from "../types"
import {
  updateProfile,
  changePassword,
  addAssociatedPerson,
  deleteAssociatedPerson,
  deleteUser,
  fetchUserStats,
} from "../utils/api"

import { ContactManager } from "./ContactDialog"

interface ProfilePageProps {
  currentUser: User
  contacts: Contact[]
  associatedPeople: AssociatedPerson[]
  refreshData: () => Promise<void>
}

export default function ProfilePage({
  currentUser,
  contacts,
  associatedPeople,
  refreshData,
}: ProfilePageProps) {
  const [newAssociatedPerson, setNewAssociatedPerson] = useState({ name: "", relationship: "" })
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [editedUser, setEditedUser] = useState<User | null>(currentUser)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false)
  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isPushLoading, setIsPushLoading] = useState(true)
  const [userStats, setUserStats] = useState<{ ridesOffered: number; ridesRequested: number } | null>(null)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const router = useRouter()
  const isOnline = useOnlineStatus()

  const { setTheme } = useTheme()
  const [currentMode, setCurrentMode] = useState<"system" | "light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "system" | "light" | "dark") || "system"
    }
    return "system"
  })

  useEffect(() => {
    localStorage.setItem("theme", currentMode)
    setTheme(currentMode)
  }, [currentMode, setTheme])

  const toggleTheme = (newMode: "system" | "light" | "dark") => {
    setCurrentMode(newMode)
    localStorage.setItem("theme", newMode)
  }

  const logout = async () => {
    router.push("/logout")
  }

  const handleLogout = () => {
    setIsLogoutDialogOpen(true)
  }

  const confirmLogout = () => {
    setIsLogoutDialogOpen(false)
    logout()
  }

  // Set edited user when currentUser changes
  useEffect(() => {
    setEditedUser(currentUser)
  }, [currentUser])

  useEffect(() => {
    const fetchPushPreference = async () => {
      setIsPushLoading(true)
      try {
        if (!isOnline) {
          return
        }
        const response = await fetch(`/api/users/${currentUser.id}/push-preference`)
        if (response.ok) {
          const data = await response.json()
          setIsPushEnabled(data.enabled)
        }
      } finally {
        setIsPushLoading(false)
      }
    }

    if (currentUser) {
      void fetchPushPreference()
    }
  }, [currentUser, isOnline])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editedUser) {
      try {
        setIsUpdatingProfile(true)
        const phoneNumber = parsePhoneNumber(editedUser.phone)
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number")
        }
        const e164PhoneNumber = phoneNumber.format("E.164")
        await updateProfile(currentUser.id, { ...editedUser, phone: e164PhoneNumber })
        toast.success("Profile updated successfully!")
        setIsEditProfileOpen(false)
        await refreshData() // Use the prop function to refresh data
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      } finally {
        setIsUpdatingProfile(false)
      }
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match")
      return
    }
    try {
      setIsChangingPassword(true)
      await changePassword(currentUser.id, currentPassword, newPassword)
      toast.success("Password changed successfully!")
      setIsChangePasswordOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleAddAssociatedPerson = async () => {
    if (newAssociatedPerson.name && newAssociatedPerson.relationship) {
      const associatename = newAssociatedPerson.name.trim()
      const associaterela = newAssociatedPerson.relationship.trim()
      try {
        await addAssociatedPerson(currentUser.id, associatename, associaterela)
        setNewAssociatedPerson({ name: "", relationship: "" })
        await refreshData() // Use the prop function to refresh data
        toast.success(`${associatename} added successfully!`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }
  }

  const handleDeleteAssociatedPerson = async (personId: string, personName: string) => {
    try {
      await deleteAssociatedPerson(personId, currentUser.id)
      await refreshData() // Use the prop function to refresh data
      toast.success(`${personName} removed successfully.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  const handleDeleteUser = async () => {
    setIsDeleteAccountDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    try {
      setIsDeletingAccount(true)
      await deleteUser(currentUser.id)
      toast.success("Your account has been successfully deleted.")
      setIsDeleteAccountDialogOpen(false)
      router.push("/")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handlePushToggle = async (checked: boolean) => {
    setIsPushEnabled(checked)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/push-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: checked }),
      })
      if (!response.ok) {
        throw new Error("Failed to update push notification preference")
      }
      toast.success(checked ? "Push notifications enabled" : "Push notifications disabled")
    } catch {
      toast.error("Failed to update push notification preference. Please try again.")
      setIsPushEnabled(!checked)
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser && isOnline) {
        try {
          const stats = await fetchUserStats(currentUser.id)
          setUserStats(stats)
        } catch {
          toast.error("Failed to fetch user statistics. Please try again.")
        }
      }
    }

    fetchStats()
    const intervalId = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(intervalId)
  }, [currentUser, isOnline])

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-8">
      {/* Profile header with avatar */}
      <div className="mb-6 flex flex-col items-center sm:flex-row sm:justify-between">
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
              {getInitials(currentUser?.name || 'User')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{currentUser?.name}</h1>
            <p className="text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> {currentUser?.email}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditProfileOpen(true)} disabled={!isOnline} size="sm" variant="outline">
            <Settings className="h-4 w-4 mr-2" /> Edit Profile
          </Button>
          <Button onClick={handleLogout} disabled={!isOnline} size="sm" variant="outline" className="text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Main content tabs */}
      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <LucideUser className="h-5 w-5 mr-2 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                <p className="font-medium">{currentUser?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                <p className="font-medium">{currentUser?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                <p className="font-medium">{currentUser?.phone}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setIsEditProfileOpen(true)} disabled={!isOnline} size="sm" variant="outline" className="w-full sm:w-auto">
                Edit Information
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Car className="h-5 w-5 mr-2 text-primary" /> Activity Statistics
              </CardTitle>
              <CardDescription>Your activity summary on the platform</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary mb-1">{userStats?.ridesOffered || 0}</span>
                  <span className="text-sm text-muted-foreground">Rides Offered</span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary mb-1">{userStats?.ridesRequested || 0}</span>
                  <span className="text-sm text-muted-foreground">Rides Requested</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-primary" /> Associated People
              </CardTitle>
              <CardDescription>People you&apos;ve added to your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {associatedPeople.length > 0 ? (
                <div className="space-y-3">
                  {associatedPeople.map((person) => (
                    <div key={person.id} className="flex justify-between items-center px-4 py-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(person.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-xs text-muted-foreground">{person.relationship}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteAssociatedPerson(person.id, person.name)}
                        disabled={!isOnline}
                      >
                        <UserX className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No associated people added yet.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2 w-full">
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
              </div>
              <Button
                onClick={handleAddAssociatedPerson}
                className="w-full"
                disabled={!isOnline || !newAssociatedPerson.name || !newAssociatedPerson.relationship}
              >
                <UserPlus className="h-4 w-4 mr-2" /> Add Person
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" /> Password Management
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 p-4 rounded-lg mb-4">
                <p className="text-sm">For security reasons, you should change your password regularly. Use a strong password that includes uppercase and lowercase letters, numbers, and special characters.</p>
              </div>
              <Button onClick={() => setIsChangePasswordOpen(true)} disabled={!isOnline} className="w-full sm:w-auto">
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Bell className="h-5 w-5 mr-2 text-primary" /> Notification Settings
              </CardTitle>
              <CardDescription>Configure how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div className="space-y-0.5">
                  <h3 className="font-medium">Push Notifications</h3>
                  <p className="text-sm text-muted-foreground">Receive alerts even when app is closed</p>
                </div>
                {isPushLoading ? (
                  <Loader className="animate-spin h-5 w-5" />
                ) : (
                  <Switch checked={isPushEnabled} onCheckedChange={handlePushToggle} disabled={!isOnline} />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center text-destructive">
                <UserX className="h-5 w-5 mr-2" /> Danger Zone
              </CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 p-4 rounded-lg mb-4 border border-destructive/20">
                <h3 className="font-medium mb-1 text-destructive">Delete Account</h3>
                <p className="text-sm mb-3">Once you delete your account, there is no going back. All your data will be permanently removed.</p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={isDeletingAccount || !isOnline}
                  size="sm"
                >
                  {isDeletingAccount ? <Loader className="animate-spin h-4 w-4 mr-2" /> : null}
                  {isDeletingAccount ? "Deleting..." : "Delete Account"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" /> Your Contacts
              </CardTitle>
              <CardDescription>Manage people you frequently travel with</CardDescription>
            </CardHeader>
            <CardContent>
              <ContactManager
                currentUser={currentUser}
                contacts={contacts}
                fetchProfileData={refreshData}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-primary" /> App Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks on your device</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 p-4 rounded-lg flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h3 className="font-medium mb-1">Theme Preference</h3>
                  <p className="text-sm text-muted-foreground">Select how you want the application to appear</p>
                </div>
                <div className="flex p-1 gap-1 self-start bg-secondary rounded-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center justify-center rounded-full px-3 ${currentMode === "light" ? "bg-background shadow" : "hover:bg-background/50"}`}
                    onClick={() => toggleTheme("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" /> Light
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center justify-center rounded-full px-3 ${currentMode === "dark" ? "bg-background shadow" : "hover:bg-background/50"}`}
                    onClick={() => toggleTheme("dark")}
                  >
                    <Moon className="h-4 w-4 mr-2" /> Dark
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex items-center justify-center rounded-full px-3 ${currentMode === "system" ? "bg-background shadow" : "hover:bg-background/50"}`}
                    onClick={() => toggleTheme("system")}
                  >
                    <Monitor className="h-4 w-4 mr-2" /> System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center">
                <Settings className="h-5 w-5 mr-2 text-primary" /> Application Settings
              </CardTitle>
              <CardDescription>General application configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                  <div className="space-y-0.5">
                    <h3 className="font-medium">Online Status</h3>
                    <p className="text-sm text-muted-foreground">Your current connection status</p>
                  </div>
                  <Badge variant={isOnline ? "default" : "destructive"} className="ml-auto">
                    {isOnline ? "Online" : "Offline"}
                  </Badge>
                </div>
                {/* Additional settings can be added here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="rounded-lg w-11/12 max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your personal information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile}>
            <div className="grid w-full items-center gap-4 py-2">
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
                <PhoneInput
                  id="edit-phone"
                  value={editedUser?.phone || ""}
                  onChange={(value) => setEditedUser((prev) => (prev ? { ...prev, phone: value || "" } : null))}
                  defaultCountry="PT"
                  international
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <Button variant="outline" type="button" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingProfile || !isOnline}>
                {isUpdatingProfile ? <Loader className="animate-spin h-4 w-4 mr-2" /> : null}
                {isUpdatingProfile ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="rounded-lg w-11/12 max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and a new password</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword}>
            <div className="grid w-full items-center gap-4 py-2">
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
              <Button variant="outline" type="button" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isChangingPassword || !isOnline}>
                {isChangingPassword ? <Loader className="animate-spin h-4 w-4 mr-2" /> : null}
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteAccountDialogOpen} onOpenChange={setIsDeleteAccountDialogOpen}>
        <DialogContent className="rounded-lg w-11/12 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 my-2">
            <p className="text-sm">All your data will be permanently removed, including:</p>
            <ul className="text-sm list-disc list-inside mt-2 space-y-1">
              <li>Your personal information</li>
              <li>Ride history</li>
              <li>Contacts and associated people</li>
              <li>Account settings</li>
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAccountDialogOpen(false)}
              className="sm:order-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={!isOnline}
              className="sm:order-2"
            >
              {isDeletingAccount ? <Loader className="animate-spin h-4 w-4 mr-2" /> : null}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>Are you sure you want to log out?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="mb-2" variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="mb-2" variant="destructive" onClick={confirmLogout}>
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}