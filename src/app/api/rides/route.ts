import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendImmediateNotification } from '@/lib/pushNotificationService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Fetch all rides related to the user
    const { data: userRides, error: userRidesError } = await supabase
      .from('rides')
      .select(`
        *,
        requester:users!rides_requester_id_fkey (name, phone),
        accepter:users!rides_accepter_id_fkey (name, phone)
      `)
      .or(`requester_id.eq.${userId},accepter_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (userRidesError) throw userRidesError;

    // Fetch all contacts of the user
    const { data: userContacts, error: userContactsError } = await supabase
      .from('contacts')
      .select('contact_id, user_id')
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (userContactsError) throw userContactsError;

    const contactIds = userContacts.map(contact => 
      contact.contact_id === userId ? contact.user_id : contact.contact_id
    );

    // Fetch available rides from contacts
    const { data: availableRides, error: availableRidesError } = await supabase
      .from('rides')
      .select(`
        *,
        requester:users!rides_requester_id_fkey (name, phone)
      `)
      .eq('status', 'pending')
      .in('requester_id', contactIds)
      .neq('requester_id', userId);

    if (availableRidesError) throw availableRidesError;

    // Combine user rides and available rides
    const allRides = [...(userRides || []), ...(availableRides || [])];

    // Remove duplicates
    const uniqueRides = allRides.filter((ride, index, self) =>
      index === self.findIndex((t) => t.id === ride.id)
    );

    return NextResponse.json({ rides: uniqueRides });
  } catch (error) {
    console.error('Fetch rides error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { from_location, to_location, from_lat, from_lon, to_lat, to_lon, time, requester_id, rider_name, rider_phone, note } = await request.json();

  try {
    const { data: newRide, error: insertError } = await supabase
      .from('rides')
      .insert({
        from_location,
        to_location,
        from_lat,
        from_lon,
        to_lat,
        to_lon,
        time,
        requester_id,
        status: 'pending',
        rider_name,
        rider_phone,
        note
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Notify contacts about the new ride
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', requester_id)
      .eq('status', 'accepted');

    if (contactsError) throw contactsError;

    // Fetch the current user's name
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', requester_id)
      .single();

    if (userError) throw userError;

    for (const contact of contacts) {
      await sendImmediateNotification(
        contact.contact_id,
        'New Ride Available',
        `A new ride is available from your contact ${currentUser.name}`
      );
      await supabase.from('notifications').insert({
        user_id: contact.contact_id,
        message: `A new ride is available from your contact ${currentUser.name}`,
        type: 'newRide',
        related_id: newRide.id
      });
    }

    return NextResponse.json({ ride: newRide });
  } catch (error) {
    console.error("Create ride error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

