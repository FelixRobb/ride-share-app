import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const db = await getDb();
  const { name, phone, password } = await request.json();

  try {
    const existingUser = await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, phone, password) VALUES (?, ?, ?)',
      [name, phone, hashedPassword]
    );

    const newUser = await db.get('SELECT id, name, phone FROM users WHERE id = ?', [result.lastID]);
    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}