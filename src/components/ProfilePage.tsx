"use client"

import type React from "react"

import {
  LucideUser,
  Mail,
  Phone,
  Car,
  Loader,
  Moon,
  Sun,
  Monitor,
  Settings,
  Shield,
  Bell,
  UserPlus,
  LogOut,
  UserX,
  Smartphone,
  Trash2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useState, useEffect, useCallback } from "react"
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
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useOnlineStatus } from "@/utils/useOnlineStatus"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"
import { signOut } from "next-auth/react"

import type { User, Contact, AssociatedPerson, PushSubscription as AppPushSubscription } from "../types"
import {
  updateProfile,
  changePassword,
  addAssociatedPerson,
  deleteAssociatedPerson,
  deleteUser,
  fetchUserStats,
  fetchProfileData,
} from "../utils/api"
import { getDeviceId, formatLastUsed } from "@/utils/deviceUtils"
import { unregisterServiceWorker } from "@/utils/cleanupService"

import { ContactManager } from "./ContactDialog"

interface ProfilePageProps {
  currentUser: User
}

export default function ProfilePage({ currentUser }: ProfilePageProps) {
  const [user, setUser] = useState<User>(currentUser)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const [newAssociatedPerson, setNewAssociatedPerson] = useState({ name: "", relationship: "" })
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [editedUser, setEditedUser] = useState<User | null>(currentUser)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [userStats, setUserStats] = useState<{ ridesOffered: number; ridesRequested: number } | null>(null)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const router = useRouter()
  const isOnline = useOnlineStatus()
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [pushDevices, setPushDevices] = useState<AppPushSubscription[]>([])
  const [isPushLoading, setIsPushLoading] = useState(true)
  const [currentDeviceId] = useState(() => getDeviceId())
  const [editedUserData, setEditedUserData] = useState<User | null>(null)

  const { setTheme } = useTheme()
  const [currentMode, setCurrentMode] = useState<"system" | "light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "system" | "light" | "dark") || "system"
    }
    return "system"
  })

  const [newPasswordStrength, setNewPasswordStrength] = useState<string>("")

  // Function to evaluate password strength
  const evaluatePasswordStrength = (password: string) => {
    const lengthCriteria = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (password.length < 6) return "Too short"
    if (lengthCriteria && hasUppercase && hasNumber) return "Strong"
    if (lengthCriteria) return "Medium"
    return "Weak"
  }

  // Fetch profile data
  const fetchData = useCallback(
    async (silent = false) => {
      if (!isOnline) return

      if (!silent) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }

      try {
        const data = await fetchProfileData()
        setUser(data.user)
        setContacts(data.contacts)
        setAssociatedPeople(data.associatedPeople)
        setEditedUser(data.user)
      } catch {
        if (!silent) {
          toast.error("Failed to fetch profile data. Please try again.")
        }
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [isOnline],
  )

  // Initial data fetch
  useEffect(() => {
    fetchData()
    const intervalId = setInterval(() => fetchData(true), 20000) // Refresh every 20 seconds silently
    return () => clearInterval(intervalId)
  }, [fetchData])

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

  const handleEditProfileOpen = () => {
    setEditedUserData({ ...user })
    setIsEditProfileOpen(true)
  }

  useEffect(() => {
    const fetchPushDevices = async () => {
      if (!isOnline || !user) return

      setIsPushLoading(true)
      try {
        const response = await fetch(`/api/users/${user.id}/push-devices`)
        if (response.ok) {
          const data = await response.json()
          setPushDevices(data.devices || [])
        } else {
          // Handle error case
          setPushDevices([])
          toast.error("Failed to load device notifications")
        }
      } catch {
        setPushDevices([])
        toast.error("Network error while loading devices")
      } finally {
        setIsPushLoading(false)
      }
    }

    void fetchPushDevices()
  }, [user, user?.id, isOnline])

  const handleToggleDevice = async (deviceId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/users/${user.id}/push-preference`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, deviceId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update device preference")
      }

      const data = await response.json()
      if (data.success) {
        setPushDevices((prev) =>
          prev.map((device) => (device.device_id === deviceId ? { ...device, enabled } : device)),
        )
        toast.success(enabled ? "Notifications enabled for this device" : "Notifications disabled for this device")
      } else {
        throw new Error("Failed to update device preference")
      }
    } catch {
      toast.error("Failed to update notification preference. Please try again.")
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/push-subscription`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, deviceId }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove device")
      }

      setPushDevices((prev) => prev.filter((device) => device.device_id !== deviceId))
      toast.success("Device removed successfully")
    } catch {
      toast.error("Failed to remove device")
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editedUserData) {
      try {
        setIsUpdatingProfile(true)

        // Validate phone number
        const phoneNumber = parsePhoneNumber(editedUserData.phone)
        if (!phoneNumber || !phoneNumber.isValid()) {
          throw new Error("Invalid phone number")
        }
        const e164PhoneNumber = phoneNumber.format("E.164")

        // Check if email is being changed
        const isEmailChanged = user.email.toLowerCase() !== editedUserData.email.toLowerCase()

        if (isEmailChanged) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(editedUserData.email)) {
            throw new Error("Invalid email format")
          }
        }

        // Update profile
        const updatedUser = await updateProfile(user.id, {
          ...editedUserData,
          phone: e164PhoneNumber,
          email: editedUserData.email.toLowerCase(),
        })

        if (!updatedUser) {
          throw new Error("Failed to update profile")
        }

        // Show success message only if email hasn't changed
        if (!isEmailChanged) {
          toast.success("Profile updated successfully!")
        } else {
          // Show email change notification
          toast.info("A notification has been sent to your previous email address.", {
            duration: 6000,
            description: "If you did not make this change, please contact support immediately.",
            action: {
              label: "Undo",
              onClick: async () => {
                try {
                  setIsUpdatingProfile(true)
                  await updateProfile(user.id, {
                    ...editedUser,
                    email: user.email,
                  })
                  toast.success("Email change reverted successfully")
                  await fetchData(true)
                } catch {
                  toast.error("Failed to revert email change")
                } finally {
                  setIsUpdatingProfile(false)
                }
              },
            },
          })
        }

        setIsEditProfileOpen(false)
        await fetchData(true)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("already in use")) {
            toast.error("This email address is already registered")
          } else if (error.message.includes("Invalid email")) {
            toast.error("Please enter a valid email address")
          } else if (error.message.includes("Invalid phone")) {
            toast.error("Please enter a valid phone number")
          } else {
            toast.error(error.message)
          }
        } else {
          toast.error("An unexpected error occurred")
        }
        setIsEditProfileOpen(false)
        await fetchData(true)
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
    if (newPasswordStrength === "Too short" || newPasswordStrength === "Weak") {
      toast.error("Please choose a stronger password")
      return
    }
    try {
      setIsChangingPassword(true)
      await changePassword(user.id, currentPassword, newPassword)
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
        await addAssociatedPerson(user.id, associatename, associaterela)
        setNewAssociatedPerson({ name: "", relationship: "" })
        await fetchData(true)
        toast.success(`${associatename} added successfully!`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }
  }

  const handleDeleteAssociatedPerson = async (personId: string, personName: string) => {
    try {
      await deleteAssociatedPerson(personId, user.id)
      await fetchData(true)
      toast.success(`${personName} removed successfully.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
    }
  }

  const handleDeleteUser = async () => {
    setIsDeleteAccountDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (deleteConfirmation !== "delete") {
      toast.error("Please type 'delete' to confirm account deletion.")
      return
    }

    try {
      setIsDeletingAccount(true)

      // Store user ID for later use
      const userId = user.id

      // 1. First, delete the user account
      try {
        await deleteUser(userId)
      } catch {
        toast.error("Failed to delete your account. Please try again.")
        setIsDeletingAccount(false)
        return
      }

      // 2. Handle push notification unsubscription
      let currentSubscription = null
      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready
        const browserSubscription = await registration.pushManager.getSubscription()

        // If we have a subscription, prepare it for the API
        if (browserSubscription) {
          currentSubscription = (browserSubscription as PushSubscription).toJSON
            ? (browserSubscription as PushSubscription).toJSON()
            : browserSubscription

          // Unsubscribe from push notifications
          await (browserSubscription as PushSubscription).unsubscribe()
        }
      }

      // 3. Get the device ID
      const deviceId = getDeviceId()

      // 4. Call the logout API with the current subscription and device ID
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: currentSubscription,
          deviceId,
        }),
        credentials: "include",
      })

      // 5. Unregister service worker
      await unregisterServiceWorker()

      // 6. Clear specific data from localStorage
      localStorage.removeItem("tutorialstep")
      localStorage.removeItem("rideData")
      localStorage.removeItem("theme")
      localStorage.removeItem("pushNotificationDeclined")
      localStorage.removeItem("rideshare_device_id")

      // 7. Sign out using NextAuth
      await signOut({ redirect: false })

      toast.success("Your account has been successfully deleted.")
      setIsDeleteAccountDialogOpen(false)

      // 8. Finally, redirect to login page using window.location instead of router.push
      window.location.href = "/login"
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred")
      setIsDeletingAccount(false)
    }
  }

  // Modify user stats fetching to have separate loading state
  useEffect(() => {
    const fetchStats = async () => {
      if (user && isOnline) {
        const stats = await fetchUserStats(user.id)
        setUserStats(stats)
      }
    }

    fetchStats()
    const intervalId = setInterval(fetchStats, 60000) // Refresh every minute
    return () => clearInterval(intervalId)
  }, [user, isOnline])

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-8">
      <>
        {/* Profile header with avatar */}
        <div className="mb-6 flex flex-col items-center sm:flex-row sm:justify-between" data-tutorial="profile-header">
          {isLoading ? (
            <div className="w-full flex items-center justify-between flex-col sm:flex-row">
              <div className="flex items-center gap-4 w-full mb-4 sm:mb-0">
                <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                <div className="space-y-2 w-full max-w-[300px]">
                  <Skeleton className="h-6 w-full max-w-[200px]" />
                  <Skeleton className="h-4 w-full max-w-[250px]" />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-center">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4 sm:mb-0">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                    {getInitials(user?.name || "User")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEditProfileOpen} disabled={!isOnline} size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
                <Button
                  onClick={handleLogout}
                  disabled={!isOnline}
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Main content tabs */}
        <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isLoading ? (
            <div className="flex flex-nowrap justify-center space-x-2 mb-6 w-full">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 mb-2 flex-1" />
              ))}
            </div>
          ) : (
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security" data-tutorial="security-tab">
                Security
              </TabsTrigger>
              <TabsTrigger value="contacts" data-tutorial="contacts-tab">
                Contacts
              </TabsTrigger>
              <TabsTrigger value="settings" data-tutorial="settings-tab">
                Settings
              </TabsTrigger>
            </TabsList>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, cardIndex) => (
                  <Card key={cardIndex}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40 mb-2" />
                      <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[...Array(cardIndex === 0 ? 3 : 2)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-full max-w-[120px]" />
                            <Skeleton className="h-6 w-full max-w-[200px]" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              // Original profile tab content remains the same
              <>
                <Card data-tutorial="personal-info">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center">
                      <LucideUser className="h-5 w-5 mr-2 text-primary" /> Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="font-medium">{user?.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <p className="font-medium">{user?.phone}</p>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={handleEditProfileOpen}
                      disabled={!isOnline}
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Edit Information
                    </Button>
                  </CardFooter>
                </Card>

                <Card data-tutorial="activity-stats">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center">
                      <Car className="h-5 w-5 mr-2 text-primary" /> Activity Statistics
                    </CardTitle>
                    <CardDescription>Your activity summary on the platform</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-secondary/50 rounded-lg p-4 flex flex-col items-center justify-center">
                        {userStats ? (
                          <span className="text-3xl font-bold text-primary mb-1">{userStats.ridesOffered}</span>
                        ) : (
                          <Skeleton className="h-8 w-8 rounded-md mb-1" />
                        )}
                        <span className="text-sm text-muted-foreground">Rides Offered</span>
                      </div>
                      <div className="bg-secondary/50 rounded-lg p-4 flex flex-col items-center justify-center">
                        {userStats ? (
                          <span className="text-3xl font-bold text-primary mb-1">{userStats.ridesRequested}</span>
                        ) : (
                          <Skeleton className="h-8 w-8 rounded-md mb-1" />
                        )}
                        <span className="text-sm text-muted-foreground">Rides Requested</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-tutorial="associated-people">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-primary" /> Associated People
                    </CardTitle>
                    <CardDescription>People you&apos;ve added to your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isRefreshing && associatedPeople.length === 0 ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : associatedPeople.length > 0 ? (
                      <div className="space-y-3">
                        {associatedPeople.map((person) => (
                          <div
                            key={person.id}
                            className="flex justify-between items-center px-4 py-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
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
              </>
            )}
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, cardIndex) => (
                  <Card key={cardIndex}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-primary" /> Password Management
                    </CardTitle>
                    <CardDescription>Update your password to keep your account secure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-secondary/30 p-4 rounded-lg mb-4">
                      <p className="text-sm">
                        For security reasons, you should change your password regularly. Use a strong password that
                        includes uppercase and lowercase letters, numbers, and special characters.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsChangePasswordOpen(true)}
                      disabled={!isOnline}
                      className="w-full sm:w-auto"
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center">
                      <Bell className="h-5 w-5 mr-2 text-primary" /> Notification Settings
                    </CardTitle>
                    <CardDescription>Manage push notifications for your devices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-medium">Device Notifications</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Manage push notifications for each of your devices
                        </p>

                        {isPushLoading ? (
                          <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                          </div>
                        ) : pushDevices.length === 0 ? (
                          <div className="text-center py-4 bg-secondary/30 rounded-lg">
                            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No devices registered for notifications</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Notifications will appear here once you allow them in your browser
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pushDevices.map((device) => (
                              <Card
                                key={device.device_id}
                                className={device.device_id === currentDeviceId ? "border-primary" : ""}
                              >
                                <CardHeader className="pb-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Smartphone className="h-4 w-4" />
                                      <CardTitle className="text-sm font-medium">
                                        {device.device_name}
                                        {device.device_id === currentDeviceId && (
                                          <Badge variant="outline" className="ml-2">
                                            Current
                                          </Badge>
                                        )}
                                      </CardTitle>
                                    </div>
                                  </div>
                                  <CardDescription className="text-xs">
                                    Last used: {formatLastUsed(device.last_used)}
                                  </CardDescription>
                                </CardHeader>
                                <CardFooter className="pt-0 flex justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={device.enabled}
                                      onCheckedChange={(checked) => handleToggleDevice(device.device_id, checked)}
                                      disabled={!isOnline}
                                    />
                                    <span className="text-sm">{device.enabled ? "Enabled" : "Disabled"}</span>
                                  </div>
                                  {!(device.device_id === currentDeviceId) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveDevice(device.device_id)}
                                      disabled={!isOnline}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/20" data-tutorial="danger-zone">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center text-destructive">
                      <UserX className="h-5 w-5 mr-2" /> Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible account actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-destructive/10 p-4 rounded-lg mb-4 border border-destructive/20">
                      <h3 className="font-medium mb-1 text-destructive">Delete Account</h3>
                      <p className="text-sm mb-3">
                        Once you delete your account, there is no going back. All your data will be permanently removed.
                      </p>
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
              </>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, cardIndex) => (
                  <Card key={cardIndex}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-primary" /> Your Contacts
                  </CardTitle>
                  <CardDescription>Manage people you frequently travel with</CardDescription>
                </CardHeader>
                <CardContent>
                  {isRefreshing && contacts.length === 0 ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : (
                    <ContactManager currentUser={user} contacts={contacts} fetchProfileData={() => fetchData(true)} />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, cardIndex) => (
                  <Card key={cardIndex}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
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
                      <div className="inline-flex w-fit gap-1 md:self-end self-center items-center rounded-full bg-background p-1 shadow-[0_0_1px_1px_rgba(255,255,255,0.1)]">
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
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog
          open={isEditProfileOpen}
          onOpenChange={(open) => {
            if (!open) {
              setEditedUserData(null)
            }
            setIsEditProfileOpen(open)
          }}
        >
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
                    value={editedUserData?.name || ""}
                    onChange={(e) => setEditedUserData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <PhoneInput
                    id="edit-phone"
                    value={editedUserData?.phone || ""}
                    onChange={(value) => setEditedUserData((prev) => (prev ? { ...prev, phone: value || "" } : null))}
                    defaultCountry="PT"
                    international
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    value={editedUserData?.email || ""}
                    onChange={(e) => setEditedUserData((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="mb-2" variant="outline" type="button" onClick={() => setIsEditProfileOpen(false)}>
                  Cancel
                </Button>
                <Button className="mb-2" type="submit" disabled={isUpdatingProfile || !isOnline}>
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
                  <PasswordInput
                    id="current-password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      setNewPasswordStrength(evaluatePasswordStrength(e.target.value))
                    }}
                    required
                  />
                  {newPassword && (
                    <div className="relative">
                      <div className="h-2 rounded bg-gray-200">
                        <div
                          className={`h-full rounded ${newPasswordStrength === "Strong" ? "bg-green-500" : newPasswordStrength === "Medium" ? "bg-yellow-500" : "bg-red-500"}`}
                          style={{
                            width:
                              newPasswordStrength === "Strong"
                                ? "100%"
                                : newPasswordStrength === "Medium"
                                  ? "66%"
                                  : newPasswordStrength === "Weak"
                                    ? "33%"
                                    : "0%",
                          }}
                        />
                      </div>
                      <p
                        className={`text-sm mt-1 ${newPasswordStrength === "Strong" ? "text-green-500" : newPasswordStrength === "Medium" ? "text-yellow-500" : "text-red-500"}`}
                      >
                        {newPasswordStrength}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <PasswordInput
                    id="confirm-new-password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="mb-2" variant="outline" type="button" onClick={() => setIsChangePasswordOpen(false)}>
                  Cancel
                </Button>
                <Button className="mb-2" type="submit" disabled={isChangingPassword || !isOnline}>
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
            <div className="flex flex-col space-y-2">
              <Label htmlFor="delete-confirmation">Type &quot;delete&quot; to confirm:</Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type 'delete'"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsDeleteAccountDialogOpen(false)} className="sm:order-1 mb-2">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                disabled={isDeletingAccount || !isOnline || deleteConfirmation !== "delete"}
                className="sm:order-2 mb-2"
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
      </>
    </div>
  )
}

