import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').at(-2);

  const db = await getDb();
  try {
    const stats = await db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId]);
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Fetch user stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}