import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const db = await getDb();
  try {
    const associatedPeople = await db.all(
      'SELECT * FROM associated_people WHERE user_id = ?',
      [userId]
    );
    return NextResponse.json({ associatedPeople });
  } catch (error) {
    console.error('Fetch associated people error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, name, relationship } = await request.json();
  const db = await getDb();

  try {
    const result = await db.run(
      'INSERT INTO associated_people (user_id, name, relationship) VALUES (?, ?, ?)',
      [userId, name, relationship]
    );

    const newAssociatedPerson = await db.get(
      'SELECT * FROM associated_people WHERE id = ?',
      [result.lastID]
    );

    return NextResponse.json({ associatedPerson: newAssociatedPerson });
  } catch (error) {
    console.error('Add associated person error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}