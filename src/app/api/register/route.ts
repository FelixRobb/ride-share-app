import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { name, phone, password } = await req.json();

    const result = await db.run('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)', [name, phone, password]);
    const user = await db.get('SELECT id, name, phone FROM users WHERE id = ?', result.lastID);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'User already exists or registration failed' }, { status: 400 });
  }
}