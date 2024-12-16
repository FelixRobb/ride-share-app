// src/app/api/rides/[id]/cancelrequest/route.ts
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
      .eq('requester_id', userId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found or you are not the requester' }, { status: 404 });
    }

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({ status: 'cancelled' })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (ride.accepter_id) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: ride.accepter_id,
          message: 'A ride you accepted has been cancelled by the requester',
          type: 'rideCancelled',
          related_id: rideId
        });

      if (notificationError) throw notificationError;
    }

    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    console.error('Cancel ride request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
