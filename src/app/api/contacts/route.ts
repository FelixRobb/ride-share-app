import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { sendImmediateNotification } from '@/lib/pushNotificationService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        *,
        user:users!contacts_user_id_fkey (name, phone),
        contact:users!contacts_contact_id_fkey (name, phone)
      `)
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`);

    if (error) throw error;

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Fetch contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId, contactPhone, countryCode } = await request.json();

  try {
    const { data: contactUser, error: contactUserError } = await supabase
      .from('users')
      .select('id, name, phone, country_code')
      .eq('phone', contactPhone)
      .eq('country_code', countryCode)
      .single();

    if (contactUserError || !contactUser) {
      return NextResponse.json({ error: 'Contact user not found' }, { status: 404 });
    }

    const { data: existingContact } = await supabase
      .from('contacts')
      .select('*')
      .or(`and(user_id.eq.${userId},contact_id.eq.${contactUser.id}),and(user_id.eq.${contactUser.id},contact_id.eq.${userId})`)
      .single();

    if (existingContact) {
      return NextResponse.json({ error: 'Contact already exists' }, { status: 409 });
    }

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({ user_id: userId, contact_id: contactUser.id, status: 'pending' })
      .select()
      .single();

    if (insertError) throw insertError;

    await sendImmediateNotification(
      contactUser.id,
      'New Contact Request',
      'You have a new contact request'
    );

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: contactUser.id,
        message: 'You have a new contact request',
        type: 'contactRequest',
        related_id: newContact.id
      });

    if (notificationError) throw notificationError;

    return NextResponse.json({ contact: { ...newContact, contact_name: contactUser.name, contact_phone: contactUser.phone, contact_country_code: contactUser.country_code } });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

