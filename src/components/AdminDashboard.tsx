"use client"



import { toast } from "sonner"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useCallback, useEffect, useState } from "react"
import { debounce } from "lodash"

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

// Update the User interface in the component
interface User {
  id: string
  name: string
  email: string
  phone: string
  isVerified: boolean
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  interface Stats {
    totalUsers: number
    totalRides: number
    totalContacts: number
  }

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

  // Replace the existing fetchUsers function with this one
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

  // Add this useEffect hook to fetch users when the component mounts
  useEffect(() => {
    fetchUsers(currentPage, searchTerm)
  }, [currentPage, fetchUsers, searchTerm])

  useEffect(() => {
    fetchStats()
    const fetchReviews = async () => {
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

    fetchReviews()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      setStats(data)
    } catch {
      toast.error("Failed to fetch statistics")
    }
  }

  // Update the handleSearch function
  const handleSearch = debounce((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    fetchUsers(1, value)
  }, 300)

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

  // Add these pagination functions
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={onLogout}>Logout</Button>
      </div>

      <Tabs defaultValue="stats">
        <TabsList>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{stats.totalUsers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Rides</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{stats.totalRides}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Contacts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{stats.totalContacts}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p>Loading statistics...</p>
          )}
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-sm"
              />
              <Dialog open={isNotifyDialogOpen} onOpenChange={setIsNotifyDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Notify All Users</Button>
                </DialogTrigger>
                <DialogContent className="rounded-lg w-11/12">
                  <DialogHeader>
                    <DialogTitle>Send Notification to All Users</DialogTitle>
                    <DialogDescription>This will send a push notification to all users.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleNotifyAll}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="body" className="text-right">
                          Body
                        </Label>
                        <Textarea
                          id="body"
                          value={notificationBody}
                          onChange={(e) => setNotificationBody(e.target.value)}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Send Notification</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {isLoadingUsers ? (
              <div className="text-center">Loading users...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>
                          <Badge variant={user.isVerified ? "default" : "secondary"}>
                            {user.isVerified ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedUser(user)
                              setIsNotifyUserDialogOpen(true)
                            }}
                          >
                            Notify
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex justify-between items-center mt-4">
                  <div>
                    Page {currentPage} of {totalPages}
                  </div>
                  <div>
                    <Button onClick={handlePrevPage} disabled={currentPage === 1} className="mr-2">
                      Previous
                    </Button>
                    <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>
        <TabsContent value="reviews">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Manage Reviews</h2>
            {isLoadingReviews ? (
              <p>Loading reviews...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>{review.userName}</TableCell>
                      <TableCell>{review.review}</TableCell>
                      <TableCell>
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="inline-block w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </TableCell>
                      <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={review.is_approved ? "default" : "destructive"}>
                          {review.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!review.is_approved && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveReview(review.id)}
                            className="mr-2"
                          >
                            Approve
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.id)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user&#39;s information here.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={selectedUser?.name || ""}
                  onChange={(e) => setSelectedUser(selectedUser ? { ...selectedUser, name: e.target.value } : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  value={selectedUser?.email || ""}
                  onChange={(e) => setSelectedUser(selectedUser ? { ...selectedUser, email: e.target.value } : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={selectedUser?.phone || ""}
                  onChange={(e) => setSelectedUser(selectedUser ? { ...selectedUser, phone: e.target.value } : null)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isVerified" className="text-right">
                  Verified
                </Label>
                <div className="col-span-3">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={selectedUser?.isVerified || false}
                    onChange={(e) =>
                      setSelectedUser(selectedUser ? { ...selectedUser, isVerified: e.target.checked } : null)
                    }
                    className="mr-2"
                  />
                  <Label htmlFor="isVerified">Is Verified</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNotifyUserDialogOpen} onOpenChange={setIsNotifyUserDialogOpen}>
        <DialogContent className="rounded-lg w-11/12">
          <DialogHeader>
            <DialogTitle>Send Notification to User</DialogTitle>
            <DialogDescription>Send a push notification to {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleNotifyUser}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title
                </Label>
                <Input
                  id="title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="body" className="text-right">
                  Body
                </Label>
                <Textarea
                  id="body"
                  value={notificationBody}
                  onChange={(e) => setNotificationBody(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Send Notification</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

