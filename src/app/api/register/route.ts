import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import bcrypt from 'bcrypt';
import { sendEmail, getWelcomeEmailContent } from '@/lib/emailService';
import { parsePhoneNumber } from 'libphonenumber-js';

export async function POST(request: Request) {
  const { name, phone, email, password } = await request.json();

  try {
    // Parse the phone number
    const phoneNumber = parsePhoneNumber(phone);
    if (!phoneNumber || !phoneNumber.isValid()) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const countryCode = phoneNumber.countryCallingCode;
    const nationalNumber = phoneNumber.nationalNumber;

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check if phone already exists
    const { data: existingPhone } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', nationalNumber)
      .single();

    if (existingPhone) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const lowerCaseEmail = email.toLowerCase();

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name,
        phone: nationalNumber,
        country_code: `+${countryCode}`,
        email: lowerCaseEmail,
        password: hashedPassword
      })
      .select('id, name, phone, country_code, email')
      .single();

    if (insertError) throw insertError;

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

