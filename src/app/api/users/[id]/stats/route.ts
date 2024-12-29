import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2);

  try {
    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Fetch user stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2);
  const updates = await request.json();

  try {
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const newStats = {
      rides_offered: (currentStats?.rides_offered || 0) + (updates.rides_offered || 0),
      rides_accepted: (currentStats?.rides_accepted || 0) + (updates.rides_accepted || 0),
      completed_rides_offered: (currentStats?.completed_rides_offered || 0) + (updates.completed_rides_offered || 0),
      completed_rides_accepted: (currentStats?.completed_rides_accepted || 0) + (updates.completed_rides_accepted || 0),
    };

    const { data: updatedStats, error: updateError } = await supabase
      .from('user_stats')
      .update(newStats)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ stats: updatedStats });
  } catch (error) {
    console.error('Update user stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

