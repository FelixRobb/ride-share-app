// src/app/api/suggested-users/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get current user's contacts
    const { data: currentContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('contact_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (contactsError) throw contactsError;

    const contactIds = currentContacts?.map(contact => contact.contact_id) || [];

    // Get contacts of contacts (mutual contacts)
    const { data: contactsOfContacts, error: contactsOfContactsError } = await supabase
      .from('contacts')
      .select('contact_id, user_id')
      .in('user_id', contactIds)
      .eq('status', 'accepted')
      .not('contact_id', 'in', `(${[userId, ...contactIds].join(',')})`);

    if (contactsOfContactsError) throw contactsOfContactsError;

    // Get rides of contacts
    const { data: contactRides, error: contactRidesError } = await supabase
      .from('rides')
      .select('id, requester_id, accepter_id')
      .or(`requester_id.in.(${contactIds.join(',')}),accepter_id.in.(${contactIds.join(',')})`)
      .not('requester_id', 'eq', userId)
      .not('accepter_id', 'eq', userId);

    if (contactRidesError) throw contactRidesError;

    // Process mutual contacts
    const mutualContactsMap = new Map();
    contactsOfContacts?.forEach(contact => {
      if (!mutualContactsMap.has(contact.contact_id)) {
        mutualContactsMap.set(contact.contact_id, { count: 1, users: [contact.user_id] });
      } else {
        const data = mutualContactsMap.get(contact.contact_id);
        data.count++;
        data.users.push(contact.user_id);
        mutualContactsMap.set(contact.contact_id, data);
      }
    });

    // Process users with common rides through contacts
    const commonRidesMap = new Map();
    contactRides?.forEach(ride => {
      const otherUserId = ride.requester_id === userId ? ride.accepter_id : ride.requester_id;
      if (!commonRidesMap.has(otherUserId) && !contactIds.includes(otherUserId) && otherUserId !== userId) {
        commonRidesMap.set(otherUserId, 1);
      } else if (commonRidesMap.has(otherUserId)) {
        commonRidesMap.set(otherUserId, commonRidesMap.get(otherUserId) + 1);
      }
    });

    // Fetch user details for suggested contacts
    const suggestedUserIds = [...Array.from(mutualContactsMap.keys()), ...Array.from(commonRidesMap.keys())];
    const { data: suggestedUsers, error: suggestedUsersError } = await supabase
      .from('users')
      .select('id, name, phone')
      .in('id', suggestedUserIds);

    if (suggestedUsersError) throw suggestedUsersError;

    // Combine all data
    const suggestedContacts = suggestedUsers?.map(user => ({
      ...user,
      mutual_contacts: mutualContactsMap.get(user.id)?.count || 0,
      mutual_contact_users: mutualContactsMap.get(user.id)?.users || [],
      common_rides: commonRidesMap.get(user.id) || 0,
    })) || [];

    // Sort by mutual contacts count, then by common rides
    suggestedContacts.sort((a, b) => {
      if (b.mutual_contacts !== a.mutual_contacts) {
        return b.mutual_contacts - a.mutual_contacts;
      }
      return b.common_rides - a.common_rides;
    });

    return NextResponse.json({ suggestedContacts: suggestedContacts.slice(0, 10) });
  } catch (error) {
    console.error('Fetch suggested contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

