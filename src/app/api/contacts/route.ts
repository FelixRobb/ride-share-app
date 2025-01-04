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
  const { userId, contactPhone } = await request.json();

  try {
    // Normalize the phone number by removing any non-digit characters
    const normalizedPhone = contactPhone.replace(/\D/g, '');

    // Search for users with phone numbers ending with the normalized input
    const { data: contactUsers, error: contactUsersError } = await supabase
      .from('users')
      .select('id, name, phone')
      .filter('phone', 'ilike', `%${normalizedPhone}`);

    if (contactUsersError) throw contactUsersError;

    if (!contactUsers || contactUsers.length === 0) {
      return NextResponse.json({ matchingUsers: [] });
    }

    // Return the list of matching users
    return NextResponse.json({ matchingUsers: contactUsers });
  } catch (error) {
    console.error('Search contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { userId, contactId } = await request.json();

  try {
    const { data: existingContact, error: existingContactError } = await supabase
      .from('contacts')
      .select('*')
      .or(`and(user_id.eq.${userId},contact_id.eq.${contactId}),and(user_id.eq.${contactId},contact_id.eq.${userId})`)
      .single();

    if (existingContact) {
      return NextResponse.json({ error: 'Contact already exists' }, { status: 409 });
    }

    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({ user_id: userId, contact_id: contactId, status: 'pending' })
      .select()
      .single();

    if (insertError) throw insertError;

    // Fetch the current user's name
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    await sendImmediateNotification(
      contactId,
      'New Contact Request',
      `You have a new contact request from ${currentUser.name}`
    );

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: contactId,
        message: `You have a new contact request from ${currentUser.name}`,
        type: 'contactRequest',
        related_id: newContact.id
      });

    if (notificationError) throw notificationError;

    return NextResponse.json({ contact: newContact });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

