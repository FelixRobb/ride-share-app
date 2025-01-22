import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Get current user's contacts (both directions)
    const { data: currentContacts, error: contactsError } = await supabase
      .from('contacts')
      .select('user_id, contact_id')
      .or(`user_id.eq.${userId},contact_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (contactsError) throw contactsError;

    // Extract all contact IDs (regardless of whether they're in user_id or contact_id)
    const contactIds = new Set(
      currentContacts?.flatMap(contact => [
        contact.user_id === userId ? contact.contact_id : contact.user_id
      ]) || []
    );
    const contactIdsArray = Array.from(contactIds);

    // Get contacts of contacts (mutual contacts)
    const { data: contactsOfContacts, error: contactsOfContactsError } = await supabase
      .from('contacts')
      .select('user_id, contact_id')
      .or(
        `user_id.in.(${contactIdsArray.join(',')}),` +
        `contact_id.in.(${contactIdsArray.join(',')})`
      )
      .eq('status', 'accepted');

    if (contactsOfContactsError) throw contactsOfContactsError;

    // Get rides of contacts
    const { data: contactRides, error: contactRidesError } = await supabase
      .from('rides')
      .select('id, requester_id, accepter_id')
      .or(
        `requester_id.in.(${contactIdsArray.join(',')}),` +
        `accepter_id.in.(${contactIdsArray.join(',')})`
      )
      .not('requester_id', 'eq', userId)
      .not('accepter_id', 'eq', userId);

    if (contactRidesError) throw contactRidesError;

    // Process mutual contacts
    const mutualContactsMap = new Map();
    contactsOfContacts?.forEach(contact => {
      // Determine which ID is the potential suggestion
      let potentialContactId;
      let mutualContactId;

      if (contactIds.has(contact.user_id)) {
        potentialContactId = contact.contact_id;
        mutualContactId = contact.user_id;
      } else if (contactIds.has(contact.contact_id)) {
        potentialContactId = contact.user_id;
        mutualContactId = contact.contact_id;
      } else {
        return; // Skip if neither ID is in our contacts
      }

      // Skip if the potential contact is the user or already a contact
      if (potentialContactId === userId || contactIds.has(potentialContactId)) {
        return;
      }

      if (!mutualContactsMap.has(potentialContactId)) {
        mutualContactsMap.set(potentialContactId, { count: 1, users: [mutualContactId] });
      } else {
        const data = mutualContactsMap.get(potentialContactId);
        if (!data.users.includes(mutualContactId)) {
          data.count++;
          data.users.push(mutualContactId);
        }
        mutualContactsMap.set(potentialContactId, data);
      }
    });

    // Process users with common rides through contacts
    const commonRidesMap = new Map();
    contactRides?.forEach(ride => {
      const potentialContactIds = [];
      if (!contactIds.has(ride.requester_id) && ride.requester_id !== userId) {
        potentialContactIds.push(ride.requester_id);
      }
      if (!contactIds.has(ride.accepter_id) && ride.accepter_id !== userId) {
        potentialContactIds.push(ride.accepter_id);
      }

      potentialContactIds.forEach(potentialContactId => {
        if (!commonRidesMap.has(potentialContactId)) {
          commonRidesMap.set(potentialContactId, 1);
        } else {
          commonRidesMap.set(potentialContactId, commonRidesMap.get(potentialContactId) + 1);
        }
      });
    });

    // Fetch user details for suggested contacts
    const mutualContactsKeys = Array.from(mutualContactsMap.keys());
    const commonRidesKeys = Array.from(commonRidesMap.keys());
    const combinedIds = [...mutualContactsKeys, ...commonRidesKeys];
    const suggestedUserIds = Array.from(new Set(combinedIds));

    if (suggestedUserIds.length === 0) {
      return NextResponse.json({ suggestedContacts: [] });
    }

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