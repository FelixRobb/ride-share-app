import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LucideUser, Mail, Phone, Car, MapPin, Loader, Moon, Sun, Monitor } from "lucide-react"
import { toast } from "sonner"
import type { User, Contact, AssociatedPerson } from "../types"
import {
  updateProfile,
  changePassword,
  addAssociatedPerson,
  deleteAssociatedPerson,
  deleteUser,
  fetchUserStats,
} from "../utils/api"
import { Switch } from "@/components/ui/switch"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { cleanupPushSubscription, unregisterServiceWorker } from "@/utils/cleanupService"
import "react-phone-number-input/style.css"
import { ContactDialog } from "./ContactDialog"
import { useTheme } from "next-themes"

interface ProfilePageProps {
  currentUser: User
  setCurrentUser: (user: User | null) => void
  contacts: Contact[]
  associatedPeople: AssociatedPerson[]
  fetchUserData: (userId: string) => Promise<void>
}

export default function ProfilePage({
  currentUser,
  setCurrentUser,
  contacts,
  associatedPeople,
  fetchUserData,
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
  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([])
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const router = useRouter()
  const isOnline = useOnlineStatus()

  const { theme, setTheme } = useTheme()
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
    if (currentUser) {
      await cleanupPushSubscription(currentUser.id)
      await unregisterServiceWorker()
    }
    localStorage.removeItem("currentUser")
    router.push('/')
  }

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutDialogOpen(false);
    logout();
  };

  useEffect(() => {
    const fetchPushPreference = async () => {
      setIsPushLoading(true)
      try {
        if (!isOnline) {
          console.log("User is offline. Skipping push preference fetch.")
          return
        }
        const response = await fetch(`/api/users/${currentUser.id}/push-preference`)
        if (response.ok) {
          const data = await response.json()
          setIsPushEnabled(data.enabled)
        } else {
          console.error("Failed to fetch push preference:", response.statusText)
        }
      } catch (error) {
        console.error("Error fetching push notification preference:", error)
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
        await updateProfile(currentUser.id, editedUser)
        setCurrentUser(editedUser)
        localStorage.setItem("currentUser", JSON.stringify(editedUser))
        toast.success("Profile updated successfully!")
        setIsEditProfileOpen(false)
        void fetchUserData(currentUser.id)
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
        void fetchUserData(currentUser.id)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }
  }

  const handleDeleteAssociatedPerson = async (personId: string) => {
    try {
      await deleteAssociatedPerson(personId, currentUser.id)
      void fetchUserData(currentUser.id)
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
      setCurrentUser(null)
      localStorage.removeItem("currentUser")
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
    } catch (error) {
      console.error("Error updating push notification preference:", error)
      toast.error("Failed to update push notification preference. Please try again.")
      setIsPushEnabled(!checked)
    }
  }

  const fetchUserDataCallback = useCallback(async () => {
    if (isOnline && currentUser) {
      try {
        await fetchUserData(currentUser.id)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to fetch user data. Please try again.")
      }
    }
  }, [isOnline, currentUser, fetchUserData, toast])

  const fetchSuggestedContacts = useCallback(async () => {
    if (isOnline && currentUser) {
      try {
        const response = await fetch(`/api/suggested-contacts?userId=${currentUser.id}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestedContacts(data.suggestedContacts)
        } else {
          throw new Error("Failed to fetch suggested contacts")
        }
      } catch (error) {
        console.error("Error fetching suggested contacts:", error)
        toast.error("Failed to fetch suggested contacts. Please try again.")
      }
    }
  }, [isOnline, currentUser, toast])

  useEffect(() => {
    fetchUserDataCallback()
    fetchSuggestedContacts()
    const intervalId = setInterval(() => {
      fetchUserDataCallback()
      fetchSuggestedContacts()
    }, 20000)
    return () => clearInterval(intervalId)
  }, [fetchUserDataCallback, fetchSuggestedContacts])

  useEffect(() => {
    const fetchStats = async () => {
      if (currentUser && isOnline) {
        try {
          const stats = await fetchUserStats(currentUser.id)
          setUserStats(stats)
        } catch (error) {
          console.error("Error fetching user stats:", error)
          toast.error("Failed to fetch user statistics. Please try again.")
        }
      }
    }

    fetchStats()
    const intervalId = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(intervalId)
  }, [currentUser, isOnline, toast])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="mb-8" data-tutorial="profile-info">
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
            <Button onClick={() => setIsEditProfileOpen(true)} disabled={!isOnline}>
              Edit Profile
            </Button>
            <Button onClick={() => setIsChangePasswordOpen(true)} disabled={!isOnline}>
              Change Password
            </Button>
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
                <p>{userStats?.ridesOffered || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-medium">Rides Requested</p>
                <p>{userStats?.ridesRequested || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8" data-tutorial="notification-settings">
        <CardHeader>
          <CardTitle className="text-2xl">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive notifications even when the app is closed</p>
            </div>
            {isPushLoading ? (
              <Loader className="animate-spin h-5 w-5" />
            ) : (
              <Switch checked={isPushEnabled} onCheckedChange={handlePushToggle} disabled={!isOnline} />
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8" data-tutorial="contacts-section">
        <CardHeader>
          <CardTitle className="text-2xl">Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactDialog
            currentUser={currentUser}
            contacts={contacts}
            suggestedContacts={suggestedContacts}
            fetchUserData={() => fetchUserData(currentUser.id)}
          />
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAssociatedPerson(person.id)}
                  disabled={!isOnline}
                >
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
            <Button onClick={handleAddAssociatedPerson} className="w-full" disabled={!isOnline}>
              Add Associated Person
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Theme Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span>Current theme:</span>
            <div className="relative inline-flex items-center rounded-full bg-background p-1 shadow-[0_0_1px_1px_rgba(255,255,255,0.1)]">
              <button
                className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${currentMode === "system" ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                onClick={() => toggleTheme("system")}
                aria-label="System theme"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${currentMode === "light" ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                onClick={() => toggleTheme("light")}
                aria-label="Light theme"
              >
                <Sun className="h-4 w-4" />
              </button>
              <button
                className={`flex items-center justify-center rounded-full p-1.5 transition-colors ${currentMode === "dark" ? "bg-accent" : "hover:bg-accent/50"
                  }`}
                onClick={() => toggleTheme("dark")}
                aria-label="Dark theme"
              >
                <Moon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Logout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <p>Logout of your account.</p>
          <Button variant="destructive" onClick={handleLogout} disabled={!isOnline}>Logout</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeletingAccount || !isOnline}>
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
                  onChange={(e) => {
                    const phoneNumber = e.target.value
                    setEditedUser((prev) => (prev ? { ...prev, phone: phoneNumber } : null))
                  }}
                  placeholder="Enter your phone number"
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
              <Button type="submit" disabled={isUpdatingProfile || !isOnline}>
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
              <Button type="submit" disabled={isChangingPassword || !isOnline}>
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
            <Button
              className="mb-2"
              variant="outline"
              onClick={() => setIsDeleteAccountDialogOpen(false)}
              disabled={!isOnline}
            >
              Cancel
            </Button>
            <Button className="mb-2" variant="destructive" onClick={confirmDeleteUser} disabled={!isOnline}>
              Delete Account
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
            <Button className="mb-2" variant="destructive" onClick={confirmLogout}>Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

