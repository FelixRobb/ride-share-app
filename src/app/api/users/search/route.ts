import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const currentUserId = searchParams.get('currentUserId');

  if (!query || !currentUserId) {
    return NextResponse.json({ error: 'Missing query or currentUserId' }, { status: 400 });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, phone, country_code')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .neq('id', currentUserId);

    if (error) throw error;

    // Fetch current user's contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', currentUserId);

    if (contactsError) throw contactsError;

    const contactIds = contacts.map(contact => contact.contact_id);

    // Filter out users who are already contacts
    const filteredUsers = users.filter(user => !contactIds.includes(user.id));

    return NextResponse.json({ users: filteredUsers });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

