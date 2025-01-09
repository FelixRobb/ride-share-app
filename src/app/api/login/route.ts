import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { identifier, password, loginMethod } = await request.json();

  if (!identifier || !password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  try {
    let query;
    if (loginMethod === 'email') {
      query = supabase
        .from('users')
        .select('*')
        .eq('email', identifier.toLowerCase())
        .single();
    } else {
      // For phone login, we need to handle the country code separately
      const phoneNumber = identifier.replace(/\s+/g, ''); // Remove any spaces
      const countryCode = phoneNumber.startsWith('+') ? phoneNumber.slice(0, phoneNumber.length - 9) : '+351'; // Default to Portugal if no country code
      const nationalNumber = phoneNumber.startsWith('+') ? phoneNumber.slice(phoneNumber.length - 9) : phoneNumber;

      query = supabase
        .from('users')
        .select('*')
        .eq('phone', nationalNumber)
        .eq('country_code', countryCode)
        .single();
    }

    const { data: user, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user) {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

