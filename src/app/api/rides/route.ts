import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { from, to, time, requesterId } = await req.json();
    
    const result = await db.run(
      'INSERT INTO rides (from_location, to_location, time, requester_id, status) VALUES (?, ?, ?, ?, ?)',
      [from, to, time, requesterId, 'pending']
    );
    const ride = await db.get('SELECT * FROM rides WHERE id = ?', result.lastID);
    
    return NextResponse.json({ ride });
  } catch (error) {
    console.error('Create ride error:', error);
    return NextResponse.json({ error: 'Failed to create ride' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (userId) {
      const rides = await db.all('SELECT * FROM rides WHERE requester_id = ? OR accepter_id = ?', [userId, userId]);
      return NextResponse.json({ rides });
    }
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Get rides error:', error);
    return NextResponse.json({ error: 'Failed to get rides' }, { status: 500 });
  }
}