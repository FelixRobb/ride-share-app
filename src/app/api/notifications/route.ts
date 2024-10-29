import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function GET(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const notifications = await db.all('SELECT * FROM notifications WHERE user_id = ?', userId);
      return NextResponse.json({ notifications });
    }
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 });
  }
}