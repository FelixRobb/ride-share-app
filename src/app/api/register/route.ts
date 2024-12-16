// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { name, phone, email, password } = await request.json();

  try {
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${phone},email.eq.${email}`)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ name, phone, email, password: hashedPassword })
      .select('id, name, phone, email')
      .single();

    if (insertError) throw insertError;

    const { error: statsError } = await supabase
      .from('user_stats')
      .insert({ user_id: newUser.id });

    if (statsError) throw statsError;

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
