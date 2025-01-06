import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  console.log('Login request received:', { email, password: '******' });

  if (!email || !password) {
    console.log('Email or password is missing');
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const lowerCaseEmail = email.toLowerCase();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', lowerCaseEmail)
      .single();

    if (error) {
      console.error('Error querying user:', error);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!data) {
      console.log('No user found with this email');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, data.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Don't send the password back to the client
    const { password: _, ...userWithoutPassword } = data;
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

