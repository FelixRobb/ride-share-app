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
      .eq('accepter_id', userId)
      .single();

    if (rideError || !ride) {
      return NextResponse.json({ error: 'Ride not found or you are not the accepter' }, { status: 404 });
    }

    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({ status: 'pending', accepter_id: null })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) throw updateError;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: ride.requester_id,
        message: 'The accepted offer for your ride has been cancelled',
        type: 'rideCancelled',
        related_id: rideId
      });

    if (notificationError) throw notificationError;

    return NextResponse.json({ ride: updatedRide });
  } catch (error) {
    console.error('Cancel ride offer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}