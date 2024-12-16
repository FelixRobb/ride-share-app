// src/app/api/rides/[id]/accept/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-2);

  try {
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    if (ride.status !== 'pending') {
      return NextResponse.json({ error: 'Ride is not available' }, { status: 400 });
    }

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({ accepter_id: userId, status: 'accepted' })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: ride.requester_id,
        message: 'Your ride request has been accepted',
        type: 'rideAccepted',
        related_id: rideId
      });

    if (notificationError) throw notificationError;

    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    console.error('Accept ride error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
