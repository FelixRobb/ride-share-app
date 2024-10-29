'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, LogOut, UserPlus, Home, Car, Users, Menu, MapPin, Clock, User, Trash2, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast, Toaster } from 'react-hot-toast'

// Types
type User = {
  id: number
  name: string
  phone: string
}

type Ride = {
  id: number
  from_location: string
  to_location: string
  time: string
  requester_id: number
  accepter_id: number | null
  status: 'pending' | 'accepted' | 'completed'
}

type Contact = {
  id: number
  user_id: number
  contact_id: number
  name: string
  phone: string
  status: 'pending' | 'accepted'
}

type Notification = {
  id: number
  user_id: number
  message: string
  type: 'rideRequest' | 'rideAccepted' | 'contactRequest'
}

// Main App Component
export default function RideShareApp() {
  const [currentPage, setCurrentPage] = useState('welcome')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const user = localStorage.getItem('currentUser')
    if (user) {
      setCurrentUser(JSON.parse(user))
      setCurrentPage('dashboard')
      fetchUserData(JSON.parse(user).id)
    }
  }, [])

  const fetchUserData = async (userId: number) => {
    const ridesResponse = await fetch(`/api/rides?userId=${userId}`)
    const ridesData = await ridesResponse.json()
    setRides(ridesData.rides)

    const contactsResponse = await fetch(`/api/contacts?userId=${userId}`)
    const contactsData = await contactsResponse.json()
    setContacts(contactsData.contacts)

    const notificationsResponse = await fetch(`/api/notifications?userId=${userId}`)
    const notificationsData = await notificationsResponse.json()
    setNotifications(notificationsData.notifications)
  }

  const login = async (phone: string, password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const data = await response.json()
      if (data.user) {
        setCurrentUser(data.user)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        setCurrentPage('dashboard')
        fetchUserData(data.user.id)
        toast.success('Logged in successfully')
      } else {
        toast.error('Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed')
    }
  }

  const register = async (name: string, phone: string, password: string) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.user) {
        setCurrentUser(data.user)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        setCurrentPage('dashboard')
        fetchUserData(data.user.id)
        toast.success('Registered successfully')
      } else {
        toast.error('Registration failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
    setCurrentPage('welcome')
    toast.success('Logged out successfully')
  }

  const createRide = async (from: string, to: string, time: string) => {
    if (!currentUser) return
    try {
      const response = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, time, requesterId: currentUser.id }),
      })
      const data = await response.json()
      if (data.ride) {
        setRides([...rides, data.ride])
        toast.success('Ride created successfully')
      } else {
        toast.error('Failed to create ride')
      }
    } catch (error) {
      console.error('Create ride error:', error)
      toast.error('Failed to create ride')
    }
  }

  const acceptRide = async (rideId: number) => {
    try {
      const response = await fetch(`/api/rides/${rideId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepterId: currentUser?.id }),
      })
      const data = await response.json()
      if (data.ride) {
        setRides(rides.map(ride => ride.id === rideId ? data.ride : ride))
        fetchUserData(currentUser!.id)
        toast.success('Ride accepted successfully')
      } else {
        toast.error('Failed to accept ride')
      }
    } catch (error) {
      console.error('Accept ride error:', error)
      toast.error('Failed to accept ride')
    }
  }

  const addContact = async (phone: string) => {
    if (!currentUser) return
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, contactPhone: phone }),
      })
      const data = await response.json()
      if (data.contact) {
        setContacts([...contacts, data.contact])
        toast.success('Contact request sent')
      } else {
        toast.error('Failed to add contact')
      }
    } catch (error) {
      console.error('Add contact error:', error)
      toast.error('Failed to add contact')
    }
  }

  const acceptContact = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to accept contact')
      }
      const data = await response.json()
      if (data.contact) {
        setContacts(contacts.map(contact => contact.id === contactId ? data.contact : contact))
        fetchUserData(currentUser!.id)
        toast.success('Contact accepted')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('Accept contact error:', error)
      toast.error('Failed to accept contact: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const deleteContact = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete contact')
      }
      setContacts(contacts.filter(contact => contact.id !== contactId))
      toast.success('Contact deleted')
    } catch (error) {
      console.error('Delete contact error:', error)
      toast.error('Failed to delete contact: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const deleteUser = async () => {
    if (!currentUser) return
    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }
      logout()
      toast.success('User account deleted')
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  // Components
  const WelcomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary text-white px-4">
      <h1 className="text-5xl font-bold mb-6 text-center">Welcome to RideShare</h1>
      <p className="text-xl mb-8 text-center max-w-md">Connect with friends, share rides, and travel together safely.</p>
      <div className="space-y-4 w-full max-w-xs">
        <Button onClick={() => setCurrentPage('login')} variant="secondary" size="lg" className="w-full">
          Login
        </Button>
        <Button onClick={() => setCurrentPage('register')} variant="outline" size="lg" className="w-full">
          Register
        </Button>
      </div>
    </div>
  )

  const LoginPage = () => (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>Enter your details to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault()
          const phone = (e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value
          const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value
          login(phone, password)
        }}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter your phone number" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" />
            </div>
          </div>
          <Button className="w-full mt-6" type="submit">Login</Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button variant="link" onClick={() => setCurrentPage('register')} className="w-full">
          Don't have an account? Register
        </Button>
      </CardFooter>
    </Card>
  )

  const RegisterPage = () => (
    <Card className="w-[350px] shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault()
          const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value
          const phone = (e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value
          const password = (e.currentTarget.elements.namedItem('password') as HTMLInputElement).value
          register(name, phone, password)
        }}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="Enter your phone number" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Create a password" />
            </div>
          </div>
          <Button className="w-full mt-6" type="submit">Register</Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button variant="link" onClick={() => setCurrentPage('login')} className="w-full">
          Already have an account? Login
        </Button>
      </CardFooter>
    </Card>
  )

  const DashboardPage = () => (
    <div className="w-full max-w-4xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Dashboard</CardTitle>
          <CardDescription>Manage your rides and connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="available" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available">Available Rides</TabsTrigger>
              <TabsTrigger value="my-rides">My Rides</TabsTrigger>
            </TabsList>
            <TabsContent value="available">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {rides.filter(ride => 
                  ride.status === 'pending' && 
                  ride.requester_id !== currentUser?.id &&
                  contacts.some(contact => 
                    (contact.user_id ===   ride.requester_id || contact.contact_id === ride.requester_id) && 
                    contact.status === 'accepted'
                  )
                ).map(ride => (
                  <Card key={ride.id} className="mb-4 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{ride.from_location} to {ride.to_location}</CardTitle>
                      <CardDescription>Requested by: User {ride.requester_id}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(ride.time).toLocaleString()}</span>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted py-2">
                      <Button onClick={() => acceptRide(ride.id)} className="w-full">Accept Ride</Button>
                    </CardFooter>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="my-rides">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                {rides.filter(ride => ride.requester_id === currentUser?.id).map(ride => (
                  <Card key={ride.id} className="mb-4 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{ride.from_location} to {ride.to_location}</CardTitle>
                      <CardDescription>Status: {ride.status}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(ride.time).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )

  const CreateRidePage = () => (
    <Card className="w-[350px] shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Ride</CardTitle>
        <CardDescription>Request a ride by filling out the details below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault()
          const from = (e.currentTarget.elements.namedItem('from') as HTMLInputElement).value
          const to = (e.currentTarget.elements.namedItem('to') as HTMLInputElement).value
          const time = (e.currentTarget.elements.namedItem('time') as HTMLInputElement).value
          createRide(from, to, time)
          setCurrentPage('dashboard')
        }}>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="from">From</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="from" placeholder="Enter starting location" className="pl-8" />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="to">To</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="to" placeholder="Enter destination" className="pl-8" />
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="time" type="datetime-local" className="pl-8" />
              </div>
            </div>
          </div>
          <Button className="w-full mt-6" type="submit">Create Ride</Button>
        </form>
      </CardContent>
    </Card>
  )

  const ProfilePage = () => (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-lg">
            {currentUser?.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
            <p className="text-muted-foreground">{currentUser?.phone}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center space-x-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Manage Contacts</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Contacts</DialogTitle>
              <DialogDescription>Manage your contacts and friend requests.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <h3 className="mb-2 font-semibold">Add New Contact</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const phone = (e.currentTarget.elements.namedItem('contactPhone') as HTMLInputElement).value
                addContact(phone)
              }} className="flex space-x-2">
                <Input id="contactPhone" placeholder="Enter phone number" />
                <Button type="submit"><UserPlus className="h-4 w-4 mr-2" /> Add</Button>
              </form>
            </div>
            <ScrollArea className="h-[200px]">
              {contacts.map(contact => (
                <div key={contact.id} className="flex justify-between items-center py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                  {contact.status === 'pending' && contact.user_id === currentUser?.id && (
                    <Button onClick={() => deleteContact(contact.id)} size="sm" variant="destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  {contact.status === 'pending' && contact.contact_id === currentUser?.id && (
                    <Button onClick={() => acceptContact(contact.id)} size="sm">Accept</Button>
                  )}
                  {contact.status === 'accepted' && (
                    <Button onClick={() => deleteContact(contact.id)} size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </ScrollArea>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete your account? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>Cancel</Button>
              <Button variant="destructive" onClick={deleteUser}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )

  const Layout = ({ children }: { children: React.ReactNode }) => {
    if (!currentUser) return children

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 hidden md:flex">
              <a className="mr-6 flex items-center space-x-2 ml-10" href="/">
                <Car className="h-6 w-6" />
                <span className="hidden font-bold sm:inline-block">RideShare</span>
              </a>
              <nav className="flex items-center space-x-6 text-sm font-medium">
                <Button variant="ghost" onClick={() => setCurrentPage('dashboard')}><Home className="mr-2 h-4 w-4" /> Dashboard</Button>
                <Button variant="ghost" onClick={() => setCurrentPage('create-ride')}><Car className="mr-2 h-4 w-4" /> Create Ride</Button>
                <Button variant="ghost" onClick={() => setCurrentPage('profile')}><User className="mr-2 h-4 w-4" /> Profile</Button>
              </nav>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <div className="w-full flex-1 md:w-auto md:flex-none">
                <Button variant="outline" className="relative h-8 w-full justify-start text-sm font-normal md:w-40 md:flex-none">
                  <span className="hidden lg:inline-flex">Search...</span>
                  <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </Button>
              </div>
              <nav className="flex items-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Notifications</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-[300px]">
                      {notifications.map(notification => (
                        <div key={notification.id} className="py-2">
                          <p>{notification.message}</p>
                        </div>
                      ))}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4" /></Button>
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t py-6 md:py-0">
          <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Built by the RideShare team. The source code is available on GitHub.
            </p>
            <p className="text-center text-sm text-muted-foreground md:text-left">
              © 2024 RideShare. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  // Render the appropriate page based on the current state
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
        {currentPage === 'welcome' && <WelcomePage />}
        {currentPage === 'login' && <LoginPage />}
        {currentPage === 'register' && <RegisterPage />}
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'create-ride' && <CreateRidePage />}
        {currentPage === 'profile' && <ProfilePage />}
      </div>
      <Toaster />
    </Layout>
  )
}