"use client"

import { useCallback, useEffect, useState } from "react"
import { debounce } from "lodash"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCircle,
  ClipboardList,
  Edit,
  LogOut,
  MessageSquareWarning,
  Search,
  Send,
  Star,
  Trash2,
  Users,
  User as UserIcon,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import ReportManagement from "@/components/ReportManagement"
import BugReportManagement from "@/components/BugReportManagement"

interface AdminDashboardProps {
  onLogout: () => void
}

interface Review {
  id: string
  userId: string
  review: string
  rating: number
  createdAt: string
  is_approved: boolean
  userName: string
}

interface User {
  id: string
  name: string
  email: string
  phone: string
  isVerified: boolean
}

interface Stats {
  totalUsers: number
  totalRides: number
  totalContacts: number
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false)
  const [isNotifyUserDialogOpen, setIsNotifyUserDialogOpen] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationBody, setNotificationBody] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Fetch users function
  const fetchUsers = useCallback(async (page: number, search = "") => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch(`/api/admin/users?page=${page}&search=${search}`)
      const data = await response.json()
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch {
      toast.error("Failed to fetch users")
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  // Fetch users when component mounts or when page/search changes
  useEffect(() => {
    fetchUsers(currentPage, searchTerm)
  }, [currentPage, fetchUsers, searchTerm])

  // Fetch stats and reviews on component mount
  useEffect(() => {
    fetchStats()
    fetchReviews()
  }, [])

  const fetchStats = async () => {
    setIsLoadingStats(true)
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch {
      toast.error("Failed to fetch statistics")
    } finally {
      setIsLoadingStats(false)
    }
  }

  const fetchReviews = async () => {
    setIsLoadingReviews(true)
    try {
      const response = await fetch("/api/admin/reviews")
      const data = await response.json()
      setReviews(data)
    } catch {
      toast.error("Failed to fetch reviews")
    } finally {
      setIsLoadingReviews(false)
    }
  }

  // Search handler with debounce
  const handleSearch = debounce((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    fetchUsers(1, value)
  }, 300)

  // User management functions
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        })
        if (response.ok) {
          setUsers(users.filter((user) => user.id !== userId))
          toast.success("User deleted successfully")
        } else {
          throw new Error("Failed to delete user")
        }
      } catch {
        toast.error("Failed to delete user")
      }
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedUser.name,
          email: selectedUser.email,
          phone: selectedUser.phone,
          isVerified: selectedUser.isVerified,
        }),
      })
      if (response.ok) {
        setUsers(users.map((user) => (user.id === selectedUser.id ? selectedUser : user)))
        setIsEditDialogOpen(false)
        toast.success("User updated successfully")
      } else {
        throw new Error("Failed to update user")
      }
    } catch {
      toast.error("Failed to update user")
    }
  }

  // Notification functions
  const handleNotifyAll = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/notify-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: notificationTitle, body: notificationBody }),
      })
      if (response.ok) {
        setIsNotifyDialogOpen(false)
        setNotificationTitle("")
        setNotificationBody("")
        toast.success("Notification sent to all users")
      } else {
        throw new Error("Failed to send notification")
      }
    } catch {
      toast.error("Failed to send notification")
    }
  }

  const handleNotifyUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/admin/notify-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser?.id || "",
          title: notificationTitle,
          body: notificationBody,
        }),
      })
      if (response.ok) {
        setIsNotifyUserDialogOpen(false)
        setNotificationTitle("")
        setNotificationBody("")
        toast.success(`Notification sent to ${selectedUser?.name}`)
      } else {
        throw new Error("Failed to send notification")
      }
    } catch {
      toast.error("Failed to send notification")
    }
  }

  // Review management functions
  const handleApproveReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: "POST",
      })
      if (response.ok) {
        setReviews(reviews.map((review) => (review.id === reviewId ? { ...review, is_approved: true } : review)))
        toast.success("Review approved successfully")
      } else {
        throw new Error("Failed to approve review")
      }
    } catch {
      toast.error("Failed to approve review")
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setReviews(reviews.filter((review) => review.id !== reviewId))
        toast.success("Review deleted successfully")
      } else {
        throw new Error("Failed to delete review")
      }
    } catch {
      toast.error("Failed to delete review")
    }
  }

  // Pagination functions
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">Admin Dashboard</h1>
          </div>
          <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-6">
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="w-full">
            <TabsTrigger value="stats" className="flex flex-1 items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-1 items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex flex-1 items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Reviews</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-1 items-center gap-2">
              <MessageSquareWarning className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="bugs" className="flex flex-1 items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Bugs</span>
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {isLoadingStats ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    description="Registered users on the platform"
                    icon={<Users className="h-5 w-5" />}
                    trend="up"
                  />
                  <StatCard
                    title="Total Rides"
                    value={stats?.totalRides || 0}
                    description="Rides offered and requested"
                    icon={<ClipboardList className="h-5 w-5" />}
                    trend="up"
                  />
                  <StatCard
                    title="Total Contacts"
                    value={stats?.totalContacts || 0}
                    description="User connections made"
                    icon={<UserIcon className="h-5 w-5" />}
                    trend="up"
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Bell className="mr-2 h-4 w-4" />
                    Notify All Users
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] w-11/12">
                  <DialogHeader>
                    <DialogTitle>Send Notification to All Users</DialogTitle>
                    <DialogDescription>This will send a push notification to all users.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleNotifyAll}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                          placeholder="Notification title"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="body">Message</Label>
                        <Textarea
                          id="body"
                          value={notificationBody}
                          onChange={(e) => setNotificationBody(e.target.value)}
                          placeholder="Notification message"
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="gap-2">
                        <Send className="h-4 w-4" />
                        Send to All
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-lg border">
              {isLoadingUsers ? (
                <div className="p-4">
                  <UserTableSkeleton />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden lg:table-cell">Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No users found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                            <TableCell className="hidden lg:table-cell">{user.phone}</TableCell>
                            <TableCell>
                              <Badge variant={user.isVerified ? "default" : "secondary"} className="gap-1">
                                {user.isVerified ? (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    <span>Verified</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" />
                                    <span>Unverified</span>
                                  </>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex space-x-2 gap-1 overflow-auto">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsEditDialogOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setIsNotifyUserDialogOpen(true)
                                  }}
                                >
                                  <Bell className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {!isLoadingUsers && users.length > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="gap-1"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Review Management
                </CardTitle>
                <CardDescription>Approve or delete user reviews</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReviews ? (
                  <ReviewTableSkeleton />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead className="hidden md:table-cell">Review</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead className="hidden lg:table-cell">Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviews.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                              No reviews found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          reviews.map((review) => (
                            <TableRow key={review.id}>
                              <TableCell className="font-medium">{review.userName}</TableCell>
                              <TableCell className="hidden max-w-xs truncate md:table-cell">{review.review}</TableCell>
                              <TableCell>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"
                                        }`}
                                    />
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="hidden whitespace-nowrap lg:table-cell">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={review.is_approved ? "default" : "outline"}
                                  className="gap-1 whitespace-nowrap"
                                >
                                  {review.is_approved ? (
                                    <>
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Approved</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3" />
                                      <span>Pending</span>
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {!review.is_approved && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleApproveReview(review.id)}
                                      className="h-8 gap-1"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                      <span className="hidden sm:inline">Approve</span>
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="h-8 gap-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <ReportManagement />
          </TabsContent>

          {/* Bug Reports Tab */}
          <TabsContent value="bugs">
            <BugReportManagement />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] w-11/12">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user&apos;s information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={selectedUser?.name || ""}
                  onChange={(e) => setSelectedUser(selectedUser ? { ...selectedUser, name: e.target.value } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={selectedUser?.email || ""}
                  onChange={(e) => setSelectedUser(selectedUser ? { ...selectedUser, email: e.target.value } : null)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={selectedUser?.phone || ""}
                  onChange={(e) => setSelectedUser(selectedUser ? { ...selectedUser, phone: e.target.value } : null)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isVerified"
                  checked={selectedUser?.isVerified || false}
                  onCheckedChange={(checked) =>
                    setSelectedUser(selectedUser ? { ...selectedUser, isVerified: checked } : null)
                  }
                />
                <Label htmlFor="isVerified">Account verified</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Notify User Dialog */}
      <Dialog open={isNotifyUserDialogOpen} onOpenChange={setIsNotifyUserDialogOpen}>
        <DialogContent className="sm:max-w-[600px] w-11/12">
          <DialogHeader>
            <DialogTitle>Send Notification to User</DialogTitle>
            <DialogDescription>Send a push notification to {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNotifyUser}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user-title">Title</Label>
                <Input
                  id="user-title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Notification title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-body">Message</Label>
                <Textarea
                  id="user-body"
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  placeholder="Notification message"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="gap-2">
                <Send className="h-4 w-4" />
                Send Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Stat Card Component
function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: number
  description: string
  icon: React.ReactNode
  trend: "up" | "down" | "neutral"
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="rounded-md bg-primary/10 p-1 text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Skeleton loaders
function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  )
}

function UserTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

function ReviewTableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  )
}

