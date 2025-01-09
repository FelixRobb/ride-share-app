import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ exists: false, message: error?.message || 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ exists: true, user: data });
  } catch (error) {
    console.error('Check user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}