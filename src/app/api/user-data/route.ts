import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import crypto from 'crypto'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
  }

  const db = await getDb()

  try {
    const [rides, contacts, notifications, associatedPeople, stats] = await Promise.all([
      db.all('SELECT * FROM rides WHERE requester_id = ? OR accepter_id = ?', [userId, userId]),
      db.all('SELECT * FROM contacts WHERE user_id = ? OR contact_id = ?', [userId, userId]),
      db.all('SELECT * FROM notifications WHERE user_id = ?', [userId]),
      db.all('SELECT * FROM associated_people WHERE user_id = ?', [userId]),
      db.get('SELECT * FROM user_stats WHERE user_id = ?', [userId])
    ])

    const data = { rides, contacts, notifications, associatedPeople, stats }
    const dataString = JSON.stringify(data)
    const etag = crypto.createHash('md5').update(dataString).digest('hex')

    const ifNoneMatch = request.headers.get('If-None-Match')
    if (ifNoneMatch === etag) {
      return new Response(null, { status: 304 })
    }

    return new Response(dataString, {
      headers: {
        'Content-Type': 'application/json',
        'ETag': etag,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}