import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();

  try {
    const [rides, contacts, notifications, associatedPeople, stats] = await Promise.all([
      db.all(`
        SELECT r.*, 
               u_requester.name as rider_name, u_requester.phone as rider_phone
        FROM rides r
        LEFT JOIN users u_requester ON r.requester_id = u_requester.id
        WHERE r.requester_id = ? OR r.accepter_id = ? OR r.requester_id IN (
          SELECT CASE
            WHEN c.user_id = ? THEN c.contact_id
            WHEN c.contact_id = ? THEN c.user_id
          END
          FROM contacts c
          WHERE (c.user_id = ? OR c.contact_id = ?) AND c.status = 'accepted'
        )
      `, [userId, userId, userId, userId, userId, userId]),
      db.all(`
        SELECT c.*, 
               u1.name as user_name, u1.phone as user_phone,
               u2.name as contact_name, u2.phone as contact_phone
        FROM contacts c
        JOIN users u1 ON c.user_id = u1.id
        JOIN users u2 ON c.contact_id = u2.id
        WHERE c.user_id = ? OR c.contact_id = ?
      `, [userId, userId]),
      db.all('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]),
      db.all('SELECT * FROM associated_people WHERE user_id = ?', [userId]),
      db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId])
    ]);

    const data = { rides, contacts, notifications, associatedPeople, stats };
    const dataString = JSON.stringify(data);
    const etag = crypto.createHash('md5').update(dataString).digest('hex');

    const ifNoneMatch = request.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 });
    }

    return new Response(dataString, {
      headers: {
        'Content-Type': 'application/json',
        'ETag': etag,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}