// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { phoneOrEmail, password } = await request.json();

  const phoneOrEmaillower = phoneOrEmail.toLowerCase();
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${phoneOrEmaillower},email.eq.${phoneOrEmaillower}`)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
