// src/app/api/users/[id]/stats/route.ts
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
