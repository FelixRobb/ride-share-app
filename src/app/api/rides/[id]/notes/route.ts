// app/api/rides/[id]/notes/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  try {
    const { data: notes, error } = await supabase
      .from('ride_notes')
      .select(`
        *,
        user:users (name)
      `)
      .eq('ride_id', rideId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Fetch ride notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, note } = await request.json();
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  try {
    const { data: newNote, error: insertError } = await supabase
      .from('ride_notes')
      .insert({ ride_id: rideId, user_id: userId, note })
      .select(`
        *,
        user:users (name),
        ride:rides (requester_id, accepter_id)
      `)
      .single();

    if (insertError) throw insertError;

    // Create a notification for the other user involved in the ride
    const otherUserId = userId === newNote.ride.requester_id ? newNote.ride.accepter_id : newNote.ride.requester_id;
    if (otherUserId) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          message: `New message from ${newNote.user.name} for ride ${rideId}`,
          type: 'newNote'
        });

      if (notificationError) throw notificationError;
    }

    return NextResponse.json({ note: newNote });
  } catch (error) {
    console.error('Add ride note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
