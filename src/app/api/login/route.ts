import { NextResponse } from 'next/server'
import { getDb, initializeDb } from '@/lib/db'

export async function POST(req: Request) {
  try {
    await initializeDb(); // Ensure the database is initialized
    const db = await getDb();
    const { phone, password } = await req.json();
    
    const user = await db.get('SELECT id, name, phone FROM users WHERE phone = ? AND password = ?', [phone, password]);
    
    if (user) {
      return NextResponse.json({ user });
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}