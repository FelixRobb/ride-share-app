import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const db = await getDb();
  const { phone, password } = await request.json();

  try {
    const user = await db.get('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!user) {
      return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid phone number or password' }, { status: 401 });
    }

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}