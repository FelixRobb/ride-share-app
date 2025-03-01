export type User = {
  id: string
  name: string
  phone: string
  email: string
}

export type Ride = {
  id: string
  from_location: string
  to_location: string
  from_lat: number
  from_lon: number
  to_lat: number
  to_lon: number
  time: string
  requester_id: string
  accepter_id: string | null
  status: "pending" | "accepted" | "cancelled" | "completed"
  rider_name: string
  rider_phone: string | null
  note: string | null
  is_edited: boolean
}

export type Contact = {
  id: string
  user_id: string
  contact_id: string
  status: "pending" | "accepted"
  created_at: string
  user: {
    name: string
    phone: string
  }
  contact: {
    name: string
    phone: string
  }
}

export interface Notification {
  id: string
  user_id: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export type RideData = {
  from_location: string
  to_location: string
  from_lat: number
  from_lon: number
  to_lat: number
  to_lon: number
  time: string
  rider_name: string
  rider_phone: string | null
  note: string | null
}

export type AssociatedPerson = {
  id: string
  user_id: string
  name: string
  relationship: string
}

export type UserStats = {
  rides_offered: number
  rides_accepted: number
}

export type Note = {
  id: string
  ride_id: string
  user_id: string
  note: string
  created_at: string
  is_edited: boolean
  is_deleted: boolean
  seen_by: string[]
  user?: {
    name: string
  }
}

export type PushSubscription = {
  id: string
  user_id: string
  device_id: string
  subscription: string
  enabled: boolean
  device_name: string
  last_used: string
}

