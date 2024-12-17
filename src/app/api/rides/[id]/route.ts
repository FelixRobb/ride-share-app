import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rideId = url.pathname.split('/').at(-1);
  const userId = url.searchParams.get('userId');

  if (!rideId || !userId) {
    return NextResponse.json({ error: 'Ride ID and User ID are required' }, { status: 400 });
  }

  try {
    const { data: ride, error } = await supabase
      .from('rides')
      .select(`
        *,
        requester:users!rides_requester_id_fkey (name, phone),
        accepter:users!rides_accepter_id_fkey (name, phone)
      `)
      .eq('id', rideId)
      .single();

    if (error) throw error;

    if (!ride) {
      return NextResponse.json({ error: 'Ride not found' }, { status: 404 });
    }

    // Check if the user is authorized to view this ride
    if (ride.requester_id !== userId && ride.accepter_id !== userId) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('*')
        .or(`user_id.eq.${userId},contact_id.eq.${userId}`)
        .eq('status', 'accepted')
        .single();

      if (contactError || !contact) {
        return NextResponse.json({ error: 'Unauthorized to view this ride' }, { status: 403 });
      }
    }

    return NextResponse.json({ ride });
  } catch (error) {
    console.error('Fetch ride details error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

