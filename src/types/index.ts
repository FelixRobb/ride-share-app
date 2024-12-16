export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
};

export type Ride = {
  id: string;
  from_location: string;
  to_location: string;
  time: string;
  requester_id: string;
  accepter_id: string | null;
  status: "pending" | "accepted" | "cancelled";
  rider_name: string;
  rider_phone: string | null;
  note: string | null;
};

export type Contact = {
  id: string;
  user_id: string;
  contact_id: string;
  status: "pending" | "accepted";
  created_at: string;
  user: {
    name: string;
    phone: string;
  };
  contact: {
    name: string;
    phone: string;
  };
};

export type Notification = {
  id: string;
  user_id: string;
  message: string;
  type: "rideRequest" | "rideAccepted" | "contactRequest";
  is_read: boolean;
  created_at: string;
};

export type RideData = {
  from_location: string;
  to_location: string;
  time: string;
  rider_name: string;
  rider_phone: string | null;
  note: string | null;
};

export type AssociatedPerson = {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
};

export type UserStats = {
  rides_offered: number;
  rides_accepted: number;
};

export type Note = {
  id: string;
  ride_id: string;
  user_id: string;
  note: string;
  created_at: string;
};

