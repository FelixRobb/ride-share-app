// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail, getWelcomeEmailContent } from '@/lib/emailService';

export async function POST(request: Request) {
  const { name, phone, email, password } = await request.json();

  try {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${phone},email.eq.${email}`)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lowerCaseEmail = email.toLowerCase();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ name, phone, email: lowerCaseEmail, password: hashedPassword })
      .select('id, name, phone, email')
      .single();

    if (insertError) throw insertError;

    const { error: statsError } = await supabase
      .from('user_stats')
      .insert({ user_id: newUser.id });

    if (statsError) throw statsError;

    // Send welcome email
    try {
      const welcomeEmailContent = getWelcomeEmailContent(newUser.name);
      await sendEmail(newUser.email, 'Welcome to RideShare!', welcomeEmailContent);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't throw an error here, as we don't want to prevent successful registration
    }

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

